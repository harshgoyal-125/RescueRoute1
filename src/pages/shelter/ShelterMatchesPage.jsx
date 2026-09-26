import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, Bot, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import MatchCard from '../../components/matching/MatchCard';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import Button from '../../components/common/Button';

export default function ShelterMatchesPage() {
  const { matches, acceptMatch, loadingMatches, errorMatches, refreshMatches } = useApp();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [notification, setNotification] = useState('');
  const [acceptingId, setAcceptingId] = useState(null);
  const [dietFilter, setDietFilter] = useState('ALL');

  const filteredMatches = matches.filter(m => {
    if (dietFilter === 'ALL') return true;
    const diet = (m.dietaryType || m.donationId?.dietaryType || 'Vegetarian').toLowerCase();
    return diet === dietFilter.toLowerCase();
  });

  const handleAcceptMatch = async (match) => {
    const id = match.id || match._id;
    setAcceptingId(id);
    try {
      await acceptMatch(id);
      const msg = `Successfully accepted "${match.foodName || match.foodType}" from ${match.donor || match.donorName}! Dispatch request created for volunteer drivers.`;
      setNotification(msg);
      addToast({
        type: 'success',
        title: 'Surplus Match Accepted',
        message: msg
      });
      setTimeout(() => setNotification(''), 6000);
    } catch (err) {
      setNotification(err.message || 'Failed to accept match.');
      addToast({
        type: 'error',
        title: 'Acceptance Failed',
        message: err.message || 'Failed to accept match.'
      });
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="shelter-matches-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <button
            type="button"
            onClick={() => navigate('/shelter')}
            className="btn btn-outline btn-sm"
            style={{ marginBottom: '0.75rem', border: 'none', paddingLeft: 0 }}
          >
            <ArrowLeft size={16} />
            <span>Back to Shelter Dashboard</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 className="page-title">Surplus Food Matches</h1>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--color-primary)',
                backgroundColor: 'var(--primary-50)',
                border: '1px solid var(--primary-200)',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-full)'
              }}
            >
              Live Matching Engine
            </span>
          </div>
          <p className="page-description">
            Algorithmic surplus recommendations scored by distance proximity, food shelf-life, and shelter capacity requirements.
          </p>
        </div>
      </div>

      {/* Matching engine explanation banner */}
      <div style={{ backgroundColor: 'var(--primary-50)', border: '1px solid var(--primary-200)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '0.8125rem', color: 'var(--primary-900)' }}>
        <Sparkles size={18} style={{ flexShrink: 0, color: 'var(--color-primary)' }} />
        <div>
          <strong>Deterministic Matching Engine:</strong> Match scores and rankings are calculated in real time by the backend engine using straight-line proximity, remaining operational shelf life, dietary compatibility, and shelter storage capacity.
        </div>
      </div>

      {/* Dietary Filter Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--slate-600)', marginRight: '0.25rem' }}>Filter Diet:</span>
        {['ALL', 'Vegetarian', 'Eggetarian', 'Non-Vegetarian', 'Vegan'].map(diet => {
          const isActive = dietFilter === diet;
          return (
            <button
              key={diet}
              type="button"
              onClick={() => setDietFilter(diet)}
              data-testid={`shelter-diet-${diet.toLowerCase()}`}
              style={{
                padding: '0.3rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: isActive ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                backgroundColor: isActive ? 'var(--primary-50)' : '#ffffff',
                color: isActive ? 'var(--color-primary)' : 'var(--slate-600)',
                cursor: 'pointer'
              }}
            >
              {diet}
            </button>
          );
        })}
      </div>

      {/* Confirmation Notification */}
      {notification && (
        <div
          style={{
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            padding: '0.875rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem'
          }}
          role="status"
        >
          <CheckCircle2 size={18} style={{ color: '#059669', flexShrink: 0 }} />
          <span>{notification}</span>
        </div>
      )}

      {/* Matches Grid */}
      {loadingMatches ? (
        <LoadingState message="Running real-time matching algorithm against surplus donations..." />
      ) : errorMatches ? (
        <ErrorState
          title="Failed to load matches"
          description={errorMatches}
          onRetry={refreshMatches}
        />
      ) : filteredMatches.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No pending surplus matches"
          description="All available surplus food batches have either been claimed or routed to nearby shelters."
          action={
            <Button variant="primary" size="sm" onClick={() => navigate('/shelter')}>
              Return to Shelter Overview
            </Button>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onAccept={handleAcceptMatch}
              isAccepting={acceptingId === match.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
