interface SpinnerProps {
  size?: number;
  className?: string;
}

export function Spinner({ size = 28, className = '' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Chargement"
      className={`inline-block animate-spin rounded-full border-2 border-primary-200 border-t-primary-600 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function LoadingBlock({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
      <Spinner />
      <span className="text-sm">{label}</span>
    </div>
  );
}
