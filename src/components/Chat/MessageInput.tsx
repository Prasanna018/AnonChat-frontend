import React, { useState, useRef, useCallback } from 'react';

interface Props {
  onSend: (content: string) => void;
  disabled: boolean;
  disabledReason?: string;
}

export default function MessageInput({ onSend, disabled, disabledReason }: Props) {
  const [text, setText] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

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

  return (
    <div className="border-t border-white/5 p-4">
      {disabledReason && (
        <div className="mb-3 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5">
          <span className="text-amber-400 text-sm">⚠️</span>
          <p className="text-amber-300 text-xs">{disabledReason}</p>
        </div>
      )}
      <div className={`flex items-end gap-3 glass rounded-2xl px-4 py-3 transition-all duration-200 ${
        disabled ? 'opacity-50' : 'focus-within:border-brand-500/40'
      }`}>
        <textarea
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Type a message… (Enter to send)"
          rows={1}
          className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 resize-none focus:outline-none min-h-[24px] max-h-32 overflow-y-auto scrollbar-none disabled:cursor-not-allowed"
          style={{ fieldSizing: 'content' } as React.CSSProperties}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-600 hover:bg-brand-500 disabled:bg-slate-700 disabled:text-slate-500 text-white transition-all duration-150 active:scale-90 shrink-0"
        >
          <svg className="w-4 h-4 rotate-45" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
      <p className="text-xs text-slate-600 text-center mt-2">Shift+Enter for newline</p>
    </div>
  );
}
