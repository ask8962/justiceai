import twilio from 'twilio';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || '';
const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || ''; // e.g., 'whatsapp:+14155238886'

const client = twilio(accountSid, authToken);

/**
 * Sends a WhatsApp message using the Twilio SDK.
 * @param to The recipient's phone number in WhatsApp format (e.g., 'whatsapp:+919876543210')
 * @param body The message text to send
 */
export async function sendWhatsAppMessage(to: string, body: string) {
    if (!accountSid || !authToken || !fromNumber) {
        console.error('[twilioSender] Missing Twilio credentials in environment variables.');
        return;
    }

    try {
        const message = await client.messages.create({
            body,
            from: fromNumber,
            to,
        });
        console.log(`[twilioSender] Message sent to ${to}. SID: ${message.sid}`);
        return message.sid;
    } catch (error) {
        console.error(`[twilioSender] Failed to send message to ${to}:`, error);
        throw error;
    }
}
