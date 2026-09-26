import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Sparkles, SlidersHorizontal, Package, CheckCircle2, ArrowRight, Clock, MapPin } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';

export default function ShelterDashboardPage() {
  const { currentUser, shelterCapacity, matches, deliveries } = useApp();
  const navigate = useNavigate();

  const { currentCapacity, maxCapacity, acceptedCategories } = shelterCapacity || { currentCapacity: 0, maxCapacity: 0, acceptedCategories: [] };
  const capacityPercent = Math.min(100, maxCapacity ? Math.round((currentCapacity / maxCapacity) * 100) : 0);
  const capacityRemaining = Math.max(0, maxCapacity - currentCapacity);

  // Incoming donations (deliveries that are ASSIGNED or PICKED UP for this shelter)
  const incomingDeliveries = deliveries.filter(
    d => (d.status === 'DRIVER_ASSIGNED' || d.status === 'DRIVER ASSIGNED' || d.status === 'PICKED_UP' || d.status === 'PICKED UP') &&
         (d.shelterId?._id === currentUser?._id || d.shelterId === currentUser?._id)
  );

  // Recent delivered food for this shelter
  const recentDeliveries = deliveries.filter(
    d => d.status === 'DELIVERED'
  ).slice(0, 3);

  // Capacity bar color
  const getCapacityColor = () => {
    if (capacityPercent >= 90) return 'var(--color-danger)';
    if (capacityPercent >= 70) return 'var(--color-warning)';
    return 'var(--color-primary)';
  };

  return (
    <div className="shelter-dashboard">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{currentUser?.name || 'Shelter'}</h1>
          <p className="page-description">
            Shelter logistics, capacity utilization, and automated surplus food match intake.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="outline"
            icon={SlidersHorizontal}
            onClick={() => navigate('/shelter/capacity')}
          >
            Adjust Capacity
          </Button>
          <Button
            variant="primary"
            icon={Sparkles}
            onClick={() => navigate('/shelter/matches')}
          >
            View Matches ({matches.length})
          </Button>
        </div>
      </div>

      {/* Capacity & Quota Hero Card */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Real-Time Shelter Capacity
            </span>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-text)' }}>
              {currentCapacity} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>/ {maxCapacity} meals filled</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>
              Remaining Need: <strong style={{ color: 'var(--color-primary)' }}>{capacityRemaining} meals</strong>
            </span>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Capacity updates are saved to your shelter profile.
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: '14px',
            width: '100%',
            backgroundColor: 'var(--color-surface-muted)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            marginBottom: '0.75rem'
          }}
          role="progressbar"
          aria-valuenow={currentCapacity}
          aria-valuemin="0"
          aria-valuemax={maxCapacity}
        >
          <div
            style={{
              height: '100%',
              width: `${capacityPercent}%`,
              backgroundColor: getCapacityColor(),
              transition: 'width 0.3s ease'
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          <span>Accepted types: {acceptedCategories.join(', ')}</span>
          <span style={{ fontWeight: 600 }}>{capacityPercent}% storage utilized</span>
        </div>
      </Card>

      {/* Grid: Incoming Deliveries & Top Matches */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Incoming Food Inbound */}
        <Card
          title="Incoming Food Rescues"
          subtitle="Volunteer drivers currently en route to your location"
        >
          {incomingDeliveries.length === 0 ? (
            <EmptyState
              title="No incoming deliveries"
              description="No volunteer drivers are currently assigned to your shelter. Check available surplus matches."
              action={
                <Button variant="outline" size="sm" onClick={() => navigate('/shelter/matches')}>
                  Review Available Matches
                </Button>
              }
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {incomingDeliveries.map((del) => (
                <div
                  key={del.id}
                  style={{
                    padding: '0.875rem',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-surface-muted)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                    <div>
                      <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text)' }}>
                        {del.food}
                      </h4>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                        From: <strong>{del.pickup}</strong> &bull; {del.quantity}
                      </p>
                    </div>
                    <StatusBadge status={del.status} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={13} />
                      <span>ETA: {del.deadline}</span>
                    </div>
                    <div>
                      <span>Contact: {del.donorContact}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top Surplus Matches */}
        <Card
          title="Automated Surplus Matches"
          subtitle="Algorithmic recommendations based on capacity, dietary intake, and proximity"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/shelter/matches')}
              icon={ArrowRight}
            >
              All Matches
            </Button>
          }
        >
          {matches.length === 0 ? (
            <EmptyState
              title="All matches claimed"
              description="No unassigned surplus donations in your radius right now."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {matches.slice(0, 2).map((m) => (
                <div
                  key={m.id}
                  style={{
                    padding: '0.875rem',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-surface)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                        {m.score}% MATCH SCORE &bull; {m.distance}
                      </div>
                      <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text)' }}>
                        {m.foodName || m.foodType} ({m.quantity})
                      </h4>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                        Donor: {m.donor}
                      </p>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    Reason: {m.reasons[0]}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Deliveries Table */}
      <Card title="Recently Received Deliveries">
        {recentDeliveries.length === 0 ? (
          <EmptyState
            title="No past deliveries yet"
            description="Completed deliveries will show here once dropped off by volunteer drivers."
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Food Item</th>
                  <th>Quantity</th>
                  <th>Donor Organization</th>
                  <th>Delivery Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentDeliveries.map((del) => (
                  <tr key={del.id}>
                    <td style={{ fontWeight: 600 }}>{del.food}</td>
                    <td>{del.quantity}</td>
                    <td>{del.pickup}</td>
                    <td>{del.date}</td>
                    <td><StatusBadge status={del.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
