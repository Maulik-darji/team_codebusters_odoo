import Storage from './storage.js';

/**
 * Transfers.js - Handles Internal Stock Movement Logic
 */

const Transfers = {
    async init() {
        // Attach window functions immediately
        window.openModal = () => document.getElementById('modal').classList.remove('hidden');
        window.closeModal = () => {
            document.getElementById('modal').classList.add('hidden');
            document.getElementById('stock-error').classList.add('hidden');
        };
        window.validateTransfer = (id) => this.validate(id);

        try {
            await this.renderList();
            await this.populateDropdowns();
        } catch (err) {
            console.error("Failed to initialize Transfers data:", err);
        }

        const form = document.getElementById('transfer-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Re-render if auth resolves late
        window.addEventListener('auth-ready', () => {
            this.renderList();
            this.populateDropdowns();
        });
    },

    async populateDropdowns() {
        const productSelect = document.getElementById('t-product');
        const sourceSelect = document.getElementById('t-source');
        const destSelect = document.getElementById('t-dest');
        
        const products = await Storage.getProducts();
        const settings = await Storage.getSettings();

        if (productSelect) {
            productSelect.innerHTML = products.map(p => `<option value="${p.id}">${p.name} (${p.sku})</option>`).join('');
        }
        const warehouseOptions = settings.warehouses.map(w => {
            const name = typeof w === 'string' ? w : w.name;
            const prefix = (typeof w !== 'string' && w.parent) ? '↳ ' : '';
            return `<option value="${name}">${prefix}${name}</option>`;
        }).join('');
        if (sourceSelect) sourceSelect.innerHTML = warehouseOptions;
        if (destSelect) destSelect.innerHTML = warehouseOptions;
    },

    async renderList() {
        const list = document.getElementById('transfer-list');
        const allMovements = await Storage.getMovements();
        const movements = allMovements.filter(m => m.type === 'Transfer');
        
        if (!list) return;

        list.innerHTML = movements.length ? '' : '<tr><td colspan="8" style="text-align:center; padding: 2rem;">No transfers found.</td></tr>';

        movements.forEach(m => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="font-family: monospace; font-weight: 600;">${m.id}</td>
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

    async handleSubmit(e) {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Saving...';
        }

        try {
            const productId = document.getElementById('t-product').value;
            const qty = Number(document.getElementById('t-qty').value);
            const sourceName = document.getElementById('t-source').value;
            const destName = document.getElementById('t-dest').value;

            if (sourceName === destName) {
                alert("Source and destination cannot be the same!");
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Create Transfer';
                }
                return;
            }

            const products = await Storage.getProducts();
            const product = products.find(p => p.id === productId);
            if (!product) throw new Error("Please select a valid product.");

            // Simple validation (can be more complex by per-location stock)
            if (Number(product.stock) < qty) {
                document.getElementById('stock-error').classList.remove('hidden');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Create Transfer';
                }
                return;
            }

            // Find warehouse code (from source)
            const warehouses = await Storage.getWarehouses();
            const warehouse = warehouses.find(w => (typeof w === 'string' ? w : w.name) === sourceName);
            const warehouseCode = (warehouse && warehouse.code) || 'WH';

            const movement = {
                id: await Storage.getNextSequence(warehouseCode, 'Transfer'),
                type: 'Transfer',
                productId: productId,
                productName: product.name,
                quantity: qty,
                source: sourceName,
                location: destName, // "location" is destination for transfers
                status: 'Ready'
            };

            await Storage.saveMovement(movement);
            window.closeModal();
            await this.renderList();
            e.target.reset();
        } catch (err) {
            console.error("Manual transfer error:", err);
            alert("Transfer failed: " + err.message);
        } finally {
            if (submitBtn && submitBtn.textContent === 'Saving...') {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Transfer';
            }
        }
    },


    async validate(id) {
        const movements = await Storage.getMovements();
        const index = movements.findIndex(m => m.id === id);
        
        if (index !== -1) {
            const m = movements[index];
            m.status = 'Done';
            await Storage.saveMovement(m);
            await this.renderList();
        }
    }
};

// Transfers.init();
export default Transfers;
