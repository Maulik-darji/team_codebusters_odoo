/**
 * Storage Engine for IMS
 * Manages localStorage with structured data and consistency.
 */

const STORAGE_KEYS = {
    PRODUCTS: 'ims_products',
    MOVEMENTS: 'ims_movements',
    USERS: 'ims_users',
    CURRENT_USER: 'ims_current_user',
    SETTINGS: 'ims_settings'
};

const Storage = {
    // Generic Get
    get(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    },

    // Generic Set
    set(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    // --- PRODUCTS ---
    getProducts() {
        return this.get(STORAGE_KEYS.PRODUCTS);
    },

    saveProduct(product) {
        const products = this.getProducts();
        if (product.id) {
            const index = products.findIndex(p => p.id === product.id);
            if (index !== -1) products[index] = product;
        } else {
            product.id = 'p_' + Date.now();
            products.push(product);
        }
        this.set(STORAGE_KEYS.PRODUCTS, products);
        return product;
    },

    deleteProduct(id) {
        const products = this.getProducts().filter(p => p.id !== id);
        this.set(STORAGE_KEYS.PRODUCTS, products);
    },

    // --- MOVEMENTS (Ledger) ---
    getMovements() {
        return this.get(STORAGE_KEYS.MOVEMENTS);
    },

    saveMovement(movement) {
        const movements = this.getMovements();
        movement.id = 'm_' + Date.now();
        movement.date = movement.date || new Date().toISOString().split('T')[0];
        movements.unshift(movement); // Newest first
        this.set(STORAGE_KEYS.MOVEMENTS, movements);
        return movement;
    },

    // --- USERS & AUTH ---
    getUsers() {
        return this.get(STORAGE_KEYS.USERS);
    },

    saveUser(user) {
        const users = this.getUsers();
        users.push(user);
        this.set(STORAGE_KEYS.USERS, users);
    },

    getCurrentUser() {
        const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        return data ? JSON.parse(data) : null;
    },

    setCurrentUser(user) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    },

    logout() {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    },

    // --- SEED DATA ---
    seed() {
        if (this.get(STORAGE_KEYS.SETTINGS).seeded) return;

        const defaultWarehouses = ['Main Warehouse', 'Production Floor', 'Rack A', 'Rack B'];
        const defaultCategories = ['Raw Material', 'Consumables', 'Finished Goods'];

        this.set(STORAGE_KEYS.SETTINGS, { 
            seeded: true, 
            warehouses: defaultWarehouses, 
            categories: defaultCategories 
        });

        // Optional: Add a demo product if completely empty
        if (this.getProducts().length === 0) {
            // No, user wants clean slate. We'll just seed settings.
        }
    }
};

// Auto-seed on load
Storage.seed();

export default Storage;
