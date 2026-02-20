import { NextRequest, NextResponse } from 'next/server';
import { getUserUsageStats } from '@/lib/usage-logger';
import { getAuth } from 'firebase-admin/auth';

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
 * GET /api/dashboard/usage
 * Returns aggregated usage statistics for all keys of the authenticated user.
 * 
 * Query: ?days=30 (optional)
 */
export async function GET(req: NextRequest) {
    const session = await verifySession(req);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const days = parseInt(req.nextUrl.searchParams.get('days') || '30', 10);
        const stats = await getUserUsageStats(session.uid, days);

        return NextResponse.json({ data: stats });
    } catch (error: any) {
        console.error('[Dashboard] Error fetching usage stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch usage statistics' },
            { status: 500 }
        );
    }
}
