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
            <div className="absolute inset-0 rounded-full bg-brand-500/20 animate-ping-slow" />
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-brand-500/10 border border-brand-500/30">
              <span className="text-3xl">📍</span>
            </div>
          </div>
          <p className="text-slate-400 text-sm">Acquiring your location…</p>
        </div>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="glass rounded-3xl p-10 max-w-md w-full text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 mx-auto flex items-center justify-center rounded-full bg-red-500/10 border border-red-500/30">
            <span className="text-4xl">🚫</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Location Access Denied</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              EchoSpot requires your location to show chat rooms within 500m. Please enable location
              access in your browser settings, then refresh this page.
            </p>
          </div>
          {error && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {error}
            </p>
          )}
          <button onClick={onRequest} className="btn-primary w-full">
            <span>📍</span> Enable Location & Retry
          </button>
          <p className="text-slate-600 text-xs">
            Your location is used only to find nearby rooms — it's never stored beyond your session.
          </p>
        </div>
      </div>
    );
  }

  // 'prompt' state — show permission request modal
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="glass rounded-3xl p-10 max-w-md w-full text-center space-y-6 animate-slide-up">
        {/* Logo */}
        <div className="space-y-2">
          <div className="w-20 h-20 mx-auto flex items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-900/50">
            <span className="text-4xl">🌐</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gradient">EchoSpot</h1>
          <p className="text-slate-400 text-sm font-medium tracking-wide uppercase">Chat Nearby. Anonymously.</p>
        </div>

        {/* Explainer */}
        <div className="space-y-3 text-left">
          {[
            { icon: '📍', text: 'Detects your real-time location' },
            { icon: '🏘️', text: 'Shows chat rooms within 500 meters' },
            { icon: '👤', text: 'Assigns you an anonymous identity — no sign-up' },
            { icon: '🔒', text: 'No PII stored — location cleared after session' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <span className="text-xl w-7 shrink-0">{icon}</span>
              <span className="text-slate-300 text-sm">{text}</span>
            </div>
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-left">
            {error}
          </p>
        )}

        <button onClick={onRequest} className="btn-primary w-full text-base py-4">
          <span>📍</span> Allow Location Access
        </button>

        <p className="text-slate-600 text-xs">
          Location is required for EchoSpot to function. We don't track you — it's used only to discover nearby rooms.
        </p>
      </div>
    </div>
  );
}
