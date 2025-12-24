"use client";

import { useAuth } from '@/app/context/AuthContext';

/**
 * Custom hook to handle protected actions that require authentication.
 * This hook automatically shows the login modal for unauthenticated users
 * and executes the action after successful login.
 * 
 * @returns {Function} requireAuth - Function to wrap protected actions
 * 
 * @example
 * const requireAuth = useAuthAction();
 * 
 * const handleBookTrip = requireAuth(() => {
 *   // This code only runs if user is authenticated
 *   bookTrip();
 * });
 */
export function useAuthAction() {
  const auth = useAuth();

  /**
   * Wraps an action to require authentication
   * @param {Function} action - The action to execute (only if authenticated)
   * @returns {Function} - Wrapped function that checks auth before executing
   */
  const requireAuth = (action) => {
    return () => {
      if (auth?.token) {
        // User is authenticated, execute action immediately
        action();
      } else {
        // User is not authenticated, show login modal and save action
        auth?.requireAuth?.(action);
      }
    };
  };

  return requireAuth;
}
