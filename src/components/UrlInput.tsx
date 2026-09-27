import { useState, useRef } from 'react';
import { Link2, Clipboard, Search, Loader2 } from 'lucide-react';

interface UrlInputProps {
  onDetect: (url: string) => void;
  loading: boolean;
  autoDetect?: boolean;
}

export default function UrlInput({ onDetect, loading, autoDetect = true }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      inputRef.current?.focus();
      // Auto-detect if setting is enabled and text looks like a URL
      if (autoDetect && text.trim().startsWith('http')) {
        onDetect(text.trim());
      }
    } catch {
      inputRef.current?.focus();
    }
  };

  const handleDetect = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    onDetect(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleDetect();
  };

  return (
    <div className="w-full space-y-3">
      {/* Input row */}
      <div className="flex items-center bg-bg-surface border border-border-subtle rounded-[12px] overflow-hidden transition-colors duration-150 focus-within:border-border">
        <div className="flex items-center pl-4 text-text-muted shrink-0">
          <Link2 size={16} strokeWidth={1.75} />
        </div>

        <input
          ref={inputRef}
          id="url-input"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste a video or music link..."
          className="flex-1 bg-transparent text-text-primary placeholder-text-muted text-[14px] px-3 py-3.5 outline-none"
          aria-label="Media URL input"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
        />

        <button
          onClick={handlePaste}
          className="flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text-primary border-l border-border-subtle px-4 py-3.5 transition-colors duration-150 shrink-0"
          aria-label="Paste from clipboard"
          title="Paste from clipboard"
        >
          <Clipboard size={13} strokeWidth={1.75} />
          <span>Paste</span>
        </button>
      </div>

      {/* Detect Link button — full width on mobile, auto on desktop */}
      <div className="flex justify-center">
        <button
          id="detect-link-btn"
          onClick={handleDetect}
          disabled={!url.trim() || loading}
          className="flex items-center justify-center gap-2 px-8 py-2.5 bg-accent text-white text-[14px] font-medium rounded-[10px] transition-all duration-150 hover:bg-accent-hover active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 min-w-[160px]"
          aria-label="Detect link and show media information"
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin-slow" />
              <span>Detecting...</span>
            </>
          ) : (
            <>
              <Search size={14} strokeWidth={2} />
              <span>Detect Link</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
