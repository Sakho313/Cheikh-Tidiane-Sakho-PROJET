import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { roleLabels } from '@/lib/labels';
import { Button } from '@/components/ui';

const NAV: Array<{ to: string; label: string; icon: string }> = [
  { to: '/', label: 'Tableau de bord', icon: '📊' },
  { to: '/live', label: 'Carte live', icon: '🛰️' },
  { to: '/vehicles', label: 'Véhicules', icon: '🚚' },
  { to: '/drivers', label: 'Chauffeurs', icon: '🧑‍✈️' },
  { to: '/trips', label: 'Trajets', icon: '🗺️' },
  { to: '/fuel', label: 'Carburant', icon: '⛽' },
  { to: '/geofences', label: 'Géofences', icon: '📍' },
  { to: '/alerts', label: 'Alertes', icon: '🔔' },
  { to: '/reports', label: 'Rapports', icon: '📄' },
];

export default function AppLayout(): JSX.Element {
  const { user, logout } = useAuth();
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 px-6 py-5">
          <span className="text-2xl">🛰️</span>
          <span className="text-lg font-bold text-slate-900">SAO Telematics</span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div className="text-sm text-slate-500">{user?.organization?.name ?? 'Flotte'}</div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-slate-800">
                {user ? `${user.firstName} ${user.lastName}` : ''}
              </div>
              <div className="text-xs text-slate-400">{user ? roleLabels[user.role] : ''}</div>
            </div>
            <Button variant="secondary" onClick={logout}>
              Déconnexion
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
