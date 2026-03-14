import { db, auth } from './firebase-config.js';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * Storage Engine for IMS - Firestore Version
 * Manages persistent data in the cloud.
 */

const Storage = {
    // Helper to get current user ID
    getUid() {
        return auth.currentUser ? auth.currentUser.uid : 'guest';
    },

    // --- PRODUCTS ---
    async getProducts() {
        try {
            const q = collection(db, 'products');
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (err) {
            console.error("Firestore getProducts error:", err);
            return [];
        }
    },

    async saveProduct(product) {
        try {
            if (!product.id) {
                const newDoc = doc(collection(db, 'products'));
                product.id = newDoc.id;
                await setDoc(newDoc, product);
            } else {
                await setDoc(doc(db, 'products', product.id), product);
            }
        } catch (err) {
            console.error("Firestore saveProduct error:", err);
            alert("Storage error: Database might not be initialized or offline.");
        }
        return product;
    },

    async deleteProduct(id) {
        try {
            await deleteDoc(doc(db, 'products', id));
        } catch (err) {
            console.error("Firestore deleteProduct error:", err);
        }
    },

    // --- MOVEMENTS (Ledger) ---
    async getMovements() {
        try {
            const q = query(collection(db, 'movements'), orderBy('timestamp', 'desc'));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (err) {
            console.error("Firestore getMovements error:", err);
            alert("Database error: Could not fetch movements. Check your connection.");
            return [];
        }
    },

    async saveMovement(movement) {
        try {
            const ref = movement.id ? doc(db, 'movements', movement.id) : doc(collection(db, 'movements'));
            movement.id = ref.id;
            movement.date = movement.date || new Date().toISOString().split('T')[0];
            movement.timestamp = new Date().getTime();
            await setDoc(ref, movement);
        } catch (err) {
            console.error("Firestore saveMovement error:", err);
            alert("Database error: Could not save operation. " + err.message);
        }
        return movement;
    },


    // --- SETTINGS (Warehouses, Categories) ---
    async getSettings() {
        try {
            const docRef = doc(db, 'settings', 'global');
            const snap = await getDoc(docRef);
            return snap.exists() ? snap.data() : { warehouses: [], categories: [] };
        } catch (err) {
            console.error("Firestore getSettings error:", err);
            return { warehouses: [], categories: [] };
        }
    },

    async saveSettings(settings) {
        try {
            await setDoc(doc(db, 'settings', 'global'), settings);
        } catch (err) {
            console.error("Firestore saveSettings error:", err);
        }
    },

    async getWarehouses() {
        const settings = await this.getSettings();
        return settings.warehouses || [];
    },

    async saveWarehouse(warehouse) {
        try {
            const settings = await this.getSettings();
            const index = settings.warehouses.findIndex(w => (typeof w === 'string' ? w : w.name) === warehouse.name);
            if (index !== -1) {
                settings.warehouses[index] = warehouse;
            } else {
                settings.warehouses.push(warehouse);
            }
            await this.saveSettings(settings);
        } catch (err) {
            console.error("Firestore saveWarehouse error:", err);
        }
    },

    async removeWarehouse(name) {
        try {
            const settings = await this.getSettings();
            settings.warehouses = settings.warehouses.filter(w => (typeof w === 'string' ? w : w.name) !== name);
            await this.saveSettings(settings);
        } catch (err) {
            console.error("Firestore removeWarehouse error:", err);
        }
    },

    // --- SEQUENCES ---
    async getNextSequence(warehouseCode, type) {
        try {
            const settings = await this.getSettings();
            if (!settings.sequences) settings.sequences = {};

            const opCode = type === 'Receipt' ? 'IN' : (type === 'Delivery' ? 'OUT' : 'INT');
            const seqKey = `${warehouseCode}-${opCode}`;
            
            const nextId = (settings.sequences[seqKey] || 0) + 1;
            settings.sequences[seqKey] = nextId;
            await this.saveSettings(settings);

            const paddedId = String(nextId).padStart(3, '0');
            return `${warehouseCode}-${opCode}-${paddedId}`;
        } catch (err) {
            console.error("Firestore getNextSequence error:", err);
            return `${warehouseCode}-GEN-${Date.now()}`;
        }

    },

    // --- USERS ---
    setCurrentUser(user) {
        localStorage.setItem('ims_current_user', JSON.stringify(user));
    },

    getCurrentUser() {
        const data = localStorage.getItem('ims_current_user');
        return data ? JSON.parse(data) : null;
    },

    logout() {
        localStorage.removeItem('ims_current_user');
        import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js").then(m => {
            const auth = m.getAuth();
            m.signOut(auth);
        });
    },

    // --- SEED DATA ---
    async seed() {
        try {
            const settings = await this.getSettings();
            if (settings.seeded) return;

            const defaultWarehouses = [
                { name: 'Main Warehouse', code: 'MAIN', address: '123 Logistics Way, City' },
                { name: 'Production Floor', code: 'PROD', address: 'Level 1, Factory Block B' },
                { name: 'Rack A', code: 'R-A', address: 'Aisle 1, Section 5' },
                { name: 'Rack B', code: 'R-B', address: 'Aisle 2, Section 3' }
            ];
            const defaultCategories = ['Raw Material', 'Consumables', 'Finished Goods'];

            await this.saveSettings({ 
                seeded: true, 
                warehouses: defaultWarehouses, 
                categories: defaultCategories,
                sequences: {}
            });

            console.log("Database seeded successfully!");
        } catch (err) {
            console.error("Seed error:", err);
        }
    }
};

// Listen for auth state to auto-seed
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
onAuthStateChanged(auth, (user) => {
    if (user) {
        Storage.seed();
    } else {
        // Also try to seed for guests if they have a guest session
        const currentUser = Storage.getCurrentUser();
        if (currentUser && currentUser.isGuest) {
            Storage.seed();
        }
    }
});

export default Storage;
