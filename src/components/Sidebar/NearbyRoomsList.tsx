import React from 'react';
import type { Room } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  rooms: Room[];
  loading: boolean;
  activeRoomId: string | null;
  onJoin: (room: Room) => void;
  onRefresh: () => void;
  onCreateRoom: () => void;
}

export default function NearbyRoomsList({
  rooms,
  loading,
  activeRoomId,
  onJoin,
  onRefresh,
  onCreateRoom,
}: Props) {
  return (
    <div className="flex flex-col h-full" style={{ color: 'var(--sidebar-foreground)' }}>

      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid var(--sidebar-border)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-flex w-2 h-2 rounded-full animate-pulse-slow"
            style={{ background: 'var(--primary)' }}
          />
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Nearby · 500m
          </span>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          title="Refresh rooms"
          className="p-1.5 rounded-lg transition-all disabled:opacity-40"
          style={{ color: 'var(--muted-foreground)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-accent)';
            (e.currentTarget as HTMLElement).style.color = 'var(--sidebar-accent-foreground)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'var(--muted-foreground)';
          }}
        >
          <svg
            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* ── Room list ── */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-2 scrollbar-none">
        {/* Loading skeletons */}
        {loading && rooms.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-[var(--radius)] p-4 animate-pulse"
                style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
              >
                <div
                  className="h-3 rounded-full w-3/4 mb-3"
                  style={{ background: 'var(--border)' }}
                />
                <div
                  className="h-2 rounded-full w-1/2"
                  style={{ background: 'var(--border)' }}
                />
              </div>
            ))}
          </div>

        ) : rooms.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-40 text-center space-y-3 px-3">
            <span className="text-3xl">🔇</span>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              No active rooms nearby.
              <br />
              Be the first to start one!
            </p>
            <button onClick={onCreateRoom} className="btn-primary text-xs px-4 py-2">
              + Create Room
            </button>
          </div>

        ) : (
          /* Room cards */
          rooms.map((room) => (
            <RoomCard
              key={room.room_id}
              room={room}
              isActive={room.room_id === activeRoomId}
              onJoin={onJoin}
            />
          ))
        )}
      </div>

      {/* ── Create room footer ── */}
      <div
        className="p-3 shrink-0"
        style={{ borderTop: '1px solid var(--sidebar-border)' }}
      >
        <button
          onClick={onCreateRoom}
          className="btn-secondary w-full text-xs"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          New Room Here
        </button>
      </div>
    </div>
  );
}

/* ── Room Card ─────────────────────────────────────────────────────────── */
function RoomCard({
  room,
  isActive,
  onJoin,
}: {
  room: Room;
  isActive: boolean;
  onJoin: (r: Room) => void;
}) {
  const age = formatDistanceToNow(new Date(room.created_at), { addSuffix: true });
  const dist = room.distance !== undefined ? `${Math.round(room.distance)}m away` : '';

  return (
    <div
      onClick={() => onJoin(room)}
      className="room-card"
      style={
        isActive
          ? {
              background: 'var(--sidebar-accent)',
              borderColor: 'var(--primary)',
              color: 'var(--sidebar-accent-foreground)',
            }
          : {}
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Distance + active dot */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className="inline-flex w-2 h-2 rounded-full shrink-0"
              style={{ background: '#22c55e' }}
            />
            <span
              className="text-xs font-semibold truncate"
              style={{ color: isActive ? 'var(--sidebar-accent-foreground)' : 'var(--foreground)' }}
            >
              {dist || 'Nearby'}
            </span>
          </div>
          {/* Age */}
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {age}
          </p>
        </div>

        {/* Online count */}
        <div className="text-right shrink-0">
          <p
            className="font-bold text-sm"
            style={{ color: isActive ? 'var(--primary)' : 'var(--foreground)' }}
          >
            {room.participant_count}
          </p>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {room.participant_count === 1 ? 'online' : 'online'}
          </p>
        </div>
      </div>

      {/* Join button */}
      <div className="mt-3">
        <button
          onClick={(e) => { e.stopPropagation(); onJoin(room); }}
          className="w-full py-1.5 rounded-xl text-xs font-bold transition-all duration-150"
          style={
            isActive
              ? {
                  background: 'var(--tw-blue-10)',
                  color: 'var(--primary)',
                  border: '1px solid var(--primary)',
                }
              : {
                  background: 'var(--muted)',
                  color: 'var(--muted-foreground)',
                  border: '1px solid var(--border)',
                }
          }
        >
          {isActive ? '✓ Joined' : 'Join Room'}
        </button>
      </div>
    </div>
  );
}
