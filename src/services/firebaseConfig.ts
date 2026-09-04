// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, indexedDBLocalPersistence } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { Capacitor } from "@capacitor/core";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB8NRMMMhl9AUoTcrK6mmFXzU4dYipN1Y4",
  authDomain: "safelink-2acc5.firebaseapp.com",
  projectId: "safelink-2acc5",
  storageBucket: "safelink-2acc5.firebasestorage.app",
  messagingSenderId: "895007403296",
  appId: "1:895007403296:web:c9daf9693e4ec6a03afb45",
  measurementId: "G-FSTM83TTX8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// AUTH: en apps nativas usamos indexedDBLocalPersistence para evitar
// que Firebase Auth intente usar gapi/iframes (no funcionan en la webview de Capacitor).
export const auth = Capacitor.isNativePlatform()
  ? initializeAuth(app, { persistence: indexedDBLocalPersistence })
  : getAuth(app);

// FIRESTORE: forzamos long polling siempre (funciona igual en web y en nativo,
// así evitamos el problema de conexiones colgadas en Capacitor).
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});