// config/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
// Remove analytics import for React Native

const firebaseConfig = {
  apiKey: "AIzaSyDxJYUtwiFdG7WHHbU9HBPBvTPNuJAGF1k",
  authDomain: "education-thesis-1fc00.firebaseapp.com",
  databaseURL:
    "https://education-thesis-1fc00-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "education-thesis-1fc00",
  storageBucket: "education-thesis-1fc00.firebasestorage.app",
  messagingSenderId: "377456944781",
  appId: "1:377456944781:web:bfe47f111e6dd83bc2a4c4",
  measurementId: "G-X14WPVWHV9",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Changed 'database' to 'db' here so it matches our home.jsx file
const db = getDatabase(app);

export { auth, db };

