import React from 'react';
import type { Message } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  message: Message;
  isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: Props) {
  const time = formatDistanceToNow(new Date(message.timestamp), { addSuffix: true });

  // ── System message ──────────────────────────────────────────────────────
  if (message.is_system) {
    return (
      <div className="flex justify-center my-2">
        <span
          className="text-xs px-3 py-1 rounded-full"
          style={{
            color: 'var(--muted-foreground)',
            background: 'var(--muted)',
            border: '1px solid var(--border)',
          }}
        >
          {message.content}
        </span>
      </div>
    );
  }

  // ── Chat bubble ─────────────────────────────────────────────────────────
  return (
    <div className={`flex flex-col gap-0.5 animate-slide-up ${isOwn ? 'items-end' : 'items-start'}`}>
      <div className={`flex items-end gap-2 max-w-[78%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>

        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold select-none"
          style={
            isOwn
              ? { background: 'var(--primary)', color: 'var(--primary-foreground)' }
              : { background: 'var(--muted)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }
          }
        >
          {message.user_name[0].toUpperCase()}
        </div>

        {/* Bubble */}
        <div
          className="rounded-2xl px-4 py-2.5 max-w-full"
          style={
            isOwn
              ? {
                  background: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  borderBottomRightRadius: '4px',
                  boxShadow: '0 1px 4px var(--tw-blue-20)',
                }
              : {
                  background: 'var(--card)',
                  color: 'var(--card-foreground)',
                  border: '1px solid var(--border)',
                  borderBottomLeftRadius: '4px',
                }
          }
        >
          {!isOwn && (
            <p
              className="text-xs font-bold mb-0.5"
              style={{ color: 'var(--accent-foreground)' }}
            >
              {message.user_name}
            </p>
          )}
          <p className="text-sm leading-relaxed break-words">{message.content}</p>
        </div>
      </div>

      {/* Timestamp */}
      <span
        className="text-xs px-9"
        style={{ color: 'var(--muted-foreground)', opacity: 0.6 }}
      >
        {time}
      </span>
    </div>
  );
}
