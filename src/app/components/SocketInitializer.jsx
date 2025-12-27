"use client";

import { useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import socketTripService from "@/services/socketTripService";

/**
 * Socket Initializer - Connects to trip status socket when user is authenticated
 * This component should be mounted at the app root level
 */
export default function SocketInitializer() {
  const { token, user } = useAuth();

  useEffect(() => {
    // Connect to trip status socket when user is authenticated
    if (token && user) {
      console.log("[SocketInitializer] User authenticated, connecting to trip status socket...");
      socketTripService.connect(token);
    }

    // Cleanup on unmount or when user logs out
    return () => {
      if (!token) {
        console.log("[SocketInitializer] User logged out, disconnecting from trip status socket...");
        socketTripService.disconnect();
      }
    };
  }, [token, user]);

  // This component doesn't render anything
  return null;
}
