import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ROLE_DETAILS } from '../../data/users';

/**
 * Route protection wrapper that prevents unauthenticated users from bypassing login.
 * Enforces role-based access control (RBAC) across donor, shelter, driver, and admin routes.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, currentRole, isAuthLoading } = useApp();
  const location = useLocation();

  if (isAuthLoading) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          color: 'var(--color-text-muted)'
        }}
      >
        <div className="loading-spinner" />
        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Verifying credentials...</span>
      </div>
    );
  }

  // 1. If not authenticated, redirect to /login and preserve attempted URL
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Role-based authorization: Verify role access permissions
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (currentUser.role || currentRole || '').toLowerCase();
    const isAdmin = userRole === 'admin';
    const isAuthorized = isAdmin || allowedRoles.map(r => r.toLowerCase()).includes(userRole);

    if (!isAuthorized) {
      const targetDashboard =
        ROLE_DETAILS[userRole]?.defaultPath ||
        (userRole === 'admin' ? '/dashboard' : `/${userRole}`);
      return <Navigate to={targetDashboard} replace />;
    }
  }

  return children;
}
