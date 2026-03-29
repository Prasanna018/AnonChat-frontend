import React, { useState, useCallback } from 'react';
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
  // Mobile: 'sidebar' | 'chat'
  const [mobileView, setMobileView] = useState<'sidebar' | 'chat'>('sidebar');

  const handleJoin = useCallback(async (room: Room) => {
    if (activeRoom?.room_id === room.room_id) {
      setMobileView('chat');
      return;
    }
    try {
      if (activeRoom) await leaveRoom(activeRoom.room_id);
      const result = await joinRoom(room.room_id);
      setActiveRoom(result.room);
      setMobileView('chat');
    } catch (e: any) {
      const msg = e.response?.data?.detail ?? 'Failed to join room.';
      toast.error(msg);
    }
  }, [activeRoom]);

  const handleCreate = useCallback(async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      if (activeRoom) await leaveRoom(activeRoom.room_id);
      const room = await createRoom(coords.lat, coords.lng);
      setActiveRoom(room);
      setRooms((prev) => [room, ...prev.filter((r) => r.room_id !== room.room_id)]);
      toast.success('Room created! People within 500m can join.');
      setMobileView('chat');
    } catch (e: any) {
      const msg = e.response?.data?.detail ?? 'Failed to create room.';
      toast.error(msg);
    } finally {
      setIsCreating(false);
    }
  }, [isCreating, activeRoom, coords.lat, coords.lng, setRooms]);

  const handleLeave = useCallback(async () => {
    if (!activeRoom) return;
    try { await leaveRoom(activeRoom.room_id); } catch { /* silent */ }
    setActiveRoom(null);
    setMobileView('sidebar');
  }, [activeRoom]);

  const handleRoomClosed = useCallback((_reason: string) => {
    setActiveRoom(null);
    toast.error('This room has expired or been closed.');
    refresh();
    setMobileView('sidebar');
  }, [refresh]);

  return (
    <div className="flex h-full" style={{ background: 'var(--background)' }}>

      {/* ── Sidebar — desktop always visible, mobile shows/hides ── */}
      <aside
        className={`
          flex flex-col shrink-0 transition-all duration-300 ease-out
          /* Desktop */ md:w-72
          /* Mobile */ ${mobileView === 'sidebar' ? 'w-full' : 'hidden'}
          md:flex
        `}
        style={{
          background: 'var(--sidebar)',
          borderRight: '1px solid var(--sidebar-border)',
          color: 'var(--sidebar-foreground)',
        }}
      >
        <NearbyRoomsList
          rooms={rooms}
          loading={loading}
          activeRoomId={activeRoom?.room_id ?? null}
          onJoin={handleJoin}
          onRefresh={refresh}
          onCreateRoom={handleCreate}
          isCreating={isCreating}
        />
      </aside>

      {/* ── Main panel — desktop is always visible, mobile only shows when chat view ── */}
      <main
        className={`
          flex-1 flex flex-col min-w-0
          /* Mobile */ ${mobileView === 'chat' ? 'flex' : 'hidden'}
          md:flex
        `}
      >
        {activeRoom ? (
          <ChatInterface
            room={activeRoom}
            userId={user.user_id}
            token={user.token}
            userCoords={coords}
            onLeave={handleLeave}
            onRoomClosed={handleRoomClosed}
            onBackToRooms={() => setMobileView('sidebar')}
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
    <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-7 animate-fade-in">
      {/* Hero */}
      <div className="text-center space-y-2">
        <div
          className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center shadow-2xl mb-3"
          style={{ background: 'var(--primary)' }}
        >
          <span className="text-4xl">🌐</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gradient">EchoSpot</h1>
        <p className="text-sm max-w-xs mx-auto leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
          {roomCount > 0
            ? `${roomCount} room${roomCount > 1 ? 's' : ''} nearby — select one or create your own.`
            : 'No active rooms within 500m. Be the first to start a conversation!'}
        </p>
      </div>

      {/* User badge */}
      <div
        className="flex items-center gap-3 px-5 py-3 rounded-[var(--radius)]"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          {userName[0].toUpperCase()}
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>You are</p>
          <p className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>{userName}</p>
        </div>
        <span
          className="badge ml-1 text-[10px]"
          style={{
            background: 'rgba(34,197,94,0.1)',
            color: '#22c55e',
            border: '1px solid rgba(34,197,94,0.2)',
          }}
        >
          Anonymous
        </span>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <button onClick={onCreate} disabled={isCreating} className="btn-primary flex-1 py-3.5 text-sm">
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
        <button onClick={onFindRooms} className="btn-secondary flex-1 py-3.5 text-sm">
          <span>🔍</span> Refresh Rooms
        </button>
      </div>

      {/* Info pills */}
      <div className="flex flex-wrap justify-center gap-2">
        {['500m radius', 'Anonymous', 'Real-time', 'Media sharing', 'No sign-up'].map((t) => (
          <span
            key={t}
            className="badge px-3 py-1 text-[10px]"
            style={{
              background: 'var(--muted)',
              color: 'var(--muted-foreground)',
              border: '1px solid var(--border)',
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
