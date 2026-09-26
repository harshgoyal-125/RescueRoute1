import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Calendar, Eye, Check, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import Modal from '../../components/common/Modal';

export default function DriverDeliveriesPage() {
  const {
    deliveries,
    loadingDeliveries,
    errorDeliveries,
    refreshDeliveries,
    updateDeliveryStatus
  } = useApp();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const filtered = deliveries.filter(d => {
    const normStatus = (d.status || '').replace('_', ' ').toUpperCase();
    const normFilter = statusFilter.replace('_', ' ').toUpperCase();
    const matchesStatus = statusFilter === 'ALL' || normStatus === normFilter;

    const matchesSearch =
      searchTerm.trim() === '' ||
      (d.pickup && d.pickup.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.destination && d.destination.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.food && d.food.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

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
      setActionError(err.message || 'Failed to update status to PICKED_UP.');
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
      setActionError(err.message || 'Failed to update status to DELIVERED.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loadingDeliveries && deliveries.length === 0) {
    return <LoadingState message="Loading delivery log and route history..." />;
  }

  if (errorDeliveries && deliveries.length === 0) {
    return (
      <ErrorState
        title="Failed to load deliveries"
        description={errorDeliveries}
        onRetry={refreshDeliveries}
      />
    );
  }

  return (
    <div className="driver-deliveries-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <button
            type="button"
            onClick={() => navigate('/driver')}
            className="btn btn-outline btn-sm"
            style={{ marginBottom: '0.75rem', border: 'none', paddingLeft: 0 }}
          >
            <ArrowLeft size={16} />
            <span>Back to Driver Dashboard</span>
          </button>
          <h1 className="page-title">Delivery Route History</h1>
          <p className="page-description">
            Complete log of completed, active, and assigned food rescue dispatches.
          </p>
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

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem'
        }}
      >
        <div style={{ position: 'relative', minWidth: '260px', flex: '1 1 280px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--slate-400)'
            }}
          />
          <input
            type="text"
            placeholder="Search pickups, shelters, or food..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Filter size={15} style={{ color: 'var(--slate-400)' }} />
          {['ALL', 'DRIVER ASSIGNED', 'PICKED UP', 'DELIVERED'].map((st) => {
            const active = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-full)',
                  border: active ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: active ? 'var(--primary-50)' : '#ffffff',
                  color: active ? 'var(--primary-800)' : 'var(--slate-600)',
                  cursor: 'pointer'
                }}
              >
                {st}
              </button>
            );
          })}
        </div>
      </div>

      {/* Deliveries Table */}
      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            title="No deliveries match criteria"
            description="Adjust your search or filter options to display delivery records."
            action={
              <Button variant="outline" size="sm" onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}>
                Reset Filters
              </Button>
            }
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Dispatch ID</th>
                  <th>Pickup Origin</th>
                  <th>Destination Shelter</th>
                  <th>Food Item</th>
                  <th>Quantity</th>
                  <th>Assigned / Deadline</th>
                  <th>Distance</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id || d._id}>
                    <td style={{ fontWeight: 600, color: 'var(--slate-700)', fontSize: '0.8125rem' }}>
                      {d.id || d._id}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{d.pickup}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{d.pickupAddress}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{d.destination}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{d.destinationAddress}</div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{d.food}</td>
                    <td><span style={{ fontWeight: 600 }}>{d.quantity}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}>
                        <Calendar size={13} style={{ color: 'var(--slate-400)' }} />
                        <span>{d.date || 'Today'} &bull; {d.deadline}</span>
                      </div>
                    </td>
                    <td>{d.distanceKm || 3.5} km</td>
                    <td><StatusBadge status={d.status} /></td>
                    <td>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Eye}
                        onClick={() => handleOpenDetails(d)}
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal for Delivery Details */}
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
                <span style={{ color: 'var(--slate-500)' }}>Assigned / Deadline:</span>
                <div style={{ fontWeight: 600 }}>{selectedDelivery.date || 'Today'} &bull; {selectedDelivery.deadline}</div>
              </div>
              <div>
                <span style={{ color: 'var(--slate-500)' }}>Route Distance:</span>
                <div style={{ fontWeight: 600 }}>{selectedDelivery.distanceKm || 3.5} km (straight-line)</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
