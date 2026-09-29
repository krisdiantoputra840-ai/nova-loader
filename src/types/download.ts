// Download types
export type Platform = 'youtube' | 'tiktok' | 'instagram' | 'spotify' | 'ytmusic' | 'soundcloud';
export type MediaType = 'video' | 'audio';

export type DownloadStatus = 'completed' | 'downloading' | 'failed' | 'cancelled';

export interface VideoQuality {
  label: string;
  value: string;
  resolution: string;
}

export interface AudioQuality {
  label: string;
  value: string;
  bitrate: string;
}

export interface MediaInfo {
  title: string;
  channel: string;
  platform: Platform;
  thumbnail: string | null;
  duration: string;
  url: string;
  is_playlist?: boolean;
  track_count?: number;
}

export interface SelectedFormat {
  type: MediaType;
  format: string;
  quality: string;
  qualityLabel: string;
  noWatermark?: boolean;
}

export interface DownloadItem {
  id: string;
  title: string;
  channel: string;
  platform: Platform;
  thumbnail: string | null;
  type: MediaType;
  format: string;
  quality: string;
  qualityLabel: string;
  fileSize: string;
  status: DownloadStatus;
  completedAt: Date;
  url: string;
  duration?: string;
  is_playlist?: boolean;
  track_count?: number;
}

export function itemToMediaInfo(item: DownloadItem): MediaInfo {
  return {
    title: item.title,
    channel: item.channel,
    platform: item.platform,
    thumbnail: item.thumbnail,
    duration: item.duration && item.duration !== '0:00' ? item.duration : '',
    url: item.url || '',
    is_playlist: item.is_playlist,
    track_count: item.track_count,
  };
}
