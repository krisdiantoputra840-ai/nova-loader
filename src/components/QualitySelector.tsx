interface QualitySelectorProps {
  options: { label: string; value: string; sub?: string }[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}

export default function QualitySelector({ options, value, onChange, label }: QualitySelectorProps) {
  return (
    <div className="space-y-2" role="group" aria-label={label}>
      <p className="text-[12px] text-text-muted uppercase tracking-wider font-medium">{label}</p>
      <div className="flex flex-col gap-1">
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`flex items-center justify-between w-full text-left px-3.5 py-2.5 rounded-[8px] text-[13.5px] transition-all duration-150 border ${
                isSelected
                  ? 'bg-accent-subtle border-accent/30 text-text-primary'
                  : 'border-transparent hover:bg-bg-elevated text-text-secondary hover:text-text-primary'
              }`}
              aria-pressed={isSelected}
              aria-label={`Select ${opt.label}`}
            >
              <span className="font-medium">{opt.label}</span>
              {opt.sub && (
                <span className="text-[12px] text-text-muted">{opt.sub}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
