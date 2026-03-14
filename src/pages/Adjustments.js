import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import Table from '../components/Table';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { Plus } from 'lucide-react';
const Adjustments = () => {
  const { movements, products, warehouses, processAdjustment } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    productId: products[0]?.id || '',
    recordedQty: products[0]?.stock || 0,
    actualQty: products[0]?.stock || 0,
    location: warehouses[0] || '',
    reason: 'Inventory Count'
  });

  const adjustmentMovements = movements.filter(m => m.type === 'Adjustment');

  const handleProductChange = (e) => {
    const pid = e.target.value;
    const prod = products.find(p => p.id === pid);
    setFormData({
      ...formData,
      productId: pid,
      recordedQty: prod ? prod.stock : 0,
      actualQty: prod ? prod.stock : 0
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    processAdjustment(formData.productId, formData.recordedQty, formData.actualQty, formData.location, formData.reason);
    setIsModalOpen(false);
  };

  const columns = [
    { header: 'Reference', accessor: 'reference' },
    { header: 'Date', accessor: 'date' },
    { header: 'Product', accessor: 'productName' },
    { 
      header: 'Difference', 
      accessor: 'quantityChange', 
      render: (row) => (
        <span style={{ 
          color: row.quantityChange > 0 ? 'var(--secondary)' : row.quantityChange < 0 ? 'var(--danger)' : 'var(--text-muted)', 
          fontWeight: 600 
        }}>
          {row.quantityChange > 0 ? '+' : ''}{row.quantityChange}
        </span>
      ) 
    },
    { header: 'Location', accessor: 'location' },
    { header: 'Status', accessor: 'status', render: (row) => <StatusBadge status={row.status} /> }
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Adjustments</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Correct mismatches between recorded stock and physical count</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> New Adjustment
        </button>
      </div>

      <Table columns={columns} data={adjustmentMovements} />

      <Modal title="Create Stock Adjustment" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Product</label>
            <select required value={formData.productId} onChange={handleProductChange}>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
          </div>
          <div className="flex gap-4">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Recorded Quantity</label>
              <input type="number" disabled value={formData.recordedQty} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Actual Count</label>
              <input type="number" required value={formData.actualQty} onChange={e => setFormData({...formData, actualQty: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Difference Calculated</label>
            <div style={{ padding: '0.5rem', borderRadius: '0.25rem', backgroundColor: 'var(--bg-color)', fontWeight: 600 }}>
              {formData.actualQty - formData.recordedQty}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Reason</label>
            <select value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})}>
              <option value="Inventory Count">Annual Inventory Count</option>
              <option value="Damage">Damaged Goods</option>
              <option value="Theft">Shrinkage / Theft</option>
              <option value="System Error">System Error Correction</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <select value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}>
              {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div className="flex justify-between mt-4">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Apply Adjustment</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Adjustments;
