import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

/**
 * Firebase Admin SDK — Server-Side Initialization
 * Used by API routes for Firestore operations that bypass client security rules.
 * 
 * SETUP: Replace the placeholder credentials below with your actual
 * Firebase service account details from:
 * Firebase Console → Project Settings → Service Accounts → Generate New Private Key
 */

const SERVICE_ACCOUNT = {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

let adminApp: App | undefined;
let adminDb: Firestore | undefined;

function getAdminApp(): App {
    if (!adminApp) {
        if (getApps().length === 0) {
            adminApp = initializeApp({
                credential: cert({
                    projectId: SERVICE_ACCOUNT.projectId,
                    clientEmail: SERVICE_ACCOUNT.clientEmail,
                    privateKey: SERVICE_ACCOUNT.privateKey,
                }),
            });
        } else {
            adminApp = getApps()[0];
        }
    }
    return adminApp;
}

export function getFirebaseAdminDb(): Firestore {
    if (!adminDb) {
        adminDb = getFirestore(getAdminApp());
    }
    return adminDb;
}
