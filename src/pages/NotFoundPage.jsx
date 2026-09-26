import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, ArrowLeft, Home } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem'
      }}
    >
      <div style={{ maxWidth: '440px', width: '100%', textAlign: 'center' }}>
        <Card>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--slate-100)',
              color: 'var(--slate-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}
          >
            <HelpCircle size={32} />
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '0.5rem' }}>
            404
          </h1>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.5rem' }}>
            Page Not Found
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            The requested food rescue route or resource could not be found. Please check the URL or return to your role dashboard.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
            <Button
              variant="outline"
              icon={ArrowLeft}
              onClick={() => navigate(-1)}
            >
              Go Back
            </Button>
            <Button
              variant="primary"
              icon={Home}
              onClick={() => navigate('/dashboard')}
            >
              Impact Home
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
