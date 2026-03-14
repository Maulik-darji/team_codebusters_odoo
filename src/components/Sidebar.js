import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, FileWarning, History, Settings, User, LogOut, Box } from 'lucide-react';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-header flex items-center gap-2">
        <Box className="text-primary" />
        <span>StockPilot MVP</span>
      </div>
      
      <div className="nav-section">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} /> Dashboard
        </NavLink>
        <NavLink to="/products" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Package size={20} /> Products
        </NavLink>
      </div>

      <div className="nav-section">
        <div className="nav-title">Operations</div>
        <NavLink to="/operations/receipts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <ArrowDownToLine size={20} /> Receipts
        </NavLink>
        <NavLink to="/operations/delivery" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <ArrowUpFromLine size={20} /> Delivery Orders
        </NavLink>
        <NavLink to="/operations/transfers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <ArrowRightLeft size={20} /> Internal Transfers
        </NavLink>
        <NavLink to="/operations/adjustments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FileWarning size={20} /> Inventory Adjustments
        </NavLink>
      </div>

      <div className="nav-section">
        <div className="nav-title">Reports</div>
        <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <History size={20} /> Move History
        </NavLink>
      </div>

      <div className="mt-auto nav-section">
        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Settings size={20} /> Settings
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <User size={20} /> Profile
        </NavLink>
        <div className="nav-item" style={{ cursor: 'pointer', color: 'var(--danger)' }} onClick={() => { localStorage.clear(); window.location.href='/login'; }}>
          <LogOut size={20} /> Logout
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
