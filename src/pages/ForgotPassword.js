import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { Box, Loader2 } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const { forgotPassword } = useInventory();
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    if (loading) return;
    setErrorMsg('');
    setLoading(true);

    const result = await forgotPassword(email);
    if (result.success) {
        setSubmitted(true);
    } else {
        setErrorMsg(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in">
        <div className="flex flex-col items-center justify-center mb-6">
          <Box size={48} className="text-primary mb-2" />
          <div className="auth-title" style={{ marginBottom: 0 }}>StockPilot</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Reset your password</p>
        </div>
        
        {errorMsg && (
          <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.875rem', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}

        {!submitted ? (
            <form onSubmit={handleReset}>
                <div className="form-group mb-6">
                    <label className="form-label">Email ID</label>
                    <input 
                        type="email" 
                        required 
                        disabled={loading}
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        placeholder="manager@example.com" 
                    />
                </div>
                <button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={loading}
                    style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                >
                    {loading && <Loader2 className="animate-spin" size={20} />}
                    {loading ? 'Sending link...' : 'Send Reset Link'}
                </button>
                <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
                    <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Back to Login</Link>
                </div>
            </form>
        ) : (
            <div style={{ textAlign: 'center' }}>
                <div style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                    A verification link has been sent to **{email}**. Please check your inbox to reset your password.
                </div>
                <button 
                  className="btn-primary" 
                  style={{ width: '100%', padding: '0.75rem' }}
                  onClick={() => navigate('/login')}
                >
                    Return to Login
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
