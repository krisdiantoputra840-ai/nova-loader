import { useState, useEffect, useCallback } from 'react';

export type Theme = 'dark' | 'light' | 'system';
export type DefaultFormat = 'MP4' | 'MP3' | 'WAV';
export type DefaultQuality = '4k' | '1080p' | '720p' | '480p' | '320kbps' | '192kbps' | '128kbps';

export interface AppSettings {
  defaultFormat: DefaultFormat;
  defaultQuality: DefaultQuality;
  autoDetect: boolean;
  notifications: boolean;
  theme: Theme;
}

const SETTINGS_KEY = 'nova_settings';

const DEFAULT_SETTINGS: AppSettings = {
  defaultFormat: 'MP4',
  defaultQuality: '1080p',
  autoDetect: true,
  notifications: false,
  theme: 'dark',
};

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(s: AppSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch { /* quota exceeded */ }
}

/** Apply theme to <html> element */
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    root.setAttribute('data-theme', theme);
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const s = loadSettings();
    applyTheme(s.theme);
    return s;
  });

  useEffect(() => {
    saveSettings(settings);
    applyTheme(settings.theme);
  }, [settings]);

  // Listen for OS theme changes when set to "system"
  useEffect(() => {
    if (settings.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [settings.theme]);

  const update = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return { settings, update, resetSettings };
}
