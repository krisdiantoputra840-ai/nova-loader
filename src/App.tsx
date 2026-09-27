import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import MediaDetails from './pages/MediaDetails';
import DownloadProgress from './pages/DownloadProgress';
import History from './pages/History';
import Settings from './pages/Settings';
import { useDownload } from './hooks/useDownload';
import { useSettings } from './hooks/useSettings';
import { mockHistory } from './data/mockData';
import type { MediaInfo, SelectedFormat, DownloadItem } from './types/download';
import { itemToMediaInfo } from './types/download';

export default function App() {
  const { history, addToHistory, removeFromHistory, clearHistory } = useDownload(mockHistory);
  const { settings, update: updateSetting, resetSettings } = useSettings();

  const [currentMedia, setCurrentMedia] = useState<MediaInfo | null>(null);
  const [currentFormat, setCurrentFormat] = useState<SelectedFormat | null>(null);

  const handleMediaDetected = (media: MediaInfo) => {
    setCurrentMedia(media);
    setCurrentFormat(null);
  };

  const handleOpenFromHistory = (item: DownloadItem) => {
    const media = itemToMediaInfo(item);
    const format: SelectedFormat = {
      type: item.type,
      format: item.format,
      quality: item.quality,
      qualityLabel: item.qualityLabel,
    };
    setCurrentMedia(media);
    setCurrentFormat(format);
  };

  const handleStartDownload = (format: SelectedFormat) => {
    setCurrentFormat(format);
  };

  const handleDownloadComplete = (_filename: string, fileSize?: string) => {
    if (currentMedia && currentFormat) {
      addToHistory(currentMedia, currentFormat, fileSize);

      // Browser notification if enabled
      if (settings.notifications && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('NOVA — Download complete', {
          body: currentMedia.title,
          icon: currentMedia.thumbnail ?? undefined,
        });
      }
    }
  };

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-bg-base">
        <Navbar />
        <Routes>
          <Route
            path="/"
            element={
              <Home
                history={history}
                onMediaDetected={handleMediaDetected}
                onOpenMedia={handleOpenFromHistory}
                autoDetect={settings.autoDetect}
              />
            }
          />
          <Route
            path="/media-details"
            element={
              <MediaDetails
                media={currentMedia}
                initialFormat={currentFormat}
                onStartDownload={handleStartDownload}
                defaultFormat={settings.defaultFormat}
                defaultQuality={settings.defaultQuality}
              />
            }
          />
          <Route
            path="/download-progress"
            element={
              <DownloadProgress
                media={currentMedia}
                format={currentFormat}
                onComplete={handleDownloadComplete}
              />
            }
          />
          <Route
            path="/history"
            element={
              <History
                history={history}
                onDelete={removeFromHistory}
                onOpenMedia={handleOpenFromHistory}
              />
            }
          />
          <Route
            path="/settings"
            element={
              <Settings
                settings={settings}
                onUpdate={updateSetting}
                onClearHistory={clearHistory}
                onResetSettings={resetSettings}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
