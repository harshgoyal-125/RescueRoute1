import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  PackageCheck,
  Utensils,
  Truck,
  Calendar,
  MapPin,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

export default function DonorDashboardPage() {
  const { currentUser, donations, loadingDonations, errorDonations, refreshDonations } = useApp();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'DELIVERED'
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Donor-specific calculations from state
  const activeDonationsCount = donations.filter(
    d => d.status === 'POSTED' || d.status === 'MATCHED' || d.status === 'DRIVER_ASSIGNED' || d.status === 'DRIVER ASSIGNED'
  ).length;

  const completedDeliveriesCount = donations.filter(d => d.status === 'DELIVERED').length;

  const totalMealsRescued = donations
    .filter(d => d.status === 'DELIVERED' && d.unit === 'meals')
    .reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshDonations();
    setIsRefreshing(false);
    addToast({
      type: 'success',
      title: 'Donations Updated',
      message: 'Latest surplus food records synced with MongoDB.'
    });
  };

  // Filtered recent donations
  const displayDonations = donations
    .filter((d) => {
      const isAct = d.status === 'POSTED' || d.status === 'MATCHED' || d.status === 'DRIVER_ASSIGNED' || d.status === 'DRIVER ASSIGNED';
      const isDel = d.status === 'DELIVERED';
      if (filterType === 'ACTIVE') return isAct;
      if (filterType === 'DELIVERED') return isDel;
      return true;
    })
    .filter((d) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        (d.foodName && d.foodName.toLowerCase().includes(term)) ||
        (d.foodType && d.foodType.toLowerCase().includes(term)) ||
        (d.pickupLocation && d.pickupLocation.toLowerCase().includes(term))
      );
    })
    .slice(0, 5);

  return (
    <div className="donor-dashboard">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <h1 className="page-title">Welcome back, {currentUser?.name || 'Donor'}</h1>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--color-primary)',
                backgroundColor: 'var(--color-primary-subtle)',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--color-primary-border)'
              }}
            >
              <Sparkles size={12} /> Food Donor
            </span>
          </div>
          <p className="page-description">
            Manage your food surplus donations and track active logistics pickups in real time.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button
            variant="outline"
            icon={RefreshCw}
            disabled={isRefreshing || loadingDonations}
            onClick={handleManualRefresh}
            title="Sync latest live records"
          >
            {isRefreshing ? 'Syncing...' : 'Sync Data'}
          </Button>
          <Button
            variant="primary"
            icon={PlusCircle}
            onClick={() => navigate('/donor/create-donation')}
            data-testid="create-donation-btn"
          >
            Create Donation
          </Button>
        </div>
      </div>

      {/* Quick Statistics Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-green">
            <PackageCheck size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div className="stat-value">{activeDonationsCount}</div>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem'
                }}
              >
                <TrendingUp size={12} /> Active Now
              </span>
            </div>
            <div className="stat-label">Active Surplus Postings</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-blue">
            <Utensils size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div className="stat-value">{totalMealsRescued.toLocaleString()} lbs</div>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'var(--indigo-500)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem'
                }}
              >
                +18% MTD
              </span>
            </div>
            <div className="stat-label">Food Rescued to Date</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-amber">
            <Truck size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div className="stat-value">{completedDeliveriesCount}</div>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'var(--amber-500)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem'
                }}
              >
                100% Fulfilled
              </span>
            </div>
            <div className="stat-label">Completed Deliveries</div>
          </div>
        </div>
      </div>

      {/* Recent Donations Section */}
      <Card
        title="Recent Donations"
        subtitle="Live tracking of your surplus food contributions"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/donor/donations')}
            icon={ArrowRight}
          >
            View All ({donations.length})
          </Button>
        }
      >
        {/* Interactive Quick Filter Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '1rem',
            flexWrap: 'wrap'
          }}
        >
          {/* Status Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {[
              { key: 'ALL', label: `All (${donations.length})` },
              { key: 'ACTIVE', label: `Active (${activeDonationsCount})` },
              { key: 'DELIVERED', label: `Delivered (${completedDeliveriesCount})` }
            ].map((tab) => {
              const active = filterType === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilterType(tab.key)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-full)',
                    border: active ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                    backgroundColor: active ? 'var(--color-primary-subtle)' : 'var(--color-surface)',
                    color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '0.65rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)'
              }}
            />
            <input
              type="text"
              placeholder="Filter recent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2rem', paddingRight: '0.6rem', fontSize: '0.8rem', paddingBlock: '0.35rem' }}
            />
          </div>
        </div>

        {loadingDonations ? (
          <LoadingState message="Loading live donations from database..." />
        ) : errorDonations ? (
          <ErrorState
            title="Failed to load donations"
            description={errorDonations}
            onRetry={refreshDonations}
          />
        ) : displayDonations.length === 0 ? (
          <EmptyState
            title={searchTerm || filterType !== 'ALL' ? 'No matching donations' : 'No donations posted yet'}
            description={
              searchTerm || filterType !== 'ALL'
                ? 'Try changing the filter or search query.'
                : 'Start turning your excess kitchen food into fresh meals for local shelters.'
            }
            action={
              searchTerm || filterType !== 'ALL' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilterType('ALL');
                    setSearchTerm('');
                  }}
                >
                  Reset Filter
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={() => navigate('/donor/create-donation')}>
                  Create First Donation
                </Button>
              )
            }
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Food Item</th>
                  <th>Quantity</th>
                  <th>Available Until</th>
                  <th>Pickup Location</th>
                  <th>Matched Shelter</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {displayDonations.map((item) => (
                  <tr key={item.id} data-testid={`donation-row-${item.id}`}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>
                        {item.foodName || item.foodType}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                        {item.foodType} &bull; ID: {item.id}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{item.quantity}</span>{' '}
                      <span style={{ color: 'var(--color-text-muted)' }}>{item.unit}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem', color: 'var(--color-text)' }}>
                        <Calendar size={14} style={{ color: 'var(--color-text-muted)' }} />
                        <span>{item.availableUntil ? item.availableUntil.replace('T', ' ') : 'Today, End of Day'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem', color: 'var(--color-text)' }}>
                        <MapPin size={14} style={{ color: 'var(--color-text-muted)' }} />
                        <span>{item.pickupLocation}</span>
                      </div>
                    </td>
                    <td>
                      {item.matchedWith ? (
                        <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                          {item.matchedWith}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '0.8125rem' }}>
                          Pending match
                        </span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
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
