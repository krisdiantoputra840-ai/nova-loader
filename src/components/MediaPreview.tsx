import { useState } from 'react';
import { Music, Video } from 'lucide-react';
import type { MediaInfo } from '../types/download';
import { PlatformIcon, getPlatformName } from './PlatformList';

interface MediaPreviewProps {
  media: MediaInfo;
}

export default function MediaPreview({ media }: MediaPreviewProps) {
  const [imgError, setImgError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const isAudio = media.platform === 'spotify' || media.platform === 'ytmusic';
  const isYouTube = media.platform === 'youtube';
  const hasThumbnail = Boolean(media.thumbnail) && !imgError;

  return (
    <div className="flex items-center gap-4">
      {/* Thumbnail */}
      <div
        className={`relative shrink-0 rounded-[10px] bg-bg-elevated border border-border-subtle flex items-center justify-center text-text-muted overflow-hidden shadow-sm transition-all duration-200 ${
          isYouTube
            ? 'w-[118px] sm:w-[136px] aspect-video'
            : 'w-[72px] h-[72px] sm:w-[80px] sm:h-[80px]'
        }`}
      >
        {hasThumbnail ? (
          <>
            {!loaded && (
              <div className="absolute inset-0 bg-bg-elevated animate-pulse flex items-center justify-center">
                {isAudio ? (
                  <Music size={20} strokeWidth={1.5} className="text-text-muted/60" />
                ) : (
                  <Video size={20} strokeWidth={1.5} className="text-text-muted/60" />
                )}
              </div>
            )}
            <img
              src={media.thumbnail!}
              alt={media.title}
              className={`w-full h-full object-cover transition-opacity duration-200 ${
                loaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setLoaded(true)}
              onError={() => setImgError(true)}
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
            />
            {/* YouTube duration badge overlay on thumbnail */}
            {isYouTube && media.duration && media.duration !== '0:00' && (
              <span className="absolute bottom-1 right-1 px-1.5 py-0.5 text-[10px] font-semibold bg-black/85 text-white/95 rounded-[4px] backdrop-blur-[2px] leading-tight tabular-nums pointer-events-none">
                {media.duration}
              </span>
            )}
          </>
        ) : (
          isAudio ? (
            <Music size={22} strokeWidth={1.5} />
          ) : (
            <Video size={22} strokeWidth={1.5} />
          )
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h2 className="text-[16px] font-semibold text-text-primary leading-snug line-clamp-2">
          {media.title}
        </h2>
        <div className="flex items-center gap-2 mt-1.5">
          <PlatformIcon platform={media.platform} size={13} />
          <span className="text-[13px] text-text-secondary truncate">
            {media.channel} · {getPlatformName(media.platform)}
          </span>
        </div>
        {media.duration && media.duration !== '0:00' && !isYouTube && (
          <span className="text-[12px] text-text-muted mt-1 inline-block">{media.duration}</span>
        )}
      </div>
    </div>
  );
}
