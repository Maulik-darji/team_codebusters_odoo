import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import Table from '../components/Table';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { Plus } from 'lucide-react';
const Transfers = () => {
  const { movements, products, warehouses, processTransfer } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    fromLocation: '',
    toLocation: ''
  });

  // Sync initial product/warehouses when they load
  React.useEffect(() => {
    if (!formData.productId && products.length > 0) {
      setFormData(prev => ({ ...prev, productId: products[0].id }));
    }
    if (!formData.fromLocation && warehouses.length > 0) {
      setFormData(prev => ({ ...prev, fromLocation: warehouses[0] }));
    }
    if (!formData.toLocation && warehouses.length > 1) {
      setFormData(prev => ({ ...prev, toLocation: warehouses[1] }));
    }
  }, [products, warehouses]);


  const transferMovements = movements.filter(m => m.type === 'Internal Transfer');

  const handleSave = (e) => {
    e.preventDefault();
    if (formData.fromLocation === formData.toLocation) {
      alert("Source and destination must be different.");
      return;
    }
    const ref = `INT-${Date.now().toString().slice(-4)}`;
    processTransfer(formData.productId, formData.quantity, formData.fromLocation, formData.toLocation, ref);
    setIsModalOpen(false);
  };

  const columns = [
    { header: 'Reference', accessor: 'reference' },
    { header: 'Date', accessor: 'date' },
    { header: 'Product', accessor: 'productName' },
    { header: 'Movement', accessor: 'location', render: (row) => <span style={{ color: 'var(--text-muted)' }}>{row.location}</span> },
    { header: 'Status', accessor: 'status', render: (row) => <StatusBadge status={row.status} /> }
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Internal Transfers</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Move stock between locations and warehouses</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> New Transfer
        </button>
      </div>

      <Table columns={columns} data={transferMovements} />

      <Modal title="Create Internal Transfer" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Product</label>
            <select required value={formData.productId} onChange={e => setFormData({...formData, productId: e.target.value})}>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Quantity to Transfer</label>
            <input type="number" required min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
          </div>
          <div className="flex gap-4">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Source Location</label>
              <select value={formData.fromLocation} onChange={e => setFormData({...formData, fromLocation: e.target.value})}>
                {warehouses.map(w => <option key={`from-${w}`} value={w}>{w}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Destination Location</label>
              <select value={formData.toLocation} onChange={e => setFormData({...formData, toLocation: e.target.value})}>
                {warehouses.map(w => <option key={`to-${w}`} value={w}>{w}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-between mt-4">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Validate Transfer</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Transfers;
