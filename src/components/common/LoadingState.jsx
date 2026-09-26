import React from 'react';

export default function LoadingState({ message = 'Loading details...' }) {
  return (
    <div className="state-container" data-testid="loading-state">
      <div className="spinner" role="status" aria-label="Loading" />
      <p className="state-description" style={{ marginBottom: 0 }}>{message}</p>
    </div>
  );
}
