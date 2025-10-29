// src/hooks/useAuth.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from './use-toast';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'spoc' | 'user';
  department?: string;
  isActive: boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupData {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
  department: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if we're in the browser (not SSR)
      if (typeof window !== 'undefined') {
        // Check localStorage for simple auth session
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        
        if (storedUser && storedToken) {
          try {
            const userData = JSON.parse(storedUser);
            setUser({
              id: userData.id,
              email: userData.email,
              name: userData.displayName || userData.email,
              role: userData.role,
              department: userData.department,
              isActive: true
            });
            return;
          } catch (parseError) {
            console.error('Error parsing stored user data:', parseError);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        }
      }
      
      // Fallback to API check
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.data);
        } else {
          setUser(null);
        }
      } catch (apiError) {
        console.warn('API auth check failed, using localStorage only:', apiError);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.data.user);
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
        return true;
      } else {
        const errorMessage = data.error?.message || 'Login failed';
        setError(errorMessage);
        toast({
          title: "Login Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = 'Network error. Please try again.';
      setError(errorMessage);
      toast({
        title: "Login Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (signupData: SignupData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(signupData),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.data.user);
        toast({
          title: "Account Created",
          description: "Your account has been created successfully!",
        });
        return true;
      } else {
        const errorMessage = data.error?.message || 'Signup failed';
        setError(errorMessage);
        toast({
          title: "Signup Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = 'Network error. Please try again.';
      setError(errorMessage);
      toast({
        title: "Signup Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Clear localStorage if available
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
      
      // Try to call API logout (optional)
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
      } catch (apiError) {
        console.warn('API logout failed, but local logout successful:', apiError);
      }

      setUser(null);
      
      toast({
        title: "Logged Out",
        description: "You have been successfully signed out.",
      });
      
      // Redirect to login page
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout on client side even if API call fails
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
      setUser(null);
      toast({
        title: "Logout Error",
        description: "There was an error logging out, but you have been signed out locally.",
        variant: "destructive",
      });
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      setError(null);

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Password Changed",
          description: "Your password has been updated successfully.",
        });
        return true;
      } else {
        const errorMessage = data.error?.message || 'Password change failed';
        setError(errorMessage);
        toast({
          title: "Password Change Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Password change error:', error);
      const errorMessage = 'Network error. Please try again.';
      setError(errorMessage);
      toast({
        title: "Password Change Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  const updateProfile = async (updates: { name?: string; email?: string; department?: string }): Promise<boolean> => {
    try {
      setError(null);

      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.data);
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully.",
        });
        return true;
      } else {
        const errorMessage = data.error?.message || 'Profile update failed';
        setError(errorMessage);
        toast({
          title: "Profile Update Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Profile update error:', error);
      const errorMessage = 'Network error. Please try again.';
      setError(errorMessage);
      toast({
        title: "Profile Update Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Permission helpers
  const hasRole = useCallback((requiredRoles: string[]): boolean => {
    return user ? requiredRoles.includes(user.role) : false;
  }, [user]);

  const canAccessDepartment = useCallback((department: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.department === department;
  }, [user]);

  const isAdmin = useCallback((): boolean => {
    return user?.role === 'admin' || false;
  }, [user]);

  const isSpoc = useCallback((): boolean => {
    return user?.role === 'spoc' || false;
  }, [user]);

  const isUser = useCallback((): boolean => {
    return user?.role === 'user' || false;
  }, [user]);

  return {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    changePassword,
    updateProfile,
    checkAuth,
    clearError,
    // Permission helpers
    hasRole,
    canAccessDepartment,
    isAdmin,
    isSpoc,
    isUser,
  };
}
