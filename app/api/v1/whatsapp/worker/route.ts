import { NextRequest, NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { handleWhatsAppFlow } from '@/lib/flowController';

// This function processes the job exactly as the webhook used to do, 
// but it is now protected by QStash signature validation and runs in the background.
async function handler(req: NextRequest) {
    try {
        const body = await req.json();
        const rawTwilioBody = body.rawTwilioBody as string;

        if (!rawTwilioBody) {
            console.error('[QStash Worker] Missing rawTwilioBody in payload');
            return new NextResponse('Bad Request', { status: 400 });
        }

        // Parse form data from the original Twilio text body
        const formData = new URLSearchParams(rawTwilioBody);
        const from = formData.get('From');
        const twilioBody = formData.get('Body') || '';
        const numMedia = parseInt(formData.get('NumMedia') || '0', 10);
        const mediaUrl0 = formData.get('MediaUrl0') || '';

        if (!from) {
            console.error('[QStash Worker] Missing From parameter');
            return new NextResponse('Bad Request', { status: 400 });
        }

        console.log(`[QStash Worker] Processing message from ${from}`);

        // TODO: Pass media details to flow controller once STT logic is implemented
        await handleWhatsAppFlow(from, twilioBody, { numMedia, mediaUrl0 });

        return new NextResponse('OK', { status: 200 });

    } catch (error) {
        console.error('[QStash Worker] Fatal execution error:', error);
        // Throwing/returning 500 tells QStash to retry this job
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

// Wrap the handler with QStash signature verification
export const POST = verifySignatureAppRouter(handler);
