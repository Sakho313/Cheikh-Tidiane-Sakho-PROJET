import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { extractErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/Button';

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
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md">
        {/* Logo / brand */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500 text-white text-xl font-bold mb-4">
            NIS
          </div>
          <h1 className="text-2xl font-bold text-white">SAO Pilotage NIS2</h1>
          <p className="mt-1 text-sm text-slate-400">Plateforme de gestion de la conformité</p>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-8 shadow-2xl">
          <h2 className="mb-6 text-lg font-semibold text-white">Connexion</h2>

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
                className="block w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white
                  placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
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
                className="block w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white
                  placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" isLoading={submitting} className="w-full mt-2">
              Se connecter
            </Button>
          </form>

          <div className="mt-6 rounded-lg bg-slate-700/50 px-4 py-3 text-xs text-slate-400">
            <p className="font-medium text-slate-300 mb-1">Identifiants de démonstration</p>
            <p>Email : <span className="font-mono text-teal-400">admin@nis2.example.com</span></p>
            <p>Mot de passe : <span className="font-mono text-teal-400">Admin@1234</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
