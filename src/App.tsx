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
    <div className="flex flex-col h-full" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--card)',
            color: 'var(--card-foreground)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            fontSize: '13px',
            fontFamily: 'Open Sans, sans-serif',
          },
        }}
      />

      {/* Top nav */}
      <header
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{
          background: 'var(--card)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center gap-2.5">
          {/* Logo mark */}
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--primary)' }}
          >
            <span className="text-xs">🌐</span>
          </div>
          <span className="font-extrabold text-base tracking-tight" style={{ color: 'var(--foreground)' }}>
            Echo<span className="text-gradient">Spot</span>
          </span>
          <span
            className="badge text-[10px] hidden sm:inline-flex"
            style={{
              background: 'var(--tw-blue-10)',
              color: 'var(--primary)',
              border: '1px solid var(--tw-blue-20)',
            }}
          >
            Beta
          </span>
        </div>

        <div className="flex items-center gap-2">
          {coords && (
            <div
              className="hidden sm:flex items-center gap-1.5 text-xs"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse-slow inline-block"
                style={{ background: '#22c55e' }}
              />
              Location active
            </div>
          )}
          {user && (
            <div
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
            >
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
              >
                {user.display_name[0].toUpperCase()}
              </div>
              <span className="text-xs font-semibold max-w-[80px] truncate" style={{ color: 'var(--foreground)' }}>
                {user.display_name}
              </span>
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
                  <div
                    className="absolute inset-0 rounded-full animate-ping-slow"
                    style={{ background: 'var(--tw-blue-10)' }}
                  />
                  <div
                    className="relative flex items-center justify-center w-16 h-16 rounded-full"
                    style={{
                      background: 'var(--tw-blue-10)',
                      border: '1px solid var(--tw-blue-20)',
                    }}
                  >
                    <svg
                      className="w-6 h-6 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                      style={{ color: 'var(--primary)' }}
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  Setting up your anonymous profile…
                </p>
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
