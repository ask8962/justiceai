import { getFirebaseAdminDb } from './firebase-admin';
import { sendWhatsAppMessage, sendWhatsAppMedia } from './twilioSender';
import { generateLegalDraft } from './generateDraft';
import { speechToTextFromUrl, translateText, textToSpeech } from './sarvam';
import { generateLegalPDF } from './pdfGenerator';
import crypto from 'crypto';

interface Session {
    step: 'start' | 'choose_language' | 'choose_issue' | 'company_name' | 'amount' | 'order_date' | 'confirm' | 'completed';
    data: {
        issueType?: string;
        company?: string;
        amount?: string;
        orderDate?: string;
    };
    language?: string; // 'hi-IN' or 'en-IN' — set by user choice
    generatedAt?: number;
    outcomeAsked: boolean;
}

/**
 * Helper: Translate text to the user's chosen language (only if Hindi).
 * If user chose English, returns the original text.
 */
async function toUserLang(text: string, language?: string): Promise<string> {
    if (language === 'hi-IN') {
        try {
            return await translateText(text, 'en-IN', 'hi-IN');
        } catch {
            return text; // Fallback to English if translation fails
        }
    }
    return text;
}

/**
 * Helper: Translate user's input to English (only if they chose Hindi).
 * If user chose English, returns input as-is.
 */
async function toEnglish(text: string, language?: string): Promise<string> {
    if (language === 'hi-IN') {
        try {
            return await translateText(text, 'hi-IN', 'en-IN');
        } catch {
            return text;
        }
    }
    return text;
}

/**
 * Main Flow Controller for WhatsApp Bot
 * Strictly Rule-Based state machine.
 */
