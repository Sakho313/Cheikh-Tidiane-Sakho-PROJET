import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { extractErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { SaoLogo } from '@/components/brand/SaoLogo';
import { CyberBackground } from '@/components/CyberBackground';

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@nis2.example.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
          <div className="mb-6 flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-teal-400 shadow-[0_0_8px_2px_rgba(45,212,191,0.7)]" />
            <h2 className="text-lg font-semibold text-white">Connexion sécurisée</h2>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

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
                className="block w-full rounded-lg border border-slate-600/80 bg-slate-800/70 px-3 py-2 text-sm text-white
                  placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" isLoading={submitting} className="w-full mt-2">
              Se connecter
            </Button>
          </form>

          <div className="mt-6 rounded-lg border border-teal-400/10 bg-slate-800/40 px-4 py-3 text-xs text-slate-400">
            <p className="font-medium text-slate-300 mb-1">Identifiants de démonstration</p>
            <p>Email : <span className="font-mono text-teal-400">admin@nis2.example.com</span></p>
            <p>Mot de passe : <span className="font-mono text-teal-400">Admin@1234</span></p>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] tracking-wide text-slate-500">
          © {new Date().getFullYear()} SAO Consulting · Conformité NIS2
        </p>
      </div>
    </div>
  );
}
