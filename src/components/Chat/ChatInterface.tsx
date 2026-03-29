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
  onBackToRooms?: () => void; // mobile back button
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

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (isNearBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--background)' }}>

      {/* ── Header ── */}
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}
      >
        {/* Mobile back button */}
        {onBackToRooms && (
          <button
            onClick={onBackToRooms}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-xl transition-colors shrink-0"
            style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
            title="Back to rooms"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Room icon + status */}
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

        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold truncate" style={{ color: 'var(--foreground)' }}>
            Local Room
          </h2>
          <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
            <span>{onlineLabel}</span>
            {!connected && (
              <span className="font-semibold" style={{ color: '#f59e0b' }}>· Reconnecting…</span>
            )}
          </p>
        </div>

        {/* Leave button */}
        <button
          onClick={onLeave}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 border shrink-0"
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
        className="flex-1 overflow-y-auto px-4 py-4 space-y-2 scrollbar-none"
        style={{ background: 'var(--background)' }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-50">
            <span className="text-4xl">💬</span>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              No messages yet. Say hello!
            </p>
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
