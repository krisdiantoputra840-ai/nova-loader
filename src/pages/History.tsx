import { Clock } from 'lucide-react';
import type { DownloadItem } from '../types/download';
import DownloadItemCard from '../components/DownloadItem';
import EmptyState from '../components/EmptyState';

interface HistoryProps {
  history: DownloadItem[];
  onDelete: (id: string) => void;
}

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
  today: 'Today',
  yesterday: 'Yesterday',
  earlier: 'Earlier',
};

export default function History({ history, onDelete }: HistoryProps) {
  const groups = groupHistory(history);
  const hasItems = history.length > 0;

  return (
    <main className="flex-1 animate-fade-in">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-[20px] font-semibold text-text-primary tracking-[-0.01em]">
            History
          </h1>
          {hasItems && (
            <span className="text-[13px] text-text-muted">
              {history.length} {history.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>

        {!hasItems ? (
          <EmptyState
            icon={Clock}
            title="No downloads yet"
            description="Your completed downloads will appear here."
          />
        ) : (
          <div className="space-y-8">
            {(['today', 'yesterday', 'earlier'] as const).map((group) => {
              const items = groups[group];
              if (items.length === 0) return null;
              return (
                <section key={group} aria-labelledby={`group-${group}`}>
                  <h2
                    id={`group-${group}`}
                    className="text-[12px] text-text-muted uppercase tracking-wider font-medium mb-3"
                  >
                    {GROUP_LABELS[group]}
                  </h2>
                  <div className="flex flex-col gap-2">
                    {items.map((item) => (
                      <div key={item.id} className="group relative">
                        <DownloadItemCard item={item} onDelete={onDelete} />
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
