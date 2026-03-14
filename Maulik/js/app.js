import Storage from './storage.js';

/**
 * App.js - Shared Layout and Global Logic
 */

const App = {
    init() {
        this.initTheme();
        this.renderLayout();
        this.updateNavbarUser();
        this.highlightActiveMenu();
        // Global Lucide Icons init
        if (window.lucide) window.lucide.createIcons();

        // Global Search Init
        this.initSearch();
        
        // Notifications Init
        this.initNotifications();

        // AI Assistant Init
        this.initAI();

        // Update navbar if auth resolves late
        window.addEventListener('auth-ready', () => this.updateNavbarUser());
        
        // Inject Confirmation Modal
        this.injectConfirmModal();
    },

    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        window.currentTheme = savedTheme;
    },

    toggleTheme() {
        const newTheme = window.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        window.currentTheme = newTheme;
        
        // Update toggle icon
        const icon = document.querySelector('#theme-toggle i');
        if (icon && window.lucide) {
            // Replace the whole element to trigger lucide
            const newIcon = document.createElement('i');
            newIcon.setAttribute('data-lucide', newTheme === 'light' ? 'moon' : 'sun');
            newIcon.style.width = '18px';
            newIcon.style.color = 'var(--text-main)';
            icon.parentNode.replaceChild(newIcon, icon);
            window.lucide.createIcons();
        }
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
                <a href="profile.html" class="nav-link" id="nav-profile">
                    <i data-lucide="user"></i> Profile
                </a>
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
                <div class="search-wrapper" style="position: relative; width: 330px;">
                    <i data-lucide="search" style="position: absolute; left: 10px; top: 8px; width: 16px; color: #999"></i>
                    <input type="text" id="global-search" placeholder="Search products, SKU, refs..." style="padding-left: 2.5rem; height: 32px; width: 100%;">
                    <div id="search-results" class="hidden" style="position: absolute; top: 40px; left: 0; width: 450px; background: white; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid var(--border-color); z-index: 10000; padding: 1rem; max-height: 500px; overflow-y: auto;">
                    </div>
                </div>
                <div class="flex items-center gap-4" style="display: flex; align-items: center; gap: 15px;">
                    <button id="theme-toggle" class="btn btn-light" style="width: 36px; height: 36px; padding: 0; border-radius: 50%; border: 1px solid var(--border-color); background: var(--surface);" onclick="window.App.toggleTheme()">
                        <i data-lucide="${window.currentTheme === 'light' ? 'moon' : 'sun'}" style="width: 18px; color: var(--text-main);"></i>
                    </button>
                    <div id="notification-trigger" style="position: relative; cursor: pointer; padding: 8px;">
                        <i data-lucide="bell" style="width: 20px; color: var(--text-muted);"></i>
                        <span id="notif-badge" class="hidden" style="position: absolute; top: 2px; right: 2px; width: 10px; height: 10px; background: var(--danger); border-radius: 50%; border: 2px solid var(--surface);"></span>
                        <div id="notif-dropdown" class="hidden" style="position: absolute; top: 40px; right: 0; width: 300px; background: var(--surface); border-radius: 8px; box-shadow: var(--shadow-md); border: 1px solid var(--border-color); z-index: 10000; padding: 0.75rem; max-height: 400px; overflow-y: auto;">
                            <div style="font-weight: 700; font-size: 0.85rem; margin-bottom: 0.75rem; color: var(--text-main);">Notifications</div>
                            <div id="notif-list"></div>
                        </div>
                    </div>
                    <button id="ai-trigger" class="btn btn-primary btn-sm" style="display: flex; align-items: center; gap: 6px; background: linear-gradient(135deg, #6366f1, #a855f7); border: none; padding: 0.5rem 1rem; border-radius: 20px;">
                        <i data-lucide="sparkles" style="width: 16px;"></i>
                        AI Assistant
                    </button>
                    <div class="user-profile flex items-center gap-2" style="display: flex; align-items:center; gap: 10px; cursor: pointer; padding-left: 10px; border-left: 1px solid var(--border-color);" onclick="window.location.href='profile.html'">
                        <div id="nav-initials" style="width: 32px; height: 32px; background: var(--primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.8rem;">
                            MD
                        </div>
                        <div class="hidden-mobile">
                            <div id="nav-username" style="font-size: 0.85rem; font-weight: 600; color: var(--text-main);">Maulik Darji</div>
                            <div style="font-size: 0.7rem; color: var(--text-muted);">Administrator</div>
                        </div>
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
    },

    initSearch() {
        const searchInput = document.getElementById('global-search');
        const searchResults = document.getElementById('search-results');
        if (!searchInput) return;

        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            const term = e.target.value.trim();
            if (term.length < 2) {
                searchResults.classList.add('hidden');
                return;
            }
            debounceTimer = setTimeout(() => this.handleSearch(term), 300);
        });

        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.classList.add('hidden');
            }
        });
    },

    async handleSearch(term) {
        const results = document.getElementById('search-results');
        const data = await Storage.searchAll(term);
        
        results.classList.remove('hidden');
        
        if (data.products.length === 0 && data.movements.length === 0) {
            results.innerHTML = '<div class="text-muted p-2" style="font-size: 0.85rem;">No results found for "' + term + '"</div>';
            return;
        }

        let html = '';
        if (data.products.length > 0) {
            html += '<div style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; margin: 0.5rem 0 0.5rem 0.5rem; text-transform: uppercase;">Products</div>';
            data.products.forEach(p => {
                html += `
                    <a href="products.html" class="search-item" style="display: block; padding: 0.75rem; text-decoration: none; color: inherit; border-radius: 6px;">
                        <div style="font-weight: 600; font-size: 0.9rem;">${p.name}</div>
                        <div style="font-size: 0.75rem; color: #94a3b8;">SKU: ${p.sku} • Stock: ${p.stock}</div>
                    </a>
                `;
            });
        }

        if (data.movements.length > 0) {
            html += '<div style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; margin: 1rem 0 0.5rem 0.5rem; text-transform: uppercase;">Operations (Receipts/Deliveries)</div>';
            data.movements.forEach(m => {
                const page = m.type === 'Receipt' ? 'receipts.html' : (m.type === 'Delivery' ? 'delivery.html' : 'transfers.html');
                const badgeClass = m.status === 'Done' ? 'badge-success' : (m.status === 'Rejected' ? 'badge-danger' : 'badge-warning');
                html += `
                    <a href="${page}" class="search-item" style="display: block; padding: 0.75rem; text-decoration: none; color: inherit; border-radius: 6px;">
                        <div class="flex-between">
                            <span style="font-weight: 600; font-size: 0.85rem; font-family: monospace;">${m.id}</span>
                            <span class="badge ${badgeClass}" style="transform: scale(0.8)">${m.status}</span>
                        </div>
                        <div style="font-size: 0.75rem; color: #94a3b8;">${m.type} • ${m.productName} • ${m.date}</div>
                    </a>
                `;
            });
        }

        results.innerHTML = html;
        
        // Add hover effect style if not present
        if (!document.getElementById('search-styles')) {
            const style = document.createElement('style');
            style.id = 'search-styles';
            style.textContent = `
                .search-item:hover { background: #f8fafc; color: var(--primary) !important; }
            `;
            document.head.appendChild(style);
        }
    },

    initNotifications() {
        const trigger = document.getElementById('notification-trigger');
        const dropdown = document.getElementById('notif-dropdown');
        if (!trigger) return;

        trigger.onclick = (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('hidden');
            this.renderNotifications();
        };

        document.addEventListener('click', () => dropdown && dropdown.classList.add('hidden'));
        
        // Initial check for badge
        this.updateNotifBadge();
    },

    async updateNotifBadge() {
        const badge = document.getElementById('notif-badge');
        if (!badge) return;
        const data = await this.getNotificationData();
        if (data.length > 0) {
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    },

    async getNotificationData() {
        const [products, movements] = await Promise.all([
            Storage.getProducts(),
            Storage.getMovements()
        ]);

        const notifs = [];
        
        // 1. Low/Out of Stock
        products.forEach(p => {
            if (p.stock <= 0) {
                notifs.push({
                    type: 'danger',
                    icon: 'alert-octagon',
                    title: 'Out of Stock',
                    message: `${p.name} is completely out of stock!`,
                    link: 'products.html'
                });
            } else if (p.stock < 10) { // Threshold 10
                notifs.push({
                    type: 'warning',
                    icon: 'alert-triangle',
                    title: 'Low Stock',
                    message: `${p.name} level is low (${p.stock}).`,
                    link: 'products.html'
                });
            }
        });

        // 2. Pending Transfers
        movements.filter(m => m.type === 'Transfer' && m.status === 'Ready').forEach(m => {
            notifs.push({
                type: 'info',
                icon: 'arrow-right-left',
                title: 'Pending Transfer',
                message: `Transfer ${m.id} is ready to be processed.`,
                link: 'transfers.html'
            });
        });

        return notifs;
    },

    async renderNotifications() {
        const list = document.getElementById('notif-list');
        if (!list) return;
        const notifs = await this.getNotificationData();
        
        if (notifs.length === 0) {
            list.innerHTML = '<div class="text-xs text-muted p-2">No new notifications</div>';
            return;
        }

        list.innerHTML = notifs.map(n => `
            <a href="${n.link}" class="notif-item" style="display: flex; gap: 10px; padding: 0.75rem; text-decoration: none; border-radius: 6px; margin-bottom: 5px;">
                <div style="flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: ${n.type === 'danger' ? '#fee2e2' : (n.type === 'warning' ? '#fef3c7' : '#e0f2fe')}; color: ${n.type === 'danger' ? '#ef4444' : (n.type === 'warning' ? '#f59e0b' : '#0ea5e9')};">
                    <i data-lucide="${n.icon}" style="width: 16px;"></i>
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 0.8rem; color: var(--text-color);">${n.title}</div>
                    <div style="font-size: 0.75rem; color: #64748b;">${n.message}</div>
                </div>
            </a>
        `).join('');

        if (window.lucide) window.lucide.createIcons();

        if (!document.getElementById('notif-styles')) {
            const style = document.createElement('style');
            style.id = 'notif-styles';
            style.textContent = `
                .notif-item:hover { background: #f8fafc; }
            `;
            document.head.appendChild(style);
        }
    },

    // Injects a global confirmation modal for a premium UI
    injectConfirmModal() {
        if (document.getElementById('ims-confirm-modal')) return;

        const modalHtml = `
            <div id="ims-confirm-modal" class="hidden" style="position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; animation: fadeIn 0.2s ease;">
                <div class="card" style="width: 100%; max-width: 400px; padding: 2rem; text-align: center; transform: scale(1); animation: zoomIn 0.2s ease;">
                    <div id="ims-confirm-icon" style="margin-bottom: 1.5rem; display: inline-flex; width: 64px; height: 64px; background: #fee2e2; color: #ef4444; border-radius: 50%; align-items: center; justify-content: center;">
                        <i data-lucide="alert-triangle" style="width: 32px; height: 32px;"></i>
                    </div>
                    <h2 id="ims-confirm-title" style="margin-bottom: 0.5rem; font-size: 1.25rem; font-weight: 700;">Are you sure?</h2>
                    <p id="ims-confirm-message" style="color: var(--text-muted); margin-bottom: 2rem; font-size: 0.9rem;">This action cannot be undone.</p>
                    <div style="display: flex; gap: 0.75rem; justify-content: center;">
                        <button id="ims-confirm-cancel" class="btn btn-light" style="flex: 1;">Cancel</button>
                        <button id="ims-confirm-proceed" class="btn btn-primary" style="flex: 1; background: var(--danger);">Confirm</button>
                    </div>
                </div>
            </div>
            <style>
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes zoomIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            </style>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        if (window.lucide) window.lucide.createIcons();
    },

    /**
     * Shows a beautiful confirmation modal
     * @param {string} title
     * @param {string} message 
     * @param {Function} onConfirm
     */
    confirm(title, message, onConfirm) {
        const modal = document.getElementById('ims-confirm-modal');
        const titleEl = document.getElementById('ims-confirm-title');
        const msgEl = document.getElementById('ims-confirm-message');
        const proceedBtn = document.getElementById('ims-confirm-proceed');
        const cancelBtn = document.getElementById('ims-confirm-cancel');

        titleEl.textContent = title;
        msgEl.textContent = message;
        modal.classList.remove('hidden');

        const cleanup = () => {
            modal.classList.add('hidden');
            proceedBtn.onclick = null;
            cancelBtn.onclick = null;
        };

        proceedBtn.onclick = () => {
            onConfirm();
            cleanup();
        };
        cancelBtn.onclick = cleanup;
    },

    initAI() {
        // 1. Inject AI Sidebar if not exists
        if (!document.getElementById('ai-sidebar')) {
            const aiHtml = `
                <div id="ai-sidebar" class="ai-sidebar hidden">
                    <div id="ai-resizer" class="ai-resizer"></div>
                    <div class="ai-header">
                        <div class="flex-between w-full">
                            <div class="flex items-center gap-2" style="display: flex; align-items: center; gap: 8px;">
                                <i data-lucide="sparkles" style="color: #a855f7;"></i>
                                <h3 class="font-bold text-lg">StockPilot AI</h3>
                            </div>
                            <div class="flex items-center gap-3" style="display: flex; align-items: center; gap: 12px;">
                                <button id="ai-settings-btn" title="AI Settings" style="background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 6px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; border-radius: 6px;" onmouseover="this.style.background='var(--bg-body)'" onmouseout="this.style.background='none'"><i data-lucide="settings" style="width: 18px; height: 18px;"></i></button>
                                <button id="ai-history-btn" title="View History" style="background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 6px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; border-radius: 6px;" onmouseover="this.style.background='var(--bg-body)'" onmouseout="this.style.background='none'"><i data-lucide="history" style="width: 18px; height: 18px;"></i></button>
                                <button id="ai-close" title="Close" style="background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 6px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; border-radius: 6px;" onmouseover="this.style.background='var(--bg-body)'" onmouseout="this.style.background='none'"><i data-lucide="x" style="width: 18px; height: 18px;"></i></button>
                            </div>
                        </div>
                    </div>

                    <!-- History Panel -->
                    <div id="ai-history-panel" class="ai-panel hidden">
                        <div class="p-3 border-b flex-between items-center bg-white sticky top-0" style="display: flex; justify-content: space-between; align-items: center;">
                            <h4 class="font-bold text-sm">Chat History</h4>
                            <button id="ai-clear-history" class="text-xs text-red-500 hover:underline">Clear All</button>
                        </div>
                        <div id="ai-history-list" class="ai-history-list"></div>
                    </div>

                    <!-- Settings Panel -->
                    <div id="ai-settings-panel" class="ai-panel hidden">
                        <div class="p-4 border-b flex-between" style="display: flex; justify-content: space-between; align-items: center;">
                            <h4 class="font-bold">AI Settings</h4>
                            <button id="ai-settings-close" class="text-xs text-gray-500 hover:underline">Close</button>
                        </div>
                        <div class="p-4 flex flex-col gap-4" style="display: flex; flex-direction: column; gap: 16px;">
                            <div>
                                <label class="block text-xs font-semibold text-gray-500 mb-1">Gemini API Key (Optional Override)</label>
                                <div class="flex gap-2" style="display: flex; gap: 8px;">
                                    <input type="password" id="ai-api-key-input" placeholder="Paste your key here..." class="flex-1 text-sm p-2 border rounded outline-none" style="border-color: #e2e8f0; width: 100%;">
                                    <button id="ai-save-api-key" class="bg-indigo-600 text-white text-xs px-3 py-2 rounded font-semibold hover:bg-indigo-700 transition">Save</button>
                                </div>
                                <p class="text-[10px] text-gray-400 mt-2">By default, the site's global key is used. Use this to use your own key.</p>
                            </div>
                        </div>
                    </div>

                    <div id="ai-chat-messages" class="ai-messages">
                        <div class="ai-msg bot">Hello! I'm your StockPilot AI. How can I help you manage your inventory today?</div>
                    </div>

                    <div class="ai-input-area">
                        <div class="ai-input-container">
                            <div class="flex-between items-center w-full mb-1">
                                <select id="ai-model-select" style="background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 12px; font-size: 0.8rem; color: #64748b; width: fit-content; outline: none;">
                                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                                </select>
                            </div>
                            <div class="ai-input-row">
                                <textarea id="ai-input" placeholder="Ask AI to do something..." rows="1"></textarea>
                                <button id="ai-send"><i data-lucide="send" style="width: 18px;"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', aiHtml);
            if (window.lucide) window.lucide.createIcons();
        }

        // 2. Setup Listeners
        const trigger = document.getElementById('ai-trigger');
        const sidebar = document.getElementById('ai-sidebar');
        const closeBtn = document.getElementById('ai-close');

        if (trigger && sidebar) {
            trigger.onclick = (e) => {
                e.preventDefault();
                const isOpening = sidebar.classList.contains('hidden');
                sidebar.classList.toggle('hidden');
                
                // If opening, scroll to bottom
                if (isOpening && window.AIAssistant) {
                    window.AIAssistant.scrollToBottom();
                }
            };
        }
        if (closeBtn && sidebar) {
            closeBtn.onclick = () => sidebar.classList.add('hidden');
        }

        // 3. Resizing Logic
        const resizer = document.getElementById('ai-resizer');
        let isResizing = false;

        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth > 300 && newWidth < 800) {
                sidebar.style.width = newWidth + 'px';
            }
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        });

        // 4. Load AI Assistant Logic
        import('./ai-assistant.js').then(m => {
            if (m.default && typeof m.default.init === 'function') {
                m.default.init();
            }
        }).catch(err => console.error("AI Module load error:", err));
    }
};

// Expose to window for inline onclick handlers
window.App = App;

// Run init when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());

export default App;
