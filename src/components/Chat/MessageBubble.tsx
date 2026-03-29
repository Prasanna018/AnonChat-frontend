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
          {message.media_url && (
            <div className="mb-1">
              {message.media_type?.startsWith('image/') ? (
                <img 
                  src={message.media_url} 
                  alt="Attachment" 
                  className="max-w-[200px] max-h-[240px] rounded-lg object-contain cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
                  onClick={() => window.open(message.media_url, '_blank')}
                />
              ) : (
                <a 
                  href={message.media_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg bg-black/10 hover:bg-black/20 transition-colors duration-200"
                  style={{ color: 'inherit', textDecoration: 'none' }}
                >
                  <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm font-medium underline underline-offset-2">View Document</span>
                </a>
              )}
            </div>
          )}
          {message.content && (
            <p className="text-sm leading-relaxed break-words">{message.content}</p>
          )}
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
