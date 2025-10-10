"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, AuthContextType } from "@/lib/types";
import { authUtils } from "@/lib/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing user session on mount
    const savedUser = authUtils.getUser();
    setUser(savedUser);
    setIsLoading(false);
  }, []);

  const login = async (email: string, studentId: string): Promise<boolean> => {
    try {
      const user = await authUtils.login(email, studentId);
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
    studentId: string,
    formalName: string,
    preferredName: string
  ): Promise<boolean> => {
    try {
      const user = await authUtils.signup(
        email,
        studentId,
        formalName,
        preferredName
      );
      if (user) {
        setUser(user);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Signup error:", error);
      return false;
    }
  };

  const logout = () => {
    authUtils.removeUser();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    signup,
    logout,
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
