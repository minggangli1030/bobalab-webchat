import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { User } from "./types";

export const firebaseAuthUtils = {
  // Admin login check
  isAdminLogin: (email: string, password: string): boolean => {
    return email === "admin@123.com" && password === "admin123";
  },

  // Create admin user data with real Firebase UID
  createAdminUser: (firebaseUid: string): User => {
    return {
      id: firebaseUid,
      email: "admin@123.com",
      studentId: "admin",
      formalName: "Admin",
      preferredName: "Admin",
      createdAt: new Date(),
      isAdmin: true,
    };
  },

  // Create user account with email/password
  signup: async (
    email: string,
    password: string,
    formalName: string,
    preferredName: string,
    studentId?: string,
    businessName?: string
  ): Promise<{ user: User | null; error: string | null }> => {
    try {
      // Check if Firebase is initialized
      if (!auth) {
        return { user: null, error: "Firebase not initialized" };
      }

      // Create Firebase user (this will work for both admin and regular users)
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      // Check if this is an admin user
      if (firebaseAuthUtils.isAdminLogin(email, password)) {
        const adminUser = firebaseAuthUtils.createAdminUser(firebaseUser.uid);
        // Create admin user document in Firestore
        await setDoc(doc(db, "users", firebaseUser.uid), adminUser);
        return { user: adminUser, error: null };
      }

      // Create user document in Firestore
      const userData: User = {
        id: firebaseUser.uid,
        email: email,
        studentId: studentId || "",
        formalName: formalName,
        preferredName: preferredName,
        businessName: businessName || "",
        createdAt: new Date(),
        isAdmin: false,
        phase: 1, // Default to phase 1
      };

      await setDoc(doc(db, "users", firebaseUser.uid), userData);
      return { user: userData, error: null };
    } catch (error: any) {
      console.error("Error creating user:", error);

      // Provide specific error messages
      let errorMessage = "An error occurred during signup";

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email address is already in use";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters";
      } else if (error.code === "auth/operation-not-allowed") {
        errorMessage = "Email/password accounts are not enabled";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your connection";
      } else if (error.message) {
        errorMessage = error.message;
      }

      return { user: null, error: errorMessage };
    }
  },

  // Sign in with email and password
  login: async (email: string, password: string): Promise<User | null> => {
    try {
      // Check if Firebase is initialized
      if (!auth) {
        return null;
      }

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      if (userDoc.exists()) {
        return userDoc.data() as User;
      }

      // If user document doesn't exist but this is an admin login, create it
      if (firebaseAuthUtils.isAdminLogin(email, password)) {
        const adminUser = firebaseAuthUtils.createAdminUser(firebaseUser.uid);
        await setDoc(doc(db, "users", firebaseUser.uid), adminUser);
        return adminUser;
      }

      return null;
    } catch (error) {
      console.error("Error signing in:", error);
      return null;
    }
  },

  // Sign out
  logout: async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  },

  // Get current user from Firestore
  getCurrentUser: async (): Promise<User | null> => {
    try {
      if (!auth.currentUser) return null;

      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) {
        return userDoc.data() as User;
      }
      return null;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  },

  // Send password reset email
  resetPassword: async (email: string): Promise<boolean> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      console.error("Error sending password reset email:", error);
      return false;
    }
  },

  // Listen to auth state changes
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    // Check if Firebase is initialized
    if (!auth) {
      return () => {};
    }

    return onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          try {
            const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
            if (userDoc.exists()) {
              callback(userDoc.data() as User);
            } else {
              // If user document doesn't exist but this is an admin user, create it
              if (firebaseUser.email === "admin@123.com") {
                const adminUser = firebaseAuthUtils.createAdminUser(
                  firebaseUser.uid
                );
                await setDoc(doc(db, "users", firebaseUser.uid), adminUser);
                callback(adminUser);
              } else {
                callback(null);
              }
            }
          } catch (error) {
            console.error("Error getting user data:", error);
            callback(null);
          }
        } else {
          callback(null);
        }
      }
    );
  },
};
