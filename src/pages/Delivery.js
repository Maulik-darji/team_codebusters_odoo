import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import Table from '../components/Table';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { Plus } from 'lucide-react';
const Delivery = () => {
  const { movements, products, warehouses, processDelivery } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    customer: '',
    productId: products[0]?.id || '',
    quantity: 1,
    warehouse: warehouses[0] || ''
  });

  const deliveryMovements = movements.filter(m => m.type === 'Delivery');

  const handleSave = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const ref = `DO-${Date.now().toString().slice(-4)} (${formData.customer})`;
    const success = processDelivery(formData.productId, formData.quantity, formData.warehouse, ref);
    if (!success) {
      setErrorMsg('Not enough stock available for this delivery.');
    } else {
      setIsModalOpen(false);
    }
  };

  const columns = [
    { header: 'Reference', accessor: 'reference' },
    { header: 'Date', accessor: 'date' },
    { header: 'Product', accessor: 'productName' },
    { header: 'Quantity', accessor: 'quantityChange', render: (row) => <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{row.quantityChange}</span> },
    { header: 'Source Location', accessor: 'location' },
    { header: 'Status', accessor: 'status', render: (row) => <StatusBadge status={row.status} /> }
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Delivery Orders</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Manage outgoing shipments to customers</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> New Delivery
        </button>
      </div>

      <Table columns={columns} data={deliveryMovements} />

      <Modal title="Create Delivery Order" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {errorMsg && <div style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.875rem' }}>{errorMsg}</div>}
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Customer Name</label>
            <input type="text" required value={formData.customer} onChange={e => setFormData({...formData, customer: e.target.value})} placeholder="Client Corp." />
          </div>
          <div className="form-group">
            <label className="form-label">Product</label>
            <select required value={formData.productId} onChange={e => setFormData({...formData, productId: e.target.value})}>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku}) - {p.stock} in stock</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Quantity to Deliver</label>
            <input type="number" required min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Source Warehouse</label>
            <select value={formData.warehouse} onChange={e => setFormData({...formData, warehouse: e.target.value})}>
              {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div className="flex justify-between mt-4">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Validate Delivery</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Delivery;
