// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDRRJTCsrMHWs9AeCHXvqoLt0t3Djj8ypE",
  authDomain: "memory-diary-8ab6d.firebaseapp.com",
  projectId: "memory-diary-8ab6d",
  storageBucket: "memory-diary-8ab6d.firebasestorage.app",
  messagingSenderId: "630900989686",
  appId: "1:630900989686:web:74ea02e1a1aa0984bc16d7",
  measurementId: "G-VVPWLPJMTB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);