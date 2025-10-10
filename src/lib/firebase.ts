// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBtiZ7z9Pm3bwYsCpWkoosoGW93qlDke2Q",
  authDomain: "bobalab-web-chat.firebaseapp.com",
  projectId: "bobalab-web-chat",
  storageBucket: "bobalab-web-chat.firebasestorage.app",
  messagingSenderId: "575131177301",
  appId: "1:575131177301:web:e706b468abb7192d755fdc",
  measurementId: "G-F18KRP85W9",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Initialize Analytics (only in browser environment)
export const analytics =
  typeof window !== "undefined" ? getAnalytics(app) : null;

export default app;
