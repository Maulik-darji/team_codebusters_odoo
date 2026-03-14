import Storage from './storage.js';

/**
 * Receipts.js - Handles Incoming Stock Logic
 */

const Receipts = {
    init() {
        this.renderList();
        this.populateDropdowns();

        const form = document.getElementById('receipt-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        window.openModal = () => document.getElementById('modal').classList.remove('hidden');
        window.closeModal = () => document.getElementById('modal').classList.add('hidden');
        window.validateReceipt = (id) => this.validate(id);
    },

    populateDropdowns() {
        const productSelect = document.getElementById('r-product');
        const warehouseSelect = document.getElementById('r-warehouse');
        
        const products = Storage.getProducts();
        const settings = Storage.get('ims_settings') || { warehouses: [] };

        if (productSelect) {
            productSelect.innerHTML = products.map(p => `<option value="${p.id}">${p.name} (${p.sku})</option>`).join('');
        }
        if (warehouseSelect) {
            warehouseSelect.innerHTML = settings.warehouses.map(w => `<option value="${w}">${w}</option>`).join('');
        }
    },

    renderList() {
        const list = document.getElementById('receipt-list');
        const movements = Storage.getMovements().filter(m => m.type === 'Receipt');
        
        if (!list) return;

        list.innerHTML = movements.length ? '' : '<tr><td colspan="7" style="text-align:center; padding: 2rem;">No receipts found.</td></tr>';

        movements.forEach(m => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${m.id.split('_')[1].slice(-4)}</td>
                <td>${m.partner || 'Internal'}</td>
                <td>${m.productName}</td>
                <td>+${m.quantity}</td>
                <td>${m.date}</td>
                <td><span class="badge ${m.status === 'Done' ? 'badge-success' : 'badge-warning'}">${m.status}</span></td>
                <td>
                    ${m.status === 'Ready' ? `<button class="btn btn-primary btn-sm" onclick="validateReceipt('${m.id}')">Validate</button>` : ''}
                </td>
            `;
            list.appendChild(row);
        });
    },

    handleSubmit(e) {
        e.preventDefault();
        const productId = document.getElementById('r-product').value;
        const products = Storage.getProducts();
        const product = products.find(p => p.id === productId);

        const movement = {
            type: 'Receipt',
            partner: document.getElementById('r-supplier').value,
            productId: productId,
            productName: product.name,
            quantity: Number(document.getElementById('r-qty').value),
            location: document.getElementById('r-warehouse').value,
            status: 'Ready'
        };

        Storage.saveMovement(movement);
        window.closeModal();
        this.renderList();
        e.target.reset();
    },

    validate(id) {
        const movements = Storage.getMovements();
        const index = movements.findIndex(m => m.id === id);
        
        if (index !== -1) {
            const m = movements[index];
            m.status = 'Done';
            
            // Update physical stock
            const products = Storage.getProducts();
            const pIndex = products.findIndex(p => p.id === m.productId);
            if (pIndex !== -1) {
                products[pIndex].stock = Number(products[pIndex].stock) + m.quantity;
                Storage.set('ims_products', products);
            }

            Storage.set('ims_movements', movements);
            this.renderList();
        }
    }
};

Receipts.init();
export default Receipts;
