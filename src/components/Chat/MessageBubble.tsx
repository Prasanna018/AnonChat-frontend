import React, { useState } from 'react';
import type { Message } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  message: Message;
  isOwn: boolean;
}

function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={onClose}
    >
      <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt="Full size" className="w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full font-bold text-white"
          style={{ background: 'rgba(0,0,0,0.6)' }}
        >
          ✕
        </button>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 right-3 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Open original
        </a>
      </div>
    </div>
  );
}

export default function MessageBubble({ message, isOwn }: Props) {
  const [lightbox, setLightbox] = useState(false);
  const time = formatDistanceToNow(new Date(message.timestamp), { addSuffix: true });
  const isImage = message.media_type?.startsWith('image/');

  // ── System message ───────────────────────────────────────────────────────
  if (message.is_system) {
    return (
      <div className="flex justify-center my-1">
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

  // ── Chat bubble ──────────────────────────────────────────────────────────
  return (
    <>
      {lightbox && message.media_url && (
        <ImageLightbox src={message.media_url} onClose={() => setLightbox(false)} />
      )}

      <div className={`flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className={`flex items-end gap-2 max-w-[80%] sm:max-w-[72%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>

          {/* Avatar */}
          <div
            className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold select-none self-end"
            style={
              isOwn
                ? { background: 'var(--primary)', color: 'var(--primary-foreground)' }
                : { background: 'var(--muted)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }
            }
          >
            {(message.user_name || '?')[0].toUpperCase()}
          </div>

          {/* Bubble */}
          <div
            className="rounded-2xl overflow-hidden"
            style={
              isOwn
                ? {
                    background: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    borderBottomRightRadius: '4px',
                  }
                : {
                    background: 'var(--card)',
                    color: 'var(--card-foreground)',
                    border: '1px solid var(--border)',
                    borderBottomLeftRadius: '4px',
                  }
            }
          >
            {/* Sender name (others only) */}
            {!isOwn && (
              <p
                className="text-[11px] font-bold px-3 pt-2 pb-0"
                style={{ color: 'var(--accent-foreground)' }}
              >
                {message.user_name}
              </p>
            )}

            {/* Image attachment */}
            {message.media_url && isImage && (
              <div className="mt-1.5 px-[3px]">
                <img
                  src={message.media_url}
                  alt="Attachment"
                  className="max-w-[260px] w-full rounded-xl cursor-pointer object-cover transition-all duration-200 hover:brightness-90"
                  style={{ maxHeight: '300px' }}
                  onClick={() => setLightbox(true)}
                  loading="lazy"
                />
              </div>
            )}

            {/* Document attachment */}
            {message.media_url && !isImage && (
              <div className="mx-3 mt-2">
                <a
                  href={message.media_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-150"
                  style={{
                    background: isOwn ? 'rgba(255,255,255,0.15)' : 'var(--muted)',
                    border: '1px solid',
                    borderColor: isOwn ? 'rgba(255,255,255,0.2)' : 'var(--border)',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: isOwn ? 'rgba(255,255,255,0.15)' : 'var(--tw-blue-10)' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      style={{ color: isOwn ? 'white' : 'var(--primary)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold">Document</span>
                    <span className="text-[10px] opacity-70 truncate">{message.media_type ?? 'file'}</span>
                  </div>
                  <svg className="w-3.5 h-3.5 ml-auto shrink-0 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}

            {/* Text content */}
            {message.content && (
              <p className="text-sm leading-relaxed break-words px-3 py-2">
                {message.content}
              </p>
            )}

            {/* Spacer when only media, no text */}
            {!message.content && message.media_url && <div className="pb-2" />}
          </div>
        </div>

        {/* Timestamp */}
        <span
          className="text-[10px] px-9"
          style={{ color: 'var(--muted-foreground)', opacity: 0.55 }}
        >
          {time}
        </span>
      </div>
    </>
  );
}
