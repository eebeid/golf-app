'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error);
    console.error(error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center',
      background: 'var(--bg-main)',
      color: 'var(--text-main)'
    }}>
      <h1 style={{ color: 'var(--accent)', fontSize: '2.5rem', marginBottom: '1rem' }}>
        Oops! Something went wrong.
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: '500px' }}>
        An unexpected error occurred. Our team has been notified and we're working on a fix.
      </p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          onClick={() => reset()}
          className="btn"
          style={{ padding: '0.75rem 1.5rem' }}
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="btn"
          style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid var(--glass-border)' }}
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
