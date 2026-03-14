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
        window.nextStage = (id, stage) => this.updateStage(id, stage);

        const savedView = localStorage.getItem('stockpilot_delivery_view');
        if (savedView) this.currentView = savedView;

        const searchInput = document.getElementById('delivery-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.renderList();
            });
        }

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

        // Re-render if auth resolves late
        window.addEventListener('auth-ready', () => {
            this.renderList();
            this.populateDropdowns();
        });
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
                const prefix = (typeof w !== 'string' && w.parent) ? '↳ ' : '';
                return `<option value="${name}">${prefix}${name}</option>`;
            }).join('');
        }
    },

    searchTerm: '',
    currentView: 'list',

    setView(view) {
        this.currentView = view;
        localStorage.setItem('stockpilot_delivery_view', view);
        document.getElementById('view-list-btn').style.background = view === 'list' ? 'var(--primary)' : 'transparent';
        document.getElementById('view-list-btn').style.color = view === 'list' ? 'white' : 'inherit';
        document.getElementById('view-kanban-btn').style.background = view === 'kanban' ? 'var(--primary)' : 'transparent';
        document.getElementById('view-kanban-btn').style.color = view === 'kanban' ? 'white' : 'inherit';
        this.renderList();
    },

    async renderList() {
        const container = document.getElementById('view-container');
        const allMovements = await Storage.getMovements();
        let movements = allMovements.filter(m => m.type === 'Delivery');
        
        if (this.searchTerm) {
            movements = movements.filter(m => {
                const ref = m.id ? m.id.toLowerCase() : '';
                const partner = m.partner ? m.partner.toLowerCase() : '';
                return ref.includes(this.searchTerm) || partner.includes(this.searchTerm);
            });
        }
        
        if (!container) return;

        if (this.currentView === 'list') {
            let html = `
                <table>
                    <thead>
                        <tr>
                            <th>Ref</th>
                            <th>Customer</th>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            if (movements.length === 0) {
                html += '<tr><td colspan="7" style="text-align:center; padding: 2rem;">No delivery orders found.</td></tr>';
            } else {
                movements.forEach(m => {
                    const statusBadge = `<span class="badge ${m.status === 'Done' ? 'badge-success' : (['Picking', 'Packing'].includes(m.status) ? 'badge-info' : 'badge-warning')}">${m.status}</span>`;
                    let actions = '<div style="display: flex; gap: 4px;">';
                    
                    if (m.status === 'Ready') actions += `<button class="btn btn-secondary btn-sm" onclick="nextStage('${m.id}', 'Picking')">Pick</button>`;
                    else if (m.status === 'Picking') actions += `<button class="btn btn-secondary btn-sm" onclick="nextStage('${m.id}', 'Packing')">Pack</button>`;
                    else if (m.status === 'Packing') actions += `<button class="btn btn-primary btn-sm" onclick="validateDelivery('${m.id}')">Validate</button>`;
                    
                    actions += `<button class="btn btn-light btn-sm" onclick="Delivery.deleteRecord('${m.id}')" style="color: var(--danger); padding: 4px 8px;" title="Delete"><i data-lucide="trash-2" style="width: 14px;"></i></button></div>`;

                    html += `
                        <tr>
                            <td style="font-family: monospace; font-weight: 600;">${m.id}</td>
                            <td>${m.partner || 'Customer'}</td>
                            <td>${m.productName}</td>
                            <td>-${m.quantity}</td>
                            <td>${m.date}</td>
                            <td>${statusBadge}</td>
                            <td>${actions}</td>
                        </tr>
                    `;
                });
            }
            html += `</tbody></table>`;
            container.innerHTML = html;
        } else {
            // Kanban View
            let html = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; padding: 1rem 0;">`;
            if (movements.length === 0) {
                html += '<div style="grid-column: 1/-1; text-align:center; padding: 2rem; color: var(--text-muted);">No delivery orders found.</div>';
            } else {
                const statuses = ['Ready', 'Picking', 'Packing', 'Done'];
                const grouped = {};
                statuses.forEach(s => grouped[s] = movements.filter(m => m.status === s));

                statuses.forEach(status => {
                    if (grouped[status].length === 0) return;
                    html += `<div style="background: var(--bg-color, #f9fafb); border-radius: 12px; padding: 1rem; display: flex; flex-direction: column; gap: 1rem;">
                        <h3 style="font-size: 1rem; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: space-between;">
                            ${status} 
                            <span class="badge ${status === 'Done' ? 'badge-success' : (['Picking', 'Packing'].includes(status) ? 'badge-info' : 'badge-warning')}">${grouped[status].length}</span>
                        </h3>
                    `;
                    grouped[status].forEach(m => {
                        let actionBtns = '';
                        if (m.status === 'Ready') actionBtns = `<button class="btn btn-secondary btn-sm" onclick="nextStage('${m.id}', 'Picking')" style="flex:1;">Pick</button>`;
                        else if (m.status === 'Picking') actionBtns = `<button class="btn btn-secondary btn-sm" onclick="nextStage('${m.id}', 'Packing')" style="flex:1;">Pack</button>`;
                        else if (m.status === 'Packing') actionBtns = `<button class="btn btn-primary btn-sm" onclick="validateDelivery('${m.id}')" style="flex:1;">Validate</button>`;
                        
                        actionBtns += `<button class="btn btn-light btn-sm" onclick="Delivery.deleteRecord('${m.id}')" style="color: var(--danger); padding: 4px 8px; flex:0;" title="Delete"><i data-lucide="trash-2" style="width: 14px;"></i></button>`;

                        html += `
                            <div class="card" style="padding: 1rem; margin-bottom: 0; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid var(--border-color);">
                                <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                                    <span style="font-family: monospace; font-size:0.8rem; font-weight:600; color:var(--text-muted);">${m.id}</span>
                                    <span style="font-size:0.8rem; color:var(--text-muted);">${m.date}</span>
                                </div>
                                <h4 style="margin: 0 0 0.5rem 0;">${m.productName}</h4>
                                <div style="display:flex; justify-content:space-between; margin-bottom: 1rem; font-size:0.9rem;">
                                    <span><strong>Qty:</strong> -${m.quantity}</span>
                                    <span><strong>To:</strong> ${m.partner || 'Customer'}</span>
                                </div>
                                <div style="display: flex; gap: 4px; border-top: 1px solid var(--border-color); padding-top: 0.8rem;">
                                    ${actionBtns}
                                </div>
                            </div>
                        `;
                    });
                    html += `</div>`;
                });
            }
            html += `</div>`;
            container.innerHTML = html;
        }

        if (window.lucide) lucide.createIcons();
    },    async handleSubmit(e) {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating...';
        }

        try {
            const productId = document.getElementById('d-product').value;
            const qty = Number(document.getElementById('d-qty').value);
            const products = await Storage.getProducts();
            const product = products.find(p => p.id === productId);
            if (!product) throw new Error("Please select a valid product.");

            const warehouseName = document.getElementById('d-warehouse').value;

            // Validation
            if (Number(product.stock) < qty) {
                document.getElementById('stock-error').classList.remove('hidden');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Create Delivery';
                }
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

            // Reserve stock immediately
            product.reserved = (Number(product.reserved) || 0) + qty;
            await Storage.saveProduct(product);

            await Storage.saveMovement(movement);
            window.closeModal();
            await this.renderList();
            e.target.reset();
        } catch (err) {
            console.error("Manual delivery creation error:", err);
            alert("Delivery failed: " + err.message);
        } finally {
            if (submitBtn && submitBtn.textContent === 'Creating...') {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Delivery';
            }
        }
    },


    async updateStage(id, stage) {
        const movements = await Storage.getMovements();
        const m = movements.find(move => move.id === id);
        if (m) {
            m.status = stage;
            await Storage.saveMovement(m);
            await this.renderList();
        }
    },

    async validate(id) {
        const movements = await Storage.getMovements();
        const m = movements.find(move => move.id === id);
        
        if (m && m.status !== 'Done') {
            const products = await Storage.getProducts();
            const p = products.find(prod => prod.id === m.productId);
            
            if (p) {
                // Finalize: reduce physical stock and release reservation
                const qty = Number(m.quantity);
                p.stock = Number(p.stock) - qty;
                p.reserved = Math.max(0, (Number(p.reserved) || 0) - qty);
                
                await Storage.saveProduct(p);
                m.status = 'Done';
                await Storage.saveMovement(m);
                await this.renderList();
            }
        }
    },

    async deleteRecord(id) {
        if (!confirm('Are you sure you want to permanently delete this delivery record?')) return;
        try {
            await Storage.deleteMovement(id);
            await this.renderList();
        } catch (err) {
            alert('Failed to delete: ' + err.message);
        }
    }

};

Delivery.init();
window.Delivery = Delivery;
export default Delivery;
