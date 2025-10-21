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
  const { user: firebaseUser, isUserLoading, userError } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();

  // Create a memoized document reference to the user's profile in Firestore
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !firebaseUser) return null;
    return doc(firestore, 'users', firebaseUser.uid);
  }, [firestore, firebaseUser]);

  // Use the useDoc hook to get the user's profile data
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  // Memoize the final combined user object
  const authUser = React.useMemo(() => {
    // If there's no firebaseUser, there's no authenticated user
    if (!firebaseUser) {
      return null;
    }
    
    // The user is authenticated, but we might still be loading their profile from Firestore.
    // We create a complete AppUser object by merging FirebaseUser and our Firestore profile.
    return {
      ...firebaseUser,
      // Use the role from the profile if available, otherwise default to 'user'
      role: userProfile?.role || 'user', 
      // Use the department from the profile if available, otherwise default to 'Unassigned'
      department: userProfile?.department || 'Unassigned',
    } as AppUser; // Cast to our AppUser type

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
    // The overall loading state is true if either Firebase Auth is loading or the profile is loading.
    loading: isUserLoading || isProfileLoading, 
    error: userError,
    logout,
  };
}
