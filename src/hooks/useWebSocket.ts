import { useState, useEffect, useRef, useCallback } from 'react';
import type { Message, WSEvent } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '';
const WS_BASE = API_URL
  ? `${API_URL.replace(/^http/, 'ws')}/api/ws`
  : `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/ws`;
const INITIAL_BACKOFF = 1000;
const MAX_BACKOFF = 30000;
const PING_INTERVAL = 20000;

interface UseWebSocketOptions {
  roomId: string | null;
  token: string | null;
  onRoomClosed?: (reason: string) => void;
}

export function useWebSocket({ roomId, token, onRoomClosed }: UseWebSocketOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [connected, setConnected] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);

  // Store mutable values in refs to keep callbacks stable
  const wsRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef(INITIAL_BACKOFF);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shouldReconnectRef = useRef(true);
  const seenIdsRef = useRef<Set<string>>(new Set()); // dedup messages after reconnect

  // Keep onRoomClosed in a ref so it doesn't destabilize `connect`
  const onRoomClosedRef = useRef(onRoomClosed);
  useEffect(() => { onRoomClosedRef.current = onRoomClosed; }, [onRoomClosed]);

  const clearTimers = useCallback(() => {
    if (reconnectTimerRef.current) { clearTimeout(reconnectTimerRef.current); reconnectTimerRef.current = null; }
    if (pingIntervalRef.current) { clearInterval(pingIntervalRef.current); pingIntervalRef.current = null; }
  }, []);

  const connect = useCallback(() => {
    if (!roomId || !token) return;
    // Don't open a second connection if one is already connecting/open
    const ws = wsRef.current;
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

    const url = `${WS_BASE}/${roomId}?token=${encodeURIComponent(token)}`;
    const socket = new WebSocket(url);
    wsRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
      backoffRef.current = INITIAL_BACKOFF;

      // Start ping heartbeat
      clearTimers();
      pingIntervalRef.current = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'ping' }));
        }
      }, PING_INTERVAL);
    };

    socket.onmessage = (e) => {
      try {
        const event: WSEvent = JSON.parse(e.data);

        if (event.type === 'pong') {
          // Heartbeat response — no UI action needed
          return;
        }

        if (event.type === 'history') {
          const msgs = (event.messages as Message[]) ?? [];
          // Reset dedup set and seed with history IDs
          seenIdsRef.current = new Set(msgs.map((m) => m.message_id));
          setMessages(msgs);

        } else if (event.type === 'message') {
          const id = event.message_id!;
          if (seenIdsRef.current.has(id)) return; // dedup
          seenIdsRef.current.add(id);

          const msg: Message = {
            message_id: id,
            room_id: roomId ?? '',
            user_id: event.user_id!,
            user_name: event.user_name!,
            content: event.content!,
            timestamp: event.timestamp!,
            is_system: event.is_system ?? false,
          };
          setMessages((prev) => [...prev, msg]);

        } else if (event.type === 'user_joined' || event.type === 'user_left') {
          if (event.participant_count !== undefined) setParticipantCount(event.participant_count);

        } else if (event.type === 'participant_count') {
          if (event.participant_count !== undefined) setParticipantCount(event.participant_count);

        } else if (event.type === 'room_closed') {
          onRoomClosedRef.current?.(event.reason ?? 'Room has expired.');
        }
      } catch { /* ignore malformed frames */ }
    };

    socket.onclose = () => {
      setConnected(false);
      clearTimers();
      if (shouldReconnectRef.current) {
        reconnectTimerRef.current = setTimeout(() => {
          backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF);
          connect();
        }, backoffRef.current);
      }
    };

    socket.onerror = () => {
      socket.close();
    };
  // Only depends on roomId + token — stable when parent re-renders for unrelated reasons
  }, [roomId, token, clearTimers]);

  useEffect(() => {
    if (!roomId || !token) return;

    shouldReconnectRef.current = true;
    backoffRef.current = INITIAL_BACKOFF;
    seenIdsRef.current = new Set();
    // Reset UI state for the new room
    setMessages([]);
    setParticipantCount(0);
    setConnected(false);

    connect();

    return () => {
      shouldReconnectRef.current = false;
      clearTimers();
      const ws = wsRef.current;
      if (ws) {
        ws.onclose = null; // prevent triggering reconnect on intentional close
        ws.close();
        wsRef.current = null;
      }
    };
  // Run only when room or token changes — NOT when connect/clearTimers recreate
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, token]);

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'send_message', content }));
    }
  }, []);

  return { messages, connected, participantCount, sendMessage };
}
