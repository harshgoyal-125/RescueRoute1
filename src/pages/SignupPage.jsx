import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UtensilsCrossed,
  HeartHandshake,
  Home,
  Truck,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  MapPin,
  Phone,
  Building2,
  Mail,
  Lock,
  UserCheck,
  Sun,
  Moon
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import FormField from '../components/common/FormField';
import logoImg from '../assets/logo.jpeg';

export default function SignupPage() {
  const { register } = useApp();
  const { addToast } = useToast();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState('donor');
  const [formData, setFormData] = useState({
    organizationName: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    latitude: '',
    longitude: '',
    password: '',
    confirmPassword: '',
    agreeTerms: true
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const roleConfig = {
    donor: {
      label: 'Food Donor',
      subtitle: 'Restaurants, Bakeries, Caterers, Supermarkets',
      icon: HeartHandshake,
      orgPlaceholder: 'e.g. Green Leaf Bistro, Downtown Bakery',
      defaultPath: '/donor'
    },
    shelter: {
      label: 'Shelter / Food Bank',
      subtitle: 'Charities, Dining Halls, Community Pantries',
      icon: Home,
      orgPlaceholder: 'e.g. Hope Community Shelter, City Food Bank',
      defaultPath: '/shelter'
    },
    driver: {
      label: 'Volunteer Driver',
      subtitle: 'Community Couriers, Dispatch Volunteers',
      icon: Truck,
      orgPlaceholder: 'e.g. Alex Rivera',
      defaultPath: '/driver'
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.organizationName.trim()) {
      newErrors.organizationName = selectedRole === 'driver' ? 'Full name is required' : 'Organization name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required for dispatch alerts';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Primary address is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 10) {
      newErrors.password = 'Password must be at least 10 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if ((formData.latitude === '') !== (formData.longitude === '')) newErrors.coordinates = 'Enter both latitude and longitude, or leave both blank';
    if (formData.latitude !== '' && (!Number.isFinite(Number(formData.latitude)) || Math.abs(Number(formData.latitude)) > 90)) newErrors.coordinates = 'Latitude must be between -90 and 90';
    if (formData.longitude !== '' && (!Number.isFinite(Number(formData.longitude)) || Math.abs(Number(formData.longitude)) > 180)) newErrors.coordinates = 'Longitude must be between -180 and 180';
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the Good Samaritan Food Rescue terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await register({
        name: formData.organizationName,
        organizationName: formData.organizationName,
        contactPerson: formData.contactName || formData.organizationName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        password: formData.password,
        role: selectedRole.toUpperCase(),
        ...(formData.latitude !== '' && formData.longitude !== '' ? { location: { type: 'Point', coordinates: [Number(formData.longitude), Number(formData.latitude)] } } : {})
      });

      addToast({
        type: 'success',
        title: 'Account Created Successfully!',
        message: `Welcome to RescueRoute! Signed up as ${roleConfig[selectedRole].label}.`
      });

      const destination = roleConfig[selectedRole]?.defaultPath || '/dashboard';
      navigate(destination);
    } catch (err) {
      setErrors({ form: err.message || 'Registration failed. Please try again.' });
      addToast({
        type: 'error',
        title: 'Signup Error',
        message: err.message || 'Registration failed.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg)',
        backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(16, 185, 129, 0.12) 0%, transparent 70%)',
        padding: '2.5rem 1.25rem',
        position: 'relative'
      }}
    >
      {/* Top Floating Theme Switcher Option */}
      <div
        style={{
          position: 'absolute',
          top: '1.25rem',
          right: '1.25rem',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-full)',
            padding: '3px',
            boxShadow: 'var(--shadow-sm)'
          }}
          role="radiogroup"
          aria-label="Theme selection"
        >
          <button
            type="button"
            onClick={() => setTheme('light')}
            data-testid="signup-theme-light-btn"
            aria-checked={theme === 'light'}
            role="radio"
            title="Switch to Light Mode"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              backgroundColor: theme === 'light' ? 'var(--color-primary)' : 'transparent',
              color: theme === 'light' ? '#ffffff' : 'var(--color-text-muted)',
              transition: 'var(--transition-smooth)'
            }}
          >
            <Sun size={14} style={{ color: theme === 'light' ? '#ffffff' : '#f59e0b' }} />
            <span>Light</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            data-testid="signup-theme-dark-btn"
            aria-checked={theme === 'dark'}
            role="radio"
            title="Switch to Dark Mode"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              backgroundColor: theme === 'dark' ? 'var(--color-primary)' : 'transparent',
              color: theme === 'dark' ? '#ffffff' : 'var(--color-text-muted)',
              transition: 'var(--transition-smooth)'
            }}
          >
            <Moon size={14} style={{ color: theme === 'dark' ? '#ffffff' : 'var(--color-text-muted)' }} />
            <span>Dark</span>
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '580px', width: '100%', position: 'relative', zIndex: 10 }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            className="brand-icon"
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 0.75rem auto',
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
              overflow: 'hidden',
              padding: 0
            }}
          >
            <img src={logoImg} alt="RescueRoute Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
            <h1
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: 'var(--color-text)',
                letterSpacing: '-0.03em'
              }}
            >
              Join RescueRoute
            </h1>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.15rem 0.5rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-primary-subtle)',
                color: 'var(--color-primary)',
                border: '1px solid var(--color-primary-border)'
              }}
            >
              FREE
            </span>
          </div>
          <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
            Connect surplus food directly to recipient shelters and volunteer drivers.
          </p>

          {/* Toggle Tabs Between Sign In & Sign Up */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--color-surface-muted)',
              padding: '0.25rem',
              borderRadius: 'var(--radius-full)',
              marginTop: '1.25rem',
              border: '1px solid var(--color-border)'
            }}
          >
            <Link
              to="/login"
              style={{
                padding: '0.45rem 1.25rem',
                fontSize: '0.825rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-full)',
                color: 'var(--color-text-muted)',
                transition: 'var(--transition-smooth)'
              }}
            >
              Sign In
            </Link>
            <span
              style={{
                padding: '0.45rem 1.25rem',
                fontSize: '0.825rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-primary)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              Create Account
            </span>
          </div>
        </div>

        {/* Signup Form Card */}
        <Card style={{ boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-border)' }}>
          <form onSubmit={handleSubmit}>
            {/* Role Persona Chooser */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ marginBottom: '0.5rem' }}>
                Select Your Participation Role:
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.5rem'
                }}
              >
                {Object.entries(roleConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  const isSelected = selectedRole === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedRole(key)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0.85rem 0.5rem',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected
                          ? '2px solid var(--color-primary)'
                          : '1px solid var(--color-border)',
                        backgroundColor: isSelected
                          ? 'var(--color-primary-subtle)'
                          : 'var(--color-surface)',
                        boxShadow: isSelected ? '0 0 12px rgba(16, 185, 129, 0.2)' : 'none',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      <Icon
                        size={22}
                        style={{
                          color: isSelected ? 'var(--color-primary)' : 'var(--color-text-muted)',
                          marginBottom: '0.35rem'
                        }}
                      />
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: isSelected ? 'var(--color-primary)' : 'var(--color-text)'
                        }}
                      >
                        {config.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.4rem', textAlign: 'center' }}>
                {roleConfig[selectedRole].subtitle}
              </p>
            </div>

            {/* Error banner */}
            {errors.form && (
              <div
                style={{
                  backgroundColor: 'var(--color-danger-subtle)',
                  border: '1px solid var(--color-danger-border)',
                  color: 'var(--color-danger)',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                  fontSize: '0.825rem'
                }}
              >
                {errors.form}
              </div>
            )}

            {/* Form Fields Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <FormField
                id="signup-org-name"
                label={selectedRole === 'driver' ? 'Your Full Name' : 'Organization / Business Name'}
                name="organizationName"
                value={formData.organizationName}
                onChange={handleChange}
                placeholder={roleConfig[selectedRole].orgPlaceholder}
                required
                error={errors.organizationName}
              />

              {selectedRole !== 'driver' && (
                <FormField
                  id="signup-contact-name"
                  label="Contact Person Name"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  placeholder="e.g. Sarah Jenkins"
                />
              )}

              <FormField
                id="signup-email"
                label="Official Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@organization.org"
                required
                error={errors.email}
              />

              <FormField
                id="signup-phone"
                label="Dispatch Phone Number"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
                required
                error={errors.phone}
              />
            </div>

            <FormField
              id="signup-address"
              label="Primary Address / Facility Location"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="e.g. 500 Mission Street, Suite 200, San Francisco, CA"
              required
              error={errors.address}
              helpText="Address is for pickup or delivery; add coordinates below to enable distance matching."
            />

            <div className="form-row">
              <FormField id="signup-latitude" label="Latitude (optional)" name="latitude" type="number" step="any" value={formData.latitude} onChange={handleChange} />
              <FormField id="signup-longitude" label="Longitude (optional)" name="longitude" type="number" step="any" value={formData.longitude} onChange={handleChange} error={errors.coordinates} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <FormField
                id="signup-password"
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                error={errors.password}
              />

              <FormField
                id="signup-confirm-password"
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                error={errors.confirmPassword}
              />
            </div>

            {/* Good Samaritan Act / Terms Agreement */}
            <div style={{ margin: '1rem 0 1.25rem 0' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                  fontSize: '0.8rem',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  style={{ marginTop: '0.2rem', accentColor: 'var(--color-primary)' }}
                />
                <span>
                  I certify food handling safety standards and agree to the <strong>Bill Emerson Good Samaritan Food Donation Act</strong> legal liability protections.
                </span>
              </label>
              {errors.agreeTerms && (
                <div className="form-error" style={{ marginLeft: '1.75rem' }}>
                  {errors.agreeTerms}
                </div>
              )}
            </div>

            {/* Submit Registration Button */}
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '0.95rem',
                fontWeight: 700
              }}
              icon={ArrowRight}
            >
              {loading ? 'Creating Your Account...' : `Register as ${roleConfig[selectedRole].label}`}
            </Button>

            {/* Alternate Login Link */}
            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                Sign In here
              </Link>
            </div>
          </form>
        </Card>

        {/* Footer info */}
        <p
          style={{
            textAlign: 'center',
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            marginTop: '1.5rem',
            lineHeight: 1.5
          }}
        >
          RescueRoute Platform &bull; Confirm food safety and eligibility with your local coordinator
        </p>
      </div>
    </div>
  );
}
