import Storage from './storage.js';

/**
 * Products.js - Production-ready CRUD for Inventory Catalog
 */

const Products = {
    async init() {
        // Attach window functions immediately to prevent "not a function" errors
        window.openModal = () => document.getElementById('modal').classList.remove('hidden');
        window.closeModal = () => document.getElementById('modal').classList.add('hidden');
        window.deleteProduct = (id) => this.delete(id);
        window.editProduct = (id) => this.edit(id);
        window.openCategoryModal = () => document.getElementById('category-modal').classList.remove('hidden');
        window.closeCategoryModal = () => document.getElementById('category-modal').classList.add('hidden');
        window.deleteCategory = (name) => this.deleteCat(name);
        window.renderProductsList = () => this.renderList();


        try {
            await this.renderList();
            await this.populateSettings();
        } catch (err) {
            console.error("Failed to initialize Products data:", err);
            // Non-blocking: UI still works but list might be empty or show error
        }

        const form = document.getElementById('product-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        const catForm = document.getElementById('category-form');
        if (catForm) {
            catForm.addEventListener('submit', (e) => this.handleCategorySubmit(e));
        }
        await this.populateSettings();

        // Final fallback: if auth resolves late, re-render
        window.addEventListener('auth-ready', () => {
            this.renderList();
            this.populateSettings();
        });
    },

    async populateSettings() {
        const catSelect = document.getElementById('p-category');
        const locSelect = document.getElementById('p-location');
        const settings = await Storage.getSettings();

        if (catSelect) catSelect.innerHTML = settings.categories.map(c => `<option value="${c}">${c}</option>`).join('');
        if (locSelect) {
            locSelect.innerHTML = settings.warehouses.map(w => {
                const name = typeof w === 'string' ? w : w.name;
                const prefix = (typeof w !== 'string' && w.parent) ? '↳ ' : '';
                return `<option value="${name}">${prefix}${name}</option>`;
            }).join('');
        }
        await this.renderCategoryList();
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
                    <div style="display: flex; flex-direction: column; gap: 2px;">
                        <div>
                            <span style="font-weight: 700;">${p.stock}</span> 
                            <span style="font-size: 0.75rem; color: var(--text-muted)">${p.unit || 'Units'}</span>
                            <span class="badge ${lowText === 'IN STOCK' ? 'badge-success' : (lowText === 'LOW STOCK' ? 'badge-warning' : 'badge-danger')}" style="margin-left: 0.5rem;">${lowText}</span>
                        </div>
                        ${Number(p.reserved) > 0 ? `<div style="font-size: 0.7rem; color: var(--text-muted)">Reserved: ${p.reserved} | Avail: ${p.stock - p.reserved}</div>` : ''}
                    </div>
                </td>
                <td>${p.warehouse || p.location || '-'}</td>
                <td>
                    <div style="display: flex; gap: 4px;">
                        <button class="btn btn-light btn-sm" onclick="editProduct('${p.id}')"><i data-lucide="edit-2" style="width: 14px;"></i></button>
                        <button class="btn btn-light btn-sm" style="color: var(--danger)" onclick="deleteProduct('${p.id}')"><i data-lucide="trash-2" style="width: 14px;"></i></button>
                    </div>
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

    async handleCategorySubmit(e) {
        e.preventDefault();
        const name = document.getElementById('cat-name').value;
        const settings = await Storage.getSettings();
        if (!settings.categories.includes(name)) {
            settings.categories.push(name);
            await Storage.saveSettings(settings);
            await this.populateSettings();
            e.target.reset();
        }
    },

    async renderCategoryList() {
        const list = document.getElementById('category-list');
        if (!list) return;
        const settings = await Storage.getSettings();
        list.innerHTML = settings.categories.map(c => `
            <div class="flex-between mb-2" style="padding: 0.5rem; background: var(--surface-muted); border-radius: 4px; border: 1px solid var(--border-color);">
                <span>${c}</span>
                <button class="btn btn-light btn-sm" style="color: var(--danger)" onclick="deleteCategory('${c}')"><i data-lucide="x" style="width: 14px;"></i></button>
            </div>
        `).join('');
        if (window.lucide) window.lucide.createIcons();
    },

    async deleteCat(name) {
        window.App.confirm(
            "Delete Category",
            `Are you sure you want to remove the category "${name}"?`,
            async () => {
                const settings = await Storage.getSettings();
                settings.categories = settings.categories.filter(c => c !== name);
                await Storage.saveSettings(settings);
                await this.populateSettings();
            }
        );
    },


    async delete(id) {
        window.App.confirm(
            "Delete Product",
            "Are you sure you want to delete this product? This action cannot be undone.",
            async () => {
                await Storage.deleteProduct(id);
                await this.renderList();
            }
        );
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

// Products.init();
export default Products;
