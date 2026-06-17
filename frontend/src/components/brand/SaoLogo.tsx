import { useId, useEffect, useState } from 'react';

/** Path to an optional raster brand asset. Drop your file at
 *  `frontend/public/logo.png` and it is used automatically everywhere;
 *  otherwise the inline SVG mark below is shown. */
const RASTER_SRC = '/logo.png';

// Module-level cache so the existence check runs once per page load.
let rasterStatus: 'unknown' | 'ok' | 'missing' = 'unknown';
const rasterListeners = new Set<(s: typeof rasterStatus) => void>();

function probeRaster() {
  if (rasterStatus !== 'unknown' || typeof window === 'undefined') return;
  const img = new Image();
  img.onload = () => {
    rasterStatus = img.naturalWidth > 0 ? 'ok' : 'missing';
    rasterListeners.forEach((fn) => fn(rasterStatus));
  };
  img.onerror = () => {
    rasterStatus = 'missing';
    rasterListeners.forEach((fn) => fn(rasterStatus));
  };
  img.src = RASTER_SRC;
}

/**
 * SAO Consulting brand mark. Uses the raster logo at `/logo.png` when present,
 * otherwise renders a metallic hexagonal security shield with a teal neon glow
 * and an interlocking triskelion emblem — pure SVG so it stays crisp at any
 * size and can be animated (the teal glow + emblem pulse).
 */
export function SaoLogo({
  size = 48,
  animated = true,
  className = '',
  title = 'SAO Pilotage NIS2',
}: {
  size?: number;
  animated?: boolean;
  className?: string;
  title?: string;
}) {
  // Unique gradient/filter ids so multiple logos on one page don't collide.
  const uid = useId().replace(/:/g, '');
  const [status, setStatus] = useState(rasterStatus);
  useEffect(() => {
    if (rasterStatus !== 'unknown') {
      setStatus(rasterStatus);
      return;
    }
    rasterListeners.add(setStatus);
    probeRaster();
    return () => {
      rasterListeners.delete(setStatus);
    };
  }, []);

  // Real brand asset available → use it (rounded, never distorted).
  if (status === 'ok') {
    return (
      <img
        src={RASTER_SRC}
        alt={title}
        width={size}
        height={size}
        className={`rounded-xl object-contain ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  const metal = `metal-${uid}`;
  const teal = `teal-${uid}`;
  const core = `core-${uid}`;
  const glow = `glow-${uid}`;

  const SHIELD = 'M100 6 L181 50 L181 124 L100 210 L19 124 L19 50 Z';
  // One pinwheel "hook" of the interlocking emblem; replicated at 120°/240°.
  const ARM = 'M100 106 L100 60 L130 76';
  const glowCls = animated ? 'animate-sao-glow' : '';

  return (
    <svg
      viewBox="0 0 200 218"
      width={size}
      height={(size * 218) / 200}
      className={className}
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient id={metal} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="22%" stopColor="#e2e8f0" />
          <stop offset="48%" stopColor="#94a3b8" />
          <stop offset="72%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id={teal} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
        <radialGradient id={core} cx="50%" cy="38%" r="75%">
          <stop offset="0%" stopColor="#0f3a2f" />
          <stop offset="65%" stopColor="#0b251d" />
          <stop offset="100%" stopColor="#06120d" />
        </radialGradient>
        <filter id={glow} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Shield body */}
      <path d={SHIELD} fill={`url(#${core})`} />

      {/* Teal neon inner border (glowing, pulsing) */}
      <path
        d={SHIELD}
        fill="none"
        stroke={`url(#${teal})`}
        strokeWidth="3"
        filter={`url(#${glow})`}
        className={glowCls}
        transform="translate(0 0) scale(0.9) translate(11 12)"
        style={{ transformOrigin: 'center' }}
      />

      {/* Metallic bevel border */}
      <path d={SHIELD} fill="none" stroke={`url(#${metal})`} strokeWidth="5.5" strokeLinejoin="round" />

      {/* Corner circuit nodes */}
      {[
        [100, 6],
        [181, 50],
        [181, 124],
        [19, 124],
        [19, 50],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="3.2" fill="#5eead4" filter={`url(#${glow})`} className={glowCls} />
      ))}

      {/* Interlocking triskelion — teal glow underlay */}
      <g filter={`url(#${glow})`} className={glowCls}>
        {[0, 120, 240].map((a) => (
          <path
            key={a}
            d={ARM}
            transform={`rotate(${a} 100 108)`}
            fill="none"
            stroke="#5eead4"
            strokeWidth="13"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </g>

      {/* Interlocking triskelion — metallic top */}
      <g>
        {[0, 120, 240].map((a) => (
          <path
            key={a}
            d={ARM}
            transform={`rotate(${a} 100 108)`}
            fill="none"
            stroke={`url(#${metal})`}
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </g>

      {/* Central node */}
      <circle cx="100" cy="108" r="8" fill={`url(#${metal})`} />
      <circle cx="100" cy="108" r="3.4" fill="#0d2e26" />
    </svg>
  );
}
