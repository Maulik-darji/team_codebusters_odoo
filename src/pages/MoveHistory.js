import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import Table from '../components/Table';
import StatusBadge from '../components/StatusBadge';
import { Search } from 'lucide-react';

const MoveHistory = () => {
  const { movements } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');

  const filteredMovements = movements.filter(m => {
    const matchesSearch = m.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || m.type === filterType;
    return matchesSearch && matchesType;
  });

  const columns = [
    { header: 'Date', accessor: 'date' },
    { header: 'Reference', accessor: 'reference', render: (row) => <span style={{ fontWeight: 500 }}>{row.reference}</span> },
    { header: 'Product', accessor: 'productName' },
    { header: 'Operation Type', accessor: 'type' },
    { header: 'Quantity Change', accessor: 'quantityChange', render: (row) => {
        let color = 'var(--text-main)';
        let prefix = '';
        if (row.quantityChange > 0) { color = 'var(--secondary)'; prefix = '+'; }
        else if (row.quantityChange < 0) { color = 'var(--danger)'; }
        return <span style={{ color, fontWeight: 600 }}>{prefix}{row.quantityChange}</span>;
      }
    },
    { header: 'Location', accessor: 'location' },
    { header: 'Status', accessor: 'status', render: (row) => <StatusBadge status={row.status} /> }
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Move History</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Ledger of all inventory movements</p>
        </div>
        <div className="flex gap-4">
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: '180px' }}>
            <option value="All">All Operations</option>
            <option value="Receipt">Receipts</option>
            <option value="Delivery">Deliveries</option>
            <option value="Internal Transfer">Internal Transfers</option>
            <option value="Adjustment">Adjustments</option>
          </select>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', top: '10px', left: '10px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search history..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem', width: '250px' }}
            />
          </div>
        </div>
      </div>

      <Table columns={columns} data={filteredMovements} />
    </div>
  );
};

export default MoveHistory;
