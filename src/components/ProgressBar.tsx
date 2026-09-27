interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
}

export default function ProgressBar({ progress, className = '' }: ProgressBarProps) {
  return (
    <div
      className={`w-full h-1.5 bg-bg-elevated rounded-full overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Download progress: ${progress}%`}
    >
      <div
        className="h-full bg-accent rounded-full progress-bar"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
