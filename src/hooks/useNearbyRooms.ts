import { useState, useEffect, useCallback, useRef } from 'react';
import type { Room, Coords } from '../types';
import { getNearbyRooms } from '../services/api';

const POLL_INTERVAL = 15000; // 15s

function haversineDistance(a: Coords, b: Coords): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function useNearbyRooms(coords: Coords | null) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchedCoordsRef = useRef<Coords | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRooms = useCallback(async (c: Coords) => {
    setLoading(true);
    setError(null);
    try {
      const r = await getNearbyRooms(c.lat, c.lng);
      setRooms(r);
      lastFetchedCoordsRef.current = c;
    } catch (e: any) {
      setError('Failed to fetch nearby rooms.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!coords) return;
    const last = lastFetchedCoordsRef.current;
    const moved = last ? haversineDistance(coords, last) > 30 : true;
    if (moved) fetchRooms(coords);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (coords) fetchRooms(coords);
    }, POLL_INTERVAL);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [coords, fetchRooms]);

  const refresh = useCallback(() => {
    if (coords) fetchRooms(coords);
  }, [coords, fetchRooms]);

  return { rooms, setRooms, loading, error, refresh };
}
