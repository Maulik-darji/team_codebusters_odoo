import Storage from './storage.js';

/**
 * Transfers.js - Handles Internal Stock Movement Logic
 */

const Transfers = {
    init() {
        this.renderList();
        this.populateDropdowns();

        const form = document.getElementById('transfer-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        window.openModal = () => document.getElementById('modal').classList.remove('hidden');
        window.closeModal = () => {
            document.getElementById('modal').classList.add('hidden');
            document.getElementById('stock-error').classList.add('hidden');
        };
        window.validateTransfer = (id) => this.validate(id);
    },

    populateDropdowns() {
        const productSelect = document.getElementById('t-product');
        const sourceSelect = document.getElementById('t-source');
        const destSelect = document.getElementById('t-dest');
        
        const products = Storage.getProducts();
        const settings = Storage.get('ims_settings') || { warehouses: [] };

        if (productSelect) {
            productSelect.innerHTML = products.map(p => `<option value="${p.id}">${p.name} (${p.sku})</option>`).join('');
        }
        const warehouseOptions = settings.warehouses.map(w => `<option value="${w}">${w}</option>`).join('');
        if (sourceSelect) sourceSelect.innerHTML = warehouseOptions;
        if (destSelect) destSelect.innerHTML = warehouseOptions;
    },

    renderList() {
        const list = document.getElementById('transfer-list');
        const movements = Storage.getMovements().filter(m => m.type === 'Transfer');
        
        if (!list) return;

        list.innerHTML = movements.length ? '' : '<tr><td colspan="8" style="text-align:center; padding: 2rem;">No transfers found.</td></tr>';

        movements.forEach(m => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${m.id.split('_')[1].slice(-4)}</td>
                <td>${m.productName}</td>
                <td>${m.quantity}</td>
                <td>${m.source}</td>
                <td>${m.location}</td>
                <td>${m.date}</td>
                <td><span class="badge ${m.status === 'Done' ? 'badge-success' : 'badge-warning'}">${m.status}</span></td>
                <td>
                    ${m.status === 'Ready' ? `<button class="btn btn-primary btn-sm" onclick="validateTransfer('${m.id}')">Validate</button>` : ''}
                </td>
            `;
            list.appendChild(row);
        });
    },

    handleSubmit(e) {
        e.preventDefault();
        const productId = document.getElementById('t-product').value;
        const qty = Number(document.getElementById('t-qty').value);
        const source = document.getElementById('t-source').value;
        const dest = document.getElementById('t-dest').value;

        if (source === dest) {
            alert("Source and destination cannot be the same!");
            return;
        }

        const products = Storage.getProducts();
        const product = products.find(p => p.id === productId);

        // Simple validation (can be more complex by per-location stock)
        if (Number(product.stock) < qty) {
            document.getElementById('stock-error').classList.remove('hidden');
            return;
        }

        const movement = {
            type: 'Transfer',
            productId: productId,
            productName: product.name,
            quantity: qty,
            source: source,
            location: dest, // "location" is destination for transfers
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
            Storage.set('ims_movements', movements);
            this.renderList();
        }
    }
};

Transfers.init();
export default Transfers;
