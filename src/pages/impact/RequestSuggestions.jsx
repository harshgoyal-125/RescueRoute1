import React, { useState } from 'react';
import { foodRequestApi } from '../../services/api';

export default function RequestSuggestions({ requestId }) {
  const [candidates, setCandidates] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await foodRequestApi.getSuggestions(requestId);
      setCandidates(data.suggestions || []);
    } catch (err) {
      setError(err.message || 'Could not check available donations.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
      <button type="button" className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
        {loading ? 'Checking...' : 'Find available food suggestions'}
      </button>
      {error && <p role="alert" style={{ color: 'var(--color-danger)', marginTop: 8 }}>{error}</p>}
      {candidates && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: '.78rem', color: 'var(--color-text-muted)' }}>Suggestions only. No food has been reserved, assigned or promised to the requester. Check availability with the donor before taking action.</p>
          {candidates.length === 0 ? <p>No compatible nearby donations with registered coordinates are available right now.</p> : (
            <ul style={{ paddingLeft: 20 }}>
              {candidates.map(item => <li key={item.donationId} style={{ marginTop: 8, fontSize: '.86rem' }}>
                <strong>{item.foodName}</strong> - {item.quantity} {item.unit}, {item.dietaryType}, {item.distanceKm} km straight-line; deadline {new Date(item.availableUntil).toLocaleString()}
              </li>)}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
