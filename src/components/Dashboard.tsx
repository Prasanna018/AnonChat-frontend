import React, { useState } from 'react';
import type { Room, Coords, User } from '../types';
import { useNearbyRooms } from '../hooks/useNearbyRooms';
import NearbyRoomsList from './Sidebar/NearbyRoomsList';
import ChatInterface from './Chat/ChatInterface';
import { createRoom, joinRoom, leaveRoom } from '../services/api';
import toast from 'react-hot-toast';

interface Props {
  user: User;
  coords: Coords;
}

export default function Dashboard({ user, coords }: Props) {
  const { rooms, setRooms, loading, refresh } = useNearbyRooms(coords);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleJoin = async (room: Room) => {
    if (activeRoom?.room_id === room.room_id) return;
    try {
      if (activeRoom) await leaveRoom(activeRoom.room_id);
      const result = await joinRoom(room.room_id);
      setActiveRoom(result.room);
      // Refresh rooms to get updated participant counts
      setTimeout(refresh, 500);
    } catch (e: any) {
      const msg = e.response?.data?.detail ?? 'Failed to join room.';
      toast.error(msg);
    }
  };

  const handleCreate = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      if (activeRoom) await leaveRoom(activeRoom.room_id);
      const room = await createRoom(coords.lat, coords.lng);
      setActiveRoom(room);
      setRooms((prev) => [room, ...prev.filter((r) => r.room_id !== room.room_id)]);
      toast.success('Room created! People within 500m can join.');
    } catch (e: any) {
      const msg = e.response?.data?.detail ?? 'Failed to create room.';
      toast.error(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleLeave = async () => {
    if (!activeRoom) return;
    try {
      await leaveRoom(activeRoom.room_id);
    } catch { /* silent */ }
    setActiveRoom(null);
    refresh();
  };

  const handleRoomClosed = (_reason: string) => {
    setActiveRoom(null);
    toast.error('This room has expired or been closed.');
    refresh();
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-0 overflow-hidden'} flex-shrink-0 glass border-r border-white/5 flex flex-col transition-all duration-300 ease-out`}>
        <NearbyRoomsList
          rooms={rooms}
          loading={loading}
          activeRoomId={activeRoom?.room_id ?? null}
          onJoin={handleJoin}
          onRefresh={refresh}
          onCreateRoom={handleCreate}
        />
      </aside>

      {/* Toggle sidebar (mobile) */}
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className="absolute top-16 left-0 z-10 md:hidden w-6 h-10 flex items-center justify-center bg-surface-50 border border-white/10 rounded-r-lg text-slate-400"
      >
        {sidebarOpen ? '‹' : '›'}
      </button>

      {/* Main panel */}
      <main className="flex-1 flex flex-col min-w-0">
        {activeRoom ? (
          <ChatInterface
            room={activeRoom}
            userId={user.user_id}
            token={user.token}
            userCoords={coords}
            onLeave={handleLeave}
            onRoomClosed={handleRoomClosed}
          />
        ) : (
          <WelcomePanel
            userName={user.display_name}
            roomCount={rooms.length}
            isCreating={isCreating}
            onCreate={handleCreate}
            onFindRooms={refresh}
          />
        )}
      </main>
    </div>
  );
}

interface WelcomePanelProps {
  userName: string;
  roomCount: number;
  isCreating: boolean;
  onCreate: () => void;
  onFindRooms: () => void;
}

function WelcomePanel({ userName, roomCount, isCreating, onCreate, onFindRooms }: WelcomePanelProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8 animate-fade-in">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-brand-500 via-brand-600 to-violet-600 flex items-center justify-center shadow-2xl shadow-brand-900/50 mb-4">
          <span className="text-5xl">🌐</span>
        </div>
        <h1 className="text-4xl font-extrabold text-gradient">EchoSpot</h1>
        <p className="text-slate-400 text-base max-w-xs mx-auto leading-relaxed">
          {roomCount > 0
            ? `${roomCount} room${roomCount > 1 ? 's' : ''} nearby — select one or create your own.`
            : 'No active rooms within 500m. Be the first to start a conversation!'}
        </p>
      </div>

      {/* User badge */}
      <div className="flex items-center gap-3 glass rounded-2xl px-5 py-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-brand-600 flex items-center justify-center font-bold text-white">
          {userName[0].toUpperCase()}
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">You are</p>
          <p className="text-white font-bold">{userName}</p>
        </div>
        <span className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ml-1">Anonymous</span>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
        <button
          onClick={onCreate}
          disabled={isCreating}
          className="btn-primary flex-1 py-4 text-base"
        >
          {isCreating ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Creating…
            </>
          ) : (
            <><span>🌍</span> Create New Room</>
          )}
        </button>
        <button onClick={onFindRooms} className="btn-secondary flex-1 py-4 text-base">
          <span>🔍</span> Find Nearby Rooms
        </button>
      </div>

      {/* Info pills */}
      <div className="flex flex-wrap justify-center gap-2 mt-2">
        {['500m radius', 'Anonymous', 'Real-time', 'No sign-up'].map((t) => (
          <span key={t} className="badge bg-white/5 text-slate-400 border border-white/10 px-3 py-1 text-xs">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
