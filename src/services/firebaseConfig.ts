// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

// Export Firebase services to use them across the app
export const auth = getAuth(app);
export const db = getFirestore(app);