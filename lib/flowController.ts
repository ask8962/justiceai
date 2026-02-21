import { getFirebaseAdminDb } from './firebase-admin';
import { sendWhatsAppMessage } from './twilioSender';
import { generateLegalDraft } from './generateDraft';
import { speechToTextFromUrl, translateText } from './sarvam';

interface Session {
    step: 'start' | 'choose_issue' | 'company_name' | 'amount' | 'order_date' | 'confirm' | 'completed';
    data: {
        issueType?: string;
        company?: string;
        amount?: string;
        orderDate?: string;
    };
    language?: string; // Tracks 'hi-IN' or 'en-IN'
    generatedAt?: number;
    outcomeAsked: boolean;
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

    // -- PHASE 2: VOICE NOTE SUPPORT --
    // If the user sent a voice note, transcribe it first
    if (media && media.numMedia > 0 && media.mediaUrl0) {
        await sendWhatsAppMessage(phone, "🎧 _Listening to your voice note..._");
        try {
            console.log(`[WhatsApp API] Downloading and transcribing audio from ${media.mediaUrl0}`);
            // speechToTextFromUrl downloads from Twilio and uses Sarvam saaras:v1 to return English text
            const transcript = await speechToTextFromUrl(media.mediaUrl0);
            console.log(`[WhatsApp API] Transcription Result: "${transcript}"`);

            if (!transcript) {
                await sendWhatsAppMessage(phone, "Sorry, I couldn't understand that audio. Could you please type it out?");
                return;
            }
            userInput = transcript;
        } catch (sttError) {
            console.error('[WhatsApp API] STT Error:', sttError);
            await sendWhatsAppMessage(phone, "Sorry, I had trouble processing your voice note. Please type your message instead.");
            return;
        }
    }

    // -- PHASE 2: AUTO TRANSLATION (VERNACULAR SUPPORT) --
    // We attempt to translate ANY incoming text to English.
    // The translation model auto-detects the source language.
    // If it's already English, it returns English. If Hindi, it translates to English.
    let englishInput = userInput;
    if (userInput && userInput.length > 0) {
        try {
            console.log(`[WhatsApp API] Translating input: "${userInput}"`);
            // We ask Sarvam to translate to English.
            // Note: We'll assume the user is speaking Hindi if the transcription or text looks non-standard,
            // but for a robust system, language detection should happen first.
            // Sarvam requires source_language, so we will attempt hi-IN to en-IN.
            // If the user spoke English, Sarvam might fail or return it as-is.
            englishInput = await translateText(userInput, 'hi-IN', 'en-IN');
            console.log(`[WhatsApp API] Translated Input (en): "${englishInput}"`);

            // If the translation actually changed the text significantly, we assume the user prefers Hindi.
            if (englishInput.toLowerCase().trim() !== userInput.toLowerCase().trim()) {
                session.language = 'hi-IN';
            }
        } catch (translateError) {
            console.error('[WhatsApp API] Translation Error:', translateError);
            // Fallback to original input if translation fails
        }
    }

    let replyText = '';

    // If user says "restart" or "hi" initially, reset the flow
    if (englishInput.toLowerCase() === 'restart' || englishInput.toLowerCase() === 'hi' || englishInput.toLowerCase() === 'hello') {
        session = { step: 'start', data: {}, outcomeAsked: false, language: session.language }; // Preserve language preference on restart
    }

