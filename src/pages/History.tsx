import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Search, X, Music, Video, Layers, RotateCcw } from 'lucide-react';
import type { DownloadItem } from '../types/download';
import DownloadItemCard from '../components/DownloadItem';
import EmptyState from '../components/EmptyState';

interface HistoryProps {
  history: DownloadItem[];
  onDelete: (id: string) => void;
  onOpenMedia?: (item: DownloadItem) => void;
}

type CategoryFilter = 'all' | 'audio' | 'video';

function getGroup(date: Date): 'today' | 'yesterday' | 'earlier' {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours < 24) return 'today';
  if (diffHours < 48) return 'yesterday';
  return 'earlier';
}

function groupHistory(items: DownloadItem[]) {
  const groups: Record<string, DownloadItem[]> = {
    today: [],
    yesterday: [],
    earlier: [],
  };
  for (const item of items) {
    groups[getGroup(item.completedAt)].push(item);
  }
  return groups;
}

const GROUP_LABELS: Record<string, string> = {
  today: 'Hari ini',
  yesterday: 'Kemarin',
  earlier: 'Sebelumnya',
};

export default function History({ history, onDelete, onOpenMedia }: HistoryProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');

  const hasItems = history.length > 0;

  // Counts for each category
  const audioCount = useMemo(
    () => history.filter((i) => i.type === 'audio' || i.format === 'MP3' || i.format === 'WAV').length,
    [history]
  );
  const videoCount = useMemo(
    () => history.filter((i) => i.type === 'video' || i.format === 'MP4').length,
    [history]
  );

  // Filter items by category and search query
  const filteredItems = useMemo(() => {
    return history.filter((item) => {
      // 1. Category filter
      if (selectedCategory === 'audio') {
        const isAudio = item.type === 'audio' || item.format === 'MP3' || item.format === 'WAV';
        if (!isAudio) return false;
      } else if (selectedCategory === 'video') {
        const isVideo = item.type === 'video' || item.format === 'MP4';
        if (!isVideo) return false;
      }

      // 2. Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchChannel = item.channel?.toLowerCase().includes(q);
      const matchPlatform = item.platform?.toLowerCase().includes(q);
      const matchFormat = item.format?.toLowerCase().includes(q);
      const matchQuality = item.qualityLabel?.toLowerCase().includes(q);

      return matchTitle || matchChannel || matchPlatform || matchFormat || matchQuality;
    });
  }, [history, selectedCategory, searchQuery]);

  const groups = groupHistory(filteredItems);

  const handleOpenMedia = (item: DownloadItem) => {
    if (onOpenMedia) {
      onOpenMedia(item);
    }
    navigate('/media-details');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
  };

  return (
    <main className="flex-1 animate-fade-in">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-[22px] font-semibold text-text-primary tracking-[-0.01em]">
              Recent Downloads & History
            </h1>
            <p className="text-[13px] text-text-secondary mt-1">
              Buka kembali lagu atau video yang sudah diunduh untuk mendownload lagi tanpa perlu mencari linknya.
            </p>
          </div>
          {hasItems && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-[12px] px-2.5 py-1 rounded-full bg-bg-surface border border-border-subtle text-text-secondary font-medium">
                {filteredItems.length} dari {history.length} item
              </span>
            </div>
          )}
        </div>

        {!hasItems ? (
          <EmptyState
            icon={Clock}
            title="Belum ada riwayat unduhan"
            description="Media yang selesai kamu unduh akan otomatis muncul di sini dan dapat diunduh ulang kapan saja."
          />
        ) : (
          <div className="space-y-6">
            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-bg-surface border border-border-subtle p-3 rounded-[12px]">
              {/* Category Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-bg-base/60 rounded-[9px] border border-border-subtle/50 shrink-0 overflow-x-auto">
                {/* All */}
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[12.5px] font-medium transition-all duration-150 whitespace-nowrap ${
                    selectedCategory === 'all'
                      ? 'bg-accent text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                  }`}
                >
                  <Layers size={13} strokeWidth={2} />
                  <span>Semua</span>
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[11px] ${
                      selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-bg-elevated text-text-muted'
                    }`}
                  >
                    {history.length}
                  </span>
                </button>

                {/* Audio */}
                <button
                  onClick={() => setSelectedCategory('audio')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[12.5px] font-medium transition-all duration-150 whitespace-nowrap ${
                    selectedCategory === 'audio'
                      ? 'bg-accent text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                  }`}
                >
                  <Music size={13} strokeWidth={2} />
                  <span>Audio (MP3 / WAV)</span>
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[11px] ${
                      selectedCategory === 'audio' ? 'bg-white/20 text-white' : 'bg-bg-elevated text-text-muted'
                    }`}
                  >
                    {audioCount}
                  </span>
                </button>

                {/* Video */}
                <button
                  onClick={() => setSelectedCategory('video')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[12.5px] font-medium transition-all duration-150 whitespace-nowrap ${
                    selectedCategory === 'video'
                      ? 'bg-accent text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                  }`}
                >
                  <Video size={13} strokeWidth={2} />
                  <span>Video (MP4)</span>
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[11px] ${
                      selectedCategory === 'video' ? 'bg-white/20 text-white' : 'bg-bg-elevated text-text-muted'
                    }`}
                  >
                    {videoCount}
                  </span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 md:max-w-[340px]">
                <Search
                  size={15}
                  strokeWidth={2}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari lagu, video, atau artis..."
                  className="w-full pl-9 pr-9 py-2 text-[13px] bg-bg-base/80 border border-border-subtle rounded-[8px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
                    title="Hapus pencarian"
                  >
                    <X size={13} strokeWidth={2} />
                  </button>
                )}
              </div>
            </div>

            {/* List or Filtered Empty State */}
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 px-4 bg-bg-surface/50 border border-dashed border-border-subtle rounded-[12px] animate-fade-in">
                <Search size={28} strokeWidth={1.5} className="mx-auto text-text-muted mb-3" />
                <h3 className="text-[15px] font-semibold text-text-primary">Tidak ada unduhan yang cocok</h3>
                <p className="text-[13px] text-text-secondary mt-1 max-w-[400px] mx-auto">
                  {searchQuery
                    ? `Tidak ditemukan hasil untuk "${searchQuery}" pada kategori yang dipilih.`
                    : 'Belum ada riwayat unduhan pada kategori ini.'}
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[12.5px] font-medium text-accent hover:text-accent-hover bg-accent/10 hover:bg-accent/20 rounded-[8px] transition-colors"
                >
                  <RotateCcw size={12} strokeWidth={2} />
                  <span>Reset Filter & Pencarian</span>
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {(['today', 'yesterday', 'earlier'] as const).map((group) => {
                  const items = groups[group];
                  if (items.length === 0) return null;
                  return (
                    <section key={group} aria-labelledby={`group-${group}`}>
                      <h2
                        id={`group-${group}`}
                        className="text-[12px] text-text-muted uppercase tracking-wider font-medium mb-3 flex items-center gap-2"
                      >
                        <span>{GROUP_LABELS[group]}</span>
                        <span className="text-[11px] px-1.5 py-0.2 rounded bg-bg-surface text-text-muted border border-border-subtle">
                          {items.length}
                        </span>
                      </h2>
                      <div className="flex flex-col gap-2">
                        {items.map((item) => (
                          <DownloadItemCard
                            key={item.id}
                            item={item}
                            onDelete={onDelete}
                            onOpenMedia={handleOpenMedia}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
