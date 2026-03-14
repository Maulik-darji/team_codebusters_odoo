import Storage from './storage.js';

/**
 * Delivery.js - Handles Outgoing Stock Logic
 */

const Delivery = {
    init() {
        this.renderList();
        this.populateDropdowns();

        const form = document.getElementById('delivery-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        window.openModal = () => document.getElementById('modal').classList.remove('hidden');
        window.closeModal = () => {
            document.getElementById('modal').classList.add('hidden');
            document.getElementById('stock-error').classList.add('hidden');
        };
        window.validateDelivery = (id) => this.validate(id);
    },

    populateDropdowns() {
        const productSelect = document.getElementById('d-product');
        const warehouseSelect = document.getElementById('d-warehouse');
        
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
        const list = document.getElementById('delivery-list');
        const movements = Storage.getMovements().filter(m => m.type === 'Delivery');
        
        if (!list) return;

        list.innerHTML = movements.length ? '' : '<tr><td colspan="7" style="text-align:center; padding: 2rem;">No delivery orders found.</td></tr>';

        movements.forEach(m => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${m.id.split('_')[1].slice(-4)}</td>
                <td>${m.partner || 'Unknown'}</td>
                <td>${m.productName}</td>
                <td>-${m.quantity}</td>
                <td>${m.date}</td>
                <td><span class="badge ${m.status === 'Done' ? 'badge-success' : 'badge-warning'}">${m.status}</span></td>
                <td>
                    ${m.status === 'Ready' ? `<button class="btn btn-primary btn-sm" onclick="validateDelivery('${m.id}')">Validate</button>` : ''}
                </td>
            `;
            list.appendChild(row);
        });
    },

    handleSubmit(e) {
        e.preventDefault();
        const productId = document.getElementById('d-product').value;
        const qty = Number(document.getElementById('d-qty').value);
        const products = Storage.getProducts();
        const product = products.find(p => p.id === productId);

        // Validation
        if (Number(product.stock) < qty) {
            document.getElementById('stock-error').classList.remove('hidden');
            return;
        }

        const movement = {
            type: 'Delivery',
            partner: document.getElementById('d-customer').value,
            productId: productId,
            productName: product.name,
            quantity: qty,
            location: document.getElementById('d-warehouse').value,
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
            
            // Re-check stock just in case
            const products = Storage.getProducts();
            const pIndex = products.findIndex(p => p.id === m.productId);
            
            if (pIndex !== -1 && Number(products[pIndex].stock) >= m.quantity) {
                products[pIndex].stock = Number(products[pIndex].stock) - m.quantity;
                Storage.set('ims_products', products);
                
                m.status = 'Done';
                Storage.set('ims_movements', movements);
                this.renderList();
            } else {
                alert("Insufficient stock available to validate this delivery!");
            }
        }
    }
};

Delivery.init();
export default Delivery;
