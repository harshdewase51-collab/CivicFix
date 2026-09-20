import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Laptop } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="theme-toggle-group"
      role="group"
      aria-label="Theme selector"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'var(--bg-muted)',
        borderRadius: 'var(--radius-full)',
        padding: '2px',
        border: '1px solid var(--border)'
      }}
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        title="Light theme"
        aria-label="Light theme"
        aria-pressed={theme === 'light'}
        style={{
          background: theme === 'light' ? 'var(--bg-surface)' : 'transparent',
          color: theme === 'light' ? 'var(--primary)' : 'var(--text-muted)',
          border: 'none',
          borderRadius: 'var(--radius-full)',
          padding: '0.35rem 0.6rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          fontSize: '0.75rem',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: theme === 'light' ? 'var(--shadow-sm)' : 'none',
          transition: 'all 0.15s ease'
        }}
      >
        <Sun size={14} />
        <span className="theme-toggle-label">Light</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        title="Dark theme"
        aria-label="Dark theme"
        aria-pressed={theme === 'dark'}
        style={{
          background: theme === 'dark' ? 'var(--bg-surface)' : 'transparent',
          color: theme === 'dark' ? 'var(--primary)' : 'var(--text-muted)',
          border: 'none',
          borderRadius: 'var(--radius-full)',
          padding: '0.35rem 0.6rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          fontSize: '0.75rem',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: theme === 'dark' ? 'var(--shadow-sm)' : 'none',
          transition: 'all 0.15s ease'
        }}
      >
        <Moon size={14} />
        <span className="theme-toggle-label">Dark</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('system')}
        title="System preference"
        aria-label="System preference"
        aria-pressed={theme === 'system'}
        style={{
          background: theme === 'system' ? 'var(--bg-surface)' : 'transparent',
          color: theme === 'system' ? 'var(--primary)' : 'var(--text-muted)',
          border: 'none',
          borderRadius: 'var(--radius-full)',
          padding: '0.35rem 0.6rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          fontSize: '0.75rem',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: theme === 'system' ? 'var(--shadow-sm)' : 'none',
          transition: 'all 0.15s ease'
        }}
      >
        <Laptop size={14} />
        <span className="theme-toggle-label">Auto</span>
      </button>
    </div>
  );
}
