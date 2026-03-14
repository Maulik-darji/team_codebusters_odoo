import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Receipts from './pages/Receipts';
import Delivery from './pages/Delivery';
import Transfers from './pages/Transfers';
import Adjustments from './pages/Adjustments';
import MoveHistory from './pages/MoveHistory';

// Layout with Sidebar and Navbar
const AppLayout = () => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div className="content-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user } = useInventory();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Application
function App() {
  return (
    <InventoryProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            
            <Route path="operations">
              <Route path="receipts" element={<Receipts />} />
              <Route path="delivery" element={<Delivery />} />
              <Route path="transfers" element={<Transfers />} />
              <Route path="adjustments" element={<Adjustments />} />
            </Route>
            
            <Route path="history" element={<MoveHistory />} />
            
            <Route path="settings" element={<div className="animate-fade-in"><h2 className="page-title">Settings module coming soon</h2></div>} />
            <Route path="profile" element={<div className="animate-fade-in"><h2 className="page-title">User profile coming soon</h2></div>} />
            
            <Route path="*" element={<div>Page Not Found</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </InventoryProvider>
  );
}

export default App;
