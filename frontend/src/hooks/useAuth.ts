import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/auth';
import { apiService } from '../services/api';

// Global flags to prevent multiple simultaneous auth checks across all components
let globalAuthCheckInProgress = false;
let globalAuthCheckCompleted = false;

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

  // Track if this specific hook instance has checked auth
  const hasCheckedAuth = useRef(false);

  // Check authentication status on mount (only once)
  useEffect(() => {
    // Skip if already checked globally or in progress
    if (globalAuthCheckCompleted || globalAuthCheckInProgress || hasCheckedAuth.current || isLoading) {
      return;
    }

    // Only check if there's a token (to avoid unnecessary API calls)
    if (!apiService.isAuthenticated()) {
      hasCheckedAuth.current = true;
      globalAuthCheckCompleted = true;
      return;
    }

    // Mark that we're checking auth globally (prevent other components from checking)
    globalAuthCheckInProgress = true;
    globalAuthCheckCompleted = true; // Set completed immediately to prevent other components
    hasCheckedAuth.current = true;

    getCurrentUser()
      .catch(() => {
        // Error is handled in the store, just ensure we don't retry
      })
      .finally(() => {
        // Reset in-progress flag after check completes
        globalAuthCheckInProgress = false;
      });
  }, []); // Empty dependency array - only run once on mount

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
