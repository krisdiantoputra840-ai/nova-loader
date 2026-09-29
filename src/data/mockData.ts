import type { DownloadItem, MediaInfo, Platform, VideoQuality, AudioQuality } from '../types/download';

export const videoQualities: VideoQuality[] = [
  { label: '1080p', value: '1080p', resolution: '1920×1080' },
  { label: '720p', value: '720p', resolution: '1280×720' },
  { label: '480p', value: '480p', resolution: '854×480' },
  { label: '360p', value: '360p', resolution: '640×360' },
];

export const tiktokQualities: VideoQuality[] = [
  { label: 'Without Watermark', value: 'no_watermark', resolution: 'HD · MP4 (H.264) · Clean' },
  { label: 'With Watermark', value: 'watermark', resolution: 'MP4 · H.264 · Original' },
];

export const audioQualities: AudioQuality[] = [
  { label: '320 kbps', value: '320kbps', bitrate: '320 kbps' },
  { label: '192 kbps', value: '192kbps', bitrate: '192 kbps' },
  { label: '128 kbps', value: '128kbps', bitrate: '128 kbps' },
];

export const mockMediaByPlatform: Record<Platform, MediaInfo> = {
  youtube: {
    title: 'How to Build a PC in 2024 — Step by Step',
    channel: 'Linus Tech Tips',
    platform: 'youtube',
    thumbnail: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=80',
    duration: '22:14',
    url: '',
  },
  tiktok: {
    title: 'Morning Routine Aesthetic ✨',
    channel: '@lifewithsara',
    platform: 'tiktok',
    thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
    duration: '0:47',
    url: '',
  },
  instagram: {
    title: 'Instagram Reel',
    channel: '@photography.daily',
    platform: 'instagram',
    thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
    duration: '0:30',
    url: '',
  },
  spotify: {
    title: 'Blinding Lights',
    channel: 'The Weeknd',
    platform: 'spotify',
    thumbnail: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36',
    duration: '3:20',
    url: '',
  },
  ytmusic: {
    title: 'Starboy (feat. Daft Punk)',
    channel: 'The Weeknd',
    platform: 'ytmusic',
    thumbnail: 'https://i.scdn.co/image/ab67616d0000b2734718e2b124f79258be7bc452',
    duration: '3:50',
    url: '',
  },
  soundcloud: {
    title: 'SoundCloud Track',
    channel: 'SoundCloud Creator',
    platform: 'soundcloud',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    duration: '3:45',
    url: '',
  },
};

export function detectPlatform(url: string): Platform | null {
  const lower = url.toLowerCase();
  if (lower.includes('music.youtube.com')) return 'ytmusic';
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('tiktok.com')) return 'tiktok';
  if (lower.includes('instagram.com')) return 'instagram';
  if (lower.includes('spotify.com') || lower.includes('spotify.link')) return 'spotify';
  if (lower.includes('soundcloud.com') || lower.includes('snd.sc')) return 'soundcloud';
  return null;
}

export const mockHistory: DownloadItem[] = [];

export function getFileSizeForQuality(quality: string, type: string): string {
  if (type === 'audio') {
    const map: Record<string, string> = {
      '320kbps': '9.8 MB',
      '192kbps': '5.9 MB',
      '128kbps': '3.9 MB',
    };
    return map[quality] || '8.0 MB';
  }
  const map: Record<string, string> = {
    'no_watermark': '18.4 MB',
    'watermark': '19.2 MB',
    '1080p': '248.5 MB',
    '720p': '142.3 MB',
    '480p': '87.6 MB',
    '360p': '52.1 MB',
  };
  return map[quality] || '100 MB';
}
