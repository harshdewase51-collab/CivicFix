import React from 'react';

export default function LoadingSpinner({ message = 'Loading...', size = 'md' }) {
  const dim = size === 'sm' ? 18 : size === 'lg' ? 36 : 24;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1rem', gap: '0.75rem', color: 'var(--text-muted)' }}>
      <svg
        style={{ animation: 'spin 1s linear infinite', width: `${dim}px`, height: `${dim}px`, color: 'var(--primary)' }}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.2" />
        <path d="M4 12a8 8 0 018-8v8H4z" fill="currentColor" />
      </svg>
      {message && <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{message}</span>}
    </div>
  );
}
