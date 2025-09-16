import { useEffect } from 'react';
import { useAuthStore } from '../stores/auth';

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    signup,
    logout,
    getCurrentUser,
    clearError,
  } = useAuthStore();

  // Check authentication status on mount
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      getCurrentUser();
    }
  }, [isAuthenticated, isLoading, getCurrentUser]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    signup,
    logout,
    clearError,
  };
}
