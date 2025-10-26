'use client';

import React, { useMemo, useEffect, useState, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [firebaseServices, setFirebaseServices] = useState<any>(null);

  useEffect(() => {
    // Initialize Firebase and MongoDB connection
    const initializeServices = async () => {
      try {
        // Initialize Firebase services
        const services = initializeFirebase();
        
        // Initialize MongoDB connection on the server side via API call
        if (typeof window !== 'undefined') {
          try {
            // Initialize MongoDB first
            const initResponse = await fetch('/api/init');
            if (!initResponse.ok) {
              console.warn('MongoDB init failed:', initResponse.status);
            }
            
            // Then check database status
            const statusResponse = await fetch('/api/database/status');
            if (!statusResponse.ok) {
              console.warn('Database status check failed:', statusResponse.status);
            }
          } catch (error) {
            console.warn('Database initialization failed:', error);
            // Continue anyway - the app can still work
          }
        }
        
        setFirebaseServices(services);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize services:', error);
        // Set a minimal service configuration to prevent crashes
        setFirebaseServices({
          firebaseApp: null,
          auth: null,
          firestore: { _isMongoShim: true }
        });
        setIsInitialized(true);
      }
    };

    initializeServices();
  }, []);

  // Show loading state while initializing
  if (!isInitialized || !firebaseServices) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing application...</p>
        </div>
      </div>
    );
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}