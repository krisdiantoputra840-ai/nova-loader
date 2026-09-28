// Base URL for backend API:
// When running locally in browser (localhost / 127.0.0.1), connect directly to local backend on port 8080.
// When hosted on Vercel, connect via VITE_API_URL or ngrok tunnel.
const isLocal = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname.startsWith('192.168.') ||
  window.location.hostname.startsWith('10.') ||
  window.location.hostname.endsWith('.local')
);

export function getApiBase(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('nova_api_url');
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, '');
    }
  }
  return (import.meta as any).env?.VITE_API_URL || (isLocal ? `http://${window.location.hostname}:8080` : 'https://bats-tummy-underarm.ngrok-free.dev');
}

export const API_BASE = getApiBase();

export interface ApiMediaInfo {
  title: string;
  channel: string;
  platform: string;
  thumbnail: string | null;
  duration: string;
  url: string;
  is_playlist?: boolean;
  track_count?: number;
}

export async function fetchMediaInfo(url: string): Promise<ApiMediaInfo> {
  try {
    const res = await fetch(`${getApiBase()}/api/info`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({ url }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail ?? `Server error ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    if (err.message && err.message.includes('Failed to fetch')) {
      throw new Error(
        isLocal 
          ? 'Cannot connect to backend server on port 8080. Please make sure start_backend.bat is running.' 
          : 'Could not connect to download server. Connection timed out or server unavailable.'
      );
    }
    throw err;
  }
}

export async function downloadMedia(params: {
  url: string;
  media_type: 'video' | 'audio';
  quality: string;
  format: string;
  no_watermark?: boolean;
}): Promise<{ blob: Blob; filename: string }> {
  try {
    const res = await fetch(`${getApiBase()}/api/download`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail ?? `Download error ${res.status}`);
    }

    const blob = await res.blob();

    // Extract filename from Content-Disposition header
    const disposition = res.headers.get('Content-Disposition') ?? '';
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match?.[1] ?? `nova_download.${params.format.toLowerCase()}`;

    return { blob, filename };
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    if (err.message && err.message.includes('Failed to fetch')) {
      throw new Error(
        isLocal 
          ? 'Cannot connect to backend server on port 8080. Please make sure start_backend.bat is running.' 
          : 'Could not connect to download server. Connection timed out or server unavailable.'
      );
    }
    throw err;
  }
}

/** Trigger browser file save dialog */
export function saveBlobAsFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
