import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { Box, Loader2 } from 'lucide-react';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, skipLogin } = useInventory();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    setErrorMsg('');
    setLoading(true);
    
    const result = await login(identifier, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setErrorMsg("Invalid Login Id or Password");
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in">
        <div className="flex flex-col items-center justify-center mb-6">
          <Box size={48} className="text-primary mb-2" />
          <div className="auth-title" style={{ marginBottom: 0 }}>StockPilot</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Login to your MVP dashboard</p>
        </div>
        
        {errorMsg && (
          <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.875rem', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Login ID or Email Address</label>
            <input 
              type="text" 
              required 
              disabled={loading}
              value={identifier} 
              onChange={e => setIdentifier(e.target.value)} 
              placeholder="Enter ID or email" 
            />
          </div>
          <div className="form-group mb-6">
            <label className="form-label flex justify-between">
              Password
            </label>
            <input 
              type="password" 
              required 
              disabled={loading}
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••" 
            />
          </div>
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            {loading && <Loader2 className="animate-spin" size={20} />}
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          <div style={{ margin: '1rem 0', textAlign: 'center', position: 'relative' }}>
            <span style={{ 
              background: 'white', 
              padding: '0 0.5rem', 
              color: 'var(--text-muted)', 
              fontSize: '0.75rem', 
              position: 'relative', 
              zIndex: 1 
            }}>OR</span>
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: 0, 
              right: 0, 
              borderBottom: '1px solid #e2e8f0', 
              zIndex: 0 
            }}></div>
          </div>

          <button 
            type="button" 
            className="btn-secondary" 
            onClick={() => {
              const res = skipLogin();
              if (res.success) navigate('/dashboard');
            }}
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              fontSize: '1rem', 
              backgroundColor: 'white', 
              border: '2px solid var(--primary)', 
              color: 'var(--primary)',
              fontWeight: 600,
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary-light)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            Skip to Demo (Guest)
          </button>
          
          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            <Link to="/forgot-password" style={{ color: 'var(--primary)', cursor: 'pointer' }}>Forgot password ?</Link>
            <span style={{ margin: '0 0.5rem' }}>|</span>
            <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 600 }}>Signup</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
