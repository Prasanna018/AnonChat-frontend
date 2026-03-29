import React, { useState } from 'react';
import type { Message } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  message: Message;
  isOwn: boolean;
}

/* ── Image Lightbox ─────────────────────────────────────────────────────── */
function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.9)' }}
      onClick={onClose}
    >
      <div className="relative max-w-3xl w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <img
          src={src}
          alt="Full size"
          className="w-full rounded-xl shadow-2xl"
          style={{ maxHeight: '80vh', objectFit: 'contain' }}
        />
        {/* Controls */}
        <div className="flex gap-3 mt-4">
          <a
            href={src}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-white transition-opacity hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </a>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-white transition-opacity hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open original
          </a>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full font-bold text-white transition-opacity hover:opacity-80"
        style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
}

/* ── Doc attachment ─────────────────────────────────────────────────────── */
function DocAttachment({
  url,
  mediaType,
  isOwn,
}: {
  url: string;
  mediaType?: string;
  isOwn: boolean;
}) {
  const ext = url.split('.').pop()?.toUpperCase() ?? 'FILE';
  const label = mediaType
    ? mediaType.split('/').pop()?.toUpperCase() ?? ext
    : ext;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150"
      style={{
        background: isOwn ? 'rgba(255,255,255,0.15)' : 'var(--muted)',
        border: '1px solid',
        borderColor: isOwn ? 'rgba(255,255,255,0.2)' : 'var(--border)',
        textDecoration: 'none',
        color: 'inherit',
        display: 'flex',
      }}
    >
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold"
        style={{
          background: isOwn ? 'rgba(255,255,255,0.2)' : 'var(--tw-blue-10)',
          color: isOwn ? 'white' : 'var(--primary)',
        }}
      >
        {label.slice(0, 3)}
      </div>

      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-xs font-semibold">Attachment</span>
        <span className="text-[10px] opacity-60 truncate">{mediaType ?? 'file'}</span>
      </div>

      {/* Arrow */}
      <svg className="w-3.5 h-3.5 shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}

/* ── Main bubble ────────────────────────────────────────────────────────── */
export default function MessageBubble({ message, isOwn }: Props) {
  const [lightbox, setLightbox] = useState(false);

  const time = formatDistanceToNow(new Date(message.timestamp), { addSuffix: true });
  const isImage = message.media_type?.startsWith('image/') ?? false;
  const hasMedia = Boolean(message.media_url);
  const hasText = Boolean(message.content);

  /* ── System message ── */
  if (message.is_system) {
    return (
      <div className="flex justify-center my-1 px-2">
        <span
          className="text-xs px-3 py-1 rounded-full text-center"
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

  return (
    <>
      {/* Lightbox overlay */}
      {lightbox && message.media_url && (
        <ImageLightbox src={message.media_url} onClose={() => setLightbox(false)} />
      )}

      <div className={`flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}>
        <div
          className={`flex items-end gap-1.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
          style={{ maxWidth: 'min(80%, 380px)' }}
        >
          {/* Avatar */}
          <div
            className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold select-none self-end mb-0.5"
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
            className="rounded-2xl overflow-hidden min-w-0"
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

            {/* ── Image attachment ── */}
            {hasMedia && isImage && message.media_url && (
              <div className={`${hasText ? 'mt-1.5 mb-0' : 'mt-1.5'} px-1`}>
                <div className="relative group">
                  <img
                    src={message.media_url}
                    alt="Attachment"
                    className="rounded-xl cursor-pointer object-cover w-full transition-all duration-200 group-hover:brightness-90"
                    style={{ maxWidth: '260px', maxHeight: '300px', display: 'block' }}
                    onClick={() => setLightbox(true)}
                    loading="lazy"
                    onError={(e) => {
                      // If image fails to load, show broken state
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  {/* Expand hint */}
                  <div
                    className="absolute inset-0 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                    style={{ background: 'rgba(0,0,0,0.2)' }}
                  >
                    <svg className="w-8 h-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* ── Document attachment ── */}
            {hasMedia && !isImage && message.media_url && (
              <div className="mx-2 mt-2">
                <DocAttachment
                  url={message.media_url}
                  mediaType={message.media_type}
                  isOwn={isOwn}
                />
              </div>
            )}

            {/* ── Text content ── */}
            {hasText && (
              <p className="text-sm leading-relaxed break-words px-3 py-2 whitespace-pre-wrap">
                {message.content}
              </p>
            )}

            {/* Spacer when only media, no text */}
            {!hasText && hasMedia && <div className="pb-2" />}
          </div>
        </div>

        {/* Timestamp */}
        <span
          className={`text-[10px] ${isOwn ? 'pr-10' : 'pl-10'}`}
          style={{ color: 'var(--muted-foreground)', opacity: 0.5 }}
        >
          {time}
        </span>
      </div>
    </>
  );
}
