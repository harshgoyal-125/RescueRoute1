import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, MapPin, Clock, CheckCircle2, Navigation, Eye, Check, HandHeart, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import Modal from '../../components/common/Modal';
import RescueRouteMap from '../../components/maps/RescueRouteMap';

export default function DriverDashboardPage() {
  const {
    currentUser,
    deliveries,
    updateDeliveryStatus,
    assignDelivery,
    loadingDeliveries,
    errorDeliveries,
    refreshDeliveries
  } = useApp();
  const navigate = useNavigate();

  // Active delivery assigned to this driver
  const activeDelivery = deliveries.find(
    d => d.status === 'DRIVER_ASSIGNED' || d.status === 'DRIVER ASSIGNED' || d.status === 'PICKED_UP' || d.status === 'PICKED UP'
  );

  // Available unassigned deliveries ready for pickup
  const availableDeliveries = deliveries.filter(
    d => !d.driverId || d.status === 'MATCHED'
  );

  const completedCount = deliveries.filter(d => d.status === 'DELIVERED').length;
  const activeCount = deliveries.filter(
    d => d.status === 'DRIVER_ASSIGNED' || d.status === 'DRIVER ASSIGNED' || d.status === 'PICKED_UP' || d.status === 'PICKED UP'
  ).length;

  // Visual Map Markers for the Active Delivery Route
  const driverMarkers = activeDelivery
    ? [
        {
          id: `pickup-${activeDelivery.id || activeDelivery._id}`,
          type: 'pickup',
          coordinates:
            activeDelivery.pickupCoordinates ||
            activeDelivery.donationId?.location?.coordinates,
          title: `1. Pickup: ${activeDelivery.pickup}`,
          subtitle: `${activeDelivery.food} (${activeDelivery.quantity})`,
          address: activeDelivery.pickupAddress
        },
        {
          id: `dest-${activeDelivery.id || activeDelivery._id}`,
          type: 'destination',
          coordinates:
            activeDelivery.destinationCoordinates ||
            activeDelivery.shelterId?.location?.coordinates,
          title: `2. Destination: ${activeDelivery.destination}`,
          subtitle: `Deadline: ${activeDelivery.deadline}`,
          address: activeDelivery.destinationAddress
        }
      ]
    : [];

  const totalKm = deliveries
    .filter(d => d.status === 'DELIVERED')
    .reduce((sum, d) => sum + (d.distanceKm || 0), 0);

  const totalMealsDelivered = deliveries
    .filter(d => d.status === 'DELIVERED')
    .reduce((sum, d) => {
      const match = (d.quantity || '').match(/\d+/);
      return sum + (/meals/i.test(d.quantity || '') && match ? parseInt(match[0], 10) : 0);
    }, 0);

  // Modal details state
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const handleOpenDetails = (delivery) => {
    setSelectedDelivery(delivery);
    setActionError('');
    setIsModalOpen(true);
  };

  const handleMarkPickedUp = async (deliveryId) => {
    setActionLoading(true);
    setActionError('');
    try {
      await updateDeliveryStatus(deliveryId, 'PICKED_UP');
      if (selectedDelivery && (selectedDelivery.id === deliveryId || selectedDelivery._id === deliveryId)) {
        setSelectedDelivery(prev => ({ ...prev, status: 'PICKED_UP' }));
      }
    } catch (err) {
      setActionError(err.message || 'Failed to update delivery to PICKED_UP.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkDelivered = async (deliveryId) => {
    setActionLoading(true);
    setActionError('');
    try {
      await updateDeliveryStatus(deliveryId, 'DELIVERED');
      if (selectedDelivery && (selectedDelivery.id === deliveryId || selectedDelivery._id === deliveryId)) {
        setSelectedDelivery(prev => ({ ...prev, status: 'DELIVERED' }));
      }
    } catch (err) {
      setActionError(err.message || 'Failed to update delivery to DELIVERED.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClaimDelivery = async (deliveryId) => {
    setActionLoading(true);
    setActionError('');
    try {
      await assignDelivery(deliveryId);
    } catch (err) {
      setActionError(err.message || 'Failed to claim delivery.');
    } finally {
      setActionLoading(false);
    }
  };

  const driverName = currentUser?.name || 'Volunteer Driver';

  if (loadingDeliveries && deliveries.length === 0) {
    return <LoadingState message="Loading your dispatch routes and assigned pickups..." />;
  }

  if (errorDeliveries && deliveries.length === 0) {
    return (
      <ErrorState
        title="Failed to load dispatch routes"
        description={errorDeliveries}
        onRetry={refreshDeliveries}
      />
    );
  }

  return (
    <div className="driver-dashboard">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Volunteer Dispatch: {driverName}</h1>
          <p className="page-description">
            Your real-time rescue pickup routing, shelter dropoffs, and delivery schedule.
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            icon={Eye}
            onClick={() => navigate('/driver/deliveries')}
          >
            Delivery History ({deliveries.length})
          </Button>
        </div>
      </div>

      {actionError && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            fontSize: '0.875rem'
          }}
          role="alert"
        >
          {actionError}
        </div>
      )}

      {/* Driver Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-amber">
            <Clock size={22} />
          </div>
          <div>
            <div className="stat-value">{activeCount}</div>
            <div className="stat-label">Active Assigned Deliveries</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-green">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="stat-value">{completedCount}</div>
            <div className="stat-label">Completed Deliveries</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-blue">
            <HandHeart size={22} />
          </div>
          <div>
            <div className="stat-value">{totalMealsDelivered}</div>
            <div className="stat-label">Meals Rescued to Date</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-purple">
            <Navigation size={22} />
          </div>
          <div>
            <div className="stat-value">{totalKm.toFixed(1)} km</div>
            <div className="stat-label">Rescue Route Distance</div>
          </div>
        </div>
      </div>

      {/* Prominent Active Delivery Card */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.75rem' }}>
          Current Active Rescue Route
        </h2>

        {activeDelivery ? (
          <Card
            style={{
              borderLeft: '4px solid var(--color-primary)',
              backgroundColor: 'var(--color-surface)'
            }}
            data-testid="active-delivery-card"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Dispatch ID: {activeDelivery.id || activeDelivery._id} &bull; Deadline: {activeDelivery.deadline}
                </span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '0.2rem', letterSpacing: '-0.02em' }}>
                  {activeDelivery.food} ({activeDelivery.quantity})
                </h3>
              </div>
              <StatusBadge status={activeDelivery.status} />
            </div>

            {/* Interactive Progress Stepper */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.5rem',
                backgroundColor: 'var(--color-surface-muted)',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem'
              }}
            >
              {[
                { label: '1. Matched', done: true },
                { label: '2. Assigned', done: true },
                { label: '3. In Transit', done: activeDelivery.status === 'PICKED_UP' || activeDelivery.status === 'PICKED UP' || activeDelivery.status === 'DELIVERED', active: activeDelivery.status === 'DRIVER_ASSIGNED' || activeDelivery.status === 'DRIVER ASSIGNED' },
                { label: '4. Delivered', done: activeDelivery.status === 'DELIVERED', active: activeDelivery.status === 'PICKED_UP' || activeDelivery.status === 'PICKED UP' }
              ].map((step, idx) => (
                <div key={idx} style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      height: '4px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: step.done ? 'var(--color-primary)' : step.active ? 'var(--amber-500)' : 'var(--color-border)',
                      marginBottom: '0.4rem',
                      boxShadow: step.active ? '0 0 8px rgba(245, 158, 11, 0.5)' : step.done ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none'
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: step.done || step.active ? 700 : 500,
                      color: step.done ? 'var(--color-primary)' : step.active ? 'var(--amber-500)' : 'var(--color-text-muted)'
                    }}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Route Stops */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1rem',
                backgroundColor: 'var(--color-surface-muted)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem'
              }}
            >
              {/* Pickup Stop */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  <MapPin size={14} />
                  <span>1. Pickup Origin</span>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                  {activeDelivery.pickup}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  {activeDelivery.pickupAddress}
                </div>
                {activeDelivery.donorContact && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    Contact: {activeDelivery.donorContact}
                  </div>
                )}
              </div>

              {/* Destination Stop */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--indigo-500)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  <MapPin size={14} />
                  <span>2. Shelter Destination</span>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                  {activeDelivery.destination}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  {activeDelivery.destinationAddress}
                </div>
                {activeDelivery.recipientContact && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    Contact: {activeDelivery.recipientContact}
                  </div>
                )}
              </div>
            </div>

            {/* Special Instructions */}
            {activeDelivery.instructions && (
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>
                <strong>Handling Instructions:</strong> {activeDelivery.instructions}
              </div>
            )}

            {/* Free Interactive Leaflet Delivery Route Map */}
            <div style={{ marginBottom: '1.25rem' }} data-testid="driver-route-map-container">
              <RescueRouteMap
                markers={driverMarkers}
                showLine={true}
                lineLabel={`Rescue transit corridor (${activeDelivery.distanceKm || 3.8} km straight-line)`}
                height="280px"
                title="Active Rescue Route Corridor"
                subtitle="Pickup origin to shelter destination (OpenStreetMap tiles)"
              />
            </div>

            {/* Control Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
              <Button
                variant="outline"
                size="sm"
                icon={Eye}
                onClick={() => handleOpenDetails(activeDelivery)}
                data-testid="view-delivery-btn"
              >
                View Delivery Details
              </Button>

              {(activeDelivery.status === 'DRIVER_ASSIGNED' || activeDelivery.status === 'DRIVER ASSIGNED') && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={Check}
                  disabled={actionLoading}
                  onClick={() => handleMarkPickedUp(activeDelivery.id || activeDelivery._id)}
                  data-testid="mark-picked-up-btn"
                >
                  {actionLoading ? 'Updating...' : 'Mark Picked Up'}
                </Button>
              )}

              {(activeDelivery.status === 'PICKED_UP' || activeDelivery.status === 'PICKED UP') && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={CheckCircle2}
                  style={{ backgroundColor: '#059669' }}
                  disabled={actionLoading}
                  onClick={() => handleMarkDelivered(activeDelivery.id || activeDelivery._id)}
                  data-testid="mark-delivered-btn"
                >
                  {actionLoading ? 'Updating...' : 'Mark Delivered'}
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <EmptyState
            icon={Truck}
            title="All assigned pickups completed"
            description="You currently have no active deliveries in progress. Check the history tab for past completed runs."
            action={
              <Button variant="outline" size="sm" onClick={() => navigate('/driver/deliveries')}>
                View Delivery History
              </Button>
            }
          />
        )}
      </div>

      {/* Available Routes for Pickup (Unassigned) */}
      {availableDeliveries.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
            <span>Available Deliveries Awaiting Dispatch</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {availableDeliveries.map(d => (
              <Card key={d.id || d._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>
                    {d.food} ({d.quantity})
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--slate-600)' }}>
                    Pickup: <strong>{d.pickup}</strong> &rarr; Shelter: <strong>{d.destination}</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
                    Deadline: {d.deadline} &bull; Distance: {d.distanceKm || 3.5} km
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => handleClaimDelivery(d.id || d._id)}
                  >
                    Claim Delivery
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modal for Delivery Details (Structured Sections) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Delivery Details — Dispatch #${selectedDelivery?.id || selectedDelivery?._id}`}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Close
            </Button>
            {selectedDelivery && (selectedDelivery.status === 'DRIVER_ASSIGNED' || selectedDelivery.status === 'DRIVER ASSIGNED') && (
              <Button
                variant="primary"
                size="sm"
                icon={Check}
                disabled={actionLoading}
                onClick={() => handleMarkPickedUp(selectedDelivery.id || selectedDelivery._id)}
              >
                {actionLoading ? 'Updating...' : 'Mark Picked Up'}
              </Button>
            )}
            {selectedDelivery && (selectedDelivery.status === 'PICKED_UP' || selectedDelivery.status === 'PICKED UP') && (
              <Button
                variant="primary"
                size="sm"
                icon={CheckCircle2}
                style={{ backgroundColor: '#059669' }}
                disabled={actionLoading}
                onClick={() => handleMarkDelivered(selectedDelivery.id || selectedDelivery._id)}
              >
                {actionLoading ? 'Updating...' : 'Mark Delivered'}
              </Button>
            )}
            {selectedDelivery && selectedDelivery.status === 'DELIVERED' && (
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#059669' }}>
                Delivery Completed
              </span>
            )}
          </div>
        }
      >
        {selectedDelivery && (
          <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--slate-100)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--slate-500)', fontWeight: 600 }}>DELIVERY STATUS</span>
              <StatusBadge status={selectedDelivery.status} />
            </div>

            <div>
              <span style={{ color: 'var(--slate-500)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>DONATION</span>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--slate-900)' }}>
                {selectedDelivery.food}
              </div>
              <div style={{ color: 'var(--slate-600)', fontSize: '0.875rem' }}>
                Quantity: <strong>{selectedDelivery.quantity}</strong>
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--slate-500)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>PICKUP ORIGIN</span>
              <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{selectedDelivery.pickup}</div>
              <div style={{ color: 'var(--slate-600)', fontSize: '0.8125rem' }}>{selectedDelivery.pickupAddress}</div>
              {selectedDelivery.donorContact && (
                <div style={{ color: 'var(--slate-500)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                  Contact: {selectedDelivery.donorContact}
                </div>
              )}
            </div>

            <div>
              <span style={{ color: 'var(--slate-500)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>DESTINATION SHELTER</span>
              <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{selectedDelivery.destination}</div>
              <div style={{ color: 'var(--slate-600)', fontSize: '0.8125rem' }}>{selectedDelivery.destinationAddress}</div>
              {selectedDelivery.recipientContact && (
                <div style={{ color: 'var(--slate-500)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                  Contact: {selectedDelivery.recipientContact}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--slate-100)', paddingTop: '0.75rem', fontSize: '0.8125rem' }}>
              <div>
                <span style={{ color: 'var(--slate-500)' }}>Operational Deadline:</span>
                <div style={{ fontWeight: 600 }}>{selectedDelivery.deadline}</div>
              </div>
              <div>
                <span style={{ color: 'var(--slate-500)' }}>Distance:</span>
                <div style={{ fontWeight: 600 }}>{selectedDelivery.distanceKm || 3.5} km (straight-line)</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
