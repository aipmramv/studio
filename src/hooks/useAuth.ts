// src/hooks/useAuth.ts
"use client";

import type { UserRole } from '@/lib/constants';
import { useState, useEffect } from 'react';

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
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
        uid: 'mock-user-id',
        email: 'user@example.com',
        displayName: 'Mock User',
        role: 'requester', // or 'approver', 'admin', 'safety', 'mm_team'
      };
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
        setUser({
          uid: 'mock-user-id',
          email: 'user@example.com',
          displayName: 'Mock User',
          role: 'requester',
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
           uid: 'new-mock-user-id',
           email: 'newuser@example.com',
           displayName: 'New Mock User',
           role: 'requester', // Default role
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
