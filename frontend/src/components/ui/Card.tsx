import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  actions?: ReactNode;
}

export function Card({ children, className = '', title, actions }: CardProps) {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white shadow-card ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          {title ? <h3 className="text-sm font-semibold text-gray-700">{title}</h3> : <span />}
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: string;
}

export function StatCard({ label, value, hint, accent = 'text-primary-600' }: StatCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-card">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
