import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Spinner } from '@/components/ui';

export default function ProtectedRoute({ children }: { children: ReactNode }): JSX.Element {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="grid h-screen place-items-center bg-slate-50">
        <Spinner />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
