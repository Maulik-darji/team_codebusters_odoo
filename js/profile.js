import Storage from './storage.js';
import { updatePassword, getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const Profile = {
    async init() {
        this.populateProfile();
        
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        }

        const passwordForm = document.getElementById('password-form');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => this.handlePasswordChange(e));
        }
    },

    populateProfile() {
        const user = Storage.getCurrentUser();
        if (!user) return;

        document.getElementById('p-username').value = user.loginId || 'N/A';
        document.getElementById('p-email').value = user.email || 'N/A';
        document.getElementById('p-fullname').value = user.displayName || '';
    },

    async handleProfileUpdate(e) {
        e.preventDefault();
        const fullName = document.getElementById('p-fullname').value;
        const user = Storage.getCurrentUser();
        
        user.displayName = fullName;
        Storage.setCurrentUser(user);
        
        // In a real app, we'd update Firestore/Auth too
        alert("Profile updated locally!");
        this.populateProfile();
        if (window.App) window.App.updateNavbarUser();
    },

    async handlePasswordChange(e) {
        e.preventDefault();
        const newPass = document.getElementById('new-password').value;
        const confirmPass = document.getElementById('confirm-password').value;
        const errorEl = document.getElementById('password-error');

        if (newPass !== confirmPass) {
            errorEl.classList.remove('hidden');
            return;
        }
        errorEl.classList.add('hidden');

        try {
            const auth = getAuth();
            if (auth.currentUser) {
                await updatePassword(auth.currentUser, newPass);
                alert("Password changed successfully!");
                document.getElementById('password-form').reset();
            } else {
                alert("Error: No active firebase session found.");
            }
        } catch (err) {
            alert("Password change failed: " + err.message);
        }
    }
};

// Profile.init();
export default Profile;
