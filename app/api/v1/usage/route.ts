import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, addRateLimitHeaders } from '@/lib/api-key-middleware';
import { getKeyUsageStats } from '@/lib/usage-logger';

/**
 * GET /api/v1/usage
 * 
 * Query: ?days=30 (optional, default 30)
 * Auth: Bearer API key
 * 
 * Returns usage statistics for the authenticated API key.
 */
export async function GET(req: NextRequest) {
    const auth = await authenticateRequest(req);
    if (auth.error) return auth.error;
    const keyDoc = auth.keyDoc!;

    try {
        const days = parseInt(req.nextUrl.searchParams.get('days') || '30', 10);

        const stats = await getKeyUsageStats(keyDoc.id, days);

        const response = NextResponse.json({
            id: `req_${Date.now().toString(36)}`,
            model: 'anukalp-apex-v1',
            data: {
                key_prefix: keyDoc.keyPrefix,
                tier: keyDoc.tier,
                quota: {
                    limit: keyDoc.quotaLimit,
                    used: keyDoc.quotaUsed,
                    remaining: Math.max(0, keyDoc.quotaLimit - keyDoc.quotaUsed),
                },
                stats,
            },
        });

        addRateLimitHeaders(response, keyDoc);
        return response;
    } catch (error: any) {
        console.error('[API] /api/v1/usage error:', error);
        return NextResponse.json(
            { error: { message: 'Failed to fetch usage stats', type: 'api_error', code: 'internal_error' } },
            { status: 500 }
        );
    }
}
