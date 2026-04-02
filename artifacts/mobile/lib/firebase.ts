import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_GOOGLE_API_KEY ?? "AIzaSyDcOjL_e241I9OCnODB_2fPKCb1XJYRMBE",
  authDomain: "gabonterrior.firebaseapp.com",
  projectId: "gabonterrior",
  storageBucket: "gabonterroir.firebasestorage.app",
  messagingSenderId: "618213534392",
  appId: "1:618213534392:android:f02661ef635db406a1224d",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let _auth: import("firebase/auth").Auth;

export function getFirebaseAuth() {
  if (_auth) return _auth;
  const { initializeAuth, getReactNativePersistence, getAuth } =
    require("firebase/auth") as typeof import("firebase/auth");
  try {
    _auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    _auth = getAuth(app);
  }
  return _auth;
}

export const auth = getFirebaseAuth();
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
