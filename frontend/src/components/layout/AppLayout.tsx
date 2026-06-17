import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { useSelectedOrg } from '@/hooks/useSelectedOrg';
import { useOrganizations } from '@/hooks/useOrganizations';
import { entityTypeLabels } from '@/lib/labels';
import { useGap, nonConformCount } from '@/lib/gapAnalysis';
import { useEbios } from '@/lib/ebios';
import { useSuppliers, pendingEvaluationCount } from '@/lib/suppliers';

// ── SVG icon helper ────────────────────────────────────────────────────────────
function Icon({ d, size = 17 }: { d: string; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  dashboard: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  governance: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  roadmap: 'M9 18V5l12-2v13 M6 15.7a3 3 0 1 0 0 5.3 M18 13.7a3 3 0 1 0 0 5.3',
  report: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  risks: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0-3.42 0z M12 9v4 M12 17h.01',
  assets: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
  bcp: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8 M3 3v5h5 M12 7v5l4 2',
  crisis: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0-3.42 0z M12 9v4 M12 17h.01',
  response: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4',
  audit: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  suppliers: 'M1 3h15v13H1z M16 8h4l3 3v5h-7V8z M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z M18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
  menu: 'M3 12h18 M3 6h18 M3 18h18',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
};

// ── Nav badge ─────────────────────────────────────────────────────────────────
function NavBadge({ count }: { count?: number }) {
  if (!count) return null;
  return (
    <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/15 px-1.5 text-[10px] font-semibold text-white">
      {count}
    </span>
  );
}

// ── Nav item ──────────────────────────────────────────────────────────────────
function NavItem({
  to,
  label,
  iconKey,
  badge,
  onClick,
}: {
  to: string;
  label: string;
  iconKey: keyof typeof ICONS;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-teal-400 text-slate-900 font-semibold'
            : 'text-white/70 hover:bg-white/10 hover:text-white'
        }`
      }
    >
      <Icon d={ICONS[iconKey]} />
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && badge > 0 && (
        <NavBadge count={badge} />
      )}
    </NavLink>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ label }: { label: string }) {
  return (
    <p className="mt-5 mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/35">
      {label}
    </p>
  );
}

// ── AppLayout ─────────────────────────────────────────────────────────────────
export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [orgId] = useSelectedOrg();

  const { data: orgsPage } = useOrganizations();
  const orgs = orgsPage?.data;
  const selectedOrg = orgs?.find((o) => o.id === orgId);

  // Live badge counts derived from the local gap-analysis + EBIOS + suppliers data.
  const { reqs } = useGap(orgId);
  const { risks } = useEbios(orgId);
  const { suppliers } = useSuppliers(orgId);

  const gapCount = orgId ? reqs.length : 0;
  const roadmapCount = orgId ? nonConformCount(reqs) : 0;
  const riskCount = orgId ? risks.length : 0;
  const supplierCount = orgId ? pendingEvaluationCount(suppliers) : 0;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';

  const close = () => setMobileOpen(false);

  const sidebar = (
    <nav className="flex h-full flex-col" style={{ backgroundColor: '#0d2e26' }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/10">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-400">
          <Icon d={ICONS.shield} size={18} />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">
            <span className="text-teal-400">SAO</span>{' '}
            <span>Pilotage NIS2</span>
          </p>
          <p className="text-[9px] font-semibold uppercase tracking-widest text-white/40 leading-tight">
            Gouvernance &amp; Conformité
          </p>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        <SectionHeader label="Pilotage" />
        <NavItem to="/dashboard" label="Tableau de bord" iconKey="dashboard" onClick={close} />
        <NavItem to="/compliance" label="Gouvernance & Gap" iconKey="governance" badge={gapCount} onClick={close} />
        <NavItem to="/roadmap" label="Feuille de route" iconKey="roadmap" badge={roadmapCount} onClick={close} />
        <NavItem to="/reports" label="Rapport de conformité" iconKey="report" onClick={close} />

        <SectionHeader label="Risques & Continuité" />
        <NavItem to="/risks" label="Risques (EBIOS RM)" iconKey="risks" badge={riskCount} onClick={close} />
        <NavItem to="/assets" label="Actifs" iconKey="assets" onClick={close} />
        <NavItem to="/bcp" label="PCA / PRA" iconKey="bcp" onClick={close} />
        <NavItem to="/incidents" label="Gestion de crise" iconKey="crisis" onClick={close} />

        <SectionHeader label="Opérations" />
        <NavItem to="/response" label="Réponse à incident" iconKey="response" onClick={close} />
        <NavItem to="/audits" label="Audit NIS2" iconKey="audit" onClick={close} />
        <NavItem to="/suppliers" label="Fournisseurs" iconKey="suppliers" badge={supplierCount} onClick={close} />

        <SectionHeader label="Capital humain & docs" />
        <NavItem to="/sensibilisation" label="Sensibilisation" iconKey="governance" onClick={close} />
        <NavItem to="/documentation" label="Documentation" iconKey="report" badge={7} onClick={close} />
      </div>

      {/* User */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-400 text-xs font-bold text-slate-900">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">
              {user ? `${user.firstName} ${user.lastName}` : ''}
            </p>
            <p className="truncate text-[10px] text-white/40">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Déconnexion"
            className="text-white/40 hover:text-red-400 transition-colors"
          >
            <Icon d={ICONS.logout} size={15} />
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside className="hidden w-60 shrink-0 lg:block">{sidebar}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={close} aria-hidden />
          <div className="absolute left-0 top-0 h-full w-60">{sidebar}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shadow-sm">
          <button
            type="button"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Icon d={ICONS.menu} />
          </button>

          {selectedOrg ? (
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
              <span className="font-medium text-slate-500">Organisation :</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-800">
                {selectedOrg.name} · Entité{' '}
                {entityTypeLabels[selectedOrg.entityType]}
              </span>
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-400 text-xs font-bold text-slate-900">
              {initials}
            </div>
            <span className="hidden sm:block text-sm font-medium text-slate-700">
              {user ? `${user.firstName} ${user.lastName}` : ''}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
