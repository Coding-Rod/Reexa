"use client";
import { getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Public web config (not secrets). Auth is optional: without config the app runs anonymously.
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const authEnabled = !!(config.apiKey && config.authDomain && config.projectId && config.appId);

export const auth = authEnabled ? getAuth(getApps()[0] ?? initializeApp(config)) : null;
export const google = new GoogleAuthProvider();
