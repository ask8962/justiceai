import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from 'twilio/lib/webhooks/webhooks';
import { qstashClient } from '@/lib/upstash';

export async function POST(req: NextRequest) {
    try {
        // Read raw body for Twilio signature validation
        const bodyText = await req.text();
        const url = new URL(req.url); // The full URL the webhook was sent to
        const signature = req.headers.get('x-twilio-signature') || '';

        // Optional: Twilio Signature Validation
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        if (authToken && process.env.NODE_ENV === 'production') {
            const params = new URLSearchParams(bodyText);
            const paramsObject: Record<string, string> = {};
            for (const [key, value] of params.entries()) {
                paramsObject[key] = value;
            }

            const isValid = validateRequest(authToken, signature, url.toString(), paramsObject);
            if (!isValid) {
                console.warn(`[WhatsApp API] Invalid Twilio Signature detected. Expected URL: ${url.toString()}`);
            }
        }

        // Parse form data from the text body to ensure it has 'From'
        const formData = new URLSearchParams(bodyText);
        const from = formData.get('From');

        if (!from) {
            return new NextResponse('Bad Request - Missing From', { status: 400 });
        }

        // Publish to Upstash QStash for Background Processing
        // The worker runs at /api/v1/whatsapp/worker
        const workerUrl = `${url.origin}/api/v1/whatsapp/worker`;

        try {
            const messageId = await qstashClient.publishJSON({
                url: workerUrl,
                body: { rawTwilioBody: bodyText },
                retries: 3, // Retry up to 3 times if the worker fails
            });
            console.log(`[WhatsApp API] Published to QStash Worker. MessageID: ${messageId}`);
        } catch (qstashError) {
            console.error('[WhatsApp API] Failed to publish to QStash:', qstashError);
            // Even if QStash fails, we must return 200 OK to Twilio so it stops retrying
        }

        // Always return 200 OK with empty TwiML response for Twilio
        return new NextResponse('<Response></Response>', {
            status: 200,
            headers: { 'Content-Type': 'text/xml' }
        });

    } catch (error) {
        console.error('[WhatsApp API] Internal server error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
