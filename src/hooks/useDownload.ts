import { useState, useCallback, useEffect } from 'react';
import type { DownloadItem, MediaInfo, SelectedFormat } from '../types/download';
import { getFileSizeForQuality } from '../data/mockData';

const STORAGE_KEY = 'nova_download_history';
const MAX_HISTORY = 100; // batas supaya tidak terlalu besar

/** Serialise Date ke string agar bisa masuk JSON */
function serialise(items: DownloadItem[]): string {
  return JSON.stringify(
    items.map((i) => ({ ...i, completedAt: i.completedAt.toISOString() }))
  );
}

/** Deserialise JSON kembali ke DownloadItem[] dengan Date asli */
function deserialise(raw: string): DownloadItem[] {
  try {
    const parsed = JSON.parse(raw) as unknown[];
    return (parsed as Array<Record<string, unknown>>).map((i) => ({
      ...(i as unknown as DownloadItem),
      completedAt: new Date(i['completedAt'] as string),
    }));
  } catch {
    return [];
  }
}

function loadFromStorage(): DownloadItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? deserialise(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(items: DownloadItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, serialise(items));
  } catch {
    // quota exceeded — silently ignore
  }
}

interface UseDownloadReturn {
  history: DownloadItem[];
  addToHistory: (media: MediaInfo, format: SelectedFormat, actualFileSize?: string) => DownloadItem;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
}

export function useDownload(_initialHistory: DownloadItem[]): UseDownloadReturn {
  // Load from localStorage on first render (ignore initialHistory = mockData)
  const [history, setHistory] = useState<DownloadItem[]>(() => loadFromStorage());

  // Persist to localStorage whenever history changes
  useEffect(() => {
    saveToStorage(history);
  }, [history]);

  const addToHistory = useCallback(
    (media: MediaInfo, format: SelectedFormat, actualFileSize?: string): DownloadItem => {
      const item: DownloadItem = {
        id: crypto.randomUUID(),
        title: media.title,
        channel: media.channel,
        platform: media.platform,
        thumbnail: media.thumbnail,
        type: format.type,
        format: format.format,
        quality: format.quality,
        qualityLabel: format.qualityLabel,
        fileSize: actualFileSize || getFileSizeForQuality(format.quality, format.type),
        status: 'completed',
        completedAt: new Date(),
        url: media.url,
        duration: media.duration,
      };
      setHistory((prev) => [item, ...prev].slice(0, MAX_HISTORY));
      return item;
    },
    []
  );

  const removeFromHistory = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return { history, addToHistory, removeFromHistory, clearHistory };
}
