export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface Room {
  room_id: string;
  center: GeoPoint;
  radius: number;
  created_by: string;
  created_at: string;
  last_activity: string;
  is_active: boolean;
  participant_count: number;
  distance?: number;
}

export interface Message {
  message_id: string;
  room_id: string;
  user_id: string;
  user_name: string;
  content: string | null;
  media_url?: string;
  media_type?: string;
  timestamp: string;
  is_system: boolean;
}

export interface User {
  user_id: string;
  display_name: string;
  token: string;
}

export type LocationPermission = 'granted' | 'denied' | 'prompt' | 'loading';

export interface Coords {
  lat: number;
  lng: number;
}

export type WSEventType =
  | 'message'
  | 'history'
  | 'user_joined'
  | 'user_left'
  | 'room_closed'
  | 'typing'
  | 'participant_count'
  | 'ping'
  | 'pong';

export interface WSEvent {
  type: WSEventType;
  message_id?: string;
  user_id?: string;
  user_name?: string;
  content?: string;
  media_url?: string;
  media_type?: string;
  timestamp?: string;
  is_system?: boolean;
  reason?: string;
  is_typing?: boolean;
  participant_count?: number;
  messages?: Message[];
}
