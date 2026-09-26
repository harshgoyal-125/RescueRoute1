import React, { useState } from 'react';
import { MapPin, Clock, CheckCircle2, Sparkles, Building2, Package, AlertTriangle, Loader2 } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import RescueRouteMap from '../maps/RescueRouteMap';
import DietaryBadge from '../common/DietaryBadge';
import { aiApi } from '../../services/api/aiApi';

export default function MatchCard({
  match,
  onAccept,
  isAccepting = false
}) {
  const {
    id,
    donor,
    recipient,
    foodType,
    foodName,
    quantity,
    distance,
    expiry,
    score,
    capacityCompatibility,
    foodCompatibility,
    urgency,
    reasons = []
  } = match;

  const displayScore = match.matchScore ?? score ?? 0;
  const displayDonor = match.donorName ?? donor ?? 'Food Donor';
  const displayDistance = match.distanceKm ? `${match.distanceKm} km` : distance;
  const [showMap, setShowMap] = useState(false);

  // Extract coordinates for donation and shelter
  const donationCoords =
    match.donationCoordinates ||
    match.donationId?.location?.coordinates;

  const shelterCoords =
    match.shelterCoordinates ||
    match.shelterId?.location?.coordinates;

  const matchMarkers = [
    {
      id: `don-${id || 'pickup'}`,
      type: 'donation',
      coordinates: donationCoords,
      title: foodName || foodType,
      subtitle: `From: ${displayDonor} (${quantity})`,
      address: match.donationId?.pickupLocation || 'Pickup Loading Dock'
    },
    {
      id: `shel-${id || 'dest'}`,
      type: 'shelter',
      coordinates: shelterCoords,
      title: recipient || match.shelterName || 'Recipient Shelter',
      subtitle: `Calculated Distance: ${displayDistance}`,
      address: match.shelterId?.address || 'Shelter Receiving Station'
    }
  ];

  const [explanation, setExplanation] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explainError, setExplainError] = useState('');

  const handleExplainWithAi = async () => {
    const matchId = match._id || match.id;
    if (!matchId) return;

    setIsExplaining(true);
    setExplainError('');

    try {
      const response = await aiApi.explainMatch(matchId);
      const data = response?.data || response;
      setExplanation(data);
    } catch (err) {
      setExplanation({
        summary: 'AI explanation unavailable. Showing deterministic match reasons.',
        reasons,
        isFallback: true
      });
      setExplainError('');
    } finally {
      setIsExplaining(false);
    }
  };


  const getScoreBadgeColor = (val) => {
    if (val >= 90) return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' };
    if (val >= 80) return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
    return { bg: '#fffbeb', text: '#b45309', border: '#fde68a' };
  };

  const scoreColors = getScoreBadgeColor(displayScore);

  return (
    <Card className="match-card" data-testid={`match-card-${id || displayScore}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                padding: '0.2rem 0.5rem',
                backgroundColor: 'var(--slate-100)',
                color: 'var(--slate-700)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              {foodType}
            </span>
            <DietaryBadge type={match.dietaryType || match.donationId?.dietaryType || 'Vegetarian'} />
            {urgency && (
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  color: urgency.toLowerCase().includes('high') ? '#b91c1c' : '#b45309'
                }}
              >
                <AlertTriangle size={12} />
                {urgency}
              </span>
            )}
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--slate-900)' }}>
            {foodName || foodType}
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)' }}>
            <strong style={{ color: 'var(--slate-800)' }}>{quantity}</strong> from <span style={{ color: 'var(--slate-800)', fontWeight: 500 }}>{displayDonor}</span>
          </p>
        </div>

        {/* Score Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: scoreColors.bg,
            color: scoreColors.text,
            border: `1px solid ${scoreColors.border}`,
            fontWeight: 700,
            fontSize: '0.875rem'
          }}
          data-testid="match-score"
        >
          <Sparkles size={15} />
          <span>{displayScore}% Match</span>
        </div>
      </div>

      {/* Logistics & Criteria Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
          backgroundColor: 'var(--slate-50)',
          padding: '0.875rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1rem',
          fontSize: '0.8125rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--slate-700)' }}>
          <MapPin size={16} style={{ color: 'var(--slate-400)', flexShrink: 0 }} />
          <span><strong>Distance:</strong> {distance}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--slate-700)' }}>
          <Clock size={16} style={{ color: 'var(--slate-400)', flexShrink: 0 }} />
          <span><strong>Expiry:</strong> {expiry}</span>
        </div>
        {capacityCompatibility && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--slate-700)' }}>
            <Package size={16} style={{ color: 'var(--slate-400)', flexShrink: 0 }} />
            <span><strong>Capacity:</strong> {capacityCompatibility}</span>
          </div>
        )}
        {foodCompatibility && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--slate-700)' }}>
            <Building2 size={16} style={{ color: 'var(--slate-400)', flexShrink: 0 }} />
            <span><strong>Compatibility:</strong> {foodCompatibility}</span>
          </div>
        )}
      </div>

      {/* Match Engine Rationale */}
      {reasons && reasons.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Why it matches:
          </h4>
          <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {reasons.map((reason, idx) => (
              <li
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  fontSize: '0.8125rem',
                  color: 'var(--slate-600)'
                }}
              >
                <CheckCircle2 size={14} style={{ color: 'var(--color-primary)', marginTop: '2px', flexShrink: 0 }} />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AI Match Explanation */}
      <div style={{ marginBottom: '1.25rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--slate-200)' }}>
        {!explanation && !isExplaining && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExplainWithAi}
            data-testid={`explain-match-btn-${id || score}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}
          >
            <Sparkles size={14} style={{ color: 'var(--color-primary)' }} />
            <span>✨ Explain with AI</span>
          </Button>
        )}

        {isExplaining && (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--slate-600)', fontSize: '0.8125rem' }}
            role="status"
            data-testid="explaining-status"
          >
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
            <span>Generating explanation...</span>
          </div>
        )}

        {explanation && (
          <div
            style={{
              backgroundColor: 'var(--primary-50, #f0fdf4)',
              border: '1px solid var(--primary-200, #a7f3d0)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem'
            }}
            data-testid="ai-match-explanation"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <Sparkles size={14} style={{ color: 'var(--color-primary)' }} />
              <strong style={{ fontSize: '0.8125rem', color: 'var(--slate-900)' }}>
                {explanation.isFallback ? 'Match Analysis (Deterministic Summary)' : 'AI Match Explanation'}
              </strong>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--slate-700)', lineHeight: 1.5, margin: '0 0 0.5rem 0' }}>
              {explanation.summary}
            </p>
            {explanation.reasons && explanation.reasons.length > 0 && (
              <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.775rem', color: 'var(--slate-600)' }}>
                {explanation.reasons.map((r, i) => (
                  <li key={i} style={{ marginBottom: '0.2rem' }}>{r}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {explainError && (
          <p style={{ fontSize: '0.75rem', color: 'var(--color-danger, #dc2626)', marginTop: '0.35rem', marginBottom: 0 }} role="alert">
            {explainError}
          </p>
        )}
      </div>

      {/* Free Interactive Location & Transit Corridor Map */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showMap ? '0.75rem' : '0' }}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowMap(prev => !prev)}
            data-testid={`toggle-map-btn-${id || displayScore}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}
          >
            <MapPin size={14} style={{ color: 'var(--color-primary)' }} />
            <span>{showMap ? 'Hide Route Map' : '🗺️ View Route & Locations'}</span>
          </Button>

          <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>
            Proximity: <strong>{displayDistance}</strong> (Straight-Line Vector)
          </span>
        </div>

        {showMap && (
          <div data-testid="match-map-container" style={{ marginTop: '0.5rem' }}>
            <RescueRouteMap
              markers={matchMarkers}
              showLine={true}
              lineLabel={`Direct transit corridor: ${displayDistance}`}
              height="260px"
              title={`${displayDonor} ➔ ${recipient || match.shelterName || 'Shelter'}`}
              subtitle="Straight-line distance vector (no paid routing)"
            />
          </div>
        )}
      </div>

      {/* Action Footer */}

      {onAccept && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--slate-100)', paddingTop: '0.75rem' }}>
          <Button
            variant="primary"
            onClick={() => onAccept(match)}
            disabled={isAccepting}
          >
            {isAccepting ? 'Confirming Match...' : 'Accept Donation Match'}
          </Button>
        </div>
      )}
    </Card>
  );
}
