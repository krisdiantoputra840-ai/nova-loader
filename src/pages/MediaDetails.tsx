import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Info } from 'lucide-react';
import MediaPreview from '../components/MediaPreview';
import FormatSelector from '../components/FormatSelector';
import QualitySelector from '../components/QualitySelector';
import type { MediaInfo, MediaType, SelectedFormat } from '../types/download';
import { videoQualities, audioQualities, tiktokQualities } from '../data/mockData';
import { fetchMediaInfo } from '../api/client';

interface MediaDetailsProps {
  media: MediaInfo | null;
  onStartDownload: (format: SelectedFormat) => void;
  defaultFormat?: string;
  defaultQuality?: string;
  initialFormat?: SelectedFormat | null;
}

const AUDIO_FORMATS = ['MP3', 'WAV'] as const;
type AudioFormat = typeof AUDIO_FORMATS[number];

export default function MediaDetails({
  media,
  onStartDownload,
  defaultFormat = 'MP4',
  defaultQuality = '1080p',
  initialFormat,
}: MediaDetailsProps) {
  const navigate = useNavigate();
  const isTikTok = media?.platform === 'tiktok';
  const isSpotifyOrMusic = media?.platform === 'spotify' || media?.platform === 'ytmusic';

  const [currentDuration, setCurrentDuration] = useState<string>(() => {
    return (media?.duration && media.duration !== '0:00') ? media.duration : '';
  });
  const [currentChannel, setCurrentChannel] = useState<string>(() => {
    return media?.channel || '';
  });

  useEffect(() => {
    const needsDuration = !media?.duration || media.duration === '0:00';
    const needsChannel = !media?.channel || media.channel === 'Unknown Artist' || media.channel === 'Unknown';

    if (media?.url && (needsDuration || needsChannel)) {
      fetchMediaInfo(media.url)
        .then((info) => {
          if (info.duration && info.duration !== '0:00') {
            setCurrentDuration(info.duration);
            media.duration = info.duration;
          }
          if (info.channel && info.channel !== 'Unknown Artist' && info.channel !== 'Unknown') {
            setCurrentChannel(info.channel);
            media.channel = info.channel;
          }
        })
        .catch(() => {});
    } else {
      if (media?.duration && media.duration !== '0:00') {
        setCurrentDuration(media.duration);
      }
      if (media?.channel) {
        setCurrentChannel(media.channel);
      }
    }
  }, [media?.url, media?.duration, media?.channel]);

  const [mediaType, setMediaType] = useState<MediaType>(() => {
    if (initialFormat?.type) return initialFormat.type;
    if (!media) return 'video';
    if (media.platform === 'spotify' || media.platform === 'ytmusic') return 'audio';
    return defaultFormat === 'MP3' || defaultFormat === 'WAV' ? 'audio' : 'video';
  });
  const [videoQuality, setVideoQuality] = useState(() => {
    if (initialFormat?.type === 'video' && initialFormat.quality) return initialFormat.quality;
    return defaultQuality.includes('kbps') ? '1080p' : defaultQuality;
  });
  const [tiktokQuality, setTiktokQuality] = useState<'no_watermark' | 'watermark'>('no_watermark');
  const [audioQuality, setAudioQuality] = useState(() => {
    if (initialFormat?.type === 'audio' && initialFormat.quality) return initialFormat.quality;
    return defaultQuality.includes('kbps') ? defaultQuality : '320kbps';
  });
  const [audioFormat, setAudioFormat] = useState<AudioFormat>(() => {
    if (initialFormat?.type === 'audio' && (initialFormat.format === 'WAV' || initialFormat.format === 'MP3')) {
      return initialFormat.format as AudioFormat;
    }
    return (defaultFormat === 'WAV' ? 'WAV' : 'MP3') as AudioFormat;
  });

  if (!media) {
    navigate('/');
    return null;
  }

  const handleDownload = () => {
    const isAudio = mediaType === 'audio';
    const quality = isAudio
      ? audioQuality
      : isTikTok
      ? tiktokQuality
      : videoQuality;

    const qualityLabel = isAudio
      ? audioQualities.find((q) => q.value === audioQuality)?.label ?? audioQuality
      : isTikTok
      ? tiktokQualities.find((q) => q.value === tiktokQuality)?.label ?? (tiktokQuality === 'no_watermark' ? 'Without Watermark' : 'With Watermark')
      : videoQualities.find((q) => q.value === videoQuality)?.label ?? videoQuality;

    const format: SelectedFormat = {
      type: mediaType,
      format: isAudio ? audioFormat : 'MP4',
      quality,
      qualityLabel,
      noWatermark: isTikTok ? tiktokQuality === 'no_watermark' : undefined,
    };
    onStartDownload(format);
    navigate('/download-progress');
  };

  const vqOptions = videoQualities.map((q) => ({
    label: q.label,
    value: q.value,
    sub: q.resolution,
  }));

  const tqOptions = tiktokQualities.map((q) => ({
    label: q.label,
    value: q.value,
    sub: q.resolution,
  }));

  const aqOptions = audioQualities.map((q) => ({
    label: q.label,
    value: q.value,
    sub: q.bitrate,
  }));

  return (
    <main className="flex-1 animate-fade-in">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text-primary transition-colors duration-150 mb-8"
          aria-label="Go back"
        >
          <ArrowLeft size={14} strokeWidth={2} />
          Back
        </button>

        <div className="max-w-[560px] space-y-8">
          {/* Media preview */}
          <MediaPreview media={{ ...media, duration: currentDuration, channel: currentChannel || media.channel }} />

          {/* Info banner for Spotify / YT Music */}
          {isSpotifyOrMusic && (
            <div className="flex items-start gap-2.5 px-4 py-3 bg-bg-elevated border border-border-subtle rounded-[10px] text-[13px] text-text-secondary">
              <Info size={14} strokeWidth={1.75} className="text-accent mt-0.5 shrink-0" />
              <span>
                {media.platform === 'spotify'
                  ? 'Spotify downloads via audio matching — quality preserved, no DRM.'
                  : 'YouTube Music downloads as audio only.'}
              </span>
            </div>
          )}

          {/* Info banner for TikTok */}
          {isTikTok && mediaType === 'video' && (
            <div className="flex items-start gap-2.5 px-4 py-3 bg-bg-elevated border border-border-subtle rounded-[10px] text-[13px] text-text-secondary">
              <Info size={14} strokeWidth={1.75} className="text-accent mt-0.5 shrink-0" />
              <span>
                TikTok video is processed as universal MP4 (H.264) without HEVC for compatibility with all video players.
              </span>
            </div>
          )}

          <div className="border-t border-border-subtle" />

          {/* Format toggle — hide for Spotify/YT Music (audio-only) */}
          {!isSpotifyOrMusic && (
            <div className="space-y-2">
              <p className="text-[12px] text-text-muted uppercase tracking-wider font-medium">Format</p>
              <FormatSelector value={mediaType} onChange={(v) => setMediaType(v)} />
            </div>
          )}

          {/* Audio format (MP3 / WAV) — only when audio mode */}
          {mediaType === 'audio' && (
            <div className="space-y-2">
              <p className="text-[12px] text-text-muted uppercase tracking-wider font-medium">Audio Format</p>
              <div className="flex gap-2">
                {AUDIO_FORMATS.map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setAudioFormat(fmt)}
                    className={`flex-1 py-2.5 text-[13px] font-medium rounded-[8px] border transition-all duration-150 ${
                      audioFormat === fmt
                        ? 'bg-accent border-accent text-white'
                        : 'bg-bg-elevated border-border-subtle text-text-secondary hover:border-border hover:text-text-primary'
                    }`}
                  >
                    {fmt}
                    {fmt === 'WAV' && (
                      <span className="ml-1.5 text-[10px] opacity-70">Lossless</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quality selector */}
          {mediaType === 'video' ? (
            isTikTok ? (
              <QualitySelector
                label="Video Option"
                options={tqOptions}
                value={tiktokQuality}
                onChange={(v) => setTiktokQuality(v as 'no_watermark' | 'watermark')}
              />
            ) : (
              <QualitySelector
                label="Quality"
                options={vqOptions}
                value={videoQuality}
                onChange={setVideoQuality}
              />
            )
          ) : (
            /* WAV is lossless — no bitrate selector needed */
            audioFormat === 'MP3' ? (
              <QualitySelector
                label="Quality"
                options={aqOptions}
                value={audioQuality}
                onChange={setAudioQuality}
              />
            ) : (
              <div className="px-4 py-3 bg-bg-elevated border border-border-subtle rounded-[10px] text-[13px] text-text-secondary">
                WAV is uncompressed lossless audio — no quality setting needed.
              </div>
            )
          )}

          {/* Download button */}
          <button
            id="download-btn"
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 py-3 bg-accent hover:bg-accent-hover text-white text-[14px] font-medium rounded-[10px] transition-all duration-150 active:scale-[0.98]"
            aria-label="Start download"
          >
            <Download size={15} strokeWidth={2} />
            Download {mediaType === 'audio' ? audioFormat : isTikTok ? (tiktokQuality === 'no_watermark' ? 'MP4 (Without Watermark)' : 'MP4 (With Watermark)') : 'MP4'}
          </button>
        </div>
      </div>
    </main>
  );
}
