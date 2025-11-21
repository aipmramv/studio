import React from 'react';
import { useAuth } from '@context/AuthContext';

export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading) {
      setIsAuthorized(isAuthenticated);
      if (!isAuthenticated) {
        window.location.href = '/login';
      }
    }
  }, [isAuthenticated, isLoading]);

  return isAuthorized && !isLoading;
}

export function usePermission(requiredRole?: string) {
  const { user } = useAuth();

  if (!requiredRole) return true;

  const roleHierarchy: { [key: string]: number } = {
    admin: 3,
    spoc: 2,
    user: 1,
  };

  const userRoleLevel = roleHierarchy[user?.role || ''] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  return userRoleLevel >= requiredLevel;
}
