import React, { useEffect, useRef } from 'react';
import type { Room, Coords } from '../../types';
import { useWebSocket } from '../../hooks/useWebSocket';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

interface Props {
  room: Room;
  userId: string;
  token: string;
  userCoords: Coords | null;
  onLeave: () => void;
  onRoomClosed: (reason: string) => void;
  onBackToRooms?: () => void;
}

export default function ChatInterface({
  room, userId, token, userCoords: _coords,
  onLeave, onRoomClosed, onBackToRooms
}: Props) {
  const { messages, connected, participantCount, sendMessage } = useWebSocket({
    roomId: room.room_id,
    token,
    onRoomClosed,
  });

  const othersCount = Math.max(0, participantCount - 1);
  const onlineLabel = othersCount === 0
    ? 'just you'
    : `${othersCount} other${othersCount !== 1 ? 's' : ''} online`;

  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll: only if already near bottom
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 220;
    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Scroll to bottom immediately when room first opens
  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'instant' }), 80);
  }, [room.room_id]);

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: 'var(--background)' }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 shrink-0"
        style={{
          background: 'var(--card)',
          borderBottom: '1px solid var(--border)',
          // iOS status bar safe area
          paddingTop: 'max(10px, env(safe-area-inset-top))',
        }}
      >
        {/* Mobile back button */}
        {onBackToRooms && (
          <button
            onClick={onBackToRooms}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-colors shrink-0 active:scale-90"
            style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
            aria-label="Back to rooms"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Room icon + connection status dot */}
        <div className="relative shrink-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--primary)' }}
          >
            <span className="text-base">💬</span>
          </div>
          <span
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 transition-colors duration-300"
            style={{
              borderColor: 'var(--card)',
              background: connected ? '#22c55e' : '#64748b',
            }}
          />
        </div>

        {/* Room info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold truncate" style={{ color: 'var(--foreground)' }}>
            Local Room
          </h2>
          <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: connected ? '#22c55e' : '#64748b' }}
            />
            <span>{onlineLabel}</span>
            {!connected && (
              <span className="font-semibold" style={{ color: '#f59e0b' }}>· Reconnecting…</span>
            )}
          </p>
        </div>

        {/* Participant count badge */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0"
          style={{
            background: 'var(--tw-blue-10)',
            color: 'var(--primary)',
            border: '1px solid var(--tw-blue-20)',
          }}
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
          </svg>
          {participantCount}
        </div>

        {/* Leave button */}
        <button
          onClick={onLeave}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 border shrink-0 active:scale-95"
          style={{
            color: 'var(--muted-foreground)',
            borderColor: 'var(--border)',
            background: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--destructive)';
            e.currentTarget.style.borderColor = 'var(--destructive)';
            e.currentTarget.style.background = 'rgba(239,68,68,0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--muted-foreground)';
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          Leave
        </button>
      </div>

      {/* ── Messages ── */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-3 py-4 space-y-2 scrollbar-none"
        style={{ background: 'var(--background)', overscrollBehavior: 'contain' }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60 pb-10">
            <span className="text-5xl">💬</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>No messages yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Say hello to people nearby!</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.message_id}
            message={msg}
            isOwn={msg.user_id === userId}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <MessageInput
        onSend={sendMessage}
        disabled={!connected}
        roomId={room.room_id}
        token={token}
      />
    </div>
  );
}
