"use client";

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
// NOTE: The Mongo shim is server-only and must not be imported into client bundles.
// If you need server-side Mongo initialization, call `initializeMongo` from a
// server-only module (API route or server component) so the `mongodb` driver
// is never included in client bundles.

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

    // Client should not initialize server-side Mongo. If a runtime requires
    // connecting directly from the server, initialize Mongo from server-only
    // code (see `src/lib/server-only-mongodb.ts`).

    return getSdks(firebaseApp);
  }

  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  // Import the MongoDB shim to provide firestore compatibility
  const firestoreShim = require('@/firebase/firestore');
  
  // Create a MongoDB shim object that acts as the firestore instance
  const mongoShim = {
    // This object serves as a placeholder for the firestore instance
    // The actual MongoDB operations are handled by the shim functions
    _isMongoShim: true,
    app: firebaseApp,
    // Include the shim functions
    ...firestoreShim,
  };

  const sdk = {
    firebaseApp,
    auth: getAuth(firebaseApp),
    // Provide the MongoDB shim as the firestore instance for compatibility
    firestore: mongoShim,
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
