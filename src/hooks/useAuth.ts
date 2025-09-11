
// src/hooks/useAuth.ts
"use client";

import type { UserRole } from '@/lib/constants';
import { useState, useEffect } from 'react';

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  department?: string; // Added department for role-based filtering
}

// This is a mock hook. In a real Firebase app, you'd use `onAuthStateChanged`
// and potentially a custom claims system for roles.
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching auth state
    const timer = setTimeout(() => {
      // To test different roles, you can change this:
      const mockUser: AuthUser = {
        uid: 'mock-user-id-ram',
        email: 'ram.admin@example.com',
        displayName: 'Ram Kumar',
        role: 'admin', 
        department: 'IT', // Example department
      };
      // To simulate a different user for testing:
      // const mockUser: AuthUser = {
      //   uid: 'mock-user-id-prem',
      //   email: 'prem.dh@example.com',
      //   displayName: 'Prem Kumar',
      //   role: 'spoc',
      //   department: 'Finance', 
      // };
      // To simulate a logged-out state:
      // setUser(null);
      setUser(mockUser);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const login = async (/* email, password */) => {
    // Mock login
    setLoading(true);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // This mock now defaults to the 'admin' user for broader testing access
        setUser({
          uid: 'mock-user-id-ram',
          email: 'ram.admin@example.com',
          displayName: 'Ram Kumar',
          role: 'admin',
          department: 'IT'
        });
        setLoading(false);
        resolve();
      }, 500);
    });
  };

  const signup = async (/* email, password, role */) => {
     // Mock signup
     setLoading(true);
     return new Promise<void>((resolve) => {
       setTimeout(() => {
         setUser({
           uid: 'new-mock-user-id-nagaraj',
           email: 'nagaraj.new@example.com',
           displayName: 'Nagaraj V.',
           role: 'user', // Default role for new signups
           department: 'Production'
         });
         setLoading(false);
         resolve();
       }, 500);
     });
  };

  const logout = async () => {
    // Mock logout
    setLoading(true);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setUser(null);
        setLoading(false);
        // In a real app, you'd redirect here:
        // window.location.href = '/';
        resolve();
      }, 300);
    });
  };

  return { user, loading, login, signup, logout };
}
