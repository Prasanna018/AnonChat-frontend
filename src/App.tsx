import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useGeolocation } from './hooks/useGeolocation';
import PermissionGate from './components/PermissionGate';
import Dashboard from './components/Dashboard';
import type { User } from './types';
import { createAnonUser } from './services/api';

function App() {
  const { coords, permission, error, requestLocation } = useGeolocation();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Initialize anonymous user once location is granted
  useEffect(() => {
    if (permission !== 'granted') return;

    const storedToken = localStorage.getItem('echospot_token');
    const storedUserId = localStorage.getItem('echospot_user_id');
    const storedName = localStorage.getItem('echospot_display_name');

    if (storedToken && storedUserId && storedName) {
      setUser({ user_id: storedUserId, display_name: storedName, token: storedToken });
      return;
    }

    const initUser = async () => {
      setAuthLoading(true);
      try {
        const u = await createAnonUser();
        localStorage.setItem('echospot_token', u.token);
        localStorage.setItem('echospot_user_id', u.user_id);
        localStorage.setItem('echospot_display_name', u.display_name);
        setUser(u);
      } catch (e) {
        console.error('Failed to create anonymous user', e);
      } finally {
        setAuthLoading(false);
      }
    };
    initUser();
  }, [permission]);

  const showPermissionGate = permission !== 'granted' || !user;

  return (
    <div className="flex flex-col h-full bg-surface-DEFAULT">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid rgba(148,163,184,0.1)',
            borderRadius: '12px',
            fontSize: '13px',
          },
        }}
      />

      {/* Top nav */}
      <header className="flex items-center justify-between px-5 py-3.5 glass border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <span className="text-sm">🌐</span>
          </div>
          <span className="font-extrabold text-lg text-white tracking-tight">Echo<span className="text-gradient">Spot</span></span>
          <span className="badge bg-brand-500/10 text-brand-300 border border-brand-500/20 ml-1 text-xs">Beta</span>
        </div>

        <div className="flex items-center gap-3">
          {coords && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow inline-block" />
              Location active
            </div>
          )}
          {user && (
            <div className="flex items-center gap-2 glass rounded-xl px-3 py-1.5">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-brand-600 flex items-center justify-center text-xs font-bold text-white">
                {user.display_name[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium text-slate-300">{user.display_name}</span>
            </div>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        {showPermissionGate ? (
          authLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center space-y-4 animate-fade-in">
                <div className="relative mx-auto w-16 h-16">
                  <div className="absolute inset-0 rounded-full bg-brand-500/20 animate-ping-slow" />
                  <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-brand-500/10 border border-brand-500/30">
                    <svg className="w-6 h-6 text-brand-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  </div>
                </div>
                <p className="text-slate-400 text-sm">Setting up your anonymous profile…</p>
              </div>
            </div>
          ) : (
            <PermissionGate permission={permission} error={error} onRequest={requestLocation} />
          )
        ) : (
          <Dashboard user={user!} coords={coords!} />
        )}
      </div>
    </div>
  );
}

export default App;
