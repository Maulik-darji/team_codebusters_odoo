import Storage from './storage.js';

/**
 * Adjustments.js - Handles Inventory Correction Logic
 */

const Adjustments = {
    async init() {
        // Attach window functions immediately
        window.openModal = () => document.getElementById('modal').classList.remove('hidden');
        window.closeModal = () => document.getElementById('modal').classList.add('hidden');
        window.updateRecordedQty = () => this.updateRecorded();

        try {
            await this.renderList();
            await this.populateDropdowns();
        } catch (err) {
            console.error("Failed to initialize Adjustments data:", err);
        }

        const form = document.getElementById('adjustment-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    },

    async populateDropdowns() {
        const productSelect = document.getElementById('a-product');
        const products = await Storage.getProducts();

        if (productSelect) {
            productSelect.innerHTML = products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
            await this.updateRecorded();
        }
    },

    async updateRecorded() {
        const productId = document.getElementById('a-product').value;
        const products = await Storage.getProducts();
        const product = products.find(p => p.id === productId);
        if (product) {
            document.getElementById('a-recorded').value = product.stock;
        }
    },

    async renderList() {
        const list = document.getElementById('adjustment-list');
        const allMovements = await Storage.getMovements();
        const movements = allMovements.filter(m => m.type === 'Adjustment');
        
        if (!list) return;

        list.innerHTML = movements.length ? '' : '<tr><td colspan="7" style="text-align:center; padding: 2rem;">No adjustments found.</td></tr>';

        movements.forEach(m => {
            const diff = m.quantity;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#ADJ-${m.id.slice(-4)}</td>
                <td>${m.productName}</td>
                <td>${m.recordedQty}</td>
                <td>${m.actualQty}</td>
                <td style="font-weight: 700; color: ${diff >= 0 ? 'var(--success)' : 'var(--danger)'}">${diff >= 0 ? '+' : ''}${diff}</td>
                <td>${m.reason}</td>
                <td>${m.date}</td>
            `;
            list.appendChild(row);
        });
    },

    async handleSubmit(e) {
        e.preventDefault();
        const productId = document.getElementById('a-product').value;
        const recorded = Number(document.getElementById('a-recorded').value);
        const actual = Number(document.getElementById('a-actual').value);
        const diff = actual - recorded;

        const products = await Storage.getProducts();
        const product = products.find(p => p.id === productId);
        
        if (product) {
            const movement = {
                type: 'Adjustment',
                productId: productId,
                productName: product.name,
                quantity: diff,
                recordedQty: recorded,
                actualQty: actual,
                reason: document.getElementById('a-reason').value,
                location: product.warehouse || 'Unknown',
                status: 'Done'
            };

            // Update physical stock immediately
            product.stock = actual;
            await Storage.saveProduct(product);
            await Storage.saveMovement(movement);
            
            window.closeModal();
            await this.renderList();
        }
    }
};

Adjustments.init();
export default Adjustments;
