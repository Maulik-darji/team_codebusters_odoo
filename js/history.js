import Storage from './storage.js';

/**
 * History.js - Handles Move History Filtering, Rendering, and Deletion
 */

const REMEMBER_KEY = 'stockpilot_skip_delete_confirm';

const History = {
    async init() {
        const filterBtn = document.getElementById('apply-filter');
        if (filterBtn) filterBtn.addEventListener('click', () => this.renderHistory());
        
        // Auto-filter on change
        ['start-date', 'end-date', 'type-filter'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', () => this.renderHistory());
        });

        await this.renderHistory();
        window.addEventListener('auth-ready', () => this.renderHistory());

        // Wire up modal buttons
        document.getElementById('delete-cancel-btn')?.addEventListener('click', () => this.closeModal());
        document.getElementById('delete-confirm-btn')?.addEventListener('click', () => this._onModalConfirm());

        const savedView = localStorage.getItem('stockpilot_history_view');
        if (savedView) this.currentView = savedView;
    },

    currentView: 'list',

    setView(view) {
        this.currentView = view;
        localStorage.setItem('stockpilot_history_view', view);
        const isList = view === 'list';
        document.getElementById('view-list-btn').style.background = isList ? 'var(--primary)' : 'transparent';
        document.getElementById('view-list-btn').style.color = isList ? 'white' : 'var(--text-muted)';
        document.getElementById('view-kanban-btn').style.background = !isList ? 'var(--primary)' : 'transparent';
        document.getElementById('view-kanban-btn').style.color = !isList ? 'white' : 'var(--text-muted)';
        this.renderHistory();
    },

    _pendingDeleteId: null,
    _pendingDeleteAll: false,

    openModal(title, msg) {
        const overlay = document.getElementById('delete-confirm-overlay');
        if (!overlay) return;
        document.getElementById('delete-modal-title').textContent = title;
        document.getElementById('delete-modal-msg').textContent = msg;
        document.getElementById('delete-remember-cb').checked = false;
        overlay.style.display = 'flex';
        if (window.lucide) lucide.createIcons();
    },

    closeModal() {
        const overlay = document.getElementById('delete-confirm-overlay');
        if (overlay) overlay.style.display = 'none';
        this._pendingDeleteId = null;
        this._pendingDeleteAll = false;
    },

    async _onModalConfirm() {
        const remember = document.getElementById('delete-remember-cb')?.checked;
        if (remember) localStorage.setItem(REMEMBER_KEY, '1');
        this.closeModal();

        if (this._pendingDeleteAll) {
            await this._doDeleteAll();
        } else if (this._pendingDeleteId) {
            await this._doDeleteOne(this._pendingDeleteId);
        }
    },

    async deleteRecord(id) {
        if (localStorage.getItem(REMEMBER_KEY) === '1') {
            await this._doDeleteOne(id);
            return;
        }
        this._pendingDeleteId = id;
        this._pendingDeleteAll = false;
        this.openModal('Delete Record', 'Are you sure you want to permanently delete this history record? This cannot be undone.');
    },

    async deleteAll() {
        if (localStorage.getItem(REMEMBER_KEY) === '1') {
            await this._doDeleteAll();
            return;
        }
        this._pendingDeleteAll = true;
        this._pendingDeleteId = null;
        this.openModal('Delete All Records', 'Are you sure you want to permanently delete ALL movement history records? This cannot be undone.');
    },

    async _doDeleteOne(id) {
        try {
            await Storage.deleteMovement(id);
            await this.renderHistory();
        } catch (err) {
            alert('Failed to delete: ' + err.message);
        }
    },

    async _doDeleteAll() {
        try {
            const movements = await Storage.getMovements();
            await Promise.all(movements.map(m => Storage.deleteMovement(m.id)));
            await this.renderHistory();
        } catch (err) {
            alert('Failed to delete all: ' + err.message);
        }
    },

    async renderHistory() {
        try {
            const container = document.getElementById('view-container');
            if (!container) return;

            const startDate = document.getElementById('start-date')?.value;
            const endDate = document.getElementById('end-date')?.value;
            const typeFilter = document.getElementById('type-filter')?.value;

            let movements = await Storage.getMovements();

            if (startDate || endDate || typeFilter) {
                const start = startDate ? new Date(startDate) : null;
                const end = endDate ? new Date(endDate) : null;
                if (start) start.setHours(0, 0, 0, 0);
                if (end) end.setHours(23, 59, 59, 999);
                movements = movements.filter(m => {
                    const mDate = new Date(m.date);
                    const matchesDate = (!start || mDate >= start) && (!end || mDate <= end);
                    const matchesType = !typeFilter || m.type.toLowerCase() === typeFilter.toLowerCase();
                    return matchesDate && matchesType;
                });
            }

            const typeColors = {
                'Receipt': 'var(--success)',
                'Delivery': 'var(--primary)',
                'Transfer': 'var(--info)',
                'Adjustment': 'var(--warning)'
            };

            if (this.currentView === 'list') {
                let html = `
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Ref</th>
                                <th>Type</th>
                                <th>Product</th>
                                <th>Qty Change</th>
                                <th>Location</th>
                                <th>Partner</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                if (movements.length === 0) {
                    html += '<tr><td colspan="9" style="text-align:center; padding: 2.5rem;">No history records found.</td></tr>';
                } else {
                    movements.forEach(m => {
                        const qty = m.quantity !== undefined ? m.quantity : (m.qty !== undefined ? m.qty : '—');
                        const qtyDisplay = typeof qty === 'number' ? (qty > 0 ? `+${qty}` : qty) : qty;
                        const typeColor = typeColors[m.type] || 'inherit';
                        const statusBadge = `<span class="badge ${m.status === 'Done' ? 'badge-success' : (m.status === 'Rejected' ? 'badge-danger' : 'badge-warning')}">${m.status}</span>`;
                        html += `
                            <tr>
                                <td>${m.date}</td>
                                <td style="font-family: monospace; font-size: 0.85rem; font-weight: 600;">${m.id}</td>
                                <td style="color: ${typeColor}; font-weight: 700;">${m.type}</td>
                                <td style="font-weight: 600;">${m.productName}</td>
                                <td style="font-weight: 700;">${qtyDisplay}</td>
                                <td>${m.location || '—'}</td>
                                <td>${m.partner || '—'}</td>
                                <td>${statusBadge}</td>
                                <td>
                                    <button class="btn btn-light btn-sm" onclick="History.deleteRecord('${m.id}')" style="color: var(--danger); padding: 4px 8px;" title="Delete">
                                        <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
                                    </button>
                                </td>
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
                    html += '<div style="grid-column: 1/-1; text-align:center; padding: 2rem; color: var(--text-muted);">No history records found.</div>';
                } else {
                    // Group by type for history kanban
                    const types = ['Receipt', 'Delivery', 'Transfer', 'Adjustment'];
                    const grouped = {};
                    types.forEach(t => grouped[t] = movements.filter(m => m.type === t));

                    types.forEach(type => {
                        if (grouped[type].length === 0) return;
                        html += `<div style="background: var(--surface-muted); border-radius: 12px; padding: 1rem; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 1rem;">
                            <h3 style="font-size: 1rem; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: space-between; color: ${typeColors[type]}">
                                ${type} 
                                <span class="badge" style="background: ${typeColors[type]}; color: white;">${grouped[type].length}</span>
                            </h3>
                        `;
                        grouped[type].forEach(m => {
                            const qty = m.quantity !== undefined ? m.quantity : (m.qty !== undefined ? m.qty : '—');
                            const qtyDisplay = typeof qty === 'number' ? (qty > 0 ? `+${qty}` : qty) : qty;
                            const statusBadge = `<span class="badge ${m.status === 'Done' ? 'badge-success' : (m.status === 'Rejected' ? 'badge-danger' : 'badge-warning')}">${m.status}</span>`;
                            html += `
                                <div class="card" style="padding: 1rem; margin-bottom: 0; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid var(--border-color); border-left: 4px solid ${typeColors[type]};">
                                    <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                                        <span style="font-family: monospace; font-size:0.8rem; font-weight:600; color:var(--text-muted);">${m.id}</span>
                                        <span style="font-size:0.8rem; color:var(--text-muted);">${m.date}</span>
                                    </div>
                                    <h4 style="margin: 0 0 0.5rem 0; display:flex; justify-content:space-between;">
                                        ${m.productName}
                                        ${statusBadge}
                                    </h4>
                                    <div style="display:flex; justify-content:space-between; margin-bottom: 1rem; font-size:0.85rem;">
                                        <span><strong>Change:</strong> ${qtyDisplay}</span>
                                        <span><strong>Loc:</strong> ${m.location || m.source || '—'}</span>
                                    </div>
                                    <div style="display: flex; gap: 4px; border-top: 1px solid var(--border-color); padding-top: 0.8rem;">
                                        <div style="flex:1; font-size: 0.8rem; color: var(--text-muted);">${m.partner ? `With: ${m.partner}` : ''}</div>
                                        <button class="btn btn-light btn-sm" onclick="History.deleteRecord('${m.id}')" style="color: var(--danger); padding: 4px 8px;" title="Delete">
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
        } catch (err) {
            console.error('History display error:', err);
        }
    }
};

History.init();
window.History = History;
export default History;
