import React from 'react';

const StatusBadge = ({ status }) => {
  let badgeClass = 'badge-neutral';
  const s = status ? status.toLowerCase() : '';
  
  if (['done', 'ready', 'completed'].includes(s)) badgeClass = 'badge-success';
  else if (['draft', 'waiting', 'pending'].includes(s)) badgeClass = 'badge-warning';
  else if (['canceled', 'cancelled', 'out of stock'].includes(s)) badgeClass = 'badge-danger';
  else if (['low stock', 'active'].includes(s)) badgeClass = 'badge-info';

  return (
    <span className={`badge ${badgeClass}`}>
      {status || 'Unknown'}
    </span>
  );
};

export default StatusBadge;
