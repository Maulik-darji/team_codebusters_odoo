import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import Table from '../components/Table';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { Plus } from 'lucide-react';
const Receipts = () => {
  const { movements, products, warehouses, processReceipt } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    supplier: '',
    productId: '',
    quantity: 1,
    warehouse: ''
  });

  // Sync initial product/warehouse when they load
  React.useEffect(() => {
    if (!formData.productId && products.length > 0) {
      setFormData(prev => ({ ...prev, productId: products[0].id }));
    }
    if (!formData.warehouse && warehouses.length > 0) {
      setFormData(prev => ({ ...prev, warehouse: warehouses[0] }));
    }
  }, [products, warehouses]);


  const receiptMovements = movements.filter(m => m.type === 'Receipt');

  const handleSave = (e) => {
    e.preventDefault();
    const ref = `PO-${Date.now().toString().slice(-4)} (${formData.supplier})`;
    processReceipt(formData.productId, formData.quantity, formData.warehouse, ref);
    setIsModalOpen(false);
  };

  const columns = [
    { header: 'Reference', accessor: 'reference' },
    { header: 'Date', accessor: 'date' },
    { header: 'Product', accessor: 'productName' },
    { header: 'Quantity', accessor: 'quantityChange', render: (row) => <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>+{row.quantityChange}</span> },
    { header: 'Destination', accessor: 'location' },
    { header: 'Status', accessor: 'status', render: (row) => <StatusBadge status={row.status} /> }
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Incoming Receipts</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Receive stock from vendors</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> New Receipt
        </button>
      </div>

      <Table columns={columns} data={receiptMovements} />

      <Modal title="Create Receipt" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Supplier Name</label>
            <input type="text" required value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} placeholder="Vendor Inc." />
          </div>
          <div className="form-group">
            <label className="form-label">Product</label>
            <select required value={formData.productId} onChange={e => setFormData({...formData, productId: e.target.value})}>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Quantity to Receive</label>
            <input type="number" required min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Destination Warehouse</label>
            <select value={formData.warehouse} onChange={e => setFormData({...formData, warehouse: e.target.value})}>
              {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div className="flex justify-between mt-4">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Validate Receipt</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Receipts;
