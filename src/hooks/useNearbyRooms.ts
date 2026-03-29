import { useState, useEffect, useCallback, useRef } from 'react';
import type { Room, Coords } from '../types';
import { getNearbyRooms } from '../services/api';

export function useNearbyRooms(coords: Coords | null) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchRooms = useCallback(async (c: Coords) => {
    setLoading(true);
    setError(null);
    try {
      const r = await getNearbyRooms(c.lat, c.lng);
      setRooms(r);
    } catch {
      setError('Failed to fetch nearby rooms.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch once when coordinates first become available
  useEffect(() => {
    if (!coords || hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchRooms(coords);
  }, [coords, fetchRooms]);

  // Manual refresh — called only on button click
  const refresh = useCallback(() => {
    if (coords) fetchRooms(coords);
  }, [coords, fetchRooms]);

  return { rooms, setRooms, loading, error, refresh };
}
