import { useEffect, useRef } from 'react';
import { CyberBackground } from '@/components/CyberBackground';

const LINES = [
  '> Initialisation du canal sécurisé…',
  '> Vérification du code d’accès…',
  '> Code validé ✓',
  '> Authentification de la session…',
  '> Chargement du cockpit NIS2…',
];

const TOTAL_MS = 2600;

/**
 * Full-screen "access granted" cyber sequence: a terminal boot log types out,
 * a progress bar fills, then a glowing ACCÈS AUTORISÉ confirmation. Calls
 * `onComplete` once when the sequence ends.
 */
export function AccessGrantedOverlay({ onComplete }: { onComplete: () => void }) {
  const cb = useRef(onComplete);
  cb.current = onComplete;

  useEffect(() => {
    const t = setTimeout(() => cb.current(), TOTAL_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      <CyberBackground variant="full" />

      <div className="relative w-full max-w-lg px-6">
        {/* Terminal log */}
        <div className="rounded-xl border border-teal-400/20 bg-slate-950/70 p-5 font-mono text-sm shadow-2xl backdrop-blur-md">
          {LINES.map((line, i) => (
            <p
              key={i}
              className="animate-sao-line-in mb-1 text-teal-300/90"
              style={{ animationDelay: `${i * 0.32}s` }}
            >
              {line}
              {i === LINES.length - 1 && <span className="animate-sao-blink ml-0.5">_</span>}
            </p>
          ))}

          {/* Progress bar */}
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div className="animate-sao-progress h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-400" />
          </div>
        </div>

        {/* Access granted confirmation */}
        <div
          className="animate-sao-pop mt-6 flex flex-col items-center"
          style={{ animationDelay: '1.9s' }}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-400 bg-emerald-500/10 shadow-[0_0_28px_6px_rgba(16,185,129,0.45)]">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <p className="mt-3 text-lg font-black uppercase tracking-[0.25em] text-emerald-400">
            Accès autorisé
          </p>
        </div>
      </div>
    </div>
  );
}
