'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
// Note: We're replacing Firestore with an Azure Cosmos shim when AZURE_COSMOS_* env vars are provided.
import { initializeMongo } from '@/mongo/mongo';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION (we keep firebase init for auth/app compat)
export function initializeFirebase() {
  if (!getApps().length) {
    let firebaseApp;
    try {
      firebaseApp = initializeApp();
    } catch (e) {
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      firebaseApp = initializeApp(firebaseConfig);
    }

    // Initialize Mongo if environment variables are provided
    if (process.env.NEXT_PUBLIC_MONGO_URI && process.env.NEXT_PUBLIC_MONGO_DB) {
      initializeMongo(process.env.NEXT_PUBLIC_MONGO_URI, process.env.NEXT_PUBLIC_MONGO_DB).catch((err) => {
        console.warn('Failed to initialize Mongo shim:', err);
      });
    }

    return getSdks(firebaseApp);
  }

  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  const sdk = {
    firebaseApp,
    auth: getAuth(firebaseApp),
    // Firestore is intentionally omitted when using Cosmos shim; consumer code should use the
    // compatibility shims exported elsewhere.
    firestore: null as any,
  };
  return sdk;
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
