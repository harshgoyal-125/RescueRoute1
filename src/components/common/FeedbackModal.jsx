import React, { useState } from 'react';
import {
  MessageSquarePlus,
  Star,
  Sparkles,
  Send,
  X,
  CheckCircle2,
  Smile,
  Frown,
  Meh,
  Heart,
  History,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import Button from './Button';
import FormField from './FormField';

export default function FeedbackModal({ isOpen, onClose }) {
  const { currentUser, currentRole, submitFeedback, feedbacks } = useApp();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'history'
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState('General Experience');
  const [comments, setComments] = useState('');
  const [contactEmail, setContactEmail] = useState(currentUser?.email || '');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    'General Experience',
    'Feature Suggestion',
    'Bug / Issue',
    'AI Match Explanation',
    'Driver Route & Maps'
  ];

  const emojis = [
    { score: 1, label: 'Very Unsatisfied', icon: Frown, color: '#ef4444' },
    { score: 2, label: 'Unsatisfied', icon: Frown, color: '#f97316' },
    { score: 3, label: 'Neutral', icon: Meh, color: '#eab308' },
    { score: 4, label: 'Satisfied', icon: Smile, color: '#10b981' },
    { score: 5, label: 'Delighted', icon: Heart, color: '#ec4899' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!comments.trim()) {
      setError('Please provide a brief comment or suggestion.');
      return;
    }

    submitFeedback({
      rating,
      category,
      comments: comments.trim(),
      email: contactEmail || currentUser?.email || 'anonymous',
      role: currentRole,
      userName: currentUser?.name || 'RescueRoute User'
    });

    setSubmitted(true);
    setError('');

    addToast({
      type: 'success',
      title: 'Feedback Received',
      message: 'Thank you! Your feedback helps optimize food rescue routes for our communities.'
    });

    setTimeout(() => {
      setSubmitted(false);
      setComments('');
      onClose();
    }, 2200);
  };

  if (!isOpen) return null;

  return (
    <div className="feedback-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="feedback-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="feedback-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-subtle)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <MessageSquarePlus size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
                Platform Feedback
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Help us improve RescueRoute for donors, shelters, and drivers
              </p>
            </div>
          </div>
          <button
            type="button"
            className="feedback-modal-close-btn"
            onClick={onClose}
            aria-label="Close feedback dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switch between Give Feedback and Past Feedback */}
        <div style={{ padding: '0 1.5rem', display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('new')}
            style={{
              padding: '0.6rem 0.85rem',
              fontSize: '0.825rem',
              fontWeight: 700,
              border: 'none',
              background: 'transparent',
              color: activeTab === 'new' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'new' ? '2px solid var(--color-primary)' : '2px solid transparent',
              cursor: 'pointer'
            }}
          >
            Save Feedback
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            style={{
              padding: '0.6rem 0.85rem',
              fontSize: '0.825rem',
              fontWeight: 700,
              border: 'none',
              background: 'transparent',
              color: activeTab === 'history' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'history' ? '2px solid var(--color-primary)' : '2px solid transparent',
              cursor: 'pointer'
            }}
          >
            History ({feedbacks.length})
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.25rem 1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary-subtle)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto'
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.35rem' }}>
                Thank You for Your Feedback!
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', maxWidth: '340px', margin: '0 auto' }}>
                Your insights directly shape our real-time matching algorithms and dispatch workflows.
              </p>
            </div>
          ) : activeTab === 'new' ? (
            <form onSubmit={handleSubmit}>
              {/* Star / Sentiment Rating */}
              <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
                <label className="form-label" style={{ marginBottom: '0.65rem' }}>
                  How would you rate your experience?
                </label>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.3rem',
                        transition: 'transform 0.15s ease'
                      }}
                      aria-label={`${star} star`}
                    >
                      <Star
                        size={28}
                        style={{
                          fill: star <= (hoverRating || rating) ? '#f59e0b' : 'transparent',
                          color: star <= (hoverRating || rating) ? '#f59e0b' : 'var(--slate-300)'
                        }}
                      />
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                  {rating === 5 && '🌟 Exceptional & Seamless'}
                  {rating === 4 && '😊 Very Good Experience'}
                  {rating === 3 && '😐 Average / Needs Work'}
                  {rating === 2 && '🙁 Below Expectations'}
                  {rating === 1 && '⚠️ Major Issue Encountered'}
                </span>
              </div>

              {/* Category Pills */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ marginBottom: '0.45rem' }}>
                  Category:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {categories.map((cat) => {
                    const isSelected = category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderRadius: 'var(--radius-full)',
                          border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                          backgroundColor: isSelected ? 'var(--color-primary-subtle)' : 'var(--color-surface)',
                          color: isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                          cursor: 'pointer',
                          transition: 'var(--transition-smooth)'
                        }}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error banner */}
              {error && (
                <div
                  style={{
                    backgroundColor: 'var(--color-danger-subtle)',
                    border: '1px solid var(--color-danger-border)',
                    color: 'var(--color-danger)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '0.75rem',
                    fontSize: '0.775rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              {/* Comments Textarea */}
              <FormField
                id="feedback-comments"
                label="Your Thoughts, Suggestions, or Issue Description:"
                type="textarea"
                rows={4}
                value={comments}
                onChange={(e) => {
                  setComments(e.target.value);
                  if (error) setError('');
                }}
                placeholder="What can we do to improve? Be as detailed as you like..."
                required
              />

              {/* Email (Optional) */}
              <FormField
                id="feedback-email"
                label="Contact Email (Optional for followup):"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="you@domain.org"
                helpText={`Submitting as ${currentUser?.name || 'Active User'} (${currentRole.toUpperCase()})`}
              />

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <Button variant="outline" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" icon={Send}>
                  Send Feedback
                </Button>
              </div>
            </form>
          ) : (
            // Feedback History Tab
            <div>
              {feedbacks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-muted)' }}>
                  <History size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                  <div>No feedback submitted yet.</div>
                  <span style={{ fontSize: '0.75rem' }}>Your past submissions will appear here.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {feedbacks.map((fb) => (
                    <div
                      key={fb.id}
                      style={{
                        padding: '0.85rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-surface-muted)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              color: 'var(--color-primary)',
                              backgroundColor: 'var(--color-primary-subtle)',
                              padding: '0.15rem 0.5rem',
                              borderRadius: 'var(--radius-full)'
                            }}
                          >
                            {fb.category}
                          </span>
                          <span style={{ fontSize: '0.85rem' }}>
                            {'★'.repeat(fb.rating)}
                            <span style={{ color: 'var(--slate-300)' }}>{'★'.repeat(5 - fb.rating)}</span>
                          </span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                          {new Date(fb.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.825rem', color: 'var(--color-text)' }}>
                        "{fb.comments}"
                      </p>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.3rem' }}>
                        By {fb.user} ({fb.role})
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