    try {
        switch (session.step) {
            case 'start':
                replyText = `Welcome to JusticeAI's Consumer Scam Helpdesk. 👋\n\nI can help you officially complain against e-commerce fraud and draft a legal notice.\n\nType *start* to begin.`;
                session.step = 'choose_issue';
                break;

            case 'choose_issue':
                replyText = `Please describe the issue in one short sentence (e.g., "Received fake product", "Refund not processed").`;
                session.step = 'company_name';
                break;

            case 'company_name':
                session.data.issueType = englishInput;
                replyText = `Got it. What is the exact name of the company or website (e.g., Amazon, Flipkart, XYZ Fashion)?`;
                session.step = 'amount';
                break;

            case 'amount':
                session.data.company = englishInput;
                replyText = `What is the disputed amount in Rupees? (e.g., 2500)`;
                session.step = 'order_date';
                break;

            case 'order_date':
                session.data.amount = englishInput;
                replyText = `When did this happen? Provide the date of the order/incident (e.g., 12 Oct 2025).`;
                session.step = 'confirm';
                break;

            case 'confirm':
                session.data.orderDate = englishInput;
                replyText = `Please review your details:\n\n*Company:* ${session.data.company}\n*Amount:* Rs ${session.data.amount}\n*Date:* ${session.data.orderDate}\n*Issue:* ${session.data.issueType}\n\nType *YES* to generate a legal notice, or *RESTART* to start over.`;
                session.step = 'completed'; // Move to complete state to process the YES
                break;

            case 'completed':
                if (englishInput.toLowerCase() === 'yes') {
                    // Send loading message (translate if needed)
                    let loadingMsg = "⏳ Generating your legal notice using Indian Consumer Law. This will take ~10 seconds...";
                    if (session.language === 'hi-IN') {
                        try {
                            loadingMsg = await translateText(loadingMsg, 'en-IN', 'hi-IN');
                        } catch (e) { }
                    }
                    await sendWhatsAppMessage(phone, loadingMsg);

                    const draftResult = await generateLegalDraft({
                        company: session.data.company!,
                        amount: session.data.amount!,
                        orderDate: session.data.orderDate!,
                        issueType: session.data.issueType!,
                    });

                    if (!draftResult) {
                        replyText = `⚠️ INSUFFICIENT LEGAL DATA. We couldn't safely draft a notice for this specific issue. Please consult a human lawyer.`;
                    } else {
                        replyText = `*LEGAL BASIS:*\n${draftResult.citations}\n\n*Risk Level:* ${draftResult.risk_level}\n*Human Review:* Pending 👨‍⚖️\n\n*DRAFT NOTICE:*\n${draftResult.draft_notice}\n\n\n_Tip: Forward this draft to the company's grievance email or print it._`;
                        session.generatedAt = Date.now();
                        session.outcomeAsked = false;
                    }
                } else if (englishInput.toLowerCase() === 'restart') {
                    session = { step: 'start', data: {}, outcomeAsked: false, language: session.language };
                    replyText = `Restarting flow. Type *start* to begin.`;
                    session.step = 'choose_issue';
                } else {
                    replyText = `Please type *YES* to confirm or *RESTART* to cancel.`;
                }
                break;

            default:
                session.step = 'start';
                replyText = `Something went wrong. Type *hi* to restart.`;
                break;
        }

        // Save session state
        await sessionRef.set(session);

        // -- PHASE 2: AUTO TRANSLATE OUTGOING RESPONSE --
        if (replyText) {
            let finalOutput = replyText;
            if (session.language === 'hi-IN') {
                try {
                    console.log(`[WhatsApp API] Translating output to Hindi...`);
                    // We DO NOT translate the generated Draft Notice (it must stay English for legal accuracy),
                    // but we DO translate the conversational instructions.
                    if (session.step === 'completed' && englishInput.toLowerCase() === 'yes') {
                        // The notice was successfully generated. We only translate the metadata.
                        // For simplicity, we just send it as is in English here to avoid corrupting the legal draft formatting.
                        finalOutput = replyText;
                    } else {
                        finalOutput = await translateText(replyText, 'en-IN', 'hi-IN');
                    }
                } catch (tError) {
                    console.error('[WhatsApp API] Output Translation Error:', tError);
                }
            }
            await sendWhatsAppMessage(phone, finalOutput);
        }
    } catch (error) {
        console.error('[flowController] Error in state machine:', error);
        await sendWhatsAppMessage(phone, "Sorry, I encountered an internal error. Please try again later.");
    }
}
