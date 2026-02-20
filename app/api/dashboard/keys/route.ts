import { NextRequest, NextResponse } from 'next/server';
import { createApiKey, listApiKeys, AVAILABLE_SCOPES } from '@/lib/api-key-service';
import { getFirebaseAdminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

/**
 * Helper: Verify Firebase ID token from Authorization header or cookie.
 * Dashboard routes use Firebase Auth (session-based), not API keys.
 */
async function verifySession(req: NextRequest): Promise<{ uid: string; email: string } | null> {
    try {
        // Check for Bearer token (Firebase ID token)
        const authHeader = req.headers.get('Authorization');
        if (authHeader?.startsWith('Bearer ')) {
            const idToken = authHeader.slice(7);
            const decodedToken = await getAuth().verifyIdToken(idToken);
            return { uid: decodedToken.uid, email: decodedToken.email || '' };
        }

        // Check for x-user-id header (simplified auth for development)
        const userId = req.headers.get('x-user-id');
        const userEmail = req.headers.get('x-user-email') || '';
        if (userId) {
            return { uid: userId, email: userEmail };
        }

        return null;
    } catch (error) {
        console.error('[Dashboard] Auth verification failed:', error);
        return null;
    }
}

/**
 * GET /api/dashboard/keys
 * Returns all API keys for the authenticated user.
 */
export async function GET(req: NextRequest) {
    const session = await verifySession(req);
    if (!session) {
        return NextResponse.json(
            { error: 'Unauthorized. Provide Firebase ID token or x-user-id header.' },
            { status: 401 }
        );
    }

    try {
        const keys = await listApiKeys(session.uid);
        return NextResponse.json({ data: keys });
    } catch (error: any) {
        console.error('[Dashboard] Error listing keys:', error);
        return NextResponse.json(
            { error: 'Failed to list API keys' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/dashboard/keys
 * Create a new API key.
 * 
 * Body: { name: string, scopes?: string[], tier?: string }
 */
export async function POST(req: NextRequest) {
    const session = await verifySession(req);
    if (!session) {
        return NextResponse.json(
            { error: 'Unauthorized. Provide Firebase ID token or x-user-id header.' },
            { status: 401 }
        );
    }

    try {
        const body = await req.json();
        const { name, scopes, tier } = body;

        if (!name || typeof name !== 'string') {
            return NextResponse.json(
                { error: 'Missing required field: name (string)' },
                { status: 400 }
            );
        }

        // Validate scopes
        const validScopes = scopes && Array.isArray(scopes)
            ? scopes.filter((s: string) => AVAILABLE_SCOPES.includes(s as any))
            : [...AVAILABLE_SCOPES]; // Default: all scopes

        // Check max keys limit (5 per user on free tier)
        const existingKeys = await listApiKeys(session.uid);
        const activeKeys = existingKeys.filter((k) => k.status === 'active');
        if (activeKeys.length >= 10) {
            return NextResponse.json(
                { error: 'Maximum number of active API keys reached (10)' },
                { status: 400 }
            );
        }

        const result = await createApiKey({
            userId: session.uid,
            name,
            scopes: validScopes,
            tier: tier || 'free',
        });

        return NextResponse.json({
            message: 'API key created successfully. Copy the key now — it will not be shown again.',
            data: {
                id: result.keyId,
                key: result.fullKey,
                prefix: result.prefix,
                name,
                scopes: validScopes,
                tier: tier || 'free',
            },
        });
    } catch (error: any) {
        console.error('[Dashboard] Error creating key:', error);
        return NextResponse.json(
            { error: 'Failed to create API key' },
            { status: 500 }
        );
    }
}
