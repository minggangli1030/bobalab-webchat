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
    return email === "admin123" && password === "admin123";
  },

  // Create admin user data
  createAdminUser: (): User => {
    return {
      id: "admin",
      email: "admin123",
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
    studentId: string
  ): Promise<User | null> => {
    try {
      // Check for admin login
      if (firebaseAuthUtils.isAdminLogin(email, password)) {
        return firebaseAuthUtils.createAdminUser();
      }

      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      // Create user document in Firestore
      const userData: User = {
        id: firebaseUser.uid,
        email: email,
        studentId: studentId,
        formalName: formalName,
        preferredName: preferredName,
        createdAt: new Date(),
        isAdmin: false,
      };

      await setDoc(doc(db, "users", firebaseUser.uid), userData);
      return userData;
    } catch (error) {
      console.error("Error creating user:", error);
      return null;
    }
  },

  // Sign in with email and password
  login: async (email: string, password: string): Promise<User | null> => {
    try {
      // Check for admin login
      if (firebaseAuthUtils.isAdminLogin(email, password)) {
        return firebaseAuthUtils.createAdminUser();
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
    return onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          try {
            const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
            if (userDoc.exists()) {
              callback(userDoc.data() as User);
            } else {
              callback(null);
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
