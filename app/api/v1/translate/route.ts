import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, addRateLimitHeaders } from '@/lib/api-key-middleware';
import { logApiUsage } from '@/lib/usage-logger';

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || '';
const SARVAM_BASE_URL = 'https://api.sarvam.ai';

/**
 * POST /api/v1/translate
 * 
 * Body: { text: string, source_language?: string, target_language?: string }
 * Auth: Bearer API key
 */
export async function POST(req: NextRequest) {
    const startTime = Date.now();

    const auth = await authenticateRequest(req, 'translate');
    if (auth.error) return auth.error;
    const keyDoc = auth.keyDoc!;

    try {
        const body = await req.json();
        const { text, source_language = 'en-IN', target_language = 'hi-IN' } = body;

        if (!text || typeof text !== 'string') {
            return NextResponse.json(
                { error: { message: 'Missing required field: text', type: 'invalid_request', code: 'missing_field' } },
                { status: 400 }
            );
        }

        const sarvamResponse = await fetch(`${SARVAM_BASE_URL}/translate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-subscription-key': SARVAM_API_KEY,
            },
            body: JSON.stringify({
                input: text,
                source_language_code: source_language,
                target_language_code: target_language,
                model: 'mayura:v1',
                enable_preprocessing: true,
            }),
        });

        if (!sarvamResponse.ok) {
            const errorData = await sarvamResponse.text();
            throw new Error(`Sarvam Translate failed: ${sarvamResponse.status} - ${errorData}`);
        }

        const data = await sarvamResponse.json();
        const latencyMs = Date.now() - startTime;

        const response = NextResponse.json({
            id: `req_${Date.now().toString(36)}`,
            model: 'anukalp-apex-v1',
            created: Math.floor(Date.now() / 1000),
            data: {
                translated_text: data.translated_text || '',
                source_language,
                target_language,
            },
            usage: { latency_ms: latencyMs },
        });

        addRateLimitHeaders(response, keyDoc);

        logApiUsage({
            apiKeyId: keyDoc.id,
            userId: keyDoc.userId,
            endpoint: '/api/v1/translate',
            method: 'POST',
            statusCode: 200,
            latencyMs,
            model: 'anukalp-apex-v1',
            req,
        });

        return response;
    } catch (error: any) {
        const latencyMs = Date.now() - startTime;
        logApiUsage({ apiKeyId: keyDoc.id, userId: keyDoc.userId, endpoint: '/api/v1/translate', method: 'POST', statusCode: 500, latencyMs, req });
        console.error('[API] /api/v1/translate error:', error);
        return NextResponse.json(
            { error: { message: 'Translation failed', type: 'api_error', code: 'translate_error' } },
            { status: 500 }
        );
    }
}
