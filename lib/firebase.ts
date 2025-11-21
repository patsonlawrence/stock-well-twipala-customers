// lib/firebase.ts
"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCEliNMzDKx9PhBO2jCGW0Pesd3JXfMYm4",
  authDomain: "stockwellapp.firebaseapp.com",
  projectId: "stockwellapp",
  storageBucket: "stockwellapp.firebasestorage.app",
  messagingSenderId: "571651425074",
  appId: "1:571651425074:web:99ea10c29ab4048f5acd2b"
};

// Prevent duplicate initialization (IMPORTANT for Next.js)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
