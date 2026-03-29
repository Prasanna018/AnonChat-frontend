import React, { useEffect, useRef, useState } from 'react';
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
}

function getDistance(a: Coords, b: [number, number]): number {
  const R = 6371000;
  const dLat = ((b[1] - a.lat) * Math.PI) / 180;
  const dLng = ((b[0] - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b[1] * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export default function ChatInterface({ room, userId, token, userCoords, onLeave, onRoomClosed }: Props) {
  const { messages, connected, participantCount, sendMessage } = useWebSocket({
    roomId: room.room_id,
    token,
    onRoomClosed,
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const [outOfZone, setOutOfZone] = useState(false);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check if user walked outside zone

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 glass">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <span className="text-base">💬</span>
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface-DEFAULT ${connected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Local Room</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <span>{participantCount} online</span>
              {!connected && <span className="text-amber-400">· Reconnecting…</span>}
            </p>
          </div>
        </div>
        <button
          onClick={onLeave}
          className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg border border-white/5 hover:border-red-500/20 transition-all"
        >
          Leave Room
        </button>
      </div>

      {/* Out-of-zone banner */}
      {outOfZone && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs">
          <span>⚠️</span>
          <span>You've left the room zone. Messages are disabled.</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scrollbar-none">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-50">
            <span className="text-4xl">💬</span>
            <p className="text-slate-500 text-sm">No messages yet. Say hello!</p>
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

      {/* Input */}
      <MessageInput
        onSend={sendMessage}
        disabled={outOfZone || !connected}
        disabledReason={outOfZone ? "You've left the 500m zone. Move closer to send messages." : undefined}
      />
    </div>
  );
}
