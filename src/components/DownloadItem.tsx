import { CheckCircle, Music, Video, MoreVertical, Trash2, FolderOpen } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { DownloadItem } from '../types/download';
import { PlatformIcon, getPlatformName } from './PlatformList';

interface DownloadItemCardProps {
  item: DownloadItem;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = diff / (1000 * 60 * 60);
  const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  if (hours < 24) return `Today, ${timeStr}`;
  if (hours < 48) return `Yesterday, ${timeStr}`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + `, ${timeStr}`;
}

/** Thumbnail box: real cover art → icon fallback */
function Thumbnail({ item }: { item: DownloadItem }) {
  const [imgError, setImgError] = useState(false);
  const showImage = !!item.thumbnail && !imgError;

  return (
    <div className="shrink-0 w-11 h-11 rounded-[8px] bg-bg-elevated border border-border-subtle flex items-center justify-center text-text-muted overflow-hidden">
      {showImage ? (
        <img
          src={item.thumbnail!}
          alt={item.title}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : item.type === 'audio' ? (
        <Music size={18} strokeWidth={1.5} />
      ) : (
        <Video size={18} strokeWidth={1.5} />
      )}
    </div>
  );
}

export default function DownloadItemCard({ item, onDelete, compact = false }: DownloadItemCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <div className="flex items-center gap-3 sm:gap-4 px-4 py-3.5 bg-bg-surface border border-border-subtle rounded-[10px] transition-colors duration-150 hover:border-border group">
      {/* Thumbnail */}
      <Thumbnail item={item} />

      {/* Title + platform info */}
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] text-text-primary font-medium truncate leading-snug">
          {item.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <PlatformIcon platform={item.platform} size={12} />
          <span className="text-[12px] text-text-secondary">
            {getPlatformName(item.platform)} · {item.format} · {item.qualityLabel}
          </span>
        </div>
      </div>

      {/* File size + time — hidden on compact/mobile */}
      {!compact && (
        <div className="hidden sm:flex flex-col items-end shrink-0 min-w-[90px]">
          <span className="text-[13px] text-text-secondary font-medium">{item.fileSize}</span>
          <span className="text-[12px] text-text-muted mt-0.5">{formatTime(item.completedAt)}</span>
        </div>
      )}

      {/* Status badge */}
      {item.status === 'completed' && (
        <div className="hidden sm:flex items-center gap-1.5 shrink-0 min-w-[100px] justify-end">
          <CheckCircle size={14} strokeWidth={2} className="text-emerald-400" />
          <span className="text-[13px] text-emerald-400 font-medium">Completed</span>
        </div>
      )}

      {/* 3-dot menu */}
      {onDelete && (
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="p-1.5 rounded-[6px] text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors duration-150"
            aria-label="More options"
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            <MoreVertical size={15} strokeWidth={1.75} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-8 z-20 w-40 bg-bg-elevated border border-border-subtle rounded-[10px] shadow-card overflow-hidden animate-fade-up">
              <button
                onClick={() => { setMenuOpen(false); }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[13px] text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors duration-150"
              >
                <FolderOpen size={13} strokeWidth={1.75} />
                Open file
              </button>
              <div className="border-t border-border-subtle" />
              <button
                onClick={() => { setMenuOpen(false); onDelete(item.id); }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[13px] text-red-400 hover:bg-bg-surface transition-colors duration-150"
              >
                <Trash2 size={13} strokeWidth={1.75} />
                Delete
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mobile: compact status */}
      {compact && item.status === 'completed' && (
        <CheckCircle size={14} strokeWidth={2} className="text-emerald-400 shrink-0 sm:hidden" />
      )}
    </div>
  );
}
