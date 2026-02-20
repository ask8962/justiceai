import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, ApiKeyDocument } from './api-key-service';
import { logApiUsage } from './usage-logger';

/**
 * API Key Authentication Middleware
 * Extracts the Bearer token, validates it, checks quota, and returns the key doc.
 * 
 * Usage in a route:
 *   const auth = await authenticateRequest(req, 'legal-query');
 *   if (auth.error) return auth.error;
 *   // auth.keyDoc is now available
 */
export async function authenticateRequest(
    req: NextRequest,
    requiredScope?: string
): Promise<{
    keyDoc?: ApiKeyDocument & { id: string };
    error?: NextResponse;
}> {
    const startTime = Date.now();

    // 1. Extract Bearer token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
            error: NextResponse.json(
                {
                    error: {
                        message: 'Missing or invalid Authorization header. Use: Authorization: Bearer sk-justai-xxx',
                        type: 'authentication_error',
                        code: 'missing_api_key',
                    },
                },
                { status: 401 }
            ),
        };
    }

    const rawKey = authHeader.slice(7).trim();

    // 2. Quick format check
    if (!rawKey.startsWith('sk-justai-')) {
        return {
            error: NextResponse.json(
                {
                    error: {
                        message: 'Invalid API key format. Keys must start with sk-justai-',
                        type: 'authentication_error',
                        code: 'invalid_key_format',
                    },
                },
                { status: 401 }
            ),
        };
    }

    // 3. Validate against Firestore
    const validation = await validateApiKey(rawKey);
    if (!validation.valid || !validation.keyDoc) {
        return {
            error: NextResponse.json(
                {
                    error: {
                        message: validation.error || 'Invalid API key',
                        type: validation.statusCode === 429 ? 'rate_limit_error' : 'authentication_error',
                        code: validation.statusCode === 429 ? 'quota_exceeded' : 'invalid_api_key',
                    },
                },
                { status: validation.statusCode || 401 }
            ),
        };
    }

    // 4. Check scope permission
    if (requiredScope && !validation.keyDoc.scopes.includes(requiredScope)) {
        return {
            error: NextResponse.json(
                {
                    error: {
                        message: `API key does not have permission for scope: ${requiredScope}. Current scopes: ${validation.keyDoc.scopes.join(', ')}`,
                        type: 'permission_error',
                        code: 'insufficient_scope',
                    },
                },
                { status: 403 }
            ),
        };
    }

    return { keyDoc: validation.keyDoc };
}

/**
 * Add rate-limit headers to a response.
 */
export function addRateLimitHeaders(
    response: NextResponse,
    keyDoc: ApiKeyDocument
): NextResponse {
    response.headers.set('X-RateLimit-Limit', String(keyDoc.quotaLimit));
    response.headers.set('X-RateLimit-Remaining', String(Math.max(0, keyDoc.quotaLimit - keyDoc.quotaUsed - 1)));
    response.headers.set('X-RateLimit-Used', String(keyDoc.quotaUsed + 1));
    response.headers.set('X-Model', 'anukalp-apex-v1');

    if (keyDoc.quotaResetDate) {
        const resetDate = typeof keyDoc.quotaResetDate.toDate === 'function'
            ? keyDoc.quotaResetDate.toDate()
            : new Date();
        const nextReset = new Date(resetDate);
        nextReset.setMonth(nextReset.getMonth() + 1);
        response.headers.set('X-RateLimit-Reset', nextReset.toISOString());
    }

    return response;
}
