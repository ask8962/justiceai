import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import twilio from 'twilio';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

// Twilio Setup
const accountSid = process.env.TWILIO_ACCOUNT_SID || functions.config().twilio?.account_sid;
const authToken = process.env.TWILIO_AUTH_TOKEN || functions.config().twilio?.auth_token;
const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || functions.config().twilio?.whatsapp_number;

/**
 * Scheduled function that runs every hour to check for completed WhatsApp
 * sessions that are older than 48 hours and haven't been asked for outcome.
 */
export const checkOutcomesScheduler = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
    if (!accountSid || !authToken || !fromNumber) {
        console.warn('Twilio credentials not configured in Cloud Functions. Exiting scheduler.');
        return null;
    }

    const client = twilio(accountSid, authToken);

    // Calculate timestamp for 48 hours ago
    const hoursAgo48 = Date.now() - (48 * 60 * 60 * 1000);

    try {
        const sessionsRef = db.collection('whatsapp_sessions');

        // Find sessions that generated a draft > 48 hours ago and haven't been asked about outcomes
        const pendingRef = sessionsRef
            .where('step', '==', 'completed')
            .where('outcomeAsked', '==', false)
            .where('generatedAt', '<=', hoursAgo48);

        const snapshot = await pendingRef.get();
        console.log(`Found ${snapshot.size} pending outcome checks.`);

        if (snapshot.empty) {
            return null;
        }

        const batch = db.batch();

        for (const doc of snapshot.docs) {
            const phone = doc.id;

            // Send the 48-hour follow-up message
            const messageBody = `Hi there! It's been 48 hours since you generated your legal notice for ${doc.data().data?.company || 'the company'}.\n\nDid the company respond?\n\nReply with:\n*1* - Yes, full refund/resolution\n*2* - Yes, partial resolution\n*3* - No reply yet`;

            try {
                await client.messages.create({
                    body: messageBody,
                    from: fromNumber,
                    to: phone
                });
                console.log(`Sent outcome query to ${phone}`);

                // Mark as asked and change step so it expects the outcome response
                batch.update(doc.ref, {
                    outcomeAsked: true,
                    step: 'awaiting_outcome'
                });
            } catch (msgError) {
                console.error(`Failed to send outcome message to ${phone}:`, msgError);
            }
        }

        await batch.commit();
        return null;

    } catch (error) {
        console.error('Error in outcome scheduler:', error);
        return null;
    }
});
