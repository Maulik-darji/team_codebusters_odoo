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

        const pendingReceipts = movements.filter(m => m.type === 'Receipt' && m.status !== 'Done').length;
        const pendingDeliveries = movements.filter(m => m.type === 'Delivery' && m.status !== 'Done').length;
        const scheduledTransfers = movements.filter(m => m.type === 'Transfer' && m.status !== 'Done').length;

        // UI Injection
        if (document.getElementById('kpi-total-stock')) document.getElementById('kpi-total-stock').textContent = totalStock.toLocaleString();
        if (document.getElementById('kpi-low-stock')) document.getElementById('kpi-low-stock').textContent = lowStock;
        if (document.getElementById('kpi-out-stock')) document.getElementById('kpi-out-stock').textContent = outStock;
        if (document.getElementById('kpi-pending-receipts')) document.getElementById('kpi-pending-receipts').textContent = pendingReceipts;
        if (document.getElementById('kpi-pending-delivery')) document.getElementById('kpi-pending-delivery').textContent = pendingDeliveries;
        if (document.getElementById('kpi-scheduled-transfers')) document.getElementById('kpi-scheduled-transfers').textContent = scheduledTransfers;
    },

    async renderLedger() {
        const list = document.getElementById('recent-movements');
        const allMovements = await Storage.getMovements();
        const movements = allMovements.slice(0, 5); // Latest 5

        if (!list) return;

        list.innerHTML = movements.length ? '' : '<tr><td colspan="8" style="text-align:center; padding: 1.5rem;">No recent movements.</td></tr>';

        movements.forEach(m => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${m.date}</td>
                <td style="font-family: monospace; font-size: 0.75rem;">${m.id}</td>
                <td><strong style="font-size: 0.75rem;">${m.type}</strong></td>
                <td>${m.productName}</td>
                <td style="font-weight: 700;">${m.quantity > 0 ? '+' : ''}${m.quantity}</td>
                <td>${m.location || m.source}</td>
                <td><span class="badge ${m.status === 'Done' ? 'badge-success' : 'badge-warning'}">${m.status}</span></td>
            `;
            list.appendChild(row);
        });
    }
};

Dashboard.init();
export default Dashboard;
