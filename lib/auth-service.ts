import {
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  User,
  setPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { getFirebaseAuth } from './firebase';

const googleProvider = new GoogleAuthProvider();

/**
 * Sign in with Google
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase Auth not initialized');

    await setPersistence(auth, browserLocalPersistence);

    const result = await signInWithPopup(auth, googleProvider);
    console.log('[v0] User signed in with Google:', result.user.email);
    return result.user;
  } catch (error) {
    console.error('[v0] Google sign-in error:', error);
    throw error;
  }
}

/**
 * Sign in with Email and Password
 */
export async function signInWithEmail(email: string, password: string): Promise<User> {
  try {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase Auth not initialized');

    await setPersistence(auth, browserLocalPersistence);

    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log('[v0] User signed in with email:', result.user.email);
    return result.user;
  } catch (error) {
    console.error('[v0] Email sign-in error:', error);
    throw error;
  }
}

/**
 * Sign up with Email and Password
 */
export async function signUpWithEmail(email: string, password: string): Promise<User> {
  try {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase Auth not initialized');

    await setPersistence(auth, browserLocalPersistence);

    const result = await createUserWithEmailAndPassword(auth, email, password);
    console.log('[v0] User created with email:', result.user.email);
    return result.user;
  } catch (error) {
    console.error('[v0] Email sign-up error:', error);
    throw error;
  }
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<void> {
  try {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase Auth not initialized');

    await signOut(auth);
    console.log('[v0] User signed out');
  } catch (error) {
    console.error('[v0] Sign-out error:', error);
    throw error;
  }
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  return auth.currentUser;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  const auth = getFirebaseAuth();
  if (!auth) {
    callback(null);
    return () => { };
  }
  return auth.onAuthStateChanged(callback);
}
