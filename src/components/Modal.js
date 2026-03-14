import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ title, isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div className="card animate-fade-in" style={{
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative'
      }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ padding: '0.25rem', background: 'transparent', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
