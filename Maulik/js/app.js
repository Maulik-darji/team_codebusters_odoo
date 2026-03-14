import Storage from './storage.js';

/**
 * App.js - Shared Layout and Global Logic
 */

const App = {
    init() {
        this.renderLayout();
        this.updateNavbarUser();
        this.highlightActiveMenu();
        // Global Lucide Icons init
        if (window.lucide) window.lucide.createIcons();
    },

    // Injects Sidebar and Navbar into the page
    renderLayout() {
        const sidebar = document.getElementById('sidebar');
        const navbar = document.getElementById('navbar');
        
        if (!sidebar || !navbar) return;

        sidebar.innerHTML = `
            <div class="sidebar-brand">StockPilot IMS</div>
            <div class="sidebar-menu">
                <a href="index.html" class="nav-link" id="nav-dashboard">
                    <i data-lucide="layout-dashboard"></i> Dashboard
                </a>
                <a href="products.html" class="nav-link" id="nav-products">
                    <i data-lucide="package"></i> Products
                </a>
                
                <div class="nav-group-title">Operations</div>
                <a href="receipts.html" class="nav-link" id="nav-receipts">
                    <i data-lucide="arrow-down-to-line"></i> Receipts
                </a>
                <a href="delivery.html" class="nav-link" id="nav-delivery">
                    <i data-lucide="arrow-up-from-line"></i> Delivery Orders
                </a>
                <a href="transfers.html" class="nav-link" id="nav-transfers">
                    <i data-lucide="arrow-right-left"></i> Internal Transfers
                </a>
                <a href="adjustments.html" class="nav-link" id="nav-adjustments">
                    <i data-lucide="file-warning"></i> Adjustments
                </a>

                <div class="nav-group-title">Reports</div>
                <a href="history.html" class="nav-link" id="nav-history">
                    <i data-lucide="history"></i> Move History
                </a>

                <div class="nav-group-title">System</div>
                <a href="settings.html" class="nav-link" id="nav-settings">
                    <i data-lucide="settings"></i> Settings
                </a>
                <a href="#" class="nav-link" onclick="window.App.logout()">
                    <i data-lucide="log-out"></i> Logout
                </a>
            </div>
        `;

        navbar.innerHTML = `
            <div class="flex-between w-100" style="width: 100%">
                <div class="search-wrapper" style="position: relative; width: 300px;">
                    <i data-lucide="search" style="position: absolute; left: 10px; top: 8px; width: 16px; color: #999"></i>
                    <input type="text" placeholder="Search anything..." style="padding-left: 2.5rem; height: 32px;">
                </div>
                <div class="user-profile flex items-center gap-2" style="display: flex; align-items:center; gap: 10px">
                    <span id="nav-username" style="font-size: 0.85rem; font-weight: 500;">Maulik Darji</span>
                    <div id="nav-initials" style="width: 32px; height: 32px; background: var(--primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.8rem;">
                        MD
                    </div>
                </div>
            </div>
        `;
    },

    updateNavbarUser() {
        const user = Storage.getCurrentUser();
        if (user) {
            document.getElementById('nav-username').textContent = user.loginId || user.email;
            document.getElementById('nav-initials').textContent = (user.loginId || user.email).slice(0, 2).toUpperCase();
        } else {
            // If not logged in and not on login/signup page, redirect
            const path = window.location.pathname;
            if (!path.includes('login.html') && !path.includes('signup.html')) {
                window.location.href = 'login.html';
            }
        }
    },

    highlightActiveMenu() {
        const path = window.location.pathname;
        const links = document.querySelectorAll('.nav-link');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && path.includes(href)) {
                link.classList.add('active');
            }
        });
    },

    logout() {
        Storage.logout();
        window.location.href = 'login.html';
    }
};

// Expose to window for inline onclick handlers
window.App = App;

// Run init when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());

export default App;
