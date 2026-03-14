import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDOoJoeqSGbnRshWBeh9sKqLie9YhiegPU",
  authDomain: "stockpilot-odoo.firebaseapp.com",
  projectId: "stockpilot-odoo",
  storageBucket: "stockpilot-odoo.firebasestorage.app",
  messagingSenderId: "250807131527",
  appId: "1:250807131527:web:e1126358d398d3eab48722",
  measurementId: "G-DDYJ6742NF"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
