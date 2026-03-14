import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, query, where, getDocs, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import Storage from './storage.js';

/**
 * Auth.js - Handles Firebase Login, Signup and Section Guards
 */

const Auth = {
    init() {
        // Immediate redirect if session exists (Fastest)
        const currentUser = Storage.getCurrentUser();
        const path = window.location.pathname;
        const isAuthPage = path.includes('login.html') || path.includes('signup.html');
        
        if (currentUser && isAuthPage) {
            window.location.replace('index.html');
            return;
        }

        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        const skipBtn = document.getElementById('skip-btn');

        this.setupAuthObserver();

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }

        if (skipBtn) {
            skipBtn.addEventListener('click', () => {
                Storage.setCurrentUser({ loginId: 'Guest', email: 'guest@demo.com', isGuest: true });
                window.location.href = 'index.html';
            });
        }
    },

    setupAuthObserver() {
        onAuthStateChanged(auth, async (user) => {
            const isGuest = localStorage.getItem('ims_current_user') && JSON.parse(localStorage.getItem('ims_current_user')).isGuest;
            const path = window.location.pathname;
            const isAuthPage = path.includes('login.html') || path.includes('signup.html');

            if (user) {
                // Fetch extra details from Firestore if needed
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    const userData = userDoc.exists() ? userDoc.data() : { email: user.email };
                    Storage.setCurrentUser(userData);
                } catch (e) {
                    console.error("Auth helper error:", e);
                    Storage.setCurrentUser({ email: user.email });
                }
                
                // If already logged in and on an auth page, redirect to landing
                if (isAuthPage) {
                    window.location.replace('index.html');
                }
            } else if (!isGuest && !isAuthPage) {
                window.location.replace('login.html');
            } else if (isAuthPage) {
                // Only show body if we are on an auth page and definitely NOT logged in
                document.body.style.opacity = '1';
            }
        });
    },

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorEl = document.getElementById('alert-error');
        const submitBtn = e.target.querySelector('button[type="submit"]');

        submitBtn.disabled = true;
        submitBtn.textContent = "Authenticating...";

        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = 'index.html';
        } catch (err) {
            errorEl.textContent = "Login Failed: " + err.message;
            errorEl.classList.remove('hidden');
            submitBtn.disabled = false;
            submitBtn.textContent = "Login";
        }
    },

    async handleSignup(e) {
        e.preventDefault();
        const loginId = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorEl = document.getElementById('alert-error');
        const submitBtn = e.target.querySelector('button[type="submit"]');

        submitBtn.disabled = true;
        submitBtn.textContent = "Creating Account...";

        try {
            // 1. Check LoginID uniqueness in Firestore
            const q = query(collection(db, 'users'), where('loginId', '==', loginId.toLowerCase()));
            const snap = await getDocs(q);
            if (!snap.empty) throw new Error("Login ID already taken.");

            // 2. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 3. Store in Firestore
            console.log("Creating user doc for UID:", user.uid);
            await setDoc(doc(db, 'users', user.uid), {
                id: user.uid,
                loginId: loginId.toLowerCase(),
                email: email,
                createdAt: new Date().toISOString()
            });

            window.location.href = 'index.html';
        } catch (err) {
            errorEl.textContent = "Signup Failed: " + err.message;
            errorEl.classList.remove('hidden');
            submitBtn.disabled = false;
            submitBtn.textContent = "Create Account";
        }
    }
};

Auth.init();
export default Auth;
