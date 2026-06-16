import type { ReactNode } from 'react';

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-card">
      <table className="min-w-full divide-y divide-gray-200 text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-gray-50">{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-gray-100">{children}</tbody>;
}

export function TR({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <tr className={className}>{children}</tr>;
}

export function TH({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 ${className}`}
    >
      {children}
    </th>
  );
}

export function TD({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-gray-700 ${className}`}>{children}</td>;
}

export function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-gray-400">
        {message}
      </td>
    </tr>
  );
}
