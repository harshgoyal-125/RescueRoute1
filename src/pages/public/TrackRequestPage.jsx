import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, ShieldCheck } from 'lucide-react';
import { foodRequestApi } from '../../services/api';
import './TrackRequestPage.css';

const statusMessages = {
  PENDING: 'Your request has been received and is awaiting review.',
  APPROVED: 'Your request has been approved. Delivery is not yet confirmed.',
  FULFILLED: 'Your request is marked fulfilled by a coordinator.',
  CANCELLED: 'Your request is marked cancelled. Please contact the coordinator if this is unexpected.'
};

export default function TrackRequestPage() {
  const [trackingId, setTrackingId] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus(null);
    setError('');
    setLoading(true);
    try {
      const data = await foodRequestApi.trackRequest(trackingId.trim(), phone);
      setStatus(data.status);
    } catch (err) {
      setError(err.message || 'Could not check that request right now.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="track-page">
      <div className="track-card">
        <Link className="track-back" to="/"><ArrowLeft size={17} aria-hidden="true" /> Home</Link>
        <div className="track-icon"><Search size={28} aria-hidden="true" /></div>
        <h1>Track your food request</h1>
        <p>Enter the full tracking ID shown after you submitted your request and the same phone number you provided then. You do not need an account.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="tracking-id">Tracking ID</label>
          <input id="tracking-id" type="text" required maxLength="24" autoComplete="off" value={trackingId} onChange={e => setTrackingId(e.target.value)} placeholder="24-character ID" />
          <label htmlFor="tracking-phone">Phone number on request</label>
          <input id="tracking-phone" type="tel" required autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Your submitted phone number" />
          <button type="submit" disabled={loading}>{loading ? 'Checking...' : 'Check status'}</button>
        </form>
        {error && <p role="alert" className="track-error">{error}</p>}
        {status && <section role="status" className="track-result"><span>Request status</span><h2>{status}</h2><p>{statusMessages[status] || 'Please contact a coordinator for details.'}</p></section>}
        <p className="track-note"><ShieldCheck size={16} aria-hidden="true" /> This lookup shows request status only. It does not show personal details or live driver tracking.</p>
        <Link className="track-request-link" to="/request-food">Need to make a new request?</Link>
      </div>
    </main>
  );
}
