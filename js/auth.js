import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
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
        const togglePassword = document.getElementById('toggle-password');
        const forgotPasswordLink = document.getElementById('forgot-password-link');

        this.setupAuthObserver();

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }

        const passwordWrapper = document.querySelector('.password-toggle-wrapper');
        if (passwordWrapper) {
            passwordWrapper.addEventListener('click', (e) => {
                const trigger = e.target.closest('#toggle-password');
                if (!trigger) return;

                const passwordInput = document.getElementById('password');
                const isPassword = passwordInput.getAttribute('type') === 'password';
                const newType = isPassword ? 'text' : 'password';
                
                passwordInput.setAttribute('type', newType);
                
                // Toggle icon
                trigger.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
                lucide.createIcons();
            });
        }

        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleForgotPassword();
            });
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
                    userData.id = user.uid; // Ensure ID is always set for Storage.getUid()
                    Storage.setCurrentUser(userData);
                    window.dispatchEvent(new CustomEvent('auth-ready', { detail: userData }));
                } catch (e) {
                    console.error("Auth helper error:", e);
                    const userData = { id: user.uid, email: user.email };
                    Storage.setCurrentUser(userData);
                    window.dispatchEvent(new CustomEvent('auth-ready', { detail: userData }));
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
    },

    async handleForgotPassword() {
        const email = document.getElementById('email').value;
        const errorEl = document.getElementById('alert-error');
        
        if (!email) {
            errorEl.textContent = "Please enter your email address first.";
            errorEl.classList.remove('badge-success');
            errorEl.classList.add('badge-danger');
            errorEl.classList.remove('hidden');
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);
            errorEl.textContent = "Password reset email sent! Check your inbox/spambox.";
            errorEl.classList.remove('badge-danger');
            errorEl.classList.add('badge-success');
            errorEl.classList.remove('hidden');
        } catch (err) {
            errorEl.textContent = "Error: " + err.message;
            errorEl.classList.remove('badge-success');
            errorEl.classList.add('badge-danger');
            errorEl.classList.remove('hidden');
        }
    }
};

Auth.init();
export default Auth;
