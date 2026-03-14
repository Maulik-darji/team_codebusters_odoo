import Storage from './storage.js';

/**
 * Delivery.js - Handles Outgoing Stock Logic
 */

const Delivery = {
    async init() {
        // Attach window functions immediately
        window.openModal = () => document.getElementById('modal').classList.remove('hidden');
        window.closeModal = () => {
            document.getElementById('modal').classList.add('hidden');
            document.getElementById('stock-error').classList.add('hidden');
        };
        window.validateDelivery = (id) => this.validate(id);

        try {
            await this.renderList();
            await this.populateDropdowns();
        } catch (err) {
            console.error("Failed to initialize Delivery data:", err);
        }

        const form = document.getElementById('delivery-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    },

    async populateDropdowns() {
        const productSelect = document.getElementById('d-product');
        const warehouseSelect = document.getElementById('d-warehouse');
        
        const products = await Storage.getProducts();
        const settings = await Storage.getSettings();

        if (productSelect) {
            productSelect.innerHTML = products.map(p => `<option value="${p.id}">${p.name} (${p.sku})</option>`).join('');
        }
        if (warehouseSelect) {
            warehouseSelect.innerHTML = settings.warehouses.map(w => {
                const name = typeof w === 'string' ? w : w.name;
                return `<option value="${name}">${name}</option>`;
            }).join('');
        }
    },

    async renderList() {
        const list = document.getElementById('delivery-list');
        const allMovements = await Storage.getMovements();
        const movements = allMovements.filter(m => m.type === 'Delivery');
        
        if (!list) return;

        list.innerHTML = movements.length ? '' : '<tr><td colspan="7" style="text-align:center; padding: 2rem;">No delivery orders found.</td></tr>';

        movements.forEach(m => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="font-family: monospace; font-weight: 600;">${m.id}</td>
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

    async handleSubmit(e) {
        e.preventDefault();
        const productId = document.getElementById('d-product').value;
        const qty = Number(document.getElementById('d-qty').value);
        const products = await Storage.getProducts();
        const product = products.find(p => p.id === productId);
        const warehouseName = document.getElementById('d-warehouse').value;

        // Validation
        if (Number(product.stock) < qty) {
            document.getElementById('stock-error').classList.remove('hidden');
            return;
        }

        // Find warehouse code
        const warehouses = await Storage.getWarehouses();
        const warehouse = warehouses.find(w => (typeof w === 'string' ? w : w.name) === warehouseName);
        const warehouseCode = (warehouse && warehouse.code) || 'WH';

        const movement = {
            id: await Storage.getNextSequence(warehouseCode, 'Delivery'),
            type: 'Delivery',
            partner: document.getElementById('d-customer').value,
            productId: productId,
            productName: product.name,
            quantity: qty,
            location: warehouseName,
            status: 'Ready'
        };

        await Storage.saveMovement(movement);
        window.closeModal();
        await this.renderList();
        e.target.reset();
    },

    async validate(id) {
        const movements = await Storage.getMovements();
        const index = movements.findIndex(m => m.id === id);
        
        if (index !== -1) {
            const m = movements[index];
            
            // Re-check stock just in case
            const products = await Storage.getProducts();
            const pIndex = products.findIndex(p => p.id === m.productId);
            
            if (pIndex !== -1 && Number(products[pIndex].stock) >= m.quantity) {
                products[pIndex].stock = Number(products[pIndex].stock) - m.quantity;
                await Storage.saveProduct(products[pIndex]);
                
                m.status = 'Done';
                await Storage.saveMovement(m);
                await this.renderList();
            } else {
                alert("Insufficient stock available to validate this delivery!");
            }
        }
    }
};

Delivery.init();
export default Delivery;
