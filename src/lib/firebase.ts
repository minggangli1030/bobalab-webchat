// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyBtiZ7z9Pm3bwYsCpWkoosoGW93qlDke2Q",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "bobalab-web-chat.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "bobalab-web-chat",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "bobalab-web-chat.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "575131177301",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:575131177301:web:e706b468abb7192d755fdc",
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-F18KRP85W9",
};

// Initialize Firebase only in browser environment
let app: any = null;
let db: any = null;
let storage: any = null;
let auth: any = null;
let analytics: any = null;
let functions: any = null;

if (typeof window !== "undefined") {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);
  auth = getAuth(app);
  analytics = getAnalytics(app);
  functions = getFunctions(app);
}

export { db, storage, auth, analytics, functions };

export default app;
