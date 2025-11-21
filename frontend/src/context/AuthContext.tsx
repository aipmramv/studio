import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api-client.js';
import { logger } from '../lib/logger.js';
import { getErrorMessage } from '../lib/error-handler.js';
import type { User, AuthResponse } from '../types/index.js';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');

        if (storedUser && storedToken) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            logger.info('User restored from localStorage', { email: parsedUser.email });
          } catch (parseError) {
            logger.error('Failed to parse stored user', parseError);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        }
      } catch (err) {
        logger.error('Auth initialization error', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      logger.info('Attempting login', { email });
      const response = await apiClient.login(email, password);

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
      logger.info('Login successful', { email: response.user.email });
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      logger.error('Login failed', err, 'auth');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      logger.info('Logout successful');
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      logger.error('Logout failed', err, 'auth');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      setIsLoading(true);
      setError(null);

      try {
        logger.info('Attempting registration', { email, name });
        const response = await apiClient.register(email, password, name);

        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
        logger.info('Registration successful', { email: response.user.email });
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        setError(errorMsg);
        logger.error('Registration failed', err, 'auth');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    logout,
    register,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
