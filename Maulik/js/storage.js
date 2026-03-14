import { db, auth } from './firebase-config.js';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * Storage Engine for IMS - Firestore Version
 * Manages persistent data in the cloud.
 */

const DEFAULTS = {
    warehouses: [
        { name: 'Main Warehouse', code: 'MAIN', address: '123 Logistics Way, City' },
        { name: 'Production Floor', code: 'PROD', address: 'Level 1, Factory Block B' },
        { name: 'Rack A', code: 'R-A', address: 'Aisle 1, Section 5' },
        { name: 'Rack B', code: 'R-B', address: 'Aisle 2, Section 3' }
    ],
    categories: ['Raw Material', 'Consumables', 'Finished Goods']
};

const Storage = {
    // Helper to get current user ID
    getUid() {
        if (auth.currentUser) return auth.currentUser.uid;
        
        // Fallback to localStorage for immediate availability on page load
        const stored = localStorage.getItem('ims_current_user');
        if (stored) {
            const user = JSON.parse(stored);
            if (user.isGuest) return 'guest';
            return user.id || user.uid || 'guest'; // Check both common patterns
        }
        return 'guest';
    },

    // --- PRODUCTS ---
    async getProducts() {
        try {
            const uid = this.getUid();
            const q = query(collection(db, 'products'), where('ownerId', '==', uid));
            const snap = await getDocs(q);
            const products = snap.docs.map(d => ({ id: d.id, ...d.data() }));

            // Support for legacy data (created before ownerId was added)
            // We fetch all and filter in memory for orphaned records
            const allSnap = await getDocs(collection(db, 'products'));
            const legacy = allSnap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(p => !p.ownerId);

            // Combine and remove duplicates just in case
            const combined = [...products, ...legacy];
            const unique = Array.from(new Map(combined.map(p => [p.id, p])).values());
            return unique;
        } catch (err) {
            console.error("Firestore getProducts error:", err);
            return [];
        }
    },

    async saveProduct(product) {
        try {
            product.ownerId = this.getUid();
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
            const uid = this.getUid();
            const q = query(
                collection(db, 'movements'), 
                where('ownerId', '==', uid)
            );
            const snap = await getDocs(q);
            const movements = snap.docs.map(d => ({ id: d.id, ...d.data() }));

            // Legacy fallback for movements without owners
            const allSnap = await getDocs(collection(db, 'movements'));
            const legacy = allSnap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(m => !m.ownerId);

            const combined = [...movements, ...legacy];
            // Sort in memory to avoid composite index requirement
            combined.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            
            const unique = Array.from(new Map(combined.map(m => [m.id, m])).values());
            return unique;
        } catch (err) {
            console.error("Firestore getMovements error:", err);
            return [];
        }
    },

    async saveMovement(movement) {
        try {
            movement.ownerId = this.getUid();
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
            const docRef = doc(db, 'settings', this.getUid());
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                return snap.data();
            } else {
                // If no settings exist, return defaults but don't save yet (seed will handle saving)
                return { ...DEFAULTS, seeded: false };
            }
        } catch (err) {
            console.error("Firestore getSettings error:", err);
            return { ...DEFAULTS, seeded: false };
        }
    },

    async saveSettings(settings) {
        try {
            await setDoc(doc(db, 'settings', this.getUid()), settings);
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
            const uid = this.getUid();
            if (uid === 'guest') return; // Don't persist guest seeds to shared doc if it's the same

            const settings = await this.getSettings();
            if (settings.seeded) return;

            await this.saveSettings({ 
                seeded: true, 
                warehouses: settings.warehouses.length > 0 ? settings.warehouses : DEFAULTS.warehouses, 
                categories: settings.categories.length > 0 ? settings.categories : DEFAULTS.categories,
                sequences: {}
            });

            console.log("Database seeded successfully for UID:", uid);
        } catch (err) {
            console.error("Seed error:", err);
        }
    },

    async searchAll(term) {
        if (!term || term.length < 2) return { products: [], movements: [] };
        
        const termLower = term.toLowerCase();
        const [products, movements] = await Promise.all([
            this.getProducts(),
            this.getMovements()
        ]);

        const filteredProducts = products.filter(p => 
            p.name.toLowerCase().includes(termLower) || 
            p.sku.toLowerCase().includes(termLower)
        );

        const filteredMovements = movements.filter(m => 
            (m.id || '').toLowerCase().includes(termLower) ||
            (m.productName || '').toLowerCase().includes(termLower) ||
            (m.partner || '').toLowerCase().includes(termLower) ||
            (m.type || '').toLowerCase().includes(termLower)
        );

        return {
            products: filteredProducts.slice(0, 5),
            movements: filteredMovements.slice(0, 5)
        };
    },

    async wipeUserData() {
        const uid = this.getUid();
        if (!uid || uid === 'guest') return;

        try {
            // 1. Delete Settings
            await deleteDoc(doc(db, 'settings', uid));

            // 2. Delete Products
            const pQuery = query(collection(db, 'products'), where('ownerId', '==', uid));
            const pSnap = await getDocs(pQuery);
            const pDeletes = pSnap.docs.map(d => deleteDoc(d.ref));
            await Promise.all(pDeletes);

            // 3. Delete Movements
            const mQuery = query(collection(db, 'movements'), where('ownerId', '==', uid));
            const mSnap = await getDocs(mQuery);
            const mDeletes = mSnap.docs.map(d => deleteDoc(d.ref));
            await Promise.all(mDeletes);

            console.log("All cloud data wiped for user:", uid);
        } catch (err) {
            console.error("Wipe data error:", err);
            throw err;
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
