import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, addRateLimitHeaders } from '@/lib/api-key-middleware';
import { logApiUsage } from '@/lib/usage-logger';

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || '';
const SARVAM_BASE_URL = 'https://api.sarvam.ai';

/**
 * POST /api/v1/stt
 * 
 * Body: FormData with `file` (audio blob) and optional `language_code`
 * Auth: Bearer API key
 */
export async function POST(req: NextRequest) {
    const startTime = Date.now();

    const auth = await authenticateRequest(req, 'stt');
    if (auth.error) return auth.error;
    const keyDoc = auth.keyDoc!;

    try {
        const formData = await req.formData();
        const file = formData.get('file');

        if (!file || !(file instanceof Blob)) {
            return NextResponse.json(
                { error: { message: 'Missing required field: file (audio blob)', type: 'invalid_request', code: 'missing_field' } },
                { status: 400 }
            );
        }

        const languageCode = (formData.get('language_code') as string) || 'unknown';

        // Forward to Sarvam STT
        const sarvamFormData = new FormData();
        sarvamFormData.append('file', file, 'recording.wav');
        sarvamFormData.append('model', 'saaras:v3');
        sarvamFormData.append('language_code', languageCode);
        sarvamFormData.append('with_timestamps', 'false');

        const sarvamResponse = await fetch(`${SARVAM_BASE_URL}/speech-to-text`, {
            method: 'POST',
            headers: {
                'api-subscription-key': SARVAM_API_KEY,
            },
            body: sarvamFormData,
        });

        if (!sarvamResponse.ok) {
            const errorData = await sarvamResponse.text();
            throw new Error(`Sarvam STT failed: ${sarvamResponse.status} - ${errorData}`);
        }

        const data = await sarvamResponse.json();
        const latencyMs = Date.now() - startTime;

        const response = NextResponse.json({
            id: `req_${Date.now().toString(36)}`,
            model: 'anukalp-apex-v1',
            created: Math.floor(Date.now() / 1000),
            data: {
                transcript: data.transcript || '',
                language_code: data.language_code || languageCode,
            },
            usage: { latency_ms: latencyMs },
        });

        addRateLimitHeaders(response, keyDoc);

        logApiUsage({
            apiKeyId: keyDoc.id,
            userId: keyDoc.userId,
            endpoint: '/api/v1/stt',
            method: 'POST',
            statusCode: 200,
            latencyMs,
            model: 'anukalp-apex-v1',
            req,
        });

        return response;
    } catch (error: any) {
        const latencyMs = Date.now() - startTime;
        logApiUsage({ apiKeyId: keyDoc.id, userId: keyDoc.userId, endpoint: '/api/v1/stt', method: 'POST', statusCode: 500, latencyMs, req });
        console.error('[API] /api/v1/stt error:', error);
        return NextResponse.json(
            { error: { message: 'STT processing failed', type: 'api_error', code: 'stt_error' } },
            { status: 500 }
        );
    }
}
