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

export default function NearbyRoomsList({ rooms, loading, activeRoomId, onJoin, onRefresh, onCreateRoom }: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="inline-flex w-2 h-2 rounded-full bg-brand-400 animate-pulse-slow" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Nearby (500m)</span>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-all disabled:opacity-40"
          title="Refresh rooms"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Rooms list */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-2 scrollbar-none">
        {loading && rooms.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-2xl p-4 animate-pulse">
                <div className="h-3 bg-white/5 rounded w-3/4 mb-2" />
                <div className="h-2 bg-white/5 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center space-y-2 px-2">
            <span className="text-3xl">🔇</span>
            <p className="text-slate-500 text-xs leading-relaxed">No active rooms nearby.<br />Be the first to start one!</p>
            <button onClick={onCreateRoom} className="btn-primary text-xs px-3 py-2 mt-1">
              + Create Room
            </button>
          </div>
        ) : (
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

      {/* Create button at bottom */}
      <div className="p-3 border-t border-white/5">
        <button onClick={onCreateRoom} className="btn-secondary w-full text-xs">
          <span>＋</span> New Room Here
        </button>
      </div>
    </div>
  );
}

function RoomCard({ room, isActive, onJoin }: { room: Room; isActive: boolean; onJoin: (r: Room) => void }) {
  const age = formatDistanceToNow(new Date(room.created_at), { addSuffix: true });
  const dist = room.distance !== undefined ? `${Math.round(room.distance)}m away` : '';

  return (
    <div
      onClick={() => onJoin(room)}
      className={`room-card ${isActive ? 'active' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-xs text-slate-400 truncate">{dist}</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{age}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-slate-300 font-semibold text-sm">{room.participant_count}</p>
          <p className="text-slate-600 text-xs">people</p>
        </div>
      </div>
      <div className="mt-3">
        <button
          onClick={(e) => { e.stopPropagation(); onJoin(room); }}
          className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
            isActive
              ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40'
              : 'bg-white/5 text-slate-300 hover:bg-brand-500/10 hover:text-brand-300 border border-white/5'
          }`}
        >
          {isActive ? '✓ Joined' : 'Join Room'}
        </button>
      </div>
    </div>
  );
}
