"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null); // { name, email, profileComplete: boolean, onboarding: {...} }
  const [loading, setLoading] = useState(true);

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

  return (
    <AuthContext.Provider
      value={{ token, user, loading, setAuth, completeOnboarding, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
