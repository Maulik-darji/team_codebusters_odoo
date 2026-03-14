export const initialProducts = [
  { id: '1', name: 'Wafer (WA-001)', sku: 'WA-001', category: 'Food', unit: 'Pieces', stock: 50, reserved: 0, location: 'Main Warehouse', reorderLevel: 10 },
  { id: '2', name: 'Soda (SD-002)', sku: 'SD-002', category: 'Beverage', unit: 'Bottles', stock: 20, reserved: 0, location: 'Secondary Store', reorderLevel: 5 }
];

export const warehouses = ['Main Warehouse', 'Secondary Store', 'Retail Shop'];
export const categories = ['Food', 'Beverage', 'Electronics', 'Others'];

export const initialMovements = [
  { id: 'm1', productId: '1', productName: 'Wafer (WA-001)', type: 'Receipt', quantityChange: 50, location: 'Main Warehouse', reference: 'Initial Stock', date: '2026-03-10', status: 'Done' }
];

