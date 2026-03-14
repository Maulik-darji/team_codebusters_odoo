import Storage from './storage.js';

/**
 * Products.js - Production-ready CRUD for Inventory Catalog
 */

const Products = {
    async init() {
        await this.renderList();
        await this.populateSettings();

        const form = document.getElementById('product-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        window.openModal = () => document.getElementById('modal').classList.remove('hidden');
        window.closeModal = () => document.getElementById('modal').classList.add('hidden');
        window.deleteProduct = (id) => this.delete(id);
        window.editProduct = (id) => this.edit(id);
    },

    async populateSettings() {
        const catSelect = document.getElementById('p-category');
        const locSelect = document.getElementById('p-location');
        const settings = await Storage.getSettings();

        if (catSelect) catSelect.innerHTML = settings.categories.map(c => `<option value="${c}">${c}</option>`).join('');
        if (locSelect) locSelect.innerHTML = settings.warehouses.map(w => {
            const name = typeof w === 'string' ? w : w.name;
            return `<option value="${name}">${name}</option>`;
        }).join('');
    },

    async renderList() {
        const list = document.getElementById('product-list');
        const products = await Storage.getProducts();
        
        if (!list) return;

        list.innerHTML = products.length ? '' : '<tr><td colspan="6" style="text-align:center; padding: 2.5rem;">No products in catalog.</td></tr>';

        products.forEach(p => {
            const isLow = Number(p.stock) <= Number(p.reorderLevel);
            const lowText = isLow && Number(p.stock) > 0 ? 'LOW STOCK' : (Number(p.stock) <= 0 ? 'OUT OF STOCK' : 'IN STOCK');

            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="font-weight: 600;">${p.name}</td>
                <td style="font-family: monospace;">${p.sku}</td>
                <td>${p.category}</td>
                <td>
                    <span style="font-weight: 700;">${p.stock}</span> 
                    <span style="font-size: 0.75rem; color: var(--text-muted)">${p.unit}</span>
                    <span class="badge ${lowText === 'IN STOCK' ? 'badge-success' : (lowText === 'LOW STOCK' ? 'badge-warning' : 'badge-danger')}" style="margin-left: 0.5rem;">${lowText}</span>
                </td>
                <td>${p.warehouse || '-'}</td>
                <td>
                    <button class="btn btn-light btn-sm" onclick="editProduct('${p.id}')"><i data-lucide="edit-2" style="width: 14px;"></i></button>
                    <button class="btn btn-light btn-sm" style="color: var(--danger)" onclick="deleteProduct('${p.id}')"><i data-lucide="trash-2" style="width: 14px;"></i></button>
                </td>
            `;
            list.appendChild(row);
        });
        
        if (window.lucide) window.lucide.createIcons();
    },

    async handleSubmit(e) {
        e.preventDefault();
        const product = {
            id: document.getElementById('p-id')?.value || null,
            name: document.getElementById('p-name').value,
            sku: document.getElementById('p-sku').value,
            category: document.getElementById('p-category').value,
            unit: document.getElementById('p-unit').value,
            stock: Number(document.getElementById('p-stock').value),
            reorderLevel: Number(document.getElementById('p-reorder').value),
            warehouse: document.getElementById('p-location').value
        };

        await Storage.saveProduct(product);
        window.closeModal();
        await this.renderList();
        e.target.reset();
        if (document.getElementById('p-id')) document.getElementById('p-id').value = '';
    },

    async delete(id) {
        if (confirm("Are you sure you want to delete this product?")) {
            await Storage.deleteProduct(id);
            await this.renderList();
        }
    },

    async edit(id) {
        const products = await Storage.getProducts();
        const product = products.find(p => p.id === id);
        if (product) {
            document.getElementById('modal-title').textContent = "Edit Product";
            document.getElementById('p-id').value = product.id;
            document.getElementById('p-name').value = product.name;
            document.getElementById('p-sku').value = product.sku;
            document.getElementById('p-category').value = product.category;
            document.getElementById('p-unit').value = product.unit;
            document.getElementById('p-stock').value = product.stock;
            document.getElementById('p-reorder').value = product.reorderLevel;
            document.getElementById('p-location').value = product.warehouse;
            window.openModal();
        }
    }
};

Products.init();
export default Products;
