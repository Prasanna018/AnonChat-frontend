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
  isCreating?: boolean;
}

export default function NearbyRoomsList({
  rooms,
  loading,
  activeRoomId,
  onJoin,
  onRefresh,
  onCreateRoom,
  isCreating = false,
}: Props) {
  return (
    <div className="flex flex-col h-full" style={{ color: 'var(--sidebar-foreground)' }}>

      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{
          borderBottom: '1px solid var(--sidebar-border)',
          // iOS safe area
          paddingTop: 'max(12px, env(safe-area-inset-top))',
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-flex w-2 h-2 rounded-full animate-pulse-slow"
            style={{ background: '#22c55e' }}
          />
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Nearby · 500m
          </span>
        </div>

        {/* Room count badge */}
        {rooms.length > 0 && (
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              background: 'var(--tw-blue-10)',
              color: 'var(--primary)',
              border: '1px solid var(--tw-blue-20)',
            }}
          >
            {rooms.length}
          </span>
        )}

        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={loading}
          title="Refresh rooms"
          className="p-1.5 rounded-lg transition-all disabled:opacity-40 active:scale-90"
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
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-2 scrollbar-none" style={{ overscrollBehavior: 'contain' }}>

        {/* Loading skeletons */}
        {loading && rooms.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-[var(--radius)] p-4 animate-pulse"
                style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
              >
                <div className="h-3 rounded-full w-2/3 mb-3" style={{ background: 'var(--border)' }} />
                <div className="h-2 rounded-full w-1/2 mb-2" style={{ background: 'var(--border)' }} />
                <div className="h-8 rounded-xl mt-3" style={{ background: 'var(--border)' }} />
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
            <button onClick={onCreateRoom} disabled={isCreating} className="btn-primary text-xs px-4 py-2">
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
        style={{
          borderTop: '1px solid var(--sidebar-border)',
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        }}
      >
        <button
          onClick={onCreateRoom}
          disabled={isCreating}
          className="btn-primary w-full text-xs py-3"
        >
          {isCreating ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Creating…
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              New Room Here
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ── Room Card ──────────────────────────────────────────────────────────── */
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
  const dist = room.distance !== undefined
    ? room.distance < 1000
      ? `${Math.round(room.distance)}m away`
      : `${(room.distance / 1000).toFixed(1)}km away`
    : 'Nearby';

  const count = room.participant_count;

  return (
    <div
      onClick={() => onJoin(room)}
      className="room-card cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onJoin(room)}
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
          {/* Distance + status dot */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className="inline-flex w-2 h-2 rounded-full shrink-0 animate-pulse-slow"
              style={{ background: '#22c55e' }}
            />
            <span
              className="text-xs font-bold truncate"
              style={{ color: isActive ? 'var(--primary)' : 'var(--foreground)' }}
            >
              {dist}
            </span>
          </div>

          {/* Age */}
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Created {age}
          </p>
        </div>

        {/* Live count */}
        <div
          className="flex flex-col items-center shrink-0 px-2.5 py-1.5 rounded-xl"
          style={{
            background: isActive ? 'var(--primary)' : 'var(--muted)',
            color: isActive ? 'var(--primary-foreground)' : 'var(--foreground)',
          }}
        >
          <p className="font-extrabold text-sm leading-none">{count}</p>
          <p className="text-[9px] mt-0.5 font-semibold opacity-70 leading-none">
            {count === 1 ? 'person' : 'people'}
          </p>
        </div>
      </div>

      {/* Join button */}
      <div className="mt-3">
        <button
          onClick={(e) => { e.stopPropagation(); onJoin(room); }}
          className="w-full py-2 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95"
          style={
            isActive
              ? {
                  background: 'var(--tw-blue-10)',
                  color: 'var(--primary)',
                  border: '1px solid var(--primary)',
                }
              : {
                  background: 'var(--tw-blue)',
                  color: 'white',
                  border: '1px solid transparent',
                }
          }
        >
          {isActive ? '✓ Active — Tap to open' : 'Join Room →'}
        </button>
      </div>
    </div>
  );
}
