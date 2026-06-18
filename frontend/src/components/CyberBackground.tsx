/**
 * Animated "cyber" backdrop — a drifting neon grid, floating glow nodes, a
 * sweeping scan line and slow concentric rings. Pure CSS/SVG, no deps.
 * `variant="full"` is the dramatic login-screen version; `variant="subtle"`
 * is a quiet accent for in-app panels.
 */
export function CyberBackground({ variant = 'full' }: { variant?: 'full' | 'subtle' }) {
  const full = variant === 'full';

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Base deep gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: full
            ? 'radial-gradient(1200px 600px at 50% -10%, #0d4a3a 0%, #0a2a22 38%, #050f0c 100%)'
            : 'linear-gradient(135deg, #0d2e26 0%, #0a221b 100%)',
        }}
      />

      {/* Drifting neon grid */}
      <div className={`cyber-grid absolute inset-0 ${full ? 'opacity-100' : 'opacity-40'}`} />

      {/* Soft teal aura blobs */}
      <div
        className="absolute -left-24 top-1/4 h-72 w-72 rounded-full blur-3xl animate-sao-glow"
        style={{ background: 'radial-gradient(circle, rgba(45,212,191,0.18), transparent 70%)' }}
      />
      <div
        className="absolute -right-20 bottom-1/4 h-80 w-80 rounded-full blur-3xl animate-sao-glow"
        style={{ background: 'radial-gradient(circle, rgba(13,148,136,0.20), transparent 70%)', animationDelay: '1.2s' }}
      />

      {/* Concentric pulse rings + rotating reticle */}
      {full && (
        <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" width="640" height="640" viewBox="0 0 640 640">
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              cx="320"
              cy="320"
              r="120"
              fill="none"
              stroke="rgba(45,212,191,0.25)"
              strokeWidth="1"
              className="animate-sao-ring"
              style={{ animationDelay: `${i * 1.1}s`, transformBox: 'fill-box' }}
            />
          ))}
          <g className="animate-sao-spin" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <circle cx="320" cy="320" r="200" fill="none" stroke="rgba(45,212,191,0.12)" strokeWidth="1" strokeDasharray="2 16" />
          </g>
          <g className="animate-sao-spin-rev" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <circle cx="320" cy="320" r="260" fill="none" stroke="rgba(94,234,212,0.10)" strokeWidth="1" strokeDasharray="40 24" />
          </g>
        </svg>
      )}

      {/* Floating glow nodes */}
      {full &&
        [
          { left: '12%', top: '22%', d: '0s' },
          { left: '82%', top: '18%', d: '1.5s' },
          { left: '24%', top: '74%', d: '0.8s' },
          { left: '68%', top: '68%', d: '2.2s' },
          { left: '46%', top: '30%', d: '3s' },
          { left: '90%', top: '52%', d: '1.1s' },
        ].map((n, i) => (
          <span
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full bg-teal-300 shadow-[0_0_12px_4px_rgba(45,212,191,0.6)] animate-sao-float"
            style={{ left: n.left, top: n.top, animationDelay: n.d }}
          />
        ))}

      {/* Diagonal scan sweep */}
      <div
        className="absolute inset-x-0 h-40 animate-sao-scan"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(45,212,191,0.10), transparent)' }}
      />

      {/* Vignette */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)' }} />
    </div>
  );
}
