import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { Box, Eye, EyeOff, Loader2 } from 'lucide-react';

const Signup = () => {
  const [formData, setFormData] = useState({
    loginId: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signupUser } = useInventory();
  const navigate = useNavigate();

  const validatePassword = (pass) => {
    const hasLower = /[a-z]/.test(pass);
    const hasUpper = /[A-Z]/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    return pass.length >= 8 && hasLower && hasUpper && hasSpecial;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (loading) return;
    setErrorMsg('');

    // Validation 1: Login ID length 6-12
    if (formData.loginId.length < 6 || formData.loginId.length > 12) {
      setErrorMsg("Login ID must be between 6 and 12 characters.");
      return;
    }

    // Validation 2: Password strength
    if (!validatePassword(formData.password)) {
      setErrorMsg("Password must be 8+ characters and contain a mix of uppercase, lowercase, and special characters.");
      return;
    }

    // Validation 3: Password match
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords do not match!");
      return;
    }

    setLoading(true);
    
    // Safety timeout: 15 seconds
    const timeout = setTimeout(() => {
      if (loading) {
        setErrorMsg("Request is taking longer than expected. Please check your internet connection and verify your Firebase project is correctly configured (Firestore & Auth enabled).");
        setLoading(false);
      }
    }, 15000);

    try {
      const result = await signupUser(formData);
      clearTimeout(timeout);
      
      if (!result.success) {
        setErrorMsg(result.message);
        setLoading(false);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      clearTimeout(timeout);
      setErrorMsg("A system error occurred. Please check the browser console for details.");
      setLoading(false);
    } finally {
      // In case of unexpected behavior, ensure loading is stopped if we have an error
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in" style={{ maxWidth: '450px' }}>
        <div className="flex flex-col items-center justify-center mb-6">
          <Box size={48} className="text-primary mb-2" />
          <div className="auth-title" style={{ marginBottom: 0 }}>StockPilot</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Create your account</p>
        </div>
        
        {errorMsg && (
          <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.875rem', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSignup}>
          <div className="form-group">
            <label className="form-label">Login ID</label>
            <input 
              type="text" 
              required 
              disabled={loading}
              value={formData.loginId} 
              onChange={e => setFormData({...formData, loginId: e.target.value.toLowerCase()})} 
              placeholder="6-12 characters" 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email ID</label>
            <input 
              type="email" 
              required 
              disabled={loading}
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              placeholder="manager@example.com" 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                disabled={loading}
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
                placeholder="Mixed case & special chars" 
                style={{ paddingRight: '2.5rem' }}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  padding: '4px'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="form-group mb-6">
            <label className="form-label">Re-enter Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                required 
                disabled={loading}
                value={formData.confirmPassword} 
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
                placeholder="Confirm password" 
                style={{ paddingRight: '2.5rem' }}
              />
              <button 
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  padding: '4px'
                }}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            {loading && <Loader2 className="animate-spin" size={20} />}
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
          
          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign In</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
