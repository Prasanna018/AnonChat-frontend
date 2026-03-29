import { useState, useEffect, useCallback, useRef } from 'react';
import type { Coords, LocationPermission } from '../types';
import { updateLocation } from '../services/api';

const THROTTLE_INTERVAL = 10000; // 10s
const MOVEMENT_THRESHOLD = 50;   // 50m
const DEBOUNCE_DELAY = 2000;      // 2s

function haversineDistance(a: Coords, b: Coords): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function useGeolocation() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [permission, setPermission] = useState<LocationPermission>('loading');
  const [error, setError] = useState<string | null>(null);

  const lastSentRef = useRef<{ coords: Coords; time: number } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const isAuthenticated = !!localStorage.getItem('echospot_token');

  const sendLocation = useCallback(async (c: Coords) => {
    if (!isAuthenticated) return;
    const now = Date.now();
    const last = lastSentRef.current;
    const timeDiff = last ? now - last.time : Infinity;
    const dist = last ? haversineDistance(c, last.coords) : Infinity;
    if (timeDiff < THROTTLE_INTERVAL && dist < MOVEMENT_THRESHOLD) return;

    try {
      await updateLocation(c.lat, c.lng);
      lastSentRef.current = { coords: c, time: now };
    } catch (e) {
      // silent fail
    }
  }, [isAuthenticated]);

  const handlePosition = useCallback((pos: GeolocationPosition) => {
    const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    setCoords(c);
    setPermission('granted');
    setError(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => sendLocation(c), DEBOUNCE_DELAY);
  }, [sendLocation]);

  const handleError = useCallback((err: GeolocationPositionError) => {
    if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
      setPermission('denied');
      setError('Location access denied. Please enable it in your browser settings.');
    } else if (err.code === GeolocationPositionError.TIMEOUT) {
      setError('Location request timed out. Retrying...');
    } else {
      setError('Unable to determine your location.');
    }
  }, []);

  const requestLocation = useCallback(async () => {
    setPermission('loading');
    try {
      const perm = await navigator.permissions.query({ name: 'geolocation' });
      if (perm.state === 'denied') { setPermission('denied'); return; }

      navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
        enableHighAccuracy: true, timeout: 10000, maximumAge: 0,
      });

      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = navigator.geolocation.watchPosition(handlePosition, handleError, {
        enableHighAccuracy: true, maximumAge: 5000, timeout: 10000,
      });
    } catch {
      setError('Geolocation is not supported by your browser.');
      setPermission('denied');
    }
  }, [handlePosition, handleError]);

  useEffect(() => {
    requestLocation();
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [requestLocation]);

  return { coords, permission, error, requestLocation };
}
