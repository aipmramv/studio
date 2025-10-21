// src/hooks/useAuth.ts
"use client";

import { useUser, useDoc, useFirestore } from '@/firebase'; // Import the real useUser hook from your firebase setup
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from 'next/navigation';
import { useToast } from './use-toast';
import { doc } from 'firebase/firestore';
import * as React from 'react';

// This is a real auth hook that uses the Firebase context.
export function useAuth() {
  const { user: firebaseUser, isUserLoading, userError } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();

  // Create a document reference to the user's profile in Firestore
  const userDocRef = React.useMemo(() => {
    if (!firestore || !firebaseUser) return null;
    return doc(firestore, 'users', firebaseUser.uid);
  }, [firestore, firebaseUser]);

  // Use the useDoc hook to get the user's profile data
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);

  const authUser = React.useMemo(() => {
    if (!firebaseUser) return null;
    return {
      ...firebaseUser,
      // The role and department now come from the Firestore document
      role: userProfile?.role || 'user',
      department: userProfile?.department || 'Unassigned',
    };
  }, [firebaseUser, userProfile]);

  const logout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully signed out." });
      router.push('/');
    } catch (error) {
      console.error("Logout Error: ", error);
      toast({ title: "Logout Failed", description: "Could not log you out. Please try again.", variant: "destructive" });
    }
  };

  return { 
    user: authUser, 
    loading: isUserLoading || isProfileLoading, 
    error: userError,
    logout,
  };
}
