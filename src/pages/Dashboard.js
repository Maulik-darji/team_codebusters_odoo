import React from 'react';
import { useInventory } from '../context/InventoryContext';
import KpiCard from '../components/KpiCard';
import { Package, AlertTriangle, XCircle, ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft } from 'lucide-react';

const Dashboard = () => {
  const { products, movements, warehouses } = useInventory();

  const totalStock = products.reduce((acc, p) => acc + Number(p.stock), 0);
  const lowStock = products.filter(p => Number(p.stock) > 0 && Number(p.stock) <= Number(p.reorderLevel)).length;
  const outOfStock = products.filter(p => Number(p.stock) <= 0).length;

  const pendingReceipts = movements.filter(m => m.type === 'Receipt' && m.status !== 'Done').length;
  const pendingDeliveries = movements.filter(m => m.type === 'Delivery' && m.status !== 'Done').length;
  const scheduledTransfers = movements.filter(m => m.type === 'Internal Transfer' && m.status !== 'Done').length;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Overview of stock, movements, and alerts</p>
        </div>
        <div>
          <select style={{ width: '200px' }}>
            <option>All Warehouses</option>
            {warehouses.map(w => <option key={w}>{w}</option>)}
          </select>
        </div>
      </div>

      <div className="grid-cards">
        <KpiCard 
          title="Total Stock Units" 
          value={totalStock.toLocaleString()} 
          icon={<Package size={24} />} 
          colorClass="primary" 
        />
        <KpiCard 
          title="Low Stock Items" 
          value={lowStock} 
          icon={<AlertTriangle size={24} />} 
          colorClass="warning" 
        />
        <KpiCard 
          title="Out of Stock" 
          value={outOfStock} 
          icon={<XCircle size={24} />} 
          colorClass="danger" 
        />
      </div>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', marginTop: '2rem' }}>Pending Operations</h2>
      <div className="grid-cards">
        <KpiCard 
          title="Pending Receipts" 
          value={pendingReceipts} 
          icon={<ArrowDownToLine size={24} />} 
          colorClass="info" 
        />
        <KpiCard 
          title="Pending Deliveries" 
          value={pendingDeliveries} 
          icon={<ArrowUpFromLine size={24} />} 
          colorClass="secondary" 
        />
        <KpiCard 
          title="Scheduled Transfers" 
          value={scheduledTransfers} 
          icon={<ArrowRightLeft size={24} />} 
          colorClass="neutral" 
        />
      </div>
    </div>
  );
};

export default Dashboard;
