import React, { useState, useCallback } from 'react';

interface Props {
  onSend: (content: string) => void;
  disabled: boolean;
}

export default function MessageInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('');

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  }, [text, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = !disabled && text.trim().length > 0;

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
