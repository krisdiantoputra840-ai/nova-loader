// Base URL for backend API (supports VITE_API_URL from Vercel / ngrok)
export const API_BASE = (import.meta as any).env?.VITE_API_URL || 'https://bats-tummy-underarm.ngrok-free.dev';

export interface ApiMediaInfo {
  title: string;
  channel: string;
  platform: string;
  thumbnail: string | null;
  duration: string;
  url: string;
}

export async function fetchMediaInfo(url: string): Promise<ApiMediaInfo> {
  const res = await fetch(`${API_BASE}/api/info`, {
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

  return res.json();
}

export async function downloadMedia(params: {
  url: string;
  media_type: 'video' | 'audio';
  quality: string;
  format: string;
  no_watermark?: boolean;
}): Promise<{ blob: Blob; filename: string }> {
  const res = await fetch(`${API_BASE}/api/download`, {
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