export async function handleWhatsAppFlow(
    phone: string,
    incomingBody: string,
    media?: { numMedia: number; mediaUrl0: string }
) {
    const db = getFirebaseAdminDb();
    const sessionRef = db.collection('whatsapp_sessions').doc(phone);
    const sessionDoc = await sessionRef.get();

    let session: Session = { step: 'start', data: {}, outcomeAsked: false };

    if (sessionDoc.exists) {
        session = sessionDoc.data() as Session;
    }

    let userInput = incomingBody.trim();
    let isVoiceNote = false; // Track if user sent audio, so we can reply with audio too

    // -- VOICE NOTE SUPPORT --
    // If the user sent a voice note, transcribe it first
    if (media && media.numMedia > 0 && media.mediaUrl0) {
        await sendWhatsAppMessage(phone, "🎧 _Listening to your voice note..._");
        try {
            console.log(`[flowController] Downloading and transcribing audio from ${media.mediaUrl0}`);
            const transcript = await speechToTextFromUrl(media.mediaUrl0);
            console.log(`[flowController] Transcription Result: "${transcript}"`);

            if (!transcript) {
                await sendWhatsAppMessage(phone, await toUserLang("Sorry, I couldn't understand that audio. Could you please type it out?", session.language));
                return;
            }
            userInput = transcript;
            isVoiceNote = true; // Mark this so we send an audio reply
        } catch (sttError) {
            console.error('[flowController] STT Error:', sttError);
            await sendWhatsAppMessage(phone, await toUserLang("Sorry, I had trouble processing your voice note. Please type your message instead.", session.language));
            return;
        }
    }

    // If user says "restart" or "hi", reset the flow
    if (userInput.toLowerCase() === 'restart' || userInput.toLowerCase() === 'hi' || userInput.toLowerCase() === 'hello') {
        session = { step: 'start', data: {}, outcomeAsked: false };
    }

    // Translate input to English ONLY if the user has already chosen Hindi
    const englishInput = await toEnglish(userInput, session.language);

    let replyText = '';

    try {
        switch (session.step) {
            case 'start':
                replyText = `Welcome to *JusticeAI's Consumer Scam Helpdesk* 👋\n\nI can help you officially complain against e-commerce fraud and draft a legal notice.\n\n*Choose your language / अपनी भाषा चुनें:*\n\n1️⃣ English\n2️⃣ हिन्दी (Hindi)`;
                session.step = 'choose_language';
                break;

            case 'choose_language':
                if (userInput === '1' || userInput.toLowerCase() === 'english') {
                    session.language = 'en-IN';
                    replyText = `Great! You've selected *English*. 🇬🇧\n\nPlease describe the issue in one short sentence (e.g., "Received fake product", "Refund not processed").`;
                    session.step = 'company_name';
                } else if (userInput === '2' || userInput.toLowerCase().includes('hindi') || userInput.toLowerCase().includes('हिन्दी') || userInput.toLowerCase().includes('हिंदी')) {
                    session.language = 'hi-IN';
                    replyText = `बहुत बढ़िया! आपने *हिन्दी* चुनी है। 🇮🇳\n\nकृपया अपनी समस्या एक छोटे वाक्य में बताएं (जैसे, "नकली प्रोडक्ट मिला", "रिफंड नहीं मिला")।`;
                    session.step = 'company_name';
                } else {
                    replyText = `Please type *1* for English or *2* for हिन्दी (Hindi).`;
                }
                break;

            case 'company_name':
                session.data.issueType = englishInput;
                replyText = await toUserLang(`Got it. What is the exact name of the company or website? (e.g., Amazon, Flipkart, XYZ Fashion)`, session.language);
                session.step = 'amount';
                break;

            case 'amount':
                session.data.company = englishInput;
                replyText = await toUserLang(`What is the disputed amount in Rupees? (e.g., 2500)`, session.language);
                session.step = 'order_date';
                break;

            case 'order_date':
                session.data.amount = englishInput;
                replyText = await toUserLang(`When did this happen? Provide the date of the order/incident (e.g., 12 Oct 2025).`, session.language);
                session.step = 'confirm';
                break;

            case 'confirm':
                session.data.orderDate = englishInput;
                const confirmMsg = `Please review your details:\n\n*Company:* ${session.data.company}\n*Amount:* Rs ${session.data.amount}\n*Date:* ${session.data.orderDate}\n*Issue:* ${session.data.issueType}\n\nType *YES* to generate a legal notice, or *RESTART* to start over.`;
                replyText = await toUserLang(confirmMsg, session.language);
                session.step = 'completed';
                break;

            case 'completed':
                if (englishInput.toLowerCase() === 'yes' || userInput.toLowerCase() === 'haan' || userInput.toLowerCase() === 'हां') {
                    // Send loading message
                    await sendWhatsAppMessage(phone, await toUserLang("⏳ Generating your legal notice using Indian Consumer Law. This will take ~10 seconds...", session.language));

                    const draftResult = await generateLegalDraft({
                        company: session.data.company!,
                        amount: session.data.amount!,
                        orderDate: session.data.orderDate!,
                        issueType: session.data.issueType!,
                    });

                    if (!draftResult) {
                        replyText = await toUserLang(`⚠️ INSUFFICIENT LEGAL DATA. We couldn't safely draft a notice for this specific issue. Please consult a human lawyer.`, session.language);
                    } else {
                        // Generate PDF document
                        const pdfBuffer = await generateLegalPDF(draftResult.draft_notice);

                        // Store PDF in Firestore temporarily
                        const pdfId = crypto.randomUUID();
                        await db.collection('pdf_cache').doc(pdfId).set({
                            pdf: pdfBuffer.toString('base64'),
                            createdAt: Date.now(),
                        });

                        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
                            || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
                            || 'http://localhost:3000';
                        const pdfUrl = `${baseUrl}/api/v1/pdf/${pdfId}`;

                        // Keep the WhatsApp text message conversational and short
                        replyText = await toUserLang(`✅ *Your Legal Notice is Ready!*\n\n*Legal Basis:* ${draftResult.citations}\n*Risk Level:* ${draftResult.risk_level}\n\nI have attached the official PDF document below. You can forward this directly to ${session.data.company}'s grievance officer.`, session.language);

                        // Send the Text + PDF Media immediately
                        console.log(`[flowController] Sending PDF reply: ${pdfUrl}`);
                        await sendWhatsAppMedia(phone, replyText, pdfUrl);

                        // Clear replyText so the default sender at the bottom doesn't send it twice
                        replyText = '';

                        session.generatedAt = Date.now();
                        session.outcomeAsked = false;
                    }
                } else if (englishInput.toLowerCase() === 'restart') {
                    session = { step: 'start', data: {}, outcomeAsked: false };
                    replyText = await toUserLang(`Restarting flow. Type *hi* to begin.`, session.language);
                    session.step = 'choose_language';
                } else {
                    replyText = await toUserLang(`Please type *YES* to confirm or *RESTART* to cancel.`, session.language);
                }
                break;

            default:
                session.step = 'start';
                replyText = `Something went wrong. Type *hi* to restart.`;
                break;
        }

        // Save session state
        await sessionRef.set(session);

        // Send reply back via Twilio (with optional audio if user sent a voice note)
        if (replyText) {
            await sendWhatsAppMessage(phone, replyText);

            // If user sent a voice note, also reply with an audio message
            if (isVoiceNote && replyText.length <= 500) {
                try {
                    const ttsLang = session.language || 'en-IN';
                    console.log(`[flowController] Generating TTS audio in ${ttsLang}...`);
                    const base64Audio = await textToSpeech(replyText, ttsLang);

                    // Store audio in Firestore temporarily
                    const audioId = crypto.randomUUID();
                    await db.collection('tts_audio_cache').doc(audioId).set({
                        audio: base64Audio,
                        createdAt: Date.now(),
                    });

                    // Build the public URL for Twilio to fetch
                    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
                        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
                        || 'http://localhost:3000';
                    const audioUrl = `${baseUrl}/api/v1/tts-audio/${audioId}`;

                    console.log(`[flowController] Sending audio reply: ${audioUrl}`);
                    await sendWhatsAppMedia(phone, '🔊 Voice Reply', audioUrl);
                } catch (ttsError) {
                    console.error('[flowController] TTS/Audio Reply Error:', ttsError);
                    // Non-fatal: text was already sent, audio is a bonus
                }
            }
        }
    } catch (error) {
        console.error('[flowController] Error in state machine:', error);
        await sendWhatsAppMessage(phone, "Sorry, I encountered an internal error. Please try again later.");
    }
}

