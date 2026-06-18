import { useCallback, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { extractErrorMessage } from '@/api/client';
import { SaoLogo } from '@/components/brand/SaoLogo';
import { CyberBackground } from '@/components/CyberBackground';
import { AccessCodeGate } from '@/components/AccessCodeGate';
import { AccessGrantedOverlay } from '@/components/AccessGrantedOverlay';

// Shared, read-only demo account. Defaults match the backend seed; override
// at build time with VITE_DEMO_EMAIL / VITE_DEMO_PASSWORD on the static site.
const DEMO_EMAIL = (import.meta.env.VITE_DEMO_EMAIL as string) || 'demo@sao-nis2.com';
const DEMO_PASSWORD = (import.meta.env.VITE_DEMO_PASSWORD as string) || 'Demo2024NIS2!';
// Access code clients enter to unlock the demo. Override with VITE_ACCESS_CODE.
const ACCESS_CODE = ((import.meta.env.VITE_ACCESS_CODE as string) || 'SAO2026').toUpperCase();

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [granting, setGranting] = useState(false);
  const demoLogin = useRef<Promise<void> | null>(null);

  // Already authenticated (and not mid-animation) → straight to the app.
  if (isAuthenticated && !granting) {
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

  // Kick off the demo login and play the cyber "access granted" sequence.
  const startDemo = useCallback(() => {
    if (granting) return;
    setError(null);
    setGranting(true);
    demoLogin.current = login({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
  }, [granting, login]);

  // Fires once the unlock animation finishes — wait for the login, then enter.
  const onGrantComplete = useCallback(async () => {
    try {
      await demoLogin.current;
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setGranting(false);
      setError(
        extractErrorMessage(
          err,
          "La démonstration n'est pas disponible pour le moment. Réessayez dans un instant.",
        ),
      );
    }
  }, [navigate]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <CyberBackground variant="full" />

      {granting && <AccessGrantedOverlay onComplete={onGrantComplete} />}

      <div className="relative w-full max-w-md">
        {/* Logo / brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-5">
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

          {/* Access code gate */}
          <div className="mb-1 flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">Code d'accès sécurisé</h2>
          </div>
          <p className="mb-5 text-center text-xs text-slate-400">
            Entrez votre code pour déverrouiller la démonstration
          </p>

          <AccessCodeGate code={ACCESS_CODE} onUnlock={startDemo} disabled={granting} />

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={startDemo}
              disabled={granting}
              className="text-xs font-medium text-teal-300/80 underline-offset-2 transition-colors hover:text-teal-200 hover:underline disabled:opacity-50"
            >
              Pas de code ? Lancer la démonstration →
            </button>
          </div>

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
