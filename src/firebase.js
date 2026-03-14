// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDOoJoeqSGbnRshWBeh9sKqLie9YhiegPU",
  authDomain: "stockpilot-odoo.firebaseapp.com",
  projectId: "stockpilot-odoo",
  storageBucket: "stockpilot-odoo.firebasestorage.app",
  messagingSenderId: "250807131527",
  appId: "1:250807131527:web:e1126358d398d3eab48722",
  measurementId: "G-DDYJ6742NF"
};

// Initialize Firebase
console.log("Initializing Firebase for Project ID:", firebaseConfig.projectId);
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app, "stockpilot-new");

export { app, analytics, auth, db };
