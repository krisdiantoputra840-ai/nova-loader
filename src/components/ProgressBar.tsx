interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
}

export default function ProgressBar({ progress, className = '' }: ProgressBarProps) {
  return (
    <div
      className={`w-full h-1.5 bg-bg-elevated rounded-full overflow-hidden relative ${className}`}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Download progress: ${progress}%`}
    >
      <div
        className="h-full bg-accent rounded-full transition-all duration-300 ease-out relative overflow-hidden"
        style={{ width: `${progress}%` }}
      >
        {progress < 100 && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer" />
        )}
      </div>
    </div>
  );
}
