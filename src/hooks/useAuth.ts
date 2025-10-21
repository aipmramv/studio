
// src/hooks/useAuth.ts
"use client";

import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from 'next/navigation';
import { useToast } from './use-toast';
import { doc } from 'firebase/firestore';
import * as React from 'react';
import type { User as FirebaseUser } from 'firebase/auth';

// Define the shape of our user profile data in Firestore
interface UserProfile {
  role: 'admin' | 'spoc' | 'user';
  department: string;
  displayName: string;
  email: string;
  id: string;
}

// Define the shape of the user object we'll use throughout the app
export interface AppUser extends FirebaseUser {
  role: 'admin' | 'spoc' | 'user';
  department: string;
}

export function useAuth() {
  const { user: firebaseUser, isUserLoading: isAuthLoading, userError } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !firebaseUser) return null;
    return doc(firestore, 'users', firebaseUser.uid);
  }, [firestore, firebaseUser]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  // The overall loading state is true if either Firebase Auth is loading or the profile is loading.
  const isLoading = isAuthLoading || isProfileLoading;

  const authUser = React.useMemo(() => {
    // If we're still loading, or if there's no authenticated user, return null.
    if (isLoading || !firebaseUser) {
      return null;
    }

    // If the user is authenticated, but we don't have a profile yet (could be a brief state),
    // we must wait. Returning a default user object here caused the race condition.
    // By returning null, downstream components will correctly wait until the full user object is ready.
    if (!userProfile) {
        return null;
    }

    // Both firebaseUser and userProfile are available. Merge them.
    return {
      ...firebaseUser,
      role: userProfile.role,
      department: userProfile.department,
      displayName: userProfile.displayName, // Ensure displayName from Firestore is used
    } as AppUser;

  }, [firebaseUser, userProfile, isLoading]);

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
    loading: isLoading, // Return the combined loading state
    error: userError,
    logout,
  };
}
