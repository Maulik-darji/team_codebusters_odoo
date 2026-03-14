import Storage from './storage.js';

/**
 * History.js - Handles Move History Filtering and Rendering
 */

const History = {
    async init() {
        // Attach filter listener
        const filterBtn = document.getElementById('apply-filter');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => this.renderHistory());
        }
        await this.renderHistory();

        // Re-render if auth resolves late
        window.addEventListener('auth-ready', () => this.renderHistory());
    },

    async renderHistory() {
        try {
            const list = document.getElementById('history-list');
            if (!list) return;

            const startDate = document.getElementById('start-date')?.value;
            const endDate = document.getElementById('end-date')?.value;
            const typeFilter = document.getElementById('type-filter')?.value;
            
            let movements = await Storage.getMovements();
            
            // Filtering logic
            if (startDate || endDate || typeFilter) {
                const start = startDate ? new Date(startDate) : null;
                const end = endDate ? new Date(endDate) : null;
                if (start) start.setHours(0,0,0,0);
                if (end) end.setHours(23,59,59,999);

                movements = movements.filter(m => {
                    const mDate = new Date(m.date);
                    const matchesDate = (!start || mDate >= start) && (!end || mDate <= end);
                    const matchesType = !typeFilter || m.type === typeFilter;
                    return matchesDate && matchesType;
                });
            }

            list.innerHTML = movements.length ? '' : '<tr><td colspan="8" style="text-align:center; padding: 2.5rem;">No history records found.</td></tr>';

            movements.forEach(m => {
                const row = document.createElement('tr');
                const typeColor = {
                    'Receipt': 'var(--success)',
                    'Delivery': 'var(--primary)',
                    'Transfer': 'var(--info)',
                    'Adjustment': 'var(--warning)'
                }[m.type] || 'black';

                row.innerHTML = `
                    <td>${m.date}</td>
                    <td style="font-family: monospace; font-size: 0.85rem; font-weight: 600;">${m.id}</td>
                    <td style="color: ${typeColor}; font-weight: 700;">${m.type}</td>
                    <td style="font-weight: 600;">${m.productName}</td>
                    <td style="font-weight: 700;">${m.quantity > 0 ? '+' : ''}${m.quantity}</td>
                    <td>${m.location}</td>
                    <td>${m.partner || '-'}</td>
                    <td><span class="badge ${m.status === 'Done' ? 'badge-success' : 'badge-warning'}">${m.status}</span></td>
                `;
                list.appendChild(row);
            });
        } catch (err) {
            console.error("History display error:", err);
        }
    }
};

History.init();
export default History;
