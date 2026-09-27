import type { MediaType } from '../types/download';

interface FormatSelectorProps {
  value: MediaType;
  onChange: (type: MediaType) => void;
}

export default function FormatSelector({ value, onChange }: FormatSelectorProps) {
  return (
    <div className="flex items-center gap-1 bg-bg-elevated rounded-[10px] p-1" role="group" aria-label="Select media type">
      {(['video', 'audio'] as MediaType[]).map((type) => (
        <button
          key={type}
          onClick={() => onChange(type)}
          className={`flex-1 py-1.5 px-4 text-[13px] font-medium rounded-[8px] transition-all duration-150 capitalize ${
            value === type
              ? 'bg-bg-surface text-text-primary shadow-subtle'
              : 'text-text-secondary hover:text-text-primary'
          }`}
          aria-pressed={value === type}
          aria-label={`Select ${type}`}
        >
          {type === 'video' ? 'Video' : 'Audio'}
        </button>
      ))}
    </div>
  );
}
