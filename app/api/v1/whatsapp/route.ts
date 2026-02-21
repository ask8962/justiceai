import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from 'twilio/lib/webhooks/webhooks';
import { qstashClient } from '@/lib/upstash';
import { handleWhatsAppFlow } from '@/lib/flowController';

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

        // Parse form data from the text body
        const formData = new URLSearchParams(bodyText);
        const from = formData.get('From');
        const body = formData.get('Body') || '';
        const numMedia = parseInt(formData.get('NumMedia') || '0', 10);
        const mediaUrl0 = formData.get('MediaUrl0') || '';

        if (!from) {
            return new NextResponse('Bad Request - Missing From', { status: 400 });
        }

        // QStash CANNOT reach localhost (loopback). So:
        // - LOCAL DEV (ngrok): Process directly (like before)
        // - PRODUCTION (Vercel): Publish to QStash for background processing
        const isLocalDev = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

        if (isLocalDev) {
            // Direct execution for local testing
            console.log('[WhatsApp API] Local dev mode - processing directly');
            try {
                await handleWhatsAppFlow(from, body, { numMedia, mediaUrl0 });
            } catch (error) {
                console.error('[WhatsApp API] Flow controller error:', error);
            }
        } else {
            // Production: Publish to Upstash QStash for background processing
            const workerUrl = `${url.origin}/api/v1/whatsapp/worker`;
            try {
                const messageId = await qstashClient.publishJSON({
                    url: workerUrl,
                    body: { rawTwilioBody: bodyText },
                    retries: 3,
                });
                console.log(`[WhatsApp API] Published to QStash Worker. MessageID: ${messageId}`);
            } catch (qstashError) {
                console.error('[WhatsApp API] Failed to publish to QStash:', qstashError);
            }
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

