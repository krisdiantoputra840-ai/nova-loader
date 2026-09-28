import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import UrlInput from '../components/UrlInput';
import PlatformList from '../components/PlatformList';
import DownloadItemCard from '../components/DownloadItem';
import type { DownloadItem, MediaInfo, Platform } from '../types/download';
import { fetchMediaInfo } from '../api/client';

interface HomeProps {
  history: DownloadItem[];
  onMediaDetected: (media: MediaInfo) => void;
  onOpenMedia?: (item: DownloadItem) => void;
  autoDetect?: boolean;
}

export default function Home({
  history,
  onMediaDetected,
  onOpenMedia,
  autoDetect = true,
}: HomeProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleOpenFromRecent = (item: DownloadItem) => {
    if (onOpenMedia) {
      onOpenMedia(item);
    }
    navigate('/media-details');
  };

  const handleDetect = async (url: string) => {
    setError(null);
    setLoading(true);

    try {
      const info = await fetchMediaInfo(url);

      const media: MediaInfo = {
        title: info.title,
        channel: info.channel,
        platform: info.platform as Platform,
        thumbnail: info.thumbnail,
        duration: info.duration,
        url: info.url,
        is_playlist: info.is_playlist,
        track_count: info.track_count,
      };

      onMediaDetected(media);
      navigate('/media-details');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch media info.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const recentItems = history.slice(0, 5);

  return (
    <main className="flex-1 animate-fade-in">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6">

        {/* ── Hero section ── */}
        <div className="text-center py-12 sm:py-16">
          <h1 className="text-[28px] sm:text-[36px] font-semibold text-text-primary tracking-[-0.025em] leading-tight">
            Download media, simply.
          </h1>
          <p className="text-[14px] sm:text-[15px] text-text-secondary mt-2">
            Fast, clean and straightforward.
          </p>

          {/* URL input */}
          <div className="mt-8 max-w-[620px] mx-auto space-y-3">
            <UrlInput onDetect={handleDetect} loading={loading} autoDetect={autoDetect} />
            {error && (
              <p className="text-[13px] text-red-400 animate-fade-up text-left" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>

        {/* ── Supported platforms ── */}
        <section className="pb-10 text-center" aria-labelledby="platforms-heading">
          <p
            id="platforms-heading"
            className="text-[13px] text-text-secondary font-medium mb-4"
          >
            Supported platforms
          </p>
          <div className="overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex justify-center">
              <PlatformList />
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-border-subtle" />

        {/* ── Recent downloads (only shown when history has items) ── */}
        {recentItems.length > 0 && (
          <section className="py-8" aria-labelledby="recent-heading">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 id="recent-heading" className="text-[15px] font-semibold text-text-primary">
                  Recent downloads
                </h2>
                <p className="text-[12px] text-text-muted mt-0.5">
                  Click any song or video to open and download again
                </p>
              </div>
              <Link
                to="/history"
                className="text-[13px] text-accent hover:text-accent-hover transition-colors duration-150 font-medium"
              >
                See all ({history.length}) →
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              {recentItems.map((item) => (
                <DownloadItemCard
                  key={item.id}
                  item={item}
                  onDelete={undefined}
                  onOpenMedia={handleOpenFromRecent}
                />
              ))}
            </div>
          </section>
        )}

        {recentItems.length === 0 && <div className="pb-10" />}
      </div>
    </main>
  );
}
