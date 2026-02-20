import crypto from 'crypto';
import { getFirebaseAdminDb } from './firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// ─── Types ────────────────────────────────────────────────────

export interface ApiKeyDocument {
    id: string;
    userId: string;
    name: string;
    keyPrefix: string;
    keyHash: string;
    scopes: string[];
    status: 'active' | 'revoked';
    tier: 'free' | 'starter' | 'pro' | 'enterprise';
    quotaLimit: number;
    quotaUsed: number;
    quotaResetDate: Timestamp;
    rateLimit: number; // requests per minute
    lastUsedAt: Timestamp | null;
    createdAt: Timestamp;
    revokedAt: Timestamp | null;
    expiresAt: Timestamp | null;
}

// Quota limits per tier
export const TIER_LIMITS: Record<string, { quota: number; ratePerMin: number }> = {
    free: { quota: 100, ratePerMin: 10 },
    starter: { quota: 1000, ratePerMin: 30 },
    pro: { quota: 10000, ratePerMin: 60 },
    enterprise: { quota: 999999, ratePerMin: 120 },
};

// All available API scopes
export const AVAILABLE_SCOPES = [
    'legal-query',
    'document-analysis',
    'tts',
    'stt',
    'translate',
    'generate-brief',
] as const;

export type ApiScope = typeof AVAILABLE_SCOPES[number];

// ─── Key Generation ───────────────────────────────────────────

/**
 * Generate a new API key with sk-justai- prefix.
 * Returns the full key (shown once), prefix (for display), and SHA-256 hash (stored).
 */
export function generateApiKey(): { fullKey: string; prefix: string; hash: string } {
    const randomBytes = crypto.randomBytes(32);
    const keyBody = randomBytes.toString('base64url');
    const fullKey = `sk-justai-${keyBody}`;

    return {
        fullKey,
        prefix: fullKey.slice(0, 20) + '...',
        hash: crypto.createHash('sha256').update(fullKey).digest('hex'),
    };
}

/**
 * Hash a raw API key using SHA-256.
 */
export function hashApiKey(rawKey: string): string {
    return crypto.createHash('sha256').update(rawKey).digest('hex');
}

// ─── Firestore CRUD ───────────────────────────────────────────

/**
 * Create a new API key document in Firestore.
 * Returns the full key (to show user once) and the document ID.
 */
export async function createApiKey(params: {
    userId: string;
    name: string;
    scopes: string[];
    tier?: string;
}): Promise<{ fullKey: string; keyId: string; prefix: string }> {
    const db = getFirebaseAdminDb();
    const { fullKey, prefix, hash } = generateApiKey();

    const tier = params.tier || 'free';
    const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;

    const keyDoc = {
        userId: params.userId,
        name: params.name,
        keyPrefix: prefix,
        keyHash: hash,
        scopes: params.scopes,
        status: 'active',
        tier,
        quotaLimit: limits.quota,
        quotaUsed: 0,
        quotaResetDate: FieldValue.serverTimestamp(),
        rateLimit: limits.ratePerMin,
        lastUsedAt: null,
        createdAt: FieldValue.serverTimestamp(),
        revokedAt: null,
        expiresAt: null,
    };

    const docRef = await db.collection('api_keys').add(keyDoc);

    return { fullKey, keyId: docRef.id, prefix };
}

/**
 * List all API keys for a user (does NOT return the hash).
 */
export async function listApiKeys(userId: string): Promise<Omit<ApiKeyDocument, 'keyHash'>[]> {
    const db = getFirebaseAdminDb();
    const snapshot = await db
        .collection('api_keys')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            userId: data.userId,
            name: data.name,
            keyPrefix: data.keyPrefix,
            scopes: data.scopes,
            status: data.status,
            tier: data.tier,
            quotaLimit: data.quotaLimit,
            quotaUsed: data.quotaUsed,
            quotaResetDate: data.quotaResetDate,
            rateLimit: data.rateLimit,
            lastUsedAt: data.lastUsedAt,
            createdAt: data.createdAt,
            revokedAt: data.revokedAt,
            expiresAt: data.expiresAt,
        } as Omit<ApiKeyDocument, 'keyHash'>;
    });
}

/**
 * Revoke an API key.
 */
export async function revokeApiKey(keyId: string, userId: string): Promise<void> {
    const db = getFirebaseAdminDb();
    const keyRef = db.collection('api_keys').doc(keyId);
    const keyDoc = await keyRef.get();

    if (!keyDoc.exists) {
        throw new Error('API key not found');
    }

    if (keyDoc.data()?.userId !== userId) {
        throw new Error('Unauthorized: key does not belong to this user');
    }

    await keyRef.update({
        status: 'revoked',
        revokedAt: FieldValue.serverTimestamp(),
    });
}

/**
 * Validate a raw API key. Returns the key document if valid.
 */
export async function validateApiKey(rawKey: string): Promise<{
    valid: boolean;
    keyDoc?: ApiKeyDocument & { id: string };
    error?: string;
    statusCode?: number;
}> {
    const db = getFirebaseAdminDb();
    const keyHash = hashApiKey(rawKey);

    const snapshot = await db
        .collection('api_keys')
        .where('keyHash', '==', keyHash)
        .where('status', '==', 'active')
        .limit(1)
        .get();

    if (snapshot.empty) {
        return { valid: false, error: 'Invalid or revoked API key', statusCode: 401 };
    }

    const doc = snapshot.docs[0];
    const data = doc.data() as ApiKeyDocument;
    const keyDoc = { ...data, id: doc.id };

    // Check expiry
    if (keyDoc.expiresAt && keyDoc.expiresAt.toDate() < new Date()) {
        return { valid: false, error: 'API key has expired', statusCode: 401 };
    }

    // Check quota
    if (keyDoc.quotaUsed >= keyDoc.quotaLimit) {
        return {
            valid: false,
            error: `Monthly quota exceeded (${keyDoc.quotaLimit} requests). Upgrade your tier or wait for reset.`,
            statusCode: 429,
        };
    }

    return { valid: true, keyDoc };
}
