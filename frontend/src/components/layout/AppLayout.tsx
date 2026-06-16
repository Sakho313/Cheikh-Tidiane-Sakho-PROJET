import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { roleLabels } from '@/lib/labels';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Tableau de bord', icon: '▣' },
  { to: '/organizations', label: 'Organisations', icon: '🏢' },
  { to: '/compliance', label: 'Conformité', icon: '✓' },
  { to: '/incidents', label: 'Incidents', icon: '⚠' },
  { to: '/risks', label: 'Risques', icon: '◆' },
  { to: '/audits', label: 'Audits', icon: '🔍' },
  { to: '/reports', label: 'Rapports', icon: '📄' },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';

  const sidebar = (
    <nav className="flex h-full flex-col gap-1 bg-primary-900 px-3 py-4">
      <div className="mb-6 px-2">
        <p className="text-lg font-bold text-white">SAO NIS2</p>
        <p className="text-xs text-primary-300">Gestion de la conformité</p>
      </div>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
        >
          <span aria-hidden className="w-5 text-center">
            {item.icon}
          </span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">{sidebar}</aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute left-0 top-0 h-full w-64">{sidebar}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
          <button
            type="button"
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
          >
            ☰
          </button>
          <div className="flex flex-1 items-center justify-end gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">
                {user ? `${user.firstName} ${user.lastName}` : ''}
              </p>
              <p className="text-xs text-gray-500">{user ? roleLabels[user.role] : ''}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
              {initials}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Déconnexion
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
