"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, AuthContextType } from "@/lib/types";
import { firebaseAuthUtils } from "@/lib/firebase-auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = firebaseAuthUtils.onAuthStateChanged((user) => {
      setUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const user = await firebaseAuthUtils.login(email, password);
      if (user) {
        setUser(user);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const signup = async (
    email: string,
    password: string,
    formalName: string,
    preferredName: string,
    studentId?: string,
    businessName?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await firebaseAuthUtils.signup(
        email,
        password,
        formalName,
        preferredName,
        studentId || "",
        businessName || ""
      );
      if (result.user) {
        setUser(result.user);
        return { success: true };
      }
      return { success: false, error: result.error || "Signup failed" };
    } catch (error) {
      console.error("Signup error:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const logout = async () => {
    try {
      await firebaseAuthUtils.logout();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const refreshUser = async () => {
    if (user) {
      try {
        const updatedUser = await firebaseAuthUtils.getCurrentUser();
        if (updatedUser) {
          setUser(updatedUser);
        }
      } catch (error) {
        console.error("Error refreshing user:", error);
      }
    }
  };

  const value: AuthContextType = {
    user,
    login,
    signup,
    logout,
    refreshUser,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
