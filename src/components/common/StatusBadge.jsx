import React from 'react';

const STATUS_CONFIGS = {
  'POSTED': {
    label: 'Posted',
    className: 'status-posted'
  },
  'MATCHED': {
    label: 'Matched',
    className: 'status-matched'
  },
  'DRIVER ASSIGNED': {
    label: 'Driver Assigned',
    className: 'status-driver-assigned'
  },
  'PICKED UP': {
    label: 'Picked Up',
    className: 'status-picked-up'
  },
  'DELIVERED': {
    label: 'Delivered',
    className: 'status-delivered'
  },
  'CANCELLED': {
    label: 'Cancelled',
    className: 'status-cancelled'
  }
};

export default function StatusBadge({ status, className = '' }) {
  const normalizedKey = status ? status.toUpperCase().replace(/_/g, ' ').trim() : 'POSTED';
  const config = STATUS_CONFIGS[normalizedKey] || {
    label: status || 'Unknown',
    className: 'status-posted'
  };

  return (
    <span
      className={`status-badge ${config.className} ${className}`}
      data-testid="status-badge"
      data-status={status || 'POSTED'}
    >
      <span className="status-badge-dot" aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}
