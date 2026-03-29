import React, { useState, useCallback, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Props {
  onSend: (payload: { content: string; media_url?: string; media_type?: string } | string) => void;
  disabled: boolean;
  roomId: string;
  token: string;
}

export default function MessageInput({ onSend, disabled, roomId, token }: Props) {
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled || uploading) return;
    onSend(trimmed);
    setText('');
  }, [text, disabled, uploading, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Clear input so same file can be selected again
    e.target.value = '';
    
    // Check if video
    if (file.type.startsWith('video/')) {
      alert('Video uploads are not allowed.');
      return;
    }
    
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch(`${API_URL}/api/rooms/${roomId}/media`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to upload file');
      }
      
      const payload = await res.json();
      
      // Send message with media
      onSend({
        content: text.trim(),
        media_url: payload.url,
        media_type: payload.type
      });
      
      setText('');
      
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  const canSend = !disabled && !uploading && text.trim().length > 0;

  return (
    <div
      className="shrink-0 px-4 py-3"
      style={{ borderTop: '1px solid var(--border)', background: 'var(--card)' }}
    >
      {/* Reconnecting banner */}
      {disabled && (
        <div
          className="mb-3 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs"
          style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.25)',
            color: '#f59e0b',
          }}
        >
          <span>🔄</span>
          <p>Reconnecting to room…</p>
        </div>
      )}

      <div
        className="flex items-end gap-3 px-4 py-3 rounded-[var(--radius)] transition-all duration-200"
        style={{
          background: 'var(--input)',
          border: `1px solid ${disabled ? 'var(--border)' : 'var(--border)'}`,
          opacity: disabled ? 0.6 : 1,
        }}
        onFocus={(e) => {
          if (!disabled) e.currentTarget.style.borderColor = 'var(--ring)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)';
        }}
      >
        {/* Attachment button */}
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept="image/*,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileChange} 
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 active:scale-90 shrink-0"
          style={{
            background: 'var(--muted)',
            color: 'var(--muted-foreground)',
          }}
          title="Attach a file"
        >
          {uploading ? (
            <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--foreground)', borderTopColor: 'transparent' }}></span>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          )}
        </button>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? 'Reconnecting…' : 'Type a message… (Enter to send)'}
          rows={1}
          className="flex-1 bg-transparent text-sm resize-none focus:outline-none min-h-[24px] max-h-32 overflow-y-auto scrollbar-none disabled:cursor-not-allowed"
          style={{
            color: 'var(--foreground)',
            caretColor: 'var(--primary)',
            fieldSizing: 'content',
          } as React.CSSProperties}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 active:scale-90 shrink-0"
          style={{
            background: canSend ? 'var(--primary)' : 'var(--muted)',
            color: canSend ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
          }}
        >
          <svg className="w-4 h-4 rotate-45" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>

      <p className="text-xs text-center mt-1.5" style={{ color: 'var(--muted-foreground)', opacity: 0.5 }}>
        Shift+Enter for newline
      </p>
    </div>
  );
}
