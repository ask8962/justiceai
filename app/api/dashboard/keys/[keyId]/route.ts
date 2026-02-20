import { NextRequest, NextResponse } from 'next/server';
import { revokeApiKey } from '@/lib/api-key-service';
import { getFirebaseAdminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Helper: Verify Firebase ID token or dev header.
 */
async function verifySession(req: NextRequest): Promise<{ uid: string } | null> {
    try {
        const authHeader = req.headers.get('Authorization');
        if (authHeader?.startsWith('Bearer ')) {
            const idToken = authHeader.slice(7);
            const decodedToken = await getAuth().verifyIdToken(idToken);
            return { uid: decodedToken.uid };
        }
        const userId = req.headers.get('x-user-id');
        if (userId) return { uid: userId };
        return null;
    } catch {
        return null;
    }
}

/**
 * DELETE /api/dashboard/keys/[keyId]
 * Revoke an API key.
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ keyId: string }> }
) {
    const session = await verifySession(req);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { keyId } = await params;
        await revokeApiKey(keyId, session.uid);
        return NextResponse.json({ message: 'API key revoked successfully' });
    } catch (error: any) {
        console.error('[Dashboard] Error revoking key:', error);
        const status = error.message?.includes('Unauthorized') ? 403 : 500;
        return NextResponse.json(
            { error: error.message || 'Failed to revoke API key' },
            { status }
        );
    }
}

/**
 * PATCH /api/dashboard/keys/[keyId]
 * Update key metadata (name, scopes, tier).
 * 
 * Body: { name?: string, scopes?: string[], tier?: string }
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ keyId: string }> }
) {
    const session = await verifySession(req);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { keyId } = await params;
        const body = await req.json();
        const db = getFirebaseAdminDb();
        const keyRef = db.collection('api_keys').doc(keyId);
        const keyDoc = await keyRef.get();

        if (!keyDoc.exists) {
            return NextResponse.json({ error: 'API key not found' }, { status: 404 });
        }

        if (keyDoc.data()?.userId !== session.uid) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const updates: Record<string, any> = {};
        if (body.name) updates.name = body.name;
        if (body.scopes && Array.isArray(body.scopes)) updates.scopes = body.scopes;
        if (body.tier) {
            updates.tier = body.tier;
            // Update quota limits based on tier
            const TIER_LIMITS: Record<string, { quota: number; ratePerMin: number }> = {
                free: { quota: 100, ratePerMin: 10 },
                starter: { quota: 1000, ratePerMin: 30 },
                pro: { quota: 10000, ratePerMin: 60 },
                enterprise: { quota: 999999, ratePerMin: 120 },
            };
            const limits = TIER_LIMITS[body.tier] || TIER_LIMITS.free;
            updates.quotaLimit = limits.quota;
            updates.rateLimit = limits.ratePerMin;
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        await keyRef.update(updates);

        return NextResponse.json({ message: 'API key updated successfully', updates });
    } catch (error: any) {
        console.error('[Dashboard] Error updating key:', error);
        return NextResponse.json(
            { error: 'Failed to update API key' },
            { status: 500 }
        );
    }
}
