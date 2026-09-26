import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed,
  HeartHandshake,
  PlusCircle,
  ListOrdered,
  Home,
  Sparkles,
  SlidersHorizontal,
  Truck,
  History,
  BarChart3,
  LogOut,
  X,
  FileQuestion,
  Layers
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import logoImg from '../../assets/logo.jpeg';

export default function Sidebar({ isOpen, onClose }) {
  const { currentUser, currentRole, logout } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    if (onClose) onClose();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) => (isActive ? 'active' : '');

  const normRole = (currentUser?.role || currentRole || '').toUpperCase();
  const isAdmin = normRole === 'ADMIN';
  const isDonor = normRole === 'DONOR' || isAdmin;
  const isShelter = normRole === 'SHELTER' || isAdmin;
  const isDriver = normRole === 'DRIVER' || isAdmin;

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="brand-icon" style={{ overflow: 'hidden', padding: 0 }}>
              <img src={logoImg} alt="RescueRoute Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div className="brand-name">
                <span>RescueRoute</span>
              </div>
              <span className="brand-subtitle">{t('brandTagline')}</span>
            </div>
          </div>
          {isOpen && (
            <button
              type="button"
              onClick={onClose}
              className="mobile-menu-btn"
              style={{ padding: '0.25rem', border: 'none' }}
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="sidebar-content">
          {/* Donor Links */}
          {isDonor && (
            <div className="nav-section">
              <div className="nav-section-title">{t('foodDonor')}</div>
              <ul className="nav-list">
                <li className="nav-item">
                  <NavLink to="/donor" end className={navLinkClass} onClick={onClose}>
                    <HeartHandshake size={16} />
                    <span>Donor Dashboard</span>
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/donor/create-donation" className={navLinkClass} onClick={onClose}>
                    <PlusCircle size={16} />
                    <span>{t('createDonation')}</span>
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/donor/donations" className={navLinkClass} onClick={onClose}>
                    <ListOrdered size={16} />
                    <span>{t('donationsList')}</span>
                  </NavLink>
                </li>
              </ul>
            </div>
          )}

          {/* Shelter Links */}
          {isShelter && (
            <div className="nav-section">
              <div className="nav-section-title">{t('shelterFoodBank')}</div>
              <ul className="nav-list">
                <li className="nav-item">
                  <NavLink to="/shelter" end className={navLinkClass} onClick={onClose}>
                    <Home size={16} />
                    <span>Shelter Dashboard</span>
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/shelter/matches" className={navLinkClass} onClick={onClose}>
                    <Sparkles size={16} />
                    <span>{t('surplusMatches')}</span>
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/shelter/capacity" className={navLinkClass} onClick={onClose}>
                    <SlidersHorizontal size={16} />
                    <span>Capacity & Dietary Rules</span>
                  </NavLink>
                </li>
              </ul>
            </div>
          )}

          {/* Volunteer Driver Links */}
          {isDriver && (
            <div className="nav-section">
              <div className="nav-section-title">{t('volunteerDriver')}</div>
              <ul className="nav-list">
                <li className="nav-item">
                  <NavLink to="/driver" end className={navLinkClass} onClick={onClose}>
                    <Truck size={16} />
                    <span>Driver Dashboard</span>
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/driver/deliveries" className={navLinkClass} onClick={onClose}>
                    <History size={16} />
                    <span>{t('deliveryHistory')}</span>
                  </NavLink>
                </li>
              </ul>
            </div>
          )}

          {/* Community Food Requests (Public Access) */}
          <div className="nav-section">
            <div className="nav-section-title">Community Outreach</div>
            <ul className="nav-list">
              <li className="nav-item">
                <NavLink to="/request-food" className={navLinkClass} onClick={onClose}>
                  <FileQuestion size={16} />
                  <span>Request Food Aid</span>
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Global Analytics & Impact */}
          <div className="nav-section">
            <div className="nav-section-title">{isAdmin ? t('adminCoordinator') : 'Platform Impact'}</div>
            <ul className="nav-list">
              <li className="nav-item">
                <NavLink to="/dashboard" className={navLinkClass} onClick={onClose}>
                  <BarChart3 size={16} />
                  <span>{isAdmin ? 'Impact & Request Desk' : 'Community Impact'}</span>
                </NavLink>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer with Active Persona and System Status */}
        <div className="sidebar-footer">
          <div className="user-role-badge">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-surface-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {currentUser?.avatar || '👤'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--color-text)',
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '120px'
                  }}
                >
                  {currentUser?.name || 'Authorized User'}
                </div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--color-text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '120px'
                  }}
                >
                  {currentUser?.email}
                </div>
              </div>
            </div>
            <span className="role-pill">{normRole}</span>
          </div>


          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleLogout}
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.2rem' }}
          >
            <LogOut size={14} />
            <span>{t('signOut')}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
