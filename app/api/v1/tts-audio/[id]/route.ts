import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDb } from '@/lib/firebase-admin';

/**
 * Serves temporary TTS audio files stored in Firestore.
 * Twilio fetches the audio from this URL when delivering media messages.
 * 
 * GET /api/v1/tts-audio/[id]
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return new NextResponse('Not Found', { status: 404 });
        }

        const db = getFirebaseAdminDb();
        const docRef = db.collection('tts_audio_cache').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return new NextResponse('Audio not found', { status: 404 });
        }

        const data = doc.data();
        const base64Audio = data?.audio as string;

        if (!base64Audio) {
            return new NextResponse('Audio data missing', { status: 404 });
        }

        // Convert base64 to Buffer and serve as WAV
        const audioBuffer = Buffer.from(base64Audio, 'base64');

        // Delete the document after serving (one-time use)
        docRef.delete().catch(() => { });

        return new NextResponse(audioBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'audio/wav',
                'Content-Length': audioBuffer.length.toString(),
                'Cache-Control': 'no-cache, no-store',
            },
        });
    } catch (error) {
        console.error('[TTS Audio] Error serving audio:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
