import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Sparkles,
  HeartHandshake,
  PlusCircle,
  ListOrdered,
  Home,
  SlidersHorizontal,
  Truck,
  History,
  BarChart3,
  Moon,
  Sun,
  X,
  ArrowRight,
  Command,
  MessageSquarePlus
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function CommandPalette({ isOpen, onClose, onToggleTheme, onOpenFeedback, currentTheme }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { currentRole } = useApp();

  const commandItems = [
    // Fast Navigation
    {
      id: 'create-donation',
      title: 'Create Surplus Donation',
      category: 'Food Donor',
      icon: PlusCircle,
      action: () => {
        navigate('/donor/create-donation');
        onClose();
      }
    },
    {
      id: 'donor-dashboard',
      title: 'Donor Portal & Active Postings',
      category: 'Food Donor',
      icon: HeartHandshake,
      action: () => {
        navigate('/donor');
        onClose();
      }
    },
    {
      id: 'donor-donations',
      title: 'All Surplus Donations List',
      category: 'Food Donor',
      icon: ListOrdered,
      action: () => {
        navigate('/donor/donations');
        onClose();
      }
    },
    {
      id: 'shelter-dashboard',
      title: 'Shelter Real-Time Dashboard',
      category: 'Shelter & Food Bank',
      icon: Home,
      action: () => {
        navigate('/shelter');
        onClose();
      }
    },
    {
      id: 'shelter-matches',
      title: 'Smart Surplus Matches & AI Explanations',
      category: 'Shelter & Food Bank',
      icon: Sparkles,
      action: () => {
        navigate('/shelter/matches');
        onClose();
      }
    },
    {
      id: 'shelter-capacity',
      title: 'Shelter Capacity & Intake Rules',
      category: 'Shelter & Food Bank',
      icon: SlidersHorizontal,
      action: () => {
        navigate('/shelter/capacity');
        onClose();
      }
    },
    {
      id: 'driver-dashboard',
      title: 'Volunteer Driver Dispatch & Route Map',
      category: 'Volunteer Drivers',
      icon: Truck,
      action: () => {
        navigate('/driver');
        onClose();
      }
    },
    {
      id: 'driver-deliveries',
      title: 'Completed Rescue Deliveries History',
      category: 'Volunteer Drivers',
      icon: History,
      action: () => {
        navigate('/driver/deliveries');
        onClose();
      }
    },
    {
      id: 'impact-analytics',
      title: 'City-Wide Rescue Impact & Analytics',
      category: 'Global Analytics',
      icon: BarChart3,
      action: () => {
        navigate('/dashboard');
        onClose();
      }
    },
    // Theme toggle
    {
      id: 'theme-toggle',
      title: currentTheme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme',
      category: 'Appearance',
      icon: currentTheme === 'dark' ? Sun : Moon,
      action: () => {
        if (onToggleTheme) onToggleTheme();
        onClose();
      }
    },
    // Feedback
    {
      id: 'give-feedback',
      title: 'Send Feedback or Report Issue',
      category: 'Community & Feedback',
      icon: MessageSquarePlus,
      action: () => {
        if (onOpenFeedback) onOpenFeedback();
        else onClose();
      }
    }
  ].filter(item => item.category === 'Appearance' || item.category === 'Community & Feedback' || item.category === 'Global Analytics' && currentRole === 'admin' || item.category === 'Food Donor' && currentRole === 'donor' || item.category === 'Shelter & Food Bank' && currentRole === 'shelter' || item.category === 'Volunteer Drivers' && currentRole === 'driver');

  const filteredItems = commandItems.filter((item) => {
    const text = `${item.title} ${item.category}`.toLowerCase();
    return text.includes(query.toLowerCase());
  });

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems, onClose]);

  if (!isOpen) return null;

  return (
    <div className="command-palette-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="command-palette-modal" onClick={(e) => e.stopPropagation()}>
        {/* Search Input Bar */}
        <div className="command-palette-header">
          <Search size={20} className="command-palette-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="command-palette-input"
            placeholder="Type a command or jump to page... (e.g. 'donor', 'route', 'matches')"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <div className="command-palette-shortcut-badge">ESC</div>
          <button
            type="button"
            className="command-palette-close-btn"
            onClick={onClose}
            aria-label="Close command palette"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results List */}
        <div className="command-palette-list">
          {filteredItems.length === 0 ? (
            <div className="command-palette-empty">
              <Search size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
              <div>No results matching "{query}"</div>
              <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Try searching for "donation", "shelter", or "driver"</span>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  className={`command-palette-item ${isSelected ? 'selected' : ''}`}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => item.action()}
                >
                  <div className="command-palette-item-icon-box">
                    <Icon size={18} />
                  </div>
                  <div className="command-palette-item-content">
                    <div className="command-palette-item-title">{item.title}</div>
                    <div className="command-palette-item-category">{item.category}</div>
                  </div>
                  <ArrowRight size={14} className="command-palette-item-arrow" />
                </div>
              );
            })
          )}
        </div>

        {/* Command Palette Footer */}
        <div className="command-palette-footer">
          <div className="command-palette-hints">
            <span><kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
            <span><kbd>↵</kbd> to select</span>
            <span><kbd>esc</kbd> to close</span>
          </div>
          <div className="command-palette-brand">
            <Sparkles size={12} style={{ color: 'var(--color-primary)' }} />
            RescueRoute Quick Navigator
          </div>
        </div>
      </div>
    </div>
  );
}
