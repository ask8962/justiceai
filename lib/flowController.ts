import { getFirebaseAdminDb } from './firebase-admin';
import { sendWhatsAppMessage } from './twilioSender';
import { generateLegalDraft } from './generateDraft';

interface Session {
    step: 'start' | 'choose_issue' | 'company_name' | 'amount' | 'order_date' | 'confirm' | 'completed';
    data: {
        issueType?: string;
        company?: string;
        amount?: string;
        orderDate?: string;
    };
    generatedAt?: number;
    outcomeAsked: boolean;
}

/**
 * Main Flow Controller for WhatsApp Bot
 * Strictly Rule-Based state machine.
 */
export async function handleWhatsAppFlow(phone: string, incomingBody: string) {
    const db = getFirebaseAdminDb();
    const sessionRef = db.collection('whatsapp_sessions').doc(phone);
    const sessionDoc = await sessionRef.get();

    let session: Session = { step: 'start', data: {}, outcomeAsked: false };

    if (sessionDoc.exists) {
        session = sessionDoc.data() as Session;
    }

    const userInput = incomingBody.trim();
    let replyText = '';

    // If user says "restart" or "hi" initially, reset the flow
    if (userInput.toLowerCase() === 'restart' || userInput.toLowerCase() === 'hi' || userInput.toLowerCase() === 'hello') {
        session = { step: 'start', data: {}, outcomeAsked: false };
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
                session.data.issueType = userInput;
                replyText = `Got it. What is the exact name of the company or website (e.g., Amazon, Flipkart, XYZ Fashion)?`;
                session.step = 'amount';
                break;

            case 'amount':
                session.data.company = userInput;
                replyText = `What is the disputed amount in Rupees? (e.g., 2500)`;
                session.step = 'order_date';
                break;

            case 'order_date':
                session.data.amount = userInput;
                replyText = `When did this happen? Provide the date of the order/incident (e.g., 12 Oct 2025).`;
                session.step = 'confirm';
                break;

            case 'confirm':
                session.data.orderDate = userInput;
                replyText = `Please review your details:\n\n*Company:* ${session.data.company}\n*Amount:* Rs ${session.data.amount}\n*Date:* ${session.data.orderDate}\n*Issue:* ${session.data.issueType}\n\nType *YES* to generate a legal notice, or *RESTART* to start over.`;
                session.step = 'completed'; // Move to complete state to process the YES
                break;

            case 'completed':
                if (userInput.toLowerCase() === 'yes') {
                    // Send loading message
                    await sendWhatsAppMessage(phone, "⏳ Generating your legal notice using Indian Consumer Law. This will take ~10 seconds...");

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
                } else if (userInput.toLowerCase() === 'restart') {
                    session = { step: 'start', data: {}, outcomeAsked: false };
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

        // Send reply back via Twilio
        if (replyText) {
            await sendWhatsAppMessage(phone, replyText);
        }
    } catch (error) {
        console.error('[flowController] Error in state machine:', error);
        await sendWhatsAppMessage(phone, "Sorry, I encountered an internal error. Please try again later.");
    }
}
