import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC3szYUEebSR6RAgdrROPOJmNwV9j25FO0",
  authDomain: "dear-bacchanal.firebaseapp.com",
  projectId: "dear-bacchanal",
  storageBucket: "dear-bacchanal.firebasestorage.app",
  messagingSenderId: "497665888704",
  appId: "1:497665888704:web:7f97500e46fbe905d3b825",
  measurementId: "G-05ESTHB2CP"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Analytics (optional, client-side only)
const analytics = typeof window !== "undefined" ? isSupported().then(yes => yes ? getAnalytics(app) : null) : null;

export { app, auth, googleProvider, analytics };
