import { useLocation } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

const Navbar = () => {
  const { user } = useInventory();
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);
  
  const title = pathParts.length > 0 
    ? pathParts[pathParts.length - 1].replace('-', ' ') 
    : 'Dashboard';

  return (
    <div className="navbar">
      <div className="page-title" style={{ textTransform: 'capitalize' }}>
        {title}
      </div>
      <div className="flex items-center gap-4">
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', top: '10px', left: '10px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search..." 
            style={{ paddingLeft: '2.5rem', width: '250px', borderRadius: '9999px' }}
          />
        </div>
        <button className="btn-secondary" style={{ padding: '0.5rem', borderRadius: '50%' }}>
          <Bell size={20} />
        </button>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.875rem' }}>
          {user?.loginId?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || 'GU'}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
