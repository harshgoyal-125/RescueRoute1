import React from 'react';
import {
  Menu,
  Truck,
  ShieldCheck,
  HeartHandshake,
  Home,
  LogOut,
  Search,
  Sun,
  Moon,
  Sparkles,
  Command,
  MessageSquarePlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import NotificationCenter from './NotificationCenter';

export default function Navbar({
  onMobileMenuToggle,
  onOpenCommandPalette,
  onOpenFeedback,
  theme = 'light',
  onToggleTheme
}) {
  const { currentUser, currentRole, logout } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleIcon = () => {
    switch (currentRole) {
      case 'donor':
        return <HeartHandshake size={15} />;
      case 'shelter':
        return <Home size={15} />;
      case 'driver':
        return <Truck size={15} />;
      default:
        return <ShieldCheck size={15} />;
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onMobileMenuToggle}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        {/* User Info & Role Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>
            {currentUser?.name || 'RescueRoute Portal'}
          </span>
          <span
            className="role-pill"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            {getRoleIcon()}
            <span>{currentRole}</span>
          </span>
        </div>

        {/* Live Status Indicator Pill (Desktop) */}
        <div
          className="desktop-only"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.2rem 0.65rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-primary-subtle)',
            border: '1px solid var(--color-primary-border)',
            fontSize: '0.72rem',
            fontWeight: 600,
            color: 'var(--color-primary)'
          }}
        >
          <span className="live-status-pulse" />
          <span>Live Dispatch Active</span>
        </div>
      </div>

      <div className="navbar-right">
        {/* Quick Search / Command Palette Trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="desktop-only"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.4rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-muted)',
            fontSize: '0.8rem',
            cursor: 'pointer',
            transition: 'var(--transition-smooth)'
          }}
          title="Open Command Palette (Ctrl+K or ⌘K)"
        >
          <Search size={14} style={{ color: 'var(--color-primary)' }} />
          <span>Jump to...</span>
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '0.1rem 0.35rem',
              borderRadius: '4px',
              backgroundColor: 'var(--color-surface-muted)',
              border: '1px solid var(--color-border)'
            }}
          >
            ⌘K
          </span>
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="header-icon-btn"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle visual theme"
        >
          {theme === 'dark' ? (
            <Sun size={18} style={{ color: '#f59e0b' }} />
          ) : (
            <Moon size={18} style={{ color: 'var(--color-text-secondary)' }} />
          )}
        </button>

        {/* Consolidated Header Feedback Button */}
        <button
          type="button"
          onClick={onOpenFeedback}
          className="header-icon-btn"
          title="Share Feedback or Suggestions"
          aria-label="Open Feedback Dialog"
        >
          <MessageSquarePlus size={18} style={{ color: 'var(--color-primary)' }} />
        </button>

        {/* Notification Center */}
        <NotificationCenter />

        {/* Sign Out Button */}
        <button
          type="button"
          onClick={handleLogout}
          className="btn btn-outline btn-sm"
          style={{ padding: '0.4rem 0.75rem' }}
          title="Sign out of your account"
        >
          <LogOut size={14} />
          <span className="desktop-only">{t('signOut')}</span>
        </button>
      </div>
    </header>
  );
}
