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

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf', 'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MessageInput({ onSend, disabled, roomId, token }: Props) {
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Cleanup blob URL on unmount / file change
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const clearFile = useCallback(() => {
    // Cancel any in-flight upload
    abortRef.current?.abort();
    abortRef.current = null;

    setSelectedFile(null);
    setUploadError(null);
    setUploadProgress(0);
    setUploading(false);

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
    setUploadProgress(0);

    // Block videos
    if (file.type.startsWith('video/')) {
      setUploadError('Video uploads are not allowed.');
      return;
    }

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError(`File type "${file.type || 'unknown'}" is not supported.`);
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_BYTES) {
      setUploadError(`File too large (${formatBytes(file.size)}). Maximum is 10 MB.`);
      return;
    }

    setSelectedFile(file);

    // Generate preview for images only
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
      setUploadProgress(0);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const res = await fetch(`${API_URL}/api/rooms/${roomId}/media`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
          signal: controller.signal,
        });

        if (!res.ok) {
          let detail = 'Upload failed.';
          try { detail = (await res.json()).detail ?? detail; } catch { /* ignore */ }
          throw new Error(detail);
        }

        const payload: { url: string; type: string } = await res.json();

        if (!payload.url) {
          throw new Error('No URL returned from server.');
        }

        // Send message via WebSocket with media attached
        onSend({
          content: trimmed,
          media_url: payload.url,
          media_type: payload.type,
        });

        setText('');
        clearFile();
      } catch (err: any) {
        if (err.name === 'AbortError') return; // user cancelled
        setUploadError(err.message ?? 'Upload failed. Please try again.');
      } finally {
        setUploading(false);
        setUploadProgress(0);
        abortRef.current = null;
      }
    } else {
      // Text-only message
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

  // Auto-resize textarea
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`; // max ~4 lines
  };

  const canSend = !disabled && !uploading && (text.trim().length > 0 || selectedFile != null);
  const isImage = selectedFile?.type.startsWith('image/') ?? false;

  return (
    <div
      className="shrink-0 flex flex-col"
      style={{
        borderTop: '1px solid var(--border)',
        background: 'var(--card)',
        // iOS safe area padding for bottom
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* ── Reconnecting banner ── */}
      {disabled && (
        <div
          className="flex items-center gap-2 mx-3 mt-3 px-3 py-2 rounded-xl text-xs"
          style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.25)',
            color: '#f59e0b',
          }}
        >
          <span className="shrink-0">🔄</span>
          <span>Reconnecting to room…</span>
        </div>
      )}

      {/* ── Upload error ── */}
      {uploadError && (
        <div
          className="flex items-center gap-2 mx-3 mt-3 px-3 py-2 rounded-xl text-xs"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#ef4444',
          }}
        >
          <span className="shrink-0">⚠️</span>
          <span className="flex-1 min-w-0 break-words">{uploadError}</span>
          <button
            onClick={() => setUploadError(null)}
            className="shrink-0 ml-auto font-bold opacity-70 hover:opacity-100"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── File preview ── */}
      {selectedFile && (
        <div
          className="mx-3 mt-3 flex items-center gap-3 p-2 pr-3 rounded-xl relative"
          style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
        >
          {/* Thumbnail or doc icon */}
          <div className="shrink-0">
            {previewUrl && isImage ? (
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
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold truncate" style={{ color: 'var(--foreground)' }}>
              {selectedFile.name}
            </span>
            <span className="text-[10px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              {selectedFile.type || 'Unknown type'} · {formatBytes(selectedFile.size)}
            </span>

            {/* Upload progress */}
            {uploading && (
              <div className="mt-1.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin shrink-0"
                    style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
                  />
                  <span className="text-[10px]" style={{ color: 'var(--primary)' }}>
                    Uploading…
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Cancel / Remove button */}
          <button
            onClick={clearFile}
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold transition-opacity hover:opacity-80"
            style={{ background: 'var(--destructive)', color: 'white' }}
            title={uploading ? 'Cancel upload' : 'Remove file'}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Input row ── */}
      <div className="flex items-end gap-2 px-3 py-3">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleFileChange}
        />

        {/* Attach button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-150 active:scale-90 shrink-0"
          style={{
            background: selectedFile ? 'var(--tw-blue-10)' : 'var(--muted)',
            color: selectedFile ? 'var(--primary)' : 'var(--muted-foreground)',
            border: '1px solid',
            borderColor: selectedFile ? 'var(--primary)' : 'var(--border)',
          }}
          title="Attach image or document"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

        {/* Textarea */}
        <div
          className="flex-1 flex items-end rounded-2xl px-3 py-2 transition-all duration-200"
          style={{
            background: 'var(--input)',
            border: '1px solid var(--border)',
            opacity: disabled ? 0.6 : 1,
          }}
        >
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            disabled={disabled || uploading}
            placeholder={
              disabled      ? 'Reconnecting…'
              : uploading   ? 'Uploading…'
              : selectedFile ? 'Add a caption… (optional)'
              : 'Message… (Enter to send)'
            }
            rows={1}
            className="flex-1 bg-transparent text-sm resize-none focus:outline-none overflow-y-auto scrollbar-none disabled:cursor-not-allowed leading-relaxed"
            style={{
              color: 'var(--foreground)',
              caretColor: 'var(--primary)',
              minHeight: '22px',
              maxHeight: '112px',
            }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-150 active:scale-90 shrink-0"
          style={{
            background: canSend ? 'var(--primary)' : 'var(--muted)',
            color: canSend ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
          }}
          title={uploading ? 'Uploading…' : 'Send message'}
        >
          {uploading ? (
            <span
              className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'white', borderTopColor: 'transparent' }}
            />
          ) : (
            <svg className="w-4 h-4 rotate-45" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </div>

      {/* Hint */}
      <p
        className="text-[10px] text-center pb-2 px-4"
        style={{ color: 'var(--muted-foreground)', opacity: 0.4 }}
      >
        Shift+Enter for newline · Max 10 MB · Images, PDF, Word
      </p>
    </div>
  );
}
