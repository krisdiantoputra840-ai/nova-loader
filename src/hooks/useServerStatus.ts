import { useState, useEffect, useCallback } from 'react';
import { getApiBase } from '../api/client';

export type ServerHealth = 'checking' | 'online' | 'offline';

export function useServerStatus() {
  const [status, setStatus] = useState<ServerHealth>('checking');
  const [detail, setDetail] = useState<string>('');

  const check = useCallback(async () => {
    setStatus('checking');
    try {
      const url = getApiBase();
      const res = await fetch(`${url}/api/health`, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus('online');
        setDetail(data.ffmpeg ? 'FastAPI & FFmpeg ready' : 'FastAPI online');
      } else {
        setStatus('offline');
        setDetail(`Server returned HTTP ${res.status}`);
      }
    } catch {
      setStatus('offline');
      setDetail('Could not reach backend or ngrok tunnel');
    }
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, [check]);

  return { status, detail, apiUrl: getApiBase(), check };
}
