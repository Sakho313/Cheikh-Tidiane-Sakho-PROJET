import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { extractErrorMessage } from '@/api/client';
import { SaoLogo } from '@/components/brand/SaoLogo';
import { CyberBackground } from '@/components/CyberBackground';

// Shared, read-only demo account. Defaults match the backend seed; override
// at build time with VITE_DEMO_EMAIL / VITE_DEMO_PASSWORD on the static site.
const DEMO_EMAIL = (import.meta.env.VITE_DEMO_EMAIL as string) || 'demo@sao-nis2.com';
const DEMO_PASSWORD = (import.meta.env.VITE_DEMO_PASSWORD as string) || 'Demo2024NIS2!';

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, 'Identifiants incorrects'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemo = async () => {
    setError(null);
    setDemoLoading(true);
    try {
      await login({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(
        extractErrorMessage(
          err,
          "La démonstration n'est pas disponible pour le moment. Réessayez dans un instant.",
        ),
      );
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <CyberBackground variant="full" />

      <div className="relative w-full max-w-md">
        {/* Logo / brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-5">
            {/* Glow halo behind the mark */}
            <div className="absolute inset-0 -z-10 rounded-full bg-teal-400/20 blur-2xl animate-sao-glow" />
            <SaoLogo size={104} animated />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            <span className="text-teal-400">SAO</span> Pilotage NIS2
          </h1>
          <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-teal-300/70">
            Gouvernance &amp; Conformité
          </p>
          <p className="mt-2 text-sm text-slate-400">Plateforme de pilotage de la conformité NIS2</p>
        </div>

        <div className="rounded-2xl border border-teal-400/20 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Primary CTA — frictionless demo access */}
          <button
            type="button"
            onClick={handleDemo}
            disabled={demoLoading}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl
              bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-lg
              shadow-teal-500/20 transition-all hover:from-teal-400 hover:to-emerald-400 hover:shadow-teal-500/40
              disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span className="absolute inset-0 -z-0 animate-sao-scan bg-gradient-to-b from-transparent via-white/20 to-transparent" />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 3l14 9-14 9V3z" />
            </svg>
            {demoLoading ? 'Ouverture de la démonstration…' : 'Accéder à la démonstration'}
          </button>
          <p className="mt-2 text-center text-[11px] text-slate-400">
            Visite libre en <span className="font-semibold text-teal-300">lecture seule</span> · aucune inscription, aucune donnée modifiée
          </p>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-700/60" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              ou connexion équipe
            </span>
            <div className="h-px flex-1 bg-slate-700/60" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-300">
                Adresse e-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="vous@organisation.fr"
                className="block w-full rounded-lg border border-slate-600/80 bg-slate-800/70 px-3 py-2 text-sm text-white
                  placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-300">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="block w-full rounded-lg border border-slate-600/80 bg-slate-800/70 px-3 py-2 text-sm text-white
                  placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-600/80
                bg-slate-800/60 px-4 py-2 text-sm font-medium text-slate-200 transition-colors
                hover:border-teal-500/60 hover:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500
                disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              Se connecter
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[11px] tracking-wide text-slate-500">
          © {new Date().getFullYear()} SAO Consulting · Conformité NIS2
        </p>
      </div>
    </div>
  );
}
