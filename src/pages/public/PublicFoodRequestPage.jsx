import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UtensilsCrossed,
  Send,
  CheckCircle2,
  MapPin,
  AlertCircle,
  Clock,
  Heart,
  ArrowLeft,
  Building,
  Phone,
  Mail,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { foodRequestApi } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import FormField from '../../components/common/FormField';
import RescueRouteMap from '../../components/maps/RescueRouteMap';
import logoImg from '../../assets/logo.jpeg';

const FOOD_CATEGORIES = [
  'Any / All',
  'Prepared Meals',
  'Bakery',
  'Fruits & Vegetables',
  'Packaged Food',
  'Dairy'
];

const URGENCY_LEVELS = [
  { level: 'LOW', label: 'Low', desc: 'Within 48h', color: '#16a34a' },
  { level: 'MEDIUM', label: 'Medium', desc: 'Standard (24h)', color: '#d97706' },
  { level: 'HIGH', label: 'High', desc: 'Urgent (12h)', color: '#ea580c' },
  { level: 'CRITICAL', label: 'Critical', desc: 'Immediate Need', color: '#dc2626' }
];

export default function PublicFoodRequestPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    recipientName: '',
    organizationName: '',
    contactPhone: '',
    contactEmail: '',
    deliveryAddress: '',
    foodCategory: 'Any / All',
    quantityNeeded: '',
    unit: 'meals',
    urgency: 'MEDIUM',
    dietaryRestrictions: 'None',
    notes: '',
    lat: null,
    lng: null
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedData, setSubmittedData] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value, ...(name === 'deliveryAddress' ? { lat: null, lng: null } : {}) }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.recipientName || !formData.contactPhone || !formData.contactEmail || !formData.deliveryAddress) {
      setError('Please fill in all required contact and location fields.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const payload = {
        recipientName: formData.recipientName,
        organizationName: formData.organizationName,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
        deliveryAddress: formData.deliveryAddress,
        ...(formData.lat !== null && formData.lng !== null ? { latitude: Number(formData.lat), longitude: Number(formData.lng) } : {}),
        foodCategory: formData.foodCategory,
        quantityNeeded: Number(formData.quantityNeeded),
        unit: formData.unit,
        urgency: formData.urgency,
        dietaryRestrictions: formData.dietaryRestrictions,
        notes: formData.notes
      };

      const res = await foodRequestApi.submitRequest(payload);
      setSubmittedData(res.data || payload);
    } catch (err) {
      setError(err.message || 'Failed to submit food request. Please check connection.');
    } finally {
      setSubmitting(false);
    }
  };

  // Live Map Marker preview
  const mapMarkers = formData.lat !== null && formData.lng !== null ? [{
    id: 'request-preview', lat: Number(formData.lat), lng: Number(formData.lng),
    title: 'Requested Drop-off Point', address: formData.deliveryAddress,
    type: 'request'
  }] : [];

  if (submittedData) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--slate-50)', padding: '2rem 1rem' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                border: '2px solid #a7f3d0',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto'
              }}
            >
              <CheckCircle2 size={36} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              Food Request Received
            </h1>
            <p style={{ color: 'var(--slate-500)', fontSize: '0.9375rem', marginTop: '0.5rem' }}>
              Your community food request has been submitted for review.
            </p>
          </div>

          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--slate-100)' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>Tracking ID</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                  REQ-{submittedData._id ? submittedData._id.toString().slice(-6).toUpperCase() : 'SUBMITTED'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--slate-100)' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>Recipient</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--slate-800)' }}>
                  {submittedData.recipientName} {submittedData.organizationName && `(${submittedData.organizationName})`}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--slate-100)' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>Requested Amount</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                  {submittedData.quantityNeeded} {submittedData.unit} of {submittedData.foodCategory}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--slate-100)' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>Delivery Address</span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--slate-700)', textAlign: 'right', maxWidth: '280px' }}>
                  {submittedData.deliveryAddress}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>Status</span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: '#fef3c7',
                    color: '#92400e'
                  }}
                >
                  PENDING MATCH & DISPATCH
                </span>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
              <Button
                variant="outline"
                style={{ flex: 1 }}
                onClick={() => {
                  setSubmittedData(null);
                  setFormData(prev => ({ ...prev, recipientName: '', notes: '' }));
                }}
              >
                Submit Another Request
              </Button>
              <Button
                variant="primary"
                style={{ flex: 1 }}
                onClick={() => navigate('/login')}
              >
                Go to Portal Login
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--slate-50)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        {/* Navigation back bar with language switcher */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="btn btn-outline btn-sm"
            style={{ border: 'none', paddingLeft: 0 }}
          >
            <ArrowLeft size={16} />
            <span>Return to Login</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link
              to="/login"
              style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--color-primary)',
                textDecoration: 'none'
              }}
            >
              Volunteer or Shelter Portal &rarr;
            </Link>
          </div>
        </div>

        {/* Page Title & Mission Banner */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            className="brand-icon"
            style={{ width: '54px', height: '54px', margin: '0 auto 0.75rem auto', borderRadius: '14px', overflow: 'hidden', padding: 0 }}
          >
            <img src={logoImg} alt="RescueRoute Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--slate-900)', letterSpacing: '-0.03em' }}>
            Request Surplus Food Assistance
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--slate-500)', marginTop: '0.25rem', maxWidth: '580px', margin: '0.25rem auto 0 auto' }}>
            Directly connect your shelter, family center, or group home with safe, high-quality surplus meals from local certified donors.
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            {/* Left Column: Contact & Needs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <Card title="1. Recipient Information" subtitle="Who will be receiving and verifying the food drop-off?">
                <FormField
                  id="recipientName"
                  label="Contact / Recipient Name *"
                  name="recipientName"
                  value={formData.recipientName}
                  onChange={handleChange}
                  placeholder="e.g. Maria Gonzalez"
                  required
                />

                <FormField
                  id="organizationName"
                  label="Organization / Group (Optional)"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  placeholder="e.g. Tenderloin Youth Hub or Family Group"
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <FormField
                    id="contactPhone"
                    label="Phone Number *"
                    name="contactPhone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    placeholder="(555) 000-0000"
                    required
                  />

                  <FormField
                    id="contactEmail"
                    label="Email Address *"
                    name="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    placeholder="intake@organization.org"
                    required
                  />
                </div>
              </Card>

              <Card title="2. Surplus Food Needed" subtitle="Specify categories and quantities needed">
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Food Category Needed</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.35rem' }}>
                    {FOOD_CATEGORIES.map((cat) => {
                      const isSelected = formData.foodCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, foodCategory: cat }))}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                            backgroundColor: isSelected ? 'var(--primary-50)' : '#ffffff',
                            color: isSelected ? 'var(--color-primary)' : 'var(--slate-700)'
                          }}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <FormField
                    id="quantityNeeded"
                    label="Estimated Quantity *"
                    name="quantityNeeded"
                    type="number"
                    min="1"
                    value={formData.quantityNeeded}
                    onChange={handleChange}
                    required
                  />

                  <div className="form-group">
                    <label htmlFor="unit" className="form-label">Unit</label>
                    <select
                      id="unit"
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      className="form-control"
                      style={{ padding: '0.55rem' }}
                    >
                      <option value="meals">meals</option>
                      <option value="lbs">lbs</option>
                      <option value="kg">kg</option>
                      <option value="boxes">boxes</option>
                      <option value="trays">trays</option>
                    </select>
                  </div>
                </div>

                {/* Urgency Selection */}
                <div style={{ marginTop: '0.75rem' }}>
                  <label className="form-label">Urgency Level</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', marginTop: '0.35rem' }}>
                    {URGENCY_LEVELS.map((u) => {
                      const isSelected = formData.urgency === u.level;
                      return (
                        <button
                          key={u.level}
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, urgency: u.level }))}
                          style={{
                            padding: '0.5rem 0.25rem',
                            borderRadius: 'var(--radius-md)',
                            border: isSelected ? `2px solid ${u.color}` : '1px solid var(--color-border)',
                            backgroundColor: isSelected ? '#f8fafc' : '#ffffff',
                            textAlign: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: u.color }}>
                            {u.label}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--slate-400)' }}>
                            {u.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dietary Requirement Quick Selector */}
                <div style={{ marginTop: '1rem', marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ marginBottom: '0.35rem' }}>
                    Dietary Classification Requirement
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.35rem' }}>
                    {[
                      { type: 'Vegetarian', label: 'Vegetarian', icon: '🌱' },
                      { type: 'Eggetarian', label: 'Eggetarian', icon: '🥚' },
                      { type: 'Non-Vegetarian', label: 'Non-Veg', icon: '🍗' },
                      { type: 'Vegan', label: 'Vegan', icon: '🌿' },
                      { type: 'None', label: 'Any Diet', icon: '🍽️' }
                    ].map(d => {
                      const isSelected = formData.dietaryRestrictions.includes(d.type) || (d.type === 'None' && formData.dietaryRestrictions === 'None');
                      return (
                        <button
                          key={d.type}
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, dietaryRestrictions: d.type }))}
                          data-testid={`req-diet-${d.type.toLowerCase()}`}
                          style={{
                            padding: '0.4rem 0.5rem',
                            borderRadius: 'var(--radius-md)',
                            border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                            backgroundColor: isSelected ? 'var(--primary-50)' : '#ffffff',
                            color: isSelected ? 'var(--color-primary)' : 'var(--slate-700)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <span>{d.icon}</span>
                          <span>{d.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginTop: '0.5rem' }}>
                  <FormField
                    id="dietaryRestrictions"
                    label="Additional Dietary Notes (Allergens, Halal, etc.)"
                    name="dietaryRestrictions"
                    value={formData.dietaryRestrictions}
                    onChange={handleChange}
                    placeholder="e.g. Halal, Kosher, Nut-Free, Dairy-Free"
                  />

                  <FormField
                    id="notes"
                    label="Special Delivery Instructions"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="e.g. Ring buzzer 4B, delivery entrance on side alley"
                  />
                </div>
              </Card>
            </div>

            {/* Right Column: Location & Live Map */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <Card title="3. Drop-off Location" subtitle="Select a preset district or enter specific street address">
                <p style={{ fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                  Enter the actual drop-off address. Coordinates are optional; if unknown, no map pin is shown.
                </p>
                <FormField
                  id="deliveryAddress"
                  label="Delivery Street Address *"
                  name="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={handleChange}
                  placeholder="Street address, city, state, zip"
                  required
                />

                {/* Free Leaflet Map Preview */}
                <div style={{ marginTop: '0.75rem' }}>
                  <label className="form-label" style={{ marginBottom: '0.35rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Location Preview on OpenStreetMap</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>
                      {formData.lat !== null && formData.lng !== null ? `Coordinates: ${Number(formData.lat).toFixed(4)}, ${Number(formData.lng).toFixed(4)}` : 'No coordinates supplied'}
                    </span>
                  </label>
                  <RescueRouteMap
                    markers={mapMarkers}
                    height="240px"
                    zoom={14}
                    center={formData.lat !== null && formData.lng !== null ? [Number(formData.lat), Number(formData.lng)] : undefined}
                  />
                </div>
              </Card>

              {/* Submit Card */}
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                  <ShieldCheck size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                  <span>
                    Your request is visible to authorized coordinators and shelters.
                  </span>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  loading={submitting}
                  icon={Send}
                  style={{ width: '100%', padding: '0.85rem' }}
                  data-testid="submit-food-request-btn"
                >
                  {submitting ? 'Broadcasting Request...' : 'Submit Food Rescue Request'}
                </Button>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
