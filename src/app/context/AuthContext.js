"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null); // { name, email, profileComplete: boolean, onboarding: {...} }
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    try {
      const t = localStorage.getItem("access_token");
      const u = localStorage.getItem("laqtaha_user");
      if (t) setToken(t);
      if (u) setUser(JSON.parse(u));
    } finally {
      setLoading(false);
    }
  }, []);

  // Call this after successful login/register
  function setAuth({ token: newToken, user: newUser, isRegister = false }) {
    setToken(newToken);

    // لو مستخدم جديد (register) نضيف profileComplete = false
    const preparedUser = isRegister
      ? { ...newUser, profileComplete: false }
      : newUser;

    setUser(preparedUser);
    localStorage.setItem("access_token", newToken);
    localStorage.setItem("laqtaha_user", JSON.stringify(preparedUser));

    // Execute pending action if exists
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }

  // Update user after onboarding complete
  function completeOnboarding(onboardData) {
    const updated = {
      ...(user || {}),
      profileComplete: true,
      onboarding: onboardData,
    };
    setUser(updated);
    localStorage.setItem("laqtaha_user", JSON.stringify(updated));
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("laqtaha_user");
  }

  // Request authentication for protected actions
  function requireAuth(action) {
    if (token) {
      // Already authenticated, execute action immediately
      action();
    } else {
      // Not authenticated, save action and show login modal
      setPendingAction(() => action);
      setShowLoginModal(true);
    }
  }

  // Close login modal
  function closeLoginModal() {
    setShowLoginModal(false);
    setPendingAction(null);
  }

  return (
    <AuthContext.Provider
      value={{ 
        token, 
        user, 
        loading, 
        setAuth, 
        completeOnboarding, 
        logout,
        requireAuth,
        showLoginModal,
        closeLoginModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
