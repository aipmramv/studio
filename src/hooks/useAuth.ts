// src/hooks/useAuth.ts
"use client";

import { useUser, useFirestore } from '@/firebase';
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from 'next/navigation';
import { useToast } from './use-toast';
import { doc, onSnapshot } from 'firebase/firestore';
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
  
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = React.useState(true);
  const [profileError, setProfileError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!firestore || !firebaseUser) {
      setIsProfileLoading(false);
      setUserProfile(null);
      return;
    }

    setIsProfileLoading(true);
    const userDocRef = doc(firestore, 'users', firebaseUser.uid);

    const unsubscribe = onSnapshot(userDocRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        } else {
          setUserProfile(null);
          // This could be an error state if a profile is always expected for a logged-in user
          setProfileError(new Error("User profile not found in database."));
        }
        setIsProfileLoading(false);
      }, 
      (error) => {
        console.error("Error fetching user profile:", error);
        setProfileError(error);
        setUserProfile(null);
        setIsProfileLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, firebaseUser]);


  const isLoading = isAuthLoading || isProfileLoading;

  const authUser = React.useMemo(() => {
    if (isLoading || !firebaseUser || !userProfile) {
      return null;
    }

    return {
      ...firebaseUser,
      role: userProfile.role,
      department: userProfile.department,
      displayName: userProfile.displayName,
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
    loading: isLoading,
    error: userError || profileError,
    logout,
  };
}
