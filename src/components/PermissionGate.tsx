import React from 'react';
import type { LocationPermission } from '../types';

interface Props {
  permission: LocationPermission;
  error: string | null;
  onRequest: () => void;
}

export default function PermissionGate({ permission, error, onRequest }: Props) {
  if (permission === 'loading') {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="relative mx-auto w-20 h-20">
            <div
              className="absolute inset-0 rounded-full animate-ping-slow"
              style={{ background: 'var(--tw-blue-10)' }}
            />
            <div
              className="relative flex items-center justify-center w-20 h-20 rounded-full"
              style={{ background: 'var(--tw-blue-10)', border: '1px solid var(--tw-blue-20)' }}
            >
              <span className="text-3xl">📍</span>
            </div>
          </div>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Acquiring your location…
          </p>
        </div>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div
          className="rounded-[var(--radius)] p-10 max-w-md w-full text-center space-y-6 animate-fade-in"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div
            className="w-20 h-20 mx-auto flex items-center justify-center rounded-full"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            <span className="text-4xl">🚫</span>
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              Location Access Denied
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              EchoSpot requires your location to show chat rooms within 500m. Please enable location
              access in your browser settings, then refresh this page.
            </p>
          </div>
          {error && (
            <p
              className="text-xs px-4 py-3 rounded-xl"
              style={{
                color: 'var(--destructive)',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              {error}
            </p>
          )}
          <button onClick={onRequest} className="btn-primary w-full">
            <span>📍</span> Enable Location &amp; Retry
          </button>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)', opacity: 0.6 }}>
            Your location is used only to find nearby rooms — it's never stored beyond your session.
          </p>
        </div>
      </div>
    );
  }

  // 'prompt' — permission request screen
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div
        className="rounded-[var(--radius)] p-10 max-w-md w-full text-center space-y-6 animate-slide-up"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        {/* Logo */}
        <div className="space-y-2">
          <div
            className="w-20 h-20 mx-auto flex items-center justify-center rounded-2xl shadow-lg"
            style={{ background: 'var(--primary)' }}
          >
            <span className="text-4xl">🌐</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gradient">EchoSpot</h1>
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
            Chat Nearby. Anonymously.
          </p>
        </div>

        {/* Feature list */}
        <div className="space-y-3 text-left">
          {[
            { icon: '📍', text: 'Detects your real-time location' },
            { icon: '🏘️', text: 'Shows chat rooms within 500 meters' },
            { icon: '👤', text: 'Assigns you an anonymous identity — no sign-up' },
            { icon: '🔒', text: 'No PII stored — location cleared after session' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <span className="text-xl w-7 shrink-0">{icon}</span>
              <span className="text-sm" style={{ color: 'var(--foreground)' }}>{text}</span>
            </div>
          ))}
        </div>

        {error && (
          <p
            className="text-xs px-4 py-3 rounded-xl text-left"
            style={{
              color: 'var(--destructive)',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
            }}
          >
            {error}
          </p>
        )}

        <button onClick={onRequest} className="btn-primary w-full text-base py-4">
          <span>📍</span> Allow Location Access
        </button>

        <p className="text-xs" style={{ color: 'var(--muted-foreground)', opacity: 0.6 }}>
          Location is required for EchoSpot to function. We don't track you — it's used only to discover nearby rooms.
        </p>
      </div>
    </div>
  );
}
