import Storage from './storage.js';

/**
 * Receipts.js - Handles Incoming Stock Logic
 */

const Receipts = {
    async init() {
        // Attach window functions immediately
        window.openModal = () => document.getElementById('modal').classList.remove('hidden');
        window.closeModal = () => document.getElementById('modal').classList.add('hidden');
        window.validateReceipt = (id) => this.validate(id);
        window.rejectReceipt = (id) => this.reject(id);

        const savedView = localStorage.getItem('stockpilot_receipts_view');
        if (savedView) this.currentView = savedView;

        const searchInput = document.getElementById('receipt-search');
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
            console.error("Failed to initialize Receipts data:", err);
        }

        const form = document.getElementById('receipt-form');
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
        const productSelect = document.getElementById('r-product');
        const warehouseSelect = document.getElementById('r-warehouse');
        
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
        localStorage.setItem('stockpilot_receipts_view', view);
        const isList = view === 'list';
        document.getElementById('view-list-btn').style.background = isList ? 'var(--primary)' : 'transparent';
        document.getElementById('view-list-btn').style.color = isList ? 'white' : 'var(--text-muted)';
        document.getElementById('view-kanban-btn').style.background = !isList ? 'var(--primary)' : 'transparent';
        document.getElementById('view-kanban-btn').style.color = !isList ? 'white' : 'var(--text-muted)';
        this.renderList();
    },

    async renderList() {
        const container = document.getElementById('view-container');
        const allMovements = await Storage.getMovements();
        let movements = allMovements.filter(m => m.type === 'Receipt');
        
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
                            <th>Supplier</th>
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
                html += '<tr><td colspan="7" style="text-align:center; padding: 2rem;">No receipts found.</td></tr>';
            } else {
                movements.forEach(m => {
                    const statusBadge = `<span class="badge ${m.status === 'Done' ? 'badge-success' : (m.status === 'Rejected' ? 'badge-danger' : 'badge-warning')}">${m.status}</span>`;
                    const actions = `
                        <div style="display: flex; gap: 4px;">
                            ${m.status === 'Ready' ? `
                                <button class="btn btn-primary btn-sm" onclick="validateReceipt('${m.id}')">Validate</button>
                                <button class="btn btn-light btn-sm" style="color: var(--danger)" onclick="rejectReceipt('${m.id}')">Reject</button>
                            ` : ''}
                            <button class="btn btn-light btn-sm" onclick="Receipts.deleteRecord('${m.id}')" style="color: var(--danger); padding: 4px 8px;" title="Delete">
                                <i data-lucide="trash-2" style="width: 14px;"></i>
                            </button>
                        </div>
                    `;
                    html += `
                        <tr>
                            <td style="font-family: monospace; font-weight: 600;">${m.id}</td>
                            <td>${m.partner || 'Internal'}</td>
                            <td>${m.productName}</td>
                            <td>+${m.quantity}</td>
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
                html += '<div style="grid-column: 1/-1; text-align:center; padding: 2rem; color: var(--text-muted);">No receipts found.</div>';
            } else {
                // Group by status
                const statuses = ['Ready', 'Done', 'Rejected'];
                const grouped = {};
                statuses.forEach(s => grouped[s] = movements.filter(m => m.status === s));

                statuses.forEach(status => {
                    if (grouped[status].length === 0) return;
                    html += `<div style="background: var(--surface-muted); border-radius: 12px; padding: 1rem; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 1rem;">
                        <h3 style="font-size: 1rem; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: space-between; color: var(--text-main);">
                            ${status} 
                            <span class="badge ${status === 'Done' ? 'badge-success' : (status === 'Rejected' ? 'badge-danger' : 'badge-warning')}">${grouped[status].length}</span>
                        </h3>
                    `;
                    grouped[status].forEach(m => {
                        html += `
                            <div class="card" style="padding: 1rem; margin-bottom: 0; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid var(--border-color);">
                                <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                                    <span style="font-family: monospace; font-size:0.8rem; font-weight:600; color:var(--text-muted);">${m.id}</span>
                                    <span style="font-size:0.8rem; color:var(--text-muted);">${m.date}</span>
                                </div>
                                <h4 style="margin: 0 0 0.5rem 0;">${m.productName}</h4>
                                <div style="display:flex; justify-content:space-between; margin-bottom: 1rem; font-size:0.9rem;">
                                    <span><strong>Qty:</strong> +${m.quantity}</span>
                                    <span><strong>From:</strong> ${m.partner || 'Internal'}</span>
                                </div>
                                <div style="display: flex; gap: 4px; border-top: 1px solid var(--border-color); padding-top: 0.8rem;">
                                    ${m.status === 'Ready' ? `
                                        <button class="btn btn-primary btn-sm" onclick="validateReceipt('${m.id}')" style="flex:1;">Validate</button>
                                        <button class="btn btn-light btn-sm" style="color: var(--danger); flex:1;" onclick="rejectReceipt('${m.id}')">Reject</button>
                                    ` : ''}
                                    <button class="btn btn-light btn-sm" onclick="Receipts.deleteRecord('${m.id}')" style="color: var(--danger); padding: 4px 8px;" title="Delete">
                                        <i data-lucide="trash-2" style="width: 14px;"></i>
                                    </button>
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
    },

    async handleSubmit(e) {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Validating...';
        }

        try {
            const productId = document.getElementById('r-product').value;
            const products = await Storage.getProducts();
            const product = products.find(p => p.id === productId);
            if (!product) throw new Error("Please select a valid product.");

            const warehouseName = document.getElementById('r-warehouse').value;
            const warehouses = await Storage.getWarehouses();
            const warehouse = warehouses.find(w => (typeof w === 'string' ? w : w.name) === warehouseName);
            const warehouseCode = (warehouse && warehouse.code) || 'WH';

            const movement = {
                id: await Storage.getNextSequence(warehouseCode, 'Receipt'),
                type: 'Receipt',
                partner: document.getElementById('r-supplier').value,
                productId: productId,
                productName: product.name,
                quantity: Number(document.getElementById('r-qty').value),
                location: warehouseName,
                status: 'Ready'
            };

            await Storage.saveMovement(movement);
            window.closeModal();
            await this.renderList();
            e.target.reset();
        } catch (err) {
            console.error("Manual receipt creation error:", err);
            alert("Receipt failed: " + err.message);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Draft';
            }
        }
    },


    async validate(id) {
        const movements = await Storage.getMovements();
        const index = movements.findIndex(m => m.id === id);
        
        if (index !== -1) {
            const m = movements[index];
            m.status = 'Done';
            
            // Update physical stock
            const products = await Storage.getProducts();
            const pIndex = products.findIndex(p => p.id === m.productId);
            if (pIndex !== -1) {
                products[pIndex].stock = Number(products[pIndex].stock) + m.quantity;
                await Storage.saveProduct(products[pIndex]);
            }

            await Storage.saveMovement(m);
            await this.renderList();
        }
    },

    async reject(id) {
        window.App.confirm(
            "Reject Receipt",
            "Are you sure you want to reject this receipt? This will move it to Rejected status and no stock will be added.",
            async () => {
                const movements = await Storage.getMovements();
                const m = movements.find(move => move.id === id);
                if (m) {
                    m.status = 'Rejected';
                    await Storage.saveMovement(m);
                    await this.renderList();
                }
            }
        );
    },

    async deleteRecord(id) {
        if (!confirm('Are you sure you want to permanently delete this receipt record?')) return;
        try {
            await Storage.deleteMovement(id);
            await this.renderList();
        } catch (err) {
            alert('Failed to delete: ' + err.message);
        }
    }
};

Receipts.init();
window.Receipts = Receipts;
export default Receipts;
