import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, addRateLimitHeaders } from '@/lib/api-key-middleware';
import { logApiUsage } from '@/lib/usage-logger';

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || '';
const SARVAM_BASE_URL = 'https://api.sarvam.ai';

/**
 * POST /api/v1/tts
 * 
 * Body: { text: string, target_language?: string, speaker?: string, pace?: number }
 * Auth: Bearer API key
 */
export async function POST(req: NextRequest) {
    const startTime = Date.now();

    const auth = await authenticateRequest(req, 'tts');
    if (auth.error) return auth.error;
    const keyDoc = auth.keyDoc!;

    try {
        const body = await req.json();
        const { text, target_language = 'en-IN', speaker = 'kavya', pace = 1.0 } = body;

        if (!text || typeof text !== 'string') {
            return NextResponse.json(
                { error: { message: 'Missing required field: text', type: 'invalid_request', code: 'missing_field' } },
                { status: 400 }
            );
        }

        // Sarvam TTS has a 500 char limit
        const truncatedText = text.length > 500 ? text.substring(0, 500) : text;

        const sarvamResponse = await fetch(`${SARVAM_BASE_URL}/text-to-speech`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-subscription-key': SARVAM_API_KEY,
            },
            body: JSON.stringify({
                inputs: [truncatedText],
                target_language_code: target_language,
                model: 'bulbul:v3',
                speaker,
                pace,
                enable_preprocessing: true,
            }),
        });

        if (!sarvamResponse.ok) {
            const errorData = await sarvamResponse.text();
            throw new Error(`Sarvam TTS failed: ${sarvamResponse.status} - ${errorData}`);
        }

        const data = await sarvamResponse.json();
        const latencyMs = Date.now() - startTime;

        const response = NextResponse.json({
            id: `req_${Date.now().toString(36)}`,
            model: 'anukalp-apex-v1',
            created: Math.floor(Date.now() / 1000),
            data: {
                audio_base64: data.audios[0],
                format: 'wav',
                language: target_language,
                speaker,
            },
            usage: { latency_ms: latencyMs },
        });

        addRateLimitHeaders(response, keyDoc);

        logApiUsage({
            apiKeyId: keyDoc.id,
            userId: keyDoc.userId,
            endpoint: '/api/v1/tts',
            method: 'POST',
            statusCode: 200,
            latencyMs,
            model: 'anukalp-apex-v1',
            req,
        });

        return response;
    } catch (error: any) {
        const latencyMs = Date.now() - startTime;
        logApiUsage({ apiKeyId: keyDoc.id, userId: keyDoc.userId, endpoint: '/api/v1/tts', method: 'POST', statusCode: 500, latencyMs, req });
        console.error('[API] /api/v1/tts error:', error);
        return NextResponse.json(
            { error: { message: 'TTS processing failed', type: 'api_error', code: 'tts_error' } },
            { status: 500 }
        );
    }
}
