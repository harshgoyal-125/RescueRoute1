import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Leaf,
  Building2,
  Truck,
  Award,
  Sparkles,
  CheckCircle2,
  Clock,
  MapPin,
  FileQuestion,
  Filter,
  Check,
  X,
  Layers,
  BarChart3
} from 'lucide-react';
import { dashboardApi, foodRequestApi } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';
import RescueRouteMap from '../../components/maps/RescueRouteMap';
import DietaryBadge from '../../components/common/DietaryBadge';
import RequestSuggestions from './RequestSuggestions';

export default function ImpactDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const [data, setData] = useState({
    metrics: {
      totalMealsRescued: 0,
      totalFoodDivertedLbs: 0,
      totalFoodDivertedKg: 0,
      co2eAvoidedKg: null,
      organizationsHelped: 0,
      completedDeliveries: 0,
      activeVolunteers: 0,
      pendingRequests: 0
    },
    categoryDistribution: [],
    activityTimeline: [],
    recentRescues: [],
    networkMarkers: []
  });

  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestFilter, setRequestFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const loadImpact = async () => {
    try {
      setLoading(true);
      const res = await dashboardApi.getImpactMetrics();
      const payload = res?.data || res;
      if (payload?.metrics) {
        setData(payload);
      }
    } catch (err) {
      console.warn('[Impact Dashboard]: Backend load failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      setRequestsLoading(true);
      const res = await foodRequestApi.getRequests();
      const list = res?.data || res || [];
      setRequests(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('[Requests Load]: Failed to load requests:', err.message);
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    loadImpact();
    loadRequests();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await foodRequestApi.updateStatus(id, newStatus);
      setActionMessage(`Request updated to ${newStatus}.`);
      setTimeout(() => setActionMessage(''), 4000);
      loadRequests();
      loadImpact();
    } catch (err) {
      setActionMessage(err.message || 'Failed to update request.');
    }
  };

  const { metrics, categoryDistribution, activityTimeline, recentRescues, networkMarkers } = data;
  const maxMonthlyMeals = Math.max(...(activityTimeline.map(t => t.meals || 0)), 100);

  const filteredRequests = requests.filter(r => {
    if (requestFilter === 'ALL') return true;
    return (r.status || '').toUpperCase() === requestFilter.toUpperCase();
  });

  return (
    <div className="impact-dashboard">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 className="page-title">City-Wide Food Rescue Impact</h1>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--color-primary)',
                backgroundColor: 'var(--primary-50)',
                border: '1px solid var(--primary-200)',
                padding: '0.2rem 0.65rem',
                borderRadius: 'var(--radius-full)'
              }}
            >
              Live Network Analytics
            </span>
          </div>
          <p className="page-description">
            Real-time environmental and humanitarian metrics tracking surplus food diverted from landfills directly to vulnerable populations.
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          data-testid="tab-impact-overview"
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            backgroundColor: activeTab === 'overview' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'overview' ? '#ffffff' : 'var(--slate-600)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <BarChart3 size={16} />
          <span>Impact Overview & City Map</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          data-testid="tab-food-requests"
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            backgroundColor: activeTab === 'requests' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'requests' ? '#ffffff' : 'var(--slate-600)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <FileQuestion size={16} />
          <span>Manage Food Requests</span>
          {metrics.pendingRequests > 0 && (
            <span
              style={{
                backgroundColor: activeTab === 'requests' ? '#ffffff' : 'var(--color-danger)',
                color: activeTab === 'requests' ? 'var(--color-primary)' : '#ffffff',
                padding: '0.1rem 0.45rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.7rem',
                fontWeight: 800
              }}
            >
              {metrics.pendingRequests}
            </span>
          )}
        </button>
      </div>

      {actionMessage && (
        <div
          style={{
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <CheckCircle2 size={16} style={{ color: '#059669' }} />
          <span>{actionMessage}</span>
        </div>
      )}

      {activeTab === 'overview' && (
        <>
          {/* Top 6 Real Impact Stat Cards */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '1.5rem' }}>
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-green">
                <Utensils size={22} />
              </div>
              <div>
                <div className="stat-value">{metrics.totalMealsRescued.toLocaleString()}</div>
                <div className="stat-label">Meals Rescued</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-amber">
                <Award size={22} />
              </div>
              <div>
                <div className="stat-value">{metrics.totalFoodDivertedLbs.toLocaleString()} lbs</div>
                <div className="stat-label">Surplus Diverted ({metrics.totalFoodDivertedKg || 0} kg separately)</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-blue">
                <Building2 size={22} />
              </div>
              <div>
                <div className="stat-value">{metrics.organizationsHelped}</div>
                <div className="stat-label">Shelters & Food Banks</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-amber" style={{ backgroundColor: '#fef3c7', borderColor: '#fde68a', color: '#b45309' }}>
                <Truck size={22} />
              </div>
              <div>
                <div className="stat-value">{metrics.completedDeliveries}</div>
                <div className="stat-label">Completed Rescues</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}>
                <FileQuestion size={22} />
              </div>
              <div>
                <div className="stat-value">{metrics.pendingRequests || 0}</div>
                <div className="stat-label">Pending Community Requests</div>
              </div>
            </div>
          </div>

          {/* Interactive City-Wide Food Rescue Network Map */}
          <div style={{ marginBottom: '1.5rem' }}>
            <RescueRouteMap
              title="City-Wide Food Rescue & Shelter Network"
              subtitle="Live distribution of active donor hubs, certified recipient shelters, and community food requests"
              markers={networkMarkers}
              height="400px"
              zoom={13}
            />
          </div>

          {/* Two Column Grid: Activity Timeline + Category Distribution */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Monthly Meals Rescued Trend */}
            <Card
              title="Monthly Rescue Velocity"
              subtitle="Trend of meals saved and diverted to recipient partners"
            >
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '170px', gap: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--slate-100)' }}>
                  {activityTimeline.map((item) => {
                    const heightPercent = Math.round(((item.meals || 0) / maxMonthlyMeals) * 100);
                    return (
                      <div key={item.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--slate-600)', marginBottom: '0.35rem' }}>
                          {item.meals >= 1000 ? `${(item.meals / 1000).toFixed(1)}k` : item.meals}
                        </span>
                        <div
                          style={{
                            width: '100%',
                            maxWidth: '38px',
                            height: `${heightPercent}%`,
                            backgroundColor: item.month.includes('MTD') ? 'var(--color-primary)' : 'var(--primary-200)',
                            borderTopLeftRadius: '4px',
                            borderTopRightRadius: '4px',
                            transition: 'height 0.3s ease'
                          }}
                          title={`${item.month}: ${item.meals} meals rescued`}
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '0.5rem', fontWeight: 500 }}>
                          {item.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Food Category Distribution */}
            <Card
              title="Food Category Diversion Breakdown"
              subtitle="Proportion of rescued surplus across major segments"
            >
              {categoryDistribution.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--slate-400)', fontSize: '0.85rem' }}>
                  Awaiting initial completed rescues to calculate category weights.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                  {categoryDistribution.map((cat) => (
                    <div key={cat.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--slate-800)' }}>{cat.name}</span>
                        <span style={{ color: 'var(--slate-500)' }}>
                          <strong>{cat.percentage}%</strong> ({cat.lbs.toLocaleString()} lbs)
                        </span>
                      </div>
                      <div
                        style={{
                          height: '8px',
                          width: '100%',
                          backgroundColor: 'var(--slate-100)',
                          borderRadius: 'var(--radius-full)',
                          overflow: 'hidden'
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${cat.percentage}%`,
                            backgroundColor: cat.color,
                            borderRadius: 'var(--radius-full)'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Recent Successful Rescues Feed */}
          <Card
            title="Recent Completed Deliveries"
            subtitle="Delivery records from the database"
          >
            {recentRescues.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--slate-400)', fontSize: '0.875rem' }}>
                No completed rescue deliveries logged yet. Active rescues are in transit.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {recentRescues.map((rec) => (
                  <div
                    key={rec.id}
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--slate-900)', fontSize: '0.9375rem' }}>
                        {rec.food}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>{rec.timestamp}</span>
                    </div>

                    <div style={{ fontSize: '0.8125rem', color: 'var(--slate-600)', marginBottom: '0.75rem' }}>
                      <strong>{rec.donor}</strong> &rarr; <strong>{rec.recipient}</strong>
                    </div>


                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {/* Tab: Manage Food Requests (Admin Desk) */}
      {activeTab === 'requests' && (
        <div>
          {/* Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <Filter size={15} style={{ color: 'var(--slate-400)' }} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--slate-600)' }}>Status:</span>
            {['ALL', 'PENDING', 'APPROVED', 'FULFILLED', 'CANCELLED'].map((st) => {
              const isActive = requestFilter === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setRequestFilter(st)}
                  data-testid={`request-filter-${st.toLowerCase()}`}
                  style={{
                    padding: '0.3rem 0.7rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    border: isActive ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                    backgroundColor: isActive ? 'var(--primary-50)' : '#ffffff',
                    color: isActive ? 'var(--color-primary)' : 'var(--slate-600)',
                    cursor: 'pointer'
                  }}
                >
                  {st}
                </button>
              );
            })}
          </div>

          {requestsLoading ? (
            <LoadingState message="Loading community requests..." />
          ) : filteredRequests.length === 0 ? (
            <Card>
              <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                <FileQuestion size={40} style={{ color: 'var(--slate-300)', margin: '0 auto 1rem auto' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '0.5rem' }}>
                  No Food Requests Found
                </h3>
                <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem' }}>
                  {requestFilter !== 'ALL' ? 'No requests match this filter.' : 'All community food requests have been addressed.'}
                </p>
              </div>
            </Card>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
              {filteredRequests.map((req) => {
                const urgencyColors = {
                  LOW: { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' },
                  MEDIUM: { bg: '#fefce8', text: '#854d0e', border: '#fef08a' },
                  HIGH: { bg: '#fff7ed', text: '#9a3412', border: '#fed7aa' },
                  CRITICAL: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' }
                };
                const uColor = urgencyColors[req.urgency] || urgencyColors.MEDIUM;

                return (
                  <Card key={req._id || req.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--slate-900)' }}>
                            {req.recipientName}
                          </div>
                          {req.organizationName && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                              {req.organizationName}
                            </div>
                          )}
                        </div>

                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.5rem',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: uColor.bg,
                            color: uColor.text,
                            border: `1px solid ${uColor.border}`
                          }}
                        >
                          {req.urgency} URGENCY
                        </span>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: 'var(--slate-700)', marginBottom: '0.75rem' }}>
                        <strong>Need:</strong> {req.quantityNeeded} {req.unit} of {req.foodCategory}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--slate-600)', marginBottom: '0.5rem' }}>
                        <MapPin size={14} style={{ color: 'var(--slate-400)', flexShrink: 0 }} />
                        <span>{req.deliveryAddress}</span>
                      </div>

                      {req.dietaryRestrictions && req.dietaryRestrictions !== 'None' && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-600)', marginBottom: '0.5rem' }}>
                          <strong>Dietary:</strong> {req.dietaryRestrictions}
                        </div>
                      )}

                      {req.notes && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontStyle: 'italic', marginBottom: '0.75rem', backgroundColor: 'var(--slate-50)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                          &quot;{req.notes}&quot;
                        </div>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid var(--slate-100)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Current Status:</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: req.status === 'APPROVED' ? 'var(--color-primary)' : req.status === 'FULFILLED' ? '#059669' : '#d97706' }}>
                          {req.status}
                        </span>
                      </div>

                      <RequestSuggestions requestId={req._id || req.id} />

                      {/* Admin Status Actions */}
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {req.status === 'PENDING' && (
                          <Button
                            variant="primary"
                            size="sm"
                            style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => handleUpdateStatus(req._id || req.id, 'APPROVED')}
                          >
                            <Check size={13} style={{ marginRight: '0.25rem' }} /> Approve
                          </Button>
                        )}
                        {req.status === 'APPROVED' && (
                          <Button
                            variant="primary"
                            size="sm"
                            style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.75rem', backgroundColor: '#059669', borderColor: '#059669' }}
                            onClick={() => handleUpdateStatus(req._id || req.id, 'FULFILLED')}
                          >
                            <CheckCircle2 size={13} style={{ marginRight: '0.25rem' }} /> Mark Fulfilled
                          </Button>
                        )}
                        {req.status !== 'CANCELLED' && req.status !== 'FULFILLED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', color: '#b91c1c', borderColor: '#fca5a5' }}
                            onClick={() => handleUpdateStatus(req._id || req.id, 'CANCELLED')}
                          >
                            <X size={13} /> Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
