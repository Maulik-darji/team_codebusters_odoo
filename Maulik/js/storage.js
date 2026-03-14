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
        const q = collection(db, 'products');
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    async saveProduct(product) {
        if (!product.id) {
            const newDoc = doc(collection(db, 'products'));
            product.id = newDoc.id;
            await setDoc(newDoc, product);
        } else {
            await setDoc(doc(db, 'products', product.id), product);
        }
        return product;
    },

    async deleteProduct(id) {
        await deleteDoc(doc(db, 'products', id));
    },

    // --- MOVEMENTS (Ledger) ---
    async getMovements() {
        const q = query(collection(db, 'movements'), orderBy('date', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    async saveMovement(movement) {
        const ref = movement.id ? doc(db, 'movements', movement.id) : doc(collection(db, 'movements'));
        movement.id = ref.id;
        movement.date = movement.date || new Date().toISOString().split('T')[0];
        movement.timestamp = new Date().getTime();
        await setDoc(ref, movement);
        return movement;
    },

    // --- SETTINGS (Warehouses, Categories) ---
    async getSettings() {
        const docRef = doc(db, 'settings', 'global');
        const snap = await getDoc(docRef);
        return snap.exists() ? snap.data() : { warehouses: [], categories: [] };
    },

    async saveSettings(settings) {
        await setDoc(doc(db, 'settings', 'global'), settings);
    },

    async getWarehouses() {
        const settings = await this.getSettings();
        return settings.warehouses || [];
    },

    async saveWarehouse(warehouse) {
        const settings = await this.getSettings();
        const index = settings.warehouses.findIndex(w => (typeof w === 'string' ? w : w.name) === warehouse.name);
        if (index !== -1) {
            settings.warehouses[index] = warehouse;
        } else {
            settings.warehouses.push(warehouse);
        }
        await this.saveSettings(settings);
    },

    async removeWarehouse(name) {
        const settings = await this.getSettings();
        settings.warehouses = settings.warehouses.filter(w => (typeof w === 'string' ? w : w.name) !== name);
        await this.saveSettings(settings);
    },

    // --- SEQUENCES ---
    async getNextSequence(warehouseCode, type) {
        const settings = await this.getSettings();
        if (!settings.sequences) settings.sequences = {};

        const opCode = type === 'Receipt' ? 'IN' : (type === 'Delivery' ? 'OUT' : 'INT');
        const seqKey = `${warehouseCode}/${opCode}`;
        
        const nextId = (settings.sequences[seqKey] || 0) + 1;
        settings.sequences[seqKey] = nextId;
        await this.saveSettings(settings);

        const paddedId = String(nextId).padStart(3, '0');
        return `${warehouseCode}/${opCode}/${paddedId}`;
    },

    // --- USERS ---
    setCurrentUser(user) {
        localStorage.setItem('ims_current_user', JSON.stringify(user));
    },

    getCurrentUser() {
        const data = localStorage.getItem('ims_current_user');
        return data ? JSON.parse(data) : null;
    },

    // --- SEED DATA ---
    async seed() {
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
            categories: defaultCategories 
        });
    }
};

// Listen for auth state to auto-seed if first time
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
onAuthStateChanged(auth, (user) => {
    if (user) {
        Storage.seed();
    }
});

export default Storage;
