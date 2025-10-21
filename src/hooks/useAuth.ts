// src/hooks/useAuth.ts
"use client";

import { useUser } from '@/firebase'; // Import the real useUser hook from your firebase setup
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from 'next/navigation';
import { useToast } from './use-toast';

// This is a real auth hook that uses the Firebase context.
export function useAuth() {
  const { user, isUserLoading, userError } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const authUser = user ? {
    ...user,
    // The role should come from custom claims or a Firestore document.
    // For now, we'll assign a role based on email for demonstration.
    role: user.email === 'admin@example.com' || user.email === 'aipm.ramv@gmail.com' ? 'admin' : 'user',
    department: user.email === 'admin@example.com' || user.email === 'aipm.ramv@gmail.com' ? 'IT' : 'Unassigned',
  } : null;

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
    loading: isUserLoading, 
    error: userError,
    logout,
    // The login and signup functions are now handled directly in their respective forms
    // to have access to form data. This hook primarily provides user state and logout.
  };
}
