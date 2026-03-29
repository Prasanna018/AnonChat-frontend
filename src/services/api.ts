import axios from 'axios';
import type { Room, User } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '';
const BASE_URL = API_URL ? `${API_URL}/api` : '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Inject auth token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('echospot_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const createAnonUser = async (): Promise<User> => {
  const { data } = await api.post('/auth/anon');
  return data;
};

export const updateLocation = async (lat: number, lng: number): Promise<void> => {
  await api.post('/location', { lat, lng });
};

export const getNearbyRooms = async (lat: number, lng: number): Promise<Room[]> => {
  const { data } = await api.get('/rooms/nearby', { params: { lat, lng } });
  return data.rooms;
};

export const createRoom = async (lat: number, lng: number): Promise<Room> => {
  const { data } = await api.post('/rooms', { lat, lng });
  return data;
};

/**
 * Join a room — lat/lng are REQUIRED so the server can validate the user
 * is physically within 500m of the room. Pass current GPS coords.
 */
export const joinRoom = async (
  roomId: string,
  lat: number,
  lng: number
): Promise<{ status: string; room: Room }> => {
  const { data } = await api.post(`/rooms/${roomId}/join`, { lat, lng });
  return data;
};

export const leaveRoom = async (roomId: string): Promise<void> => {
  await api.post(`/rooms/${roomId}/leave`);
};

export const getRoomMessages = async (roomId: string) => {
  const { data } = await api.get(`/rooms/${roomId}/messages`);
  return data.messages;
};

export default api;
