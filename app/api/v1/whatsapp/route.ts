import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from 'twilio';
import { handleWhatsAppFlow } from '@/lib/flowController';

export async function POST(req: NextRequest) {
    try {
        // Read raw body for Twilio signature validation
        const bodyText = await req.text();
        const url = new URL(req.url); // The full URL the webhook was sent to
        const signature = req.headers.get('x-twilio-signature') || '';

        // Optional: Twilio Signature Validation (Recommended for Production)
        // If TWILIO_AUTH_TOKEN is present, we validate. If testing locally via Ngrok, we might skip if explicitly disabled.
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        if (authToken && process.env.NODE_ENV === 'production') {
            // Parse application/x-www-form-urlencoded into a standard object containing the post parameters
            const params = new URLSearchParams(bodyText);
            const paramsObject: Record<string, string> = {};
            for (const [key, value] of params.entries()) {
                paramsObject[key] = value;
            }

            const isValid = validateRequest(authToken, signature, url.toString(), paramsObject);
            if (!isValid) {
                console.warn('[WhatsApp API] Invalid Twilio Signature detected.');
                return new NextResponse('Unauthorized', { status: 401 });
            }
        }

        // Parse form data from the text body
        const formData = new URLSearchParams(bodyText);
        const from = formData.get('From'); // e.g. "whatsapp:+1234567890"
        const body = formData.get('Body');

        if (!from || !body) {
            return new NextResponse('Bad Request - Missing From or Body', { status: 400 });
        }

        // Process message asynchronously so Twilio receives a 200 OK immediately
        handleWhatsAppFlow(from, body).catch((error) => {
            console.error('[WhatsApp API] Flow controller error:', error);
        });

        // Always return 200 OK with empty response for Twilio
        // We use the REST API (`sendWhatsAppMessage`) to reply, not TwiML responses,
        // because we might need delays or to fetch AI data.
        return new NextResponse('<Response></Response>', {
            status: 200,
            headers: { 'Content-Type': 'text/xml' }
        });

    } catch (error) {
        console.error('[WhatsApp API] Internal server error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
