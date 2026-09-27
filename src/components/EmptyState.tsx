import type { LucideIcon } from 'lucide-react';
import { Download } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
}

export default function EmptyState({ icon: Icon = Download, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-10 h-10 rounded-[10px] bg-bg-elevated flex items-center justify-center text-text-muted mb-4">
        <Icon size={18} strokeWidth={1.5} />
      </div>
      <p className="text-[14px] font-medium text-text-secondary">{title}</p>
      {description && (
        <p className="text-[13px] text-text-muted mt-1 max-w-[260px]">{description}</p>
      )}
    </div>
  );
}
