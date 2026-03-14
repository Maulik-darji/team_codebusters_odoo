import Storage from './storage.js';

/**
 * Adjustments.js - Handles Inventory Correction Logic
 */

const Adjustments = {
    init() {
        this.renderList();
        this.populateDropdowns();

        const form = document.getElementById('adjustment-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        window.openModal = () => document.getElementById('modal').classList.remove('hidden');
        window.closeModal = () => document.getElementById('modal').classList.add('hidden');
        window.updateRecordedQty = () => this.updateRecorded();
    },

    populateDropdowns() {
        const productSelect = document.getElementById('a-product');
        const products = Storage.getProducts();

        if (productSelect) {
            productSelect.innerHTML = products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
            this.updateRecorded();
        }
    },

    updateRecorded() {
        const productId = document.getElementById('a-product').value;
        const product = Storage.getProducts().find(p => p.id === productId);
        if (product) {
            document.getElementById('a-recorded').value = product.stock;
        }
    },

    renderList() {
        const list = document.getElementById('adjustment-list');
        const movements = Storage.getMovements().filter(m => m.type === 'Adjustment');
        
        if (!list) return;

        list.innerHTML = movements.length ? '' : '<tr><td colspan="7" style="text-align:center; padding: 2rem;">No adjustments found.</td></tr>';

        movements.forEach(m => {
            const diff = m.quantity;
            const diffClass = diff >= 0 ? 'text-success' : 'text-danger';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#ADJ-${m.id.split('_')[1].slice(-4)}</td>
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

    handleSubmit(e) {
        e.preventDefault();
        const productId = document.getElementById('a-product').value;
        const recorded = Number(document.getElementById('a-recorded').value);
        const actual = Number(document.getElementById('a-actual').value);
        const diff = actual - recorded;

        const products = Storage.getProducts();
        const pIndex = products.findIndex(p => p.id === productId);
        
        if (pIndex !== -1) {
            const product = products[pIndex];
            
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
            Storage.set('ims_products', products);
            
            Storage.saveMovement(movement);
            window.closeModal();
            this.renderList();
        }
    }
};

Adjustments.init();
export default Adjustments;
