import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig, isFirebaseConfigured } from './config';

let firebaseAppInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null;

  if (firebaseAppInstance) return firebaseAppInstance;

  if (getApps().length > 0) {
    firebaseAppInstance = getApp();
    return firebaseAppInstance;
  }

  try {
    firebaseAppInstance = initializeApp(firebaseConfig);
    return firebaseAppInstance;
  } catch (error) {
    console.warn('[VIP TADJ Firebase] Initialization error:', error);
    return null;
  }
}

export function getDb(): Firestore | null {
  if (firestoreInstance) return firestoreInstance;

  const app = getFirebaseApp();
  if (!app) return null;

  try {
    firestoreInstance = getFirestore(app);
    return firestoreInstance;
  } catch (error) {
    console.warn('[VIP TADJ Firestore] Failed to get Firestore instance:', error);
    return null;
  }
}

export function getFirebaseAuth(): Auth | null {
  if (authInstance) return authInstance;

  const app = getFirebaseApp();
  if (!app) return null;

  try {
    authInstance = getAuth(app);
    return authInstance;
  } catch (error) {
    console.warn('[VIP TADJ Auth] Failed to get Auth instance:', error);
    return null;
  }
}
