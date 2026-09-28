import { useRef, useState, useEffect } from 'react';
import { ChevronRight, Folder, Monitor, Bell, Info, Trash2, RotateCcw, Sun, Moon, Laptop, Server, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import type { AppSettings, Theme, DefaultFormat, DefaultQuality } from '../hooks/useSettings';
import { getApiBase } from '../api/client';

interface ToggleProps {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}

function Toggle({ id, checked, onChange, label }: ToggleProps) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-9 h-5 rounded-full transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${
        checked ? 'bg-accent' : 'bg-bg-elevated border border-border-subtle'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-subtle transition-transform duration-200 ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

interface SettingRowProps {
  icon?: React.ReactNode;
  label: string;
  description?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}

function SettingRow({ icon, label, description, right, onClick, danger }: SettingRowProps) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`flex items-center justify-between w-full px-4 py-3 text-left transition-colors duration-150 ${
        onClick ? 'hover:bg-bg-elevated cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        {icon && <span className={`shrink-0 ${danger ? 'text-red-400' : 'text-text-muted'}`}>{icon}</span>}
        <div>
          <p className={`text-[13.5px] ${danger ? 'text-red-400' : 'text-text-primary'}`}>{label}</p>
          {description && (
            <p className="text-[12px] text-text-muted mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {right !== undefined ? (
        <span className="shrink-0 ml-4">{right}</span>
      ) : onClick ? (
        <ChevronRight size={15} className="text-text-muted shrink-0 ml-4" />
      ) : null}
    </Tag>
  );
}

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <h2
        id={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
        className="text-[12px] text-text-muted uppercase tracking-wider font-medium px-4 mb-1"
      >
        {title}
      </h2>
      <div className="bg-bg-surface border border-border-subtle rounded-[12px] overflow-hidden divide-y divide-border-subtle">
        {children}
      </div>
    </section>
  );
}

interface SettingsProps {
  settings: AppSettings;
  onUpdate: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  onClearHistory: () => void;
  onResetSettings: () => void;
}

export default function Settings({ settings, onUpdate, onClearHistory, onResetSettings }: SettingsProps) {
  const notifRef = useRef(false);
  const [customUrl, setCustomUrl] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('nova_api_url') || '' : ''));
  const [serverStatus, setServerStatus] = useState<'idle' | 'checking' | 'connected' | 'disconnected'>('idle');
  const [serverDetail, setServerDetail] = useState<string>('');

  const checkHealth = async () => {
    setServerStatus('checking');
    try {
      const res = await fetch(`${getApiBase()}/api/health`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      if (res.ok) {
        const d = await res.json();
        setServerStatus('connected');
        setServerDetail(d.ffmpeg ? 'FFmpeg ready' : 'Connected');
      } else {
        setServerStatus('disconnected');
        setServerDetail(`HTTP ${res.status}`);
      }
    } catch {
      setServerStatus('disconnected');
      setServerDetail('Unreachable');
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleNotifications = async (val: boolean) => {
    if (val && !notifRef.current) {
      if ('Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
          alert('Notifications permission denied. Please allow notifications in your browser settings.');
          return;
        }
        notifRef.current = true;
      }
    }
    onUpdate('notifications', val);
  };

  const themeIcons: Record<Theme, React.ReactNode> = {
    dark:   <Moon size={13} />,
    light:  <Sun size={13} />,
    system: <Laptop size={13} />,
  };

  return (
    <main className="flex-1 animate-fade-in">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="text-[20px] font-semibold text-text-primary tracking-[-0.01em] mb-8">
          Settings
        </h1>

        <div className="max-w-[560px] space-y-6">

          {/* Backend API Server */}
          <SettingSection title="Backend Connection">
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server size={15} strokeWidth={1.75} className="text-text-muted" />
                  <span className="text-[13.5px] text-text-primary">Server Status</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {serverStatus === 'checking' && (
                    <span className="text-[12px] text-text-muted flex items-center gap-1">
                      <RefreshCw size={12} className="animate-spin" /> Checking...
                    </span>
                  )}
                  {serverStatus === 'connected' && (
                    <span className="text-[12px] text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 size={13} /> Online ({serverDetail})
                    </span>
                  )}
                  {serverStatus === 'disconnected' && (
                    <span className="text-[12px] text-red-400 font-medium flex items-center gap-1">
                      <XCircle size={13} /> Offline
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-[12px] text-text-muted block">
                  API Endpoint URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder={getApiBase()}
                    className="flex-1 bg-bg-elevated border border-border-subtle text-text-primary text-[13px] rounded-[8px] px-3 py-1.5 outline-none focus:border-accent"
                  />
                  <button
                    onClick={() => {
                      if (customUrl.trim()) {
                        localStorage.setItem('nova_api_url', customUrl.trim());
                      } else {
                        localStorage.removeItem('nova_api_url');
                      }
                      checkHealth();
                    }}
                    className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-[12.5px] font-medium rounded-[8px] transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={checkHealth}
                    className="px-2.5 py-1.5 bg-bg-elevated hover:bg-bg-surface border border-border-subtle text-text-secondary text-[12.5px] rounded-[8px] transition-colors"
                    title="Test Connection"
                  >
                    <RefreshCw size={13} />
                  </button>
                </div>
                <p className="text-[11.5px] text-text-muted">
                  Current API: <code className="text-text-secondary">{getApiBase()}</code>
                </p>
              </div>
            </div>
          </SettingSection>

          {/* Downloads */}
          <SettingSection title="Downloads">
            <SettingRow
              icon={<Monitor size={15} strokeWidth={1.75} />}
              label="Default format"
              description="Applied when opening a new media link"
              right={
                <select
                  id="default-format"
                  value={settings.defaultFormat}
                  onChange={(e) => onUpdate('defaultFormat', e.target.value as DefaultFormat)}
                  className="bg-bg-elevated border border-border-subtle text-text-primary text-[13px] rounded-[8px] px-2 py-1 outline-none focus-visible:border-accent"
                  aria-label="Default format"
                >
                  <option value="MP4">MP4 (Video)</option>
                  <option value="MP3">MP3 (Audio)</option>
                  <option value="WAV">WAV (Lossless)</option>
                </select>
              }
            />
            <SettingRow
              label="Default video quality"
              description="Pre-selected quality for video downloads"
              right={
                <select
                  id="default-quality"
                  value={settings.defaultQuality}
                  onChange={(e) => onUpdate('defaultQuality', e.target.value as DefaultQuality)}
                  className="bg-bg-elevated border border-border-subtle text-text-primary text-[13px] rounded-[8px] px-2 py-1 outline-none focus-visible:border-accent"
                  aria-label="Default quality"
                >
                  <option value="4k">4K (2160p)</option>
                  <option value="1080p">1080p HD</option>
                  <option value="720p">720p HD</option>
                  <option value="480p">480p SD</option>
                </select>
              }
            />
          </SettingSection>

          {/* Behavior */}
          <SettingSection title="Behavior">
            <SettingRow
              icon={<Folder size={15} strokeWidth={1.75} />}
              label="Auto detect links"
              description="Paste a URL anywhere on the Home screen to detect media"
              right={
                <Toggle
                  id="auto-detect"
                  checked={settings.autoDetect}
                  onChange={(v) => onUpdate('autoDetect', v)}
                  label="Auto detect links"
                />
              }
            />
            <SettingRow
              icon={<Bell size={15} strokeWidth={1.75} />}
              label="Download notifications"
              description="Notify when a download completes"
              right={
                <Toggle
                  id="notifications"
                  checked={settings.notifications}
                  onChange={handleNotifications}
                  label="Download notifications"
                />
              }
            />
          </SettingSection>

          {/* Appearance */}
          <SettingSection title="Appearance">
            <SettingRow
              label="Theme"
              description="Choose your preferred color scheme"
              right={
                <div
                  className="flex items-center gap-1 bg-bg-elevated rounded-[8px] p-0.5"
                  role="group"
                  aria-label="Theme selection"
                >
                  {(['dark', 'light', 'system'] as Theme[]).map((t) => (
                    <button
                      key={t}
                      id={`theme-${t}`}
                      onClick={() => onUpdate('theme', t)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-[12px] rounded-[6px] capitalize transition-all duration-150 ${
                        settings.theme === t
                          ? 'bg-bg-surface text-text-primary shadow-subtle'
                          : 'text-text-muted hover:text-text-secondary'
                      }`}
                      aria-pressed={settings.theme === t}
                      aria-label={`${t} theme`}
                    >
                      {themeIcons[t]}
                      {t}
                    </button>
                  ))}
                </div>
              }
            />
          </SettingSection>

          {/* Data */}
          <SettingSection title="Data">
            <SettingRow
              icon={<Trash2 size={15} strokeWidth={1.75} />}
              label="Clear download history"
              description="Remove all entries from history"
              danger
              onClick={() => {
                if (window.confirm('Clear all download history? This cannot be undone.')) {
                  onClearHistory();
                }
              }}
            />
            <SettingRow
              icon={<RotateCcw size={15} strokeWidth={1.75} />}
              label="Reset settings to default"
              description="Restore all settings to their original values"
              onClick={() => {
                if (window.confirm('Reset all settings to defaults?')) {
                  onResetSettings();
                }
              }}
            />
          </SettingSection>

          {/* About */}
          <SettingSection title="About">
            <SettingRow
              icon={<Info size={15} strokeWidth={1.75} />}
              label="NOVA — Universal media downloader"
              description="Credit: CheeseChis"
              right={<span className="text-[13px] text-text-muted">v1.0.0</span>}
            />
          </SettingSection>

        </div>
      </div>
    </main>
  );
}
