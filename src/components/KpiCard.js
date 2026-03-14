import React from 'react';

const KpiCard = ({ title, value, icon, trend, trendValue, colorClass }) => {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="flex justify-between items-center">
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>{title}</div>
        <div className={`icon-container ${colorClass}`} style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: `var(--${colorClass}-light, #f3f4f6)`, color: `var(--${colorClass})` }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
        {value}
      </div>
      {trend && (
        <div style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: trend === 'up' ? 'var(--secondary)' : 'var(--danger)' }}>
          <span style={{ fontWeight: 600 }}>{trendValue}</span>
          <span style={{ color: 'var(--text-muted)' }}>vs last month</span>
        </div>
      )}
    </div>
  );
};

export default KpiCard;
