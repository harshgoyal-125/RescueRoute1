import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Filter, Calendar, MapPin, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import DietaryBadge from '../../components/common/DietaryBadge';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

const STATUS_FILTERS = [
  'ALL',
  'POSTED',
  'MATCHED',
  'DRIVER ASSIGNED',
  'PICKED UP',
  'DELIVERED',
  'CANCELLED'
];

const DIET_FILTERS = ['ALL', 'Vegetarian', 'Eggetarian', 'Non-Vegetarian', 'Vegan'];

export default function DonationsListPage() {
  const { donations, loadingDonations, errorDonations, refreshDonations } = useApp();
  const navigate = useNavigate();

  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [selectedDiet, setSelectedDiet] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter logic with underscore/space normalization
  const filteredDonations = donations.filter(d => {
    const normItemStatus = (d.status || '').replace('_', ' ').toUpperCase();
    const normFilter = selectedFilter.replace('_', ' ').toUpperCase();
    const matchesStatus = selectedFilter === 'ALL' || normItemStatus === normFilter;
    const matchesDiet = selectedDiet === 'ALL' || (d.dietaryType || 'Vegetarian').toLowerCase() === selectedDiet.toLowerCase();

    const matchesSearch =
      searchTerm.trim() === '' ||
      (d.foodName && d.foodName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.foodType && d.foodType.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.pickupLocation && d.pickupLocation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.matchedWith && d.matchedWith.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesStatus && matchesSearch && matchesDiet;
  });

  return (
    <div className="donations-list-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Surplus Food Donations</h1>
          <p className="page-description">
            Complete registry of all food rescues posted by your organization.
          </p>
        </div>
        <div>
          <Button
            variant="primary"
            icon={PlusCircle}
            onClick={() => navigate('/donor/create-donation')}
          >
            Create Donation
          </Button>
        </div>
      </div>

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
        {/* Search */}
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
            placeholder="Search by food name, type, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflowX: 'auto', maxWidth: '100%', paddingBottom: '2px' }}>
          <Filter size={15} style={{ color: 'var(--slate-400)', marginRight: '0.25rem' }} />
          {STATUS_FILTERS.map((status) => {
            const isActive = selectedFilter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedFilter(status)}
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-full)',
                  border: isActive ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: isActive ? 'var(--color-primary-subtle)' : 'var(--color-surface)',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {status}
              </button>
            );
          })}
        </div>

        {/* Diet Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflowX: 'auto', width: '100%', paddingTop: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', marginRight: '0.25rem' }}>Diet:</span>
          {DIET_FILTERS.map((diet) => {
            const isActive = selectedDiet === diet;
            return (
              <button
                key={diet}
                type="button"
                onClick={() => setSelectedDiet(diet)}
                data-testid={`filter-diet-${diet.toLowerCase()}`}
                style={{
                  padding: '0.25rem 0.55rem',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-full)',
                  border: isActive ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: isActive ? 'var(--color-primary-subtle)' : '#ffffff',
                  color: isActive ? 'var(--color-primary)' : 'var(--slate-600)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {diet}
              </button>
            );
          })}
        </div>
      </div>

      {/* Donations Content */}
      <Card>
        {loadingDonations ? (
          <LoadingState message="Fetching donation registry from MongoDB..." />
        ) : errorDonations ? (
          <ErrorState
            title="Failed to load donations"
            description={errorDonations}
            onRetry={refreshDonations}
          />
        ) : filteredDonations.length === 0 ? (
          <EmptyState
            title="No donations found"
            description={
              searchTerm || selectedFilter !== 'ALL'
                ? 'Try adjusting your search query or status filter.'
                : 'No donations posted yet.'
            }
            action={
              selectedFilter !== 'ALL' ? (
                <Button variant="outline" size="sm" onClick={() => setSelectedFilter('ALL')}>
                  Reset Filter
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={() => navigate('/donor/create-donation')}>
                  Post Donation
                </Button>
              )
            }
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Food</th>
                  <th>Quantity</th>
                  <th>Pickup Location</th>
                  <th>Available Until</th>
                  <th>Matched Organization</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredDonations.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--slate-900)' }}>
                          {item.foodName || item.foodType}
                        </span>
                        <DietaryBadge type={item.dietaryType || 'Vegetarian'} />
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                        {item.foodType} &bull; ID: {item.id}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{item.quantity}</span> {item.unit}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}>
                        <MapPin size={14} style={{ color: 'var(--slate-400)', flexShrink: 0 }} />
                        <span>{item.pickupLocation}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}>
                        <Calendar size={14} style={{ color: 'var(--slate-400)', flexShrink: 0 }} />
                        <span>{item.availableUntil ? item.availableUntil.replace('T', ' ') : 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      {item.matchedWith ? (
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--slate-800)' }}>
                            {item.matchedWith}
                          </div>
                          {item.driverAssigned && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                              Driver: {item.driverAssigned}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--slate-400)', fontStyle: 'italic', fontSize: '0.8125rem' }}>
                          Awaiting Match
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
