import { useState, useEffect, useRef, useCallback } from 'react';
import type { Message, WSEvent } from '../types';

const WS_BASE = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/ws`;
const MAX_BACKOFF = 30000;

interface UseWebSocketOptions {
  roomId: string | null;
  token: string | null;
  onRoomClosed?: (reason: string) => void;
}

export function useWebSocket({ roomId, token, onRoomClosed }: UseWebSocketOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [connected, setConnected] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef(1000);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReconnectRef = useRef(true);
  const currentRoomRef = useRef<string | null>(null);


  const connect = useCallback(() => {
    if (!roomId || !token) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const url = `${WS_BASE}/${roomId}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;
    currentRoomRef.current = roomId;

    ws.onopen = () => {
      setConnected(true);
      backoffRef.current = 1000;
    };

    ws.onmessage = (e) => {
      try {
        const event: WSEvent = JSON.parse(e.data);

        if (event.type === 'history') {
          setMessages((event.messages as Message[]) ?? []);
        } else if (event.type === 'message') {
          const msg: Message = {
            message_id: event.message_id!,
            room_id: roomId,
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
          onRoomClosed?.(event.reason ?? 'Room has expired.');
        }
      } catch { /* ignore */ }
    };

    ws.onclose = () => {
      setConnected(false);
      if (shouldReconnectRef.current && currentRoomRef.current === roomId) {
        reconnectTimerRef.current = setTimeout(() => {
          backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF);
          connect();
        }, backoffRef.current);
      }
    };

    ws.onerror = () => { ws.close(); };
  }, [roomId, token, onRoomClosed]);

  useEffect(() => {
    shouldReconnectRef.current = true;
    setMessages([]);
    setParticipantCount(0);
    connect();

    // Heartbeat to keep the Vite dev server proxy connection alive
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 15000);

    return () => {
      shouldReconnectRef.current = false;
      clearInterval(pingInterval);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [roomId, token, connect]);

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'send_message', content }));
    }
  }, []);

  return { messages, connected, participantCount, sendMessage };
}
