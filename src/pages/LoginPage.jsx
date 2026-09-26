import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ArrowRight,
  AlertCircle,
  Sun,
  Moon,
  Lock,
  Mail,
  FileQuestion,
  UserPlus
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ROLE_DETAILS } from '../data/users';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import FormField from '../components/common/FormField';
import logoImg from '../assets/logo.jpeg';

export default function LoginPage() {
  const { login } = useApp();
  const { t } = useLanguage();
  const { theme, setTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectNotice = location.state?.from
    ? 'Authentication required: Please sign in to access that portal.'
    : '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please enter both your registered email address and password.');
      return;
    }

    setLoading(true);
    setError('');

    const fromPath = location.state?.from?.pathname;

    try {
      const res = await login(cleanEmail, password);
      const userRole = res?.user?.role?.toLowerCase() || 'donor';
      const defaultTarget = ROLE_DETAILS[userRole]?.defaultPath || (userRole === 'admin' ? '/dashboard' : `/${userRole}`);
      const targetPath = fromPath && (userRole === 'admin' || fromPath.startsWith(`/${userRole}`)) ? fromPath : defaultTarget;
      navigate(targetPath);
    } catch (err) {
      setError(err.message || 'Invalid email or password. Only registered accounts can log in.');
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
        padding: '2rem 1.25rem',
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
            data-testid="login-theme-light-btn"
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
            data-testid="login-theme-dark-btn"
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

      <div style={{ maxWidth: '460px', width: '100%', position: 'relative', zIndex: 10 }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            className="brand-icon"
            style={{
              width: '68px',
              height: '68px',
              margin: '0 auto 1rem auto',
              borderRadius: '18px',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
              overflow: 'hidden',
              padding: 0
            }}
          >
            <img
              src={logoImg}
              alt="RescueRoute Logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
            <h1
              style={{
                fontSize: '2.1rem',
                fontWeight: 800,
                color: 'var(--color-text)',
                letterSpacing: '-0.03em'
              }}
            >
              RescueRoute
            </h1>
          </div>
          <p style={{ fontSize: '0.975rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
            {t('brandTagline')}
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
              Sign In
            </span>
            <Link
              to="/signup"
              style={{
                padding: '0.45rem 1.25rem',
                fontSize: '0.825rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-full)',
                color: 'var(--color-text-muted)',
                transition: 'var(--transition-smooth)'
              }}
            >
              Create Account
            </Link>
          </div>
        </div>

        {/* Login Form Card */}
        <Card style={{ boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-border)' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.35rem' }}>
                Account Sign In
              </h2>
              <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                Please sign in with your registered account credentials.
              </p>
            </div>

            {redirectNotice && !error && (
              <div
                style={{
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  color: '#b45309',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8125rem'
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{redirectNotice}</span>
              </div>
            )}

            {error && (
              <div
                style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8125rem'
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Email Field */}
            <FormField
              id="login-email"
              label="Email Address"
              type="email"
              name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder="name@organization.com"
              required
            />

            {/* Password Field */}
            <FormField
              id="login-password"
              label="Password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Enter your account password"
              required
            />

            {/* Submit Action Button */}
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              style={{
                width: '100%',
                marginTop: '0.75rem',
                padding: '0.85rem',
                fontSize: '0.95rem',
                letterSpacing: '-0.01em'
              }}
              icon={ArrowRight}
              data-testid="login-submit-btn"
            >
              {loading ? 'Authenticating...' : t('signIn')}
            </Button>

            {/* Direct Link to Signup Page */}
            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Don't have an account yet?{' '}
              <Link to="/signup" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                Sign Up for Free
              </Link>
            </div>
          </form>

          {/* Public Food Request CTA */}
          <div
            style={{
              marginTop: '1.25rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--color-border)',
              textAlign: 'center'
            }}
          >
            <Link
              to="/request-food"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--color-primary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                textDecoration: 'none'
              }}
            >
              <FileQuestion size={16} />
              <span>{t('publicRequestLink')} &rarr;</span>
            </Link>
          </div>
        </Card>

        {/* Footer info & theme toggle option */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.65rem',
            marginTop: '1.75rem',
            textAlign: 'center'
          }}
        >
          <button
            type="button"
            onClick={toggleTheme}
            data-testid="login-theme-toggle-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-secondary)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              transition: 'var(--transition-smooth)'
            }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <>
                <Sun size={14} style={{ color: '#f59e0b' }} />
                <span>Theme: Dark Mode (Click to switch)</span>
              </>
            ) : (
              <>
                <Moon size={14} style={{ color: 'var(--color-text-muted)' }} />
                <span>Theme: Light Mode (Click to switch)</span>
              </>
            )}
          </button>

          <p
            style={{
              fontSize: '0.775rem',
              color: 'var(--color-text-muted)',
              lineHeight: 1.5,
              margin: 0
            }}
          >
            RescueRoute Surplus-to-Shelter Logistics &bull; High-Performance Production System
          </p>
        </div>
      </div>
    </div>
  );
}
