import { NextRequest } from 'next/server';
import { getFirebaseAdminDb } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * API Usage Logger
 * Logs every API request to Firestore and increments the key's quota counter.
 * Runs fire-and-forget so it doesn't block the API response.
 */

export interface UsageLogEntry {
    apiKeyId: string;
    userId: string;
    endpoint: string;
    method: string;
    statusCode: number;
    latencyMs: number;
    model: string;
    inputTokens?: number;
    outputTokens?: number;
    ipAddress: string;
    userAgent: string;
    timestamp: FirebaseFirestore.FieldValue;
}

/**
 * Log an API request to the `api_usage_logs` collection.
 * Also increments quotaUsed and updates lastUsedAt on the key.
 * This is fire-and-forget — errors are logged but don't fail the request.
 */
export async function logApiUsage(params: {
    apiKeyId: string;
    userId: string;
    endpoint: string;
    method: string;
    statusCode: number;
    latencyMs: number;
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    req: NextRequest;
}): Promise<void> {
    try {
        const db = getFirebaseAdminDb();

        const logEntry: UsageLogEntry = {
            apiKeyId: params.apiKeyId,
            userId: params.userId,
            endpoint: params.endpoint,
            method: params.method,
            statusCode: params.statusCode,
            latencyMs: params.latencyMs,
            model: params.model || 'anukalp-apex-v1',
            inputTokens: params.inputTokens || 0,
            outputTokens: params.outputTokens || 0,
            ipAddress: params.req.headers.get('x-forwarded-for') || params.req.headers.get('x-real-ip') || 'unknown',
            userAgent: params.req.headers.get('user-agent') || 'unknown',
            timestamp: FieldValue.serverTimestamp(),
        };

        // Fire-and-forget: write log + update key counters in parallel
        await Promise.all([
            db.collection('api_usage_logs').add(logEntry),
            db.collection('api_keys').doc(params.apiKeyId).update({
                quotaUsed: FieldValue.increment(1),
                lastUsedAt: FieldValue.serverTimestamp(),
            }),
        ]);
    } catch (error) {
        // Non-blocking — log the error but don't fail the API response
        console.error('[UsageLogger] Failed to log API usage:', error);
    }
}

/**
 * Get usage statistics for a specific API key.
 */
export async function getKeyUsageStats(apiKeyId: string, days: number = 30): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgLatencyMs: number;
    requestsByEndpoint: Record<string, number>;
    requestsByDay: Record<string, number>;
}> {
    const db = getFirebaseAdminDb();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let snapshot;
    try {
        snapshot = await db
            .collection('api_usage_logs')
            .where('apiKeyId', '==', apiKeyId)
            .where('timestamp', '>=', cutoffDate)
            .orderBy('timestamp', 'desc')
            .limit(10000)
            .get();
    } catch (err: any) {
        // Index not ready yet — return empty stats
        console.warn('[UsageLogger] Index not ready, returning empty stats:', err.message);
        return { totalRequests: 0, successfulRequests: 0, failedRequests: 0, avgLatencyMs: 0, requestsByEndpoint: {}, requestsByDay: {} };
    }

    const logs = snapshot.docs.map((doc) => doc.data());

    const totalRequests = logs.length;
    const successfulRequests = logs.filter((l) => l.statusCode >= 200 && l.statusCode < 300).length;
    const failedRequests = totalRequests - successfulRequests;
    const avgLatencyMs = totalRequests > 0
        ? Math.round(logs.reduce((sum, l) => sum + (l.latencyMs || 0), 0) / totalRequests)
        : 0;

    const requestsByEndpoint: Record<string, number> = {};
    const requestsByDay: Record<string, number> = {};

    for (const log of logs) {
        // Group by endpoint
        const ep = log.endpoint || 'unknown';
        requestsByEndpoint[ep] = (requestsByEndpoint[ep] || 0) + 1;

        // Group by day
        if (log.timestamp && typeof log.timestamp.toDate === 'function') {
            const day = log.timestamp.toDate().toISOString().split('T')[0];
            requestsByDay[day] = (requestsByDay[day] || 0) + 1;
        }
    }

    return {
        totalRequests,
        successfulRequests,
        failedRequests,
        avgLatencyMs,
        requestsByEndpoint,
        requestsByDay,
    };
}

/**
 * Get aggregated usage stats for all keys of a user.
 */
export async function getUserUsageStats(userId: string, days: number = 30): Promise<{
    totalRequests: number;
    totalKeys: number;
    activeKeys: number;
    requestsByDay: Record<string, number>;
    requestsByEndpoint: Record<string, number>;
}> {
    const db = getFirebaseAdminDb();

    // Get all user's keys
    const keysSnapshot = await db
        .collection('api_keys')
        .where('userId', '==', userId)
        .get();

    const totalKeys = keysSnapshot.size;
    const activeKeys = keysSnapshot.docs.filter((d) => d.data().status === 'active').length;

    // Get usage logs
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let logsSnapshot;
    try {
        logsSnapshot = await db
            .collection('api_usage_logs')
            .where('userId', '==', userId)
            .where('timestamp', '>=', cutoffDate)
            .orderBy('timestamp', 'desc')
            .limit(10000)
            .get();
    } catch (err: any) {
        // Index not ready yet — return partial stats
        console.warn('[UsageLogger] Index not ready, returning partial stats:', err.message);
        return { totalRequests: 0, totalKeys, activeKeys, requestsByDay: {}, requestsByEndpoint: {} };
    }

    const logs = logsSnapshot.docs.map((doc) => doc.data());

    const requestsByDay: Record<string, number> = {};
    const requestsByEndpoint: Record<string, number> = {};

    for (const log of logs) {
        const ep = log.endpoint || 'unknown';
        requestsByEndpoint[ep] = (requestsByEndpoint[ep] || 0) + 1;

        if (log.timestamp && typeof log.timestamp.toDate === 'function') {
            const day = log.timestamp.toDate().toISOString().split('T')[0];
            requestsByDay[day] = (requestsByDay[day] || 0) + 1;
        }
    }

    return {
        totalRequests: logs.length,
        totalKeys,
        activeKeys,
        requestsByDay,
        requestsByEndpoint,
    };
}
