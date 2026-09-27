import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle, Home, FolderOpen, AlertCircle, Music, Video } from 'lucide-react';
import ProgressBar from '../components/ProgressBar';
import type { MediaInfo, SelectedFormat } from '../types/download';
import { getPlatformName, PlatformIcon } from '../components/PlatformList';
import { downloadMedia, saveBlobAsFile } from '../api/client';

interface DownloadProgressProps {
  media: MediaInfo | null;
  format: SelectedFormat | null;
  onComplete: (filename: string) => void;
}

type Phase = 'downloading' | 'complete' | 'error';

export default function DownloadProgress({ media, format, onComplete }: DownloadProgressProps) {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<Phase>('downloading');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [savedFilename, setSavedFilename] = useState<string>('');
  const [imgError, setImgError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Fake progress ticker while real download runs in background
  useEffect(() => {
    if (phase !== 'downloading') return;

    // Animate progress up to ~90%, real completion will set 100%
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + Math.random() * 3, 90);
      setProgress(Math.round(current));
    }, 400);

    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (!media || !format) {
      navigate('/');
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const run = async () => {
      try {
        const { blob, filename } = await downloadMedia({
          url: media.url,
          media_type: format.type,
          quality: format.quality,
          format: format.format,
          no_watermark: format.noWatermark,
        });

        if (controller.signal.aborted) return;

        // Trigger browser save dialog
        saveBlobAsFile(blob, filename);
        setSavedFilename(filename);

        setProgress(100);
        setTimeout(() => {
          setPhase('complete');
          onComplete(filename);
        }, 400);
      } catch (err) {
        if (controller.signal.aborted) return;
        const msg = err instanceof Error ? err.message : 'Download failed.';
        setErrorMsg(msg);
        setPhase('error');
      }
    };

    run();

    return () => {
      controller.abort();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!media || !format) return null;

  const qualityDisplay = `${format.format} · ${format.qualityLabel}`;
  const isAudio = media.platform === 'spotify' || media.platform === 'ytmusic';

  return (
    <main className="flex-1 animate-fade-in">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-[420px] mx-auto">

          {/* ── Downloading ── */}
          {phase === 'downloading' && (
            <div className="space-y-6">
              <p className="text-[12px] text-text-muted uppercase tracking-wider font-medium">
                Downloading
              </p>

              <div className="flex items-center gap-3.5">
                <div className="shrink-0 w-12 h-12 rounded-[8px] bg-bg-elevated border border-border-subtle flex items-center justify-center text-text-muted overflow-hidden">
                  {media.thumbnail && !imgError ? (
                    <img
                      src={media.thumbnail}
                      alt={media.title}
                      className="w-full h-full object-cover"
                      onError={() => setImgError(true)}
                      referrerPolicy="no-referrer"
                    />
                  ) : isAudio ? (
                    <Music size={18} strokeWidth={1.5} />
                  ) : (
                    <Video size={18} strokeWidth={1.5} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-[16px] font-semibold text-text-primary leading-snug line-clamp-1">
                    {media.title}
                  </h1>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <PlatformIcon platform={media.platform} size={12} />
                    <span className="text-[12.5px] text-text-secondary truncate">
                      {getPlatformName(media.platform)} · {qualityDisplay}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <ProgressBar progress={progress} />
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-text-primary font-medium tabular-nums">{progress}%</span>
                  <span className="text-text-muted text-[12px]">
                    Processing on server...
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  abortRef.current?.abort();
                  navigate('/');
                }}
                className="flex items-center gap-1.5 text-[13px] text-text-muted hover:text-red-400 transition-colors duration-150"
                aria-label="Cancel download"
              >
                <X size={13} strokeWidth={2} />
                Cancel
              </button>
            </div>
          )}

          {/* ── Complete ── */}
          {phase === 'complete' && (
            <div className="space-y-6 animate-fade-up">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle size={20} strokeWidth={1.75} />
                <span className="text-[15px] font-medium">Download complete</span>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="shrink-0 w-12 h-12 rounded-[8px] bg-bg-elevated border border-border-subtle flex items-center justify-center text-text-muted overflow-hidden">
                  {media.thumbnail && !imgError ? (
                    <img
                      src={media.thumbnail}
                      alt={media.title}
                      className="w-full h-full object-cover"
                      onError={() => setImgError(true)}
                      referrerPolicy="no-referrer"
                    />
                  ) : isAudio ? (
                    <Music size={18} strokeWidth={1.5} />
                  ) : (
                    <Video size={18} strokeWidth={1.5} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-semibold text-text-primary leading-snug line-clamp-1">
                    {media.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <PlatformIcon platform={media.platform} size={12} />
                    <span className="text-[12.5px] text-text-secondary truncate">
                      {getPlatformName(media.platform)} · {qualityDisplay}
                    </span>
                  </div>
                  {savedFilename && (
                    <p className="text-[12px] text-text-muted mt-1 truncate">
                      Saved as: {savedFilename}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-bg-surface border border-border-subtle hover:border-border text-text-primary text-[13.5px] font-medium rounded-[10px] transition-all duration-150"
                  aria-label="File saved to Downloads"
                  onClick={() => navigate('/')}
                >
                  <FolderOpen size={14} strokeWidth={1.75} />
                  File saved to Downloads
                </button>
              </div>

              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-primary transition-colors duration-150"
              >
                <Home size={13} strokeWidth={1.75} />
                Back to home
              </button>
            </div>
          )}

          {/* ── Error ── */}
          {phase === 'error' && (
            <div className="space-y-5 animate-fade-up">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle size={20} strokeWidth={1.75} />
                <span className="text-[15px] font-medium">Download failed</span>
              </div>
              <p className="text-[13px] text-text-secondary leading-relaxed bg-bg-surface border border-border-subtle rounded-[10px] px-4 py-3">
                {errorMsg}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-white text-[13.5px] font-medium rounded-[10px] transition-all duration-150"
                >
                  Try again
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-bg-surface border border-border-subtle hover:border-border text-text-secondary hover:text-text-primary text-[13.5px] font-medium rounded-[10px] transition-all duration-150"
                >
                  <Home size={14} strokeWidth={1.75} />
                  Home
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
