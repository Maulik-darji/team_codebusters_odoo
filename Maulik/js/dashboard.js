import Storage from './storage.js';

/**
 * Dashboard.js - Real-time Analytics Engine
 */

const Dashboard = {
    async init() {
        await this.renderStats();
        await this.renderLedger();
        await this.populateWarehouseFilter();

        document.getElementById('warehouse-filter')?.addEventListener('change', () => this.renderStats());
        document.getElementById('status-filter')?.addEventListener('change', () => this.renderLedger());

        // Re-render if auth resolves late
        window.addEventListener('auth-ready', () => {
            this.renderStats();
            this.renderLedger();
            this.populateWarehouseFilter();
        });
    },

    async populateWarehouseFilter() {
        const filter = document.getElementById('warehouse-filter');
        const warehouses = await Storage.getWarehouses();
        if (filter && warehouses) {
            filter.innerHTML = '<option value="all">All Warehouses</option>' + warehouses.map(w => {
                const name = typeof w === 'string' ? w : w.name;
                return `<option value="${name}">${name}</option>`;
            }).join('');
        }
    },

    async renderStats() {
        const filterWarehouse = document.getElementById('warehouse-filter')?.value || 'all';
        const products = await Storage.getProducts();
        const movements = await Storage.getMovements();

        // Analytical calculations
        const filteredProducts = filterWarehouse === 'all' 
            ? products 
            : products.filter(p => p.warehouse === filterWarehouse);

        const totalStock = filteredProducts.reduce((acc, p) => acc + Number(p.stock), 0);
        const lowStock = filteredProducts.filter(p => Number(p.stock) > 0 && Number(p.stock) <= Number(p.reorderLevel)).length;
        const outStock = filteredProducts.filter(p => Number(p.stock) <= 0).length;

        const pendingReceipts = movements.filter(m => m.type === 'Receipt' && m.status === 'Ready').length;
        const pendingDeliveries = movements.filter(m => m.type === 'Delivery' && m.status === 'Ready').length;
        const scheduledTransfers = movements.filter(m => m.type === 'Transfer' && m.status === 'Ready').length;

        const acceptedReceipts = movements.filter(m => m.type === 'Receipt' && m.status === 'Done').length;
        const rejectedReceipts = movements.filter(m => m.type === 'Receipt' && m.status === 'Rejected').length;

        // UI Injection
        if (document.getElementById('kpi-total-stock')) document.getElementById('kpi-total-stock').textContent = totalStock.toLocaleString();
        if (document.getElementById('kpi-low-stock')) document.getElementById('kpi-low-stock').textContent = lowStock;
        if (document.getElementById('kpi-out-stock')) document.getElementById('kpi-out-stock').textContent = outStock;
        if (document.getElementById('kpi-pending-receipts')) document.getElementById('kpi-pending-receipts').textContent = pendingReceipts;
        if (document.getElementById('kpi-pending-delivery')) document.getElementById('kpi-pending-delivery').textContent = pendingDeliveries;
        if (document.getElementById('kpi-scheduled-transfers')) document.getElementById('kpi-scheduled-transfers').textContent = scheduledTransfers;
        if (document.getElementById('kpi-accepted-receipts')) document.getElementById('kpi-accepted-receipts').textContent = acceptedReceipts;
        if (document.getElementById('kpi-rejected-receipts')) document.getElementById('kpi-rejected-receipts').textContent = rejectedReceipts;
    },

    async renderLedger() {
        const list = document.getElementById('recent-movements');
        const statusFilter = document.getElementById('status-filter')?.value || 'all';
        let movements = await Storage.getMovements();
        
        if (statusFilter !== 'all') {
            movements = movements.filter(m => m.status === statusFilter);
        }

        movements = movements.slice(0, 10); // Show up to 10 latest

        if (!list) return;

        list.innerHTML = movements.length ? '' : '<tr><td colspan="8" style="text-align:center; padding: 1.5rem;">No recent movements.</td></tr>';

        movements.forEach(m => {
            const qty = m.quantity !== undefined ? m.quantity : (m.qty !== undefined ? m.qty : '—');
            const qtyDisplay = typeof qty === 'number' ? (qty > 0 ? `+${qty}` : qty) : qty;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${m.date}</td>
                <td style="font-family: monospace; font-size: 0.75rem;">${m.id}</td>
                <td><strong style="font-size: 0.75rem;">${m.type}</strong></td>
                <td>${m.productName}</td>
                <td style="font-weight: 700;">${qtyDisplay}</td>
                <td>${m.location || m.source || '—'}</td>
                <td><span class="badge ${m.status === 'Done' ? 'badge-success' : (m.status === 'Rejected' ? 'badge-danger' : 'badge-warning')}">${m.status}</span></td>
                <td>
                    <button class="btn btn-light btn-sm" onclick="Dashboard.deleteRecord('${m.id}')" style="color: var(--danger); padding: 3px 6px;" title="Delete">
                        <i data-lucide="trash-2" style="width:13px; height:13px;"></i>
                    </button>
                </td>
            `;
            list.appendChild(row);
        });
        if (window.lucide) lucide.createIcons();
    },

    async deleteRecord(id) {
        if (!confirm('Delete this movement record?')) return;
        try {
            await Storage.deleteMovement(id);
            await this.renderLedger();
            await this.renderStats();
        } catch (err) {
            alert('Failed to delete: ' + err.message);
        }
    },

    async deleteAll() {
        if (!confirm('Delete ALL movement records shown? This cannot be undone.')) return;
        try {
            const movements = await Storage.getMovements();
            await Promise.all(movements.map(m => Storage.deleteMovement(m.id)));
            await this.renderLedger();
            await this.renderStats();
        } catch (err) {
            alert('Failed to delete all: ' + err.message);
        }
    }
};

Dashboard.init();
window.Dashboard = Dashboard;
export default Dashboard;
