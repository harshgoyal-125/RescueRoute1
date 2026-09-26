import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Trash2,
  Package,
  Sparkles,
  Truck,
  CheckCircle,
  ExternalLink
} from 'lucide-react';


export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const handleItemClick = (notif) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, unread: false } : n))
    );
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <div className="notification-center-wrapper" ref={menuRef}>
      <button
        type="button"
        className={`notification-trigger-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Notifications (${unreadCount} unread)`}
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="notification-badge-dot">
            <span className="notification-badge-ping" />
            <span className="notification-badge-count">{unreadCount}</span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text)' }}>
                Activity & Alerts
              </span>
              {unreadCount > 0 && (
                <span className="notification-unread-pill">{unreadCount} new</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="notification-action-link"
                  onClick={markAllRead}
                  title="Mark all as read"
                >
                  <CheckCheck size={14} />
                  <span>Mark read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  className="notification-action-link"
                  onClick={clearAll}
                  title="Clear all notifications"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <Bell size={28} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <div>All caught up!</div>
                <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>No new alerts at this time</span>
              </div>
            ) : (
              notifications.map((notif) => {
                const Icon = notif.icon;
                return (
                  <div
                    key={notif.id}
                    className={`notification-item ${notif.unread ? 'unread' : ''}`}
                    onClick={() => handleItemClick(notif)}
                  >
                    <div
                      className="notification-item-icon"
                      style={{ backgroundColor: `${notif.color}18`, color: notif.color }}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="notification-item-content">
                      <div className="notification-item-top">
                        <span className="notification-item-title">{notif.title}</span>
                        <span className="notification-item-time">{notif.time}</span>
                      </div>
                      <p className="notification-item-message">{notif.message}</p>
                    </div>
                    {notif.unread && <span className="notification-unread-dot" />}
                  </div>
                );
              })
            )}
          </div>

          <div className="notification-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <span className="live-status-pulse" />
              Live Webhook & Engine Stream Active
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
