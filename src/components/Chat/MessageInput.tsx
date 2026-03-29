import React, { useState, useCallback, useRef, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

interface SendPayload {
  content: string;
  media_url?: string;
  media_type?: string;
}

interface Props {
  onSend: (payload: SendPayload | string) => void;
  disabled: boolean;
  roomId: string;
  token: string;
}

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export default function MessageInput({ onSend, disabled, roomId, token }: Props) {
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Revoke blob URL on unmount / file clear
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setUploadError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [previewUrl]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset so same file can be re-picked
    if (!file) return;

    setUploadError(null);

    if (file.type.startsWith('video/')) {
      setUploadError('Video uploads are not allowed.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setUploadError('File is too large (max 10 MB).');
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
    textareaRef.current?.focus();
  }, [previewUrl]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (disabled || uploading) return;
    if (!trimmed && !selectedFile) return;

    if (selectedFile) {
      setUploading(true);
      setUploadError(null);
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const res = await fetch(`${API_URL}/api/rooms/${roomId}/media`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!res.ok) {
          let detail = 'Upload failed.';
          try { detail = (await res.json()).detail || detail; } catch { /* ignore */ }
          throw new Error(detail);
        }

        const payload: { url: string; type: string } = await res.json();
        onSend({ content: trimmed, media_url: payload.url, media_type: payload.type });
        setText('');
        clearFile();
      } catch (err: any) {
        setUploadError(err.message ?? 'Upload failed. Please try again.');
      } finally {
        setUploading(false);
      }
    } else {
      onSend(trimmed);
      setText('');
    }
  }, [text, disabled, uploading, selectedFile, roomId, token, onSend, clearFile]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = !disabled && !uploading && (text.trim().length > 0 || selectedFile != null);

  return (
    <div
      className="shrink-0 px-3 pb-3 pt-2 flex flex-col gap-2"
      style={{ borderTop: '1px solid var(--border)', background: 'var(--card)' }}
    >
      {/* Reconnecting banner */}
      {disabled && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
          style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.25)',
            color: '#f59e0b',
          }}
        >
          <span>🔄</span>
          <span>Reconnecting to room…</span>
        </div>
      )}

      {/* Upload error */}
      {uploadError && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#ef4444',
          }}
        >
          <span>⚠️</span>
          <span className="flex-1">{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="ml-auto shrink-0">✕</button>
        </div>
      )}

      {/* File Preview */}
      {selectedFile && (
        <div
          className="flex items-center gap-3 p-2 rounded-xl relative"
          style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
        >
          {/* Thumbnail or doc icon */}
          <div className="shrink-0">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-14 h-14 object-cover rounded-lg"
                style={{ border: '1px solid var(--border)' }}
              />
            ) : (
              <div
                className="w-14 h-14 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--input)' }}
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--primary)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* File info */}
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold truncate" style={{ color: 'var(--foreground)', maxWidth: '160px' }}>
              {selectedFile.name}
            </span>
            <span className="text-[10px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              {selectedFile.type || 'Unknown type'} · {(selectedFile.size / 1024).toFixed(0)} KB
            </span>
            {uploading && (
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin shrink-0"
                  style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
                />
                <span className="text-[10px]" style={{ color: 'var(--primary)' }}>Uploading…</span>
              </div>
            )}
          </div>

          {/* Remove button */}
          {!uploading && (
            <button
              onClick={clearFile}
              className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold transition-colors"
              style={{ background: 'var(--destructive)', color: 'white' }}
              title="Remove file"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Input row */}
      <div
        className="flex items-end gap-2 px-3 py-2 rounded-2xl transition-all duration-200"
        style={{
          background: 'var(--input)',
          border: '1px solid var(--border)',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {/* Attachment */}
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
          className="w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-150 active:scale-90 shrink-0"
          style={{
            background: selectedFile ? 'var(--tw-blue-10)' : 'transparent',
            color: selectedFile ? 'var(--primary)' : 'var(--muted-foreground)',
          }}
          title="Attach image or document"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || uploading}
          placeholder={
            disabled      ? 'Reconnecting…'
            : uploading   ? 'Uploading file…'
            : selectedFile ? 'Add a caption… (optional)'
            : 'Message… (Enter to send)'
          }
          rows={1}
          className="flex-1 bg-transparent text-sm resize-none focus:outline-none min-h-[22px] max-h-28 overflow-y-auto scrollbar-none disabled:cursor-not-allowed"
          style={{
            color: 'var(--foreground)',
            caretColor: 'var(--primary)',
            fieldSizing: 'content',
          } as React.CSSProperties}
        />

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-150 active:scale-90 shrink-0"
          style={{
            background: canSend ? 'var(--primary)' : 'var(--muted)',
            color: canSend ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
          }}
          title="Send message"
        >
          {uploading ? (
            <span
              className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'white', borderTopColor: 'transparent' }}
            />
          ) : (
            <svg className="w-4 h-4 rotate-45" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </div>

      <p className="text-[10px] text-center" style={{ color: 'var(--muted-foreground)', opacity: 0.45 }}>
        Shift+Enter for newline · Max 10 MB per file
      </p>
    </div>
  );
}
