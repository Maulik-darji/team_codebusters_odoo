import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import Table from '../components/Table';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { Plus, Search, Edit2, Trash2, Eye } from 'lucide-react';

const Products = () => {
  const { products, warehouses, categories, addProduct, updateProduct, deleteProduct, addCategory, deleteCategory } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [newCatName, setNewCatName] = useState('');
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '', 
    sku: '', 
    category: categories[0] || '', 
    unit: 'Pieces', 
    stock: 0, 
    location: warehouses[0] || '', 
    reorderLevel: 10
  });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingId(product.id);
      setFormData(product);
    } else {
      setEditingId(null);
      setFormData({ 
        name: '', 
        sku: '', 
        category: categories[0] || '', 
        unit: 'Pieces', 
        stock: 0, 
        location: warehouses[0] || '', 
        reorderLevel: 10 
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingId) {
      updateProduct(editingId, formData);
    } else {
      addProduct(formData);
    }
    setIsModalOpen(false);
  };

  const confirmDelete = (product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = () => {
    deleteProduct(productToDelete.id);
    setIsDeleteModalOpen(false);
    setProductToDelete(null);
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (newCatName && !categories.includes(newCatName)) {
      addCategory(newCatName);
      setNewCatName('');
    }
  };


  const columns = [
    { header: 'Name', accessor: 'name', render: (row) => <div style={{ fontWeight: 500 }}>{row.name}</div> },
    { header: 'SKU', accessor: 'sku' },
    { header: 'Category', accessor: 'category' },
    { header: 'Stock', accessor: 'stock', render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 600 }}>{row.stock}</span> {row.unit}
            {Number(row.stock) <= Number(row.reorderLevel) && (
              <StatusBadge status={Number(row.stock) === 0 ? 'Out of Stock' : 'Low Stock'} />
            )}
          </div>
          {Number(row.reserved) > 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Reserved: {row.reserved} | Avail: {row.stock - row.reserved}
            </div>
          )}
        </div>
      )
    },

    { header: 'Location', accessor: 'location' },
    { header: 'Actions', accessor: 'actions', render: (row) => (
        <div className="flex gap-2">
          <button style={{ padding: '0.25rem', background: 'transparent', color: 'var(--text-muted)' }} onClick={() => handleOpenModal(row)} aria-label="Edit"><Edit2 size={16} /></button>
          <button style={{ padding: '0.25rem', background: 'transparent', color: 'var(--danger)' }} onClick={() => confirmDelete(row)} aria-label="Delete"><Trash2 size={16} /></button>
        </div>
      )
    }

  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Products Component</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Manage catalog and track inventory levels</p>
        </div>
        <div className="flex gap-4">
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', top: '10px', left: '10px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem', width: '250px' }}
            />
          </div>
          <button className="btn-secondary flex items-center gap-2" onClick={() => setIsCategoryModalOpen(true)}>
             Manage Categories
          </button>
          <button className="btn-primary flex items-center gap-2" onClick={() => handleOpenModal()}>
            <Plus size={18} /> Add Product
          </button>
        </div>

      </div>

      <Table columns={columns} data={filteredProducts} />

      <Modal title={editingId ? "Edit Product" : "New Product"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Product Name</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">SKU / Code</label>
              <input type="text" required value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Category</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Unit of Measure</label>
              <input type="text" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Initial Stock</label>
              <input type="number" required value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} disabled={!!editingId} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Reorder Level</label>
              <input type="number" required value={formData.reorderLevel} onChange={e => setFormData({...formData, reorderLevel: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Warehouse Location</label>
            <select value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}>
              {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div className="flex justify-between mt-4">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Save Product</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal title="Confirm Deletion" isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <p style={{ marginBottom: '1.5rem' }}>Are you sure you want to delete <strong>{productToDelete?.name}</strong>? This action cannot be undone.</p>
        <div className="flex justify-between">
          <button className="btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
          <button className="btn-primary" style={{ background: 'var(--danger)' }} onClick={handleDelete}>Delete Product</button>
        </div>
      </Modal>

      {/* Category Management Modal */}
      <Modal title="Manage Categories" isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)}>
        <form onSubmit={handleAddCategory} className="flex gap-2 mb-6">
          <input 
            type="text" 
            placeholder="New category name..." 
            value={newCatName} 
            onChange={e => setNewCatName(e.target.value)} 
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-primary">Add</button>
        </form>
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {categories.map(cat => (
              <li key={cat} className="flex justify-between items-center" style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <span>{cat}</span>
                <button 
                  style={{ background: 'transparent', color: 'var(--danger)', padding: '0.25rem' }} 
                  onClick={() => deleteCategory(cat)}
                  disabled={products.some(p => p.category === cat)}
                  title={products.some(p => p.category === cat) ? "Cannot delete category with products" : "Delete category"}
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
          {categories.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No categories yet.</p>}
        </div>
      </Modal>

    </div>
  );
};

export default Products;
