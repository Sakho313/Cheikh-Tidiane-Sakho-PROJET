import { useState } from 'react';
import { Link } from 'react-router-dom';

/** Petit check inline (accent bleu) pour les listes de fonctionnalités. */
function Check({ className = 'text-sao-blue' }: { className?: string }): JSX.Element {
  return (
    <svg className={`h-4 w-4 shrink-0 ${className}`} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M4 10.5l3.5 3.5L16 5.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const NAV = [
  { href: '#solution', label: 'Solution' },
  { href: '#capacites', label: 'Capacités' },
  { href: '#scenarios', label: 'Scénarios' },
  { href: '#tarifs', label: 'Tarifs' },
];

const STATS = [
  { v: '12', l: 'En ligne' },
  { v: '80', l: 'km/h moy.' },
  { v: '0.8s', l: 'Latence' },
  { v: '0', l: 'Alertes' },
];

const MISSIONS = [
  {
    n: '01',
    title: 'Localiser',
    tag: 'Voir, en direct',
    desc: 'Chaque véhicule, à chaque instant, où qu’il soit.',
    items: ['Position GPS 4G en temps réel, 24/7', 'Suivi même moteur éteint', 'Historique complet des trajets'],
  },
  {
    n: '02',
    title: 'Protéger',
    tag: 'Reprendre le contrôle',
    desc: 'Un véhicule en danger ? Vous agissez à distance, immédiatement.',
    items: ['Coupe-moteur à distance (anti-vol)', 'Géo-barrières et alertes de zone', 'Alarme de survitesse en temps réel'],
  },
  {
    n: '03',
    title: 'Optimiser',
    tag: 'Décider mieux',
    desc: 'Vos données deviennent des économies concrètes.',
    items: ['Suivi de la consommation réelle', 'Rapports d’activité et coûts cachés', 'Optimisation des tournées'],
  },
];

const CAPACITES = [
  { t: 'GPS 4G temps réel', d: 'Position rafraîchie en continu, latence < 1 s.' },
  { t: 'Coupe-moteur à distance', d: 'Immobilisez un véhicule volé en un geste.' },
  { t: 'Géo-barrières', d: 'Zones autorisées/interdites et alertes d’entrée-sortie.' },
  { t: 'Survitesse', d: 'Seuil par véhicule, alerte conducteur instantanée.' },
  { t: 'Consommation carburant', d: 'Conso réelle, dérives et pleins suspects.' },
  { t: 'Score de conduite', d: 'Freinages/accélérations, scoring par chauffeur.' },
  { t: 'Rapports & exports', d: 'Activité, coûts cachés, CSV/Excel.' },
  { t: 'Ingestion boîtiers (API)', d: 'Clé d’API + import CSV/Excel des positions.' },
];

type Scenario = {
  id: string;
  title: string;
  sub: string;
  severity: string;
  severityClass: string;
  log: string[];
  outcome: string;
};

const SCENARIOS: Scenario[] = [
  {
    id: 'vol',
    title: 'Tentative de vol',
    sub: 'Mouvement non autorisé',
    severity: 'INCIDENT DÉTECTÉ',
    severityClass: 'text-red-400',
    log: [
      '14:02:11  Mouvement détecté · moteur éteint',
      '14:02:12  Géo-barrière franchie · ZONE A',
      '14:02:13  ⚡ Coupe-moteur à distance ENVOYÉ',
      '14:02:13  Alerte push → propriétaire + superviseur',
    ],
    outcome: 'Véhicule immobilisé en 2 s. Position transmise aux équipes.',
  },
  {
    id: 'survitesse',
    title: 'Survitesse',
    sub: 'Dépassement de seuil',
    severity: 'ALERTE',
    severityClass: 'text-sao-gold',
    log: [
      '09:41:03  Vitesse 132 km/h · limite 90 km/h',
      '09:41:03  Événement SPEEDING enregistré',
      '09:41:04  Notification conducteur émise',
      '09:41:04  Score de conduite mis à jour',
    ],
    outcome: 'Comportement tracé et pondéré dans le score du chauffeur.',
  },
  {
    id: 'geofence',
    title: 'Sortie de zone',
    sub: 'Géo-barrière franchie',
    severity: 'ALERTE',
    severityClass: 'text-sao-gold',
    log: [
      '17:20:55  Sortie de zone autorisée · CHANTIER 3',
      '17:20:55  Événement GEOFENCE_EXIT',
      '17:20:56  Alerte zone → dispatcher',
      '17:20:56  Trajet rattaché au véhicule',
    ],
    outcome: 'Le dispatch est prévenu en direct, carte à l’appui.',
  },
  {
    id: 'carburant',
    title: 'Carburant anormal',
    sub: 'Chute de niveau',
    severity: 'À VÉRIFIER',
    severityClass: 'text-sao-blue',
    log: [
      '22:10:40  Niveau carburant −18 L en 4 min',
      '22:10:41  Anomalie de consommation détectée',
      '22:10:41  Marquée pour rapport',
      '22:10:42  Notification gestionnaire',
    ],
    outcome: 'Les pertes suspectes remontent avant la fin du mois.',
  },
];

const TARIFS = [
  {
    name: 'Essentiel',
    price: '50 000',
    unit: 'F · véhicule / an',
    features: ['Suivi GPS 4G temps réel', 'Historique des trajets', 'Alertes de base', 'Application web'],
    highlight: false,
  },
  {
    name: 'Pro',
    price: '90 000',
    unit: 'F · véhicule / an',
    features: [
      'Tout l’Essentiel',
      'Coupe-moteur à distance',
      'Géo-barrières & survitesse',
      'Score de conduite & rapports',
    ],
    highlight: true,
  },
  {
    name: 'Flotte+',
    price: 'Sur devis',
    unit: 'grands parcs',
    features: ['Tout le Pro', 'API & ingestion boîtiers', 'Multi-sites & rôles', 'Support 24/7'],
    highlight: false,
  },
];

export default function LandingPage(): JSX.Element {
  const [scenario, setScenario] = useState<Scenario>(SCENARIOS[0]);

  return (
    <div className="min-h-screen bg-sao-bg font-sans text-slate-300">
      {/* ─── Barre de navigation ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-sao-border bg-sao-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg border border-sao-border bg-sao-surface text-sao-blue">
              ▲
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-bold tracking-wide text-white">SAO TÉLÉMATIQUE</span>
              <span className="block font-mono text-[10px] uppercase tracking-widest text-sao-muted">
                Filiale de SAO Consulting Group
              </span>
            </span>
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="text-sm text-slate-300 transition hover:text-white">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden text-sm text-slate-300 transition hover:text-white sm:block">
              Se connecter
            </Link>
            <a
              href="#contact"
              className="rounded-lg bg-sao-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1B86C2]"
            >
              Réserver une démo
            </a>
          </div>
        </div>
      </header>

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-40 right-0 h-[480px] w-[480px] rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, #29A3E0 0%, transparent 70%)' }}
          aria-hidden
        />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-sao-border bg-sao-surface px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-sao-muted">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-live-dot" />
              Centre de contrôle · Temps réel
            </span>
            <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl">
              La maîtrise <span className="text-sao-blue">du</span> mouvement.
            </h1>
            <p className="mt-6 max-w-md text-lg text-slate-400">
              Votre flotte sous contrôle, en direct.{' '}
              <span className="font-semibold text-white">Localisez, protégez et optimisez</span> chaque véhicule
              depuis un seul centre de commande — voitures, utilitaires, poids lourds, engins et motos.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#contact"
                className="rounded-lg bg-sao-gold px-6 py-3 font-semibold text-[#0A0E14] transition hover:brightness-95"
              >
                Réserver une démo →
              </a>
              <a
                href="#tarifs"
                className="rounded-lg border border-sao-border bg-sao-surface2 px-6 py-3 font-semibold text-white transition hover:border-slate-500"
              >
                Voir les tarifs
              </a>
            </div>
            <p className="mt-8 font-mono text-xs uppercase tracking-widest text-sao-muted">
              Suivi GPS <span className="text-sao-gold">4G</span> · Supervision{' '}
              <span className="text-sao-gold">24/7</span> · À partir de{' '}
              <span className="text-sao-gold">50 000 F</span>
            </p>
          </div>

          {/* Widget « Live Fleet » */}
          <div className="rounded-2xl border border-sao-border bg-sao-surface p-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-sao-border pb-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-sao-gold" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                <span className="ml-2 font-mono text-[11px] uppercase tracking-widest text-sao-muted">
                  SAO · Live Fleet
                </span>
              </div>
              <span className="font-mono text-[11px] uppercase tracking-widest text-sao-muted">Lat 14.7°</span>
            </div>

            <div className="relative mt-3 rounded-xl border border-sao-border bg-sao-bg p-3">
              <span className="absolute left-3 top-3 z-10 rounded border border-sao-border bg-sao-surface px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-sao-muted">
                Dakar · Zone A
              </span>
              <span className="absolute bottom-3 right-3 z-10 rounded border border-sao-border bg-sao-surface px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-sao-muted">
                12 véhicules suivis
              </span>
              <svg viewBox="0 0 400 190" className="h-44 w-full">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M40 0H0V40" fill="none" stroke="#15212F" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="400" height="190" fill="url(#grid)" />
                <path
                  d="M30,160 C120,160 150,95 215,85 S330,45 380,30"
                  fill="none"
                  stroke="#29A3E0"
                  strokeWidth="2"
                  strokeDasharray="2 6"
                  strokeLinecap="round"
                />
                <circle cx="30" cy="160" r="5" fill="#22C55E" />
                <circle cx="215" cy="85" r="5" fill="#F5C518" />
                <circle cx="380" cy="30" r="7" fill="none" stroke="#F5C518" strokeWidth="2" />
                <circle cx="380" cy="30" r="3" fill="#F5C518" />
              </svg>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-px overflow-hidden rounded-xl bg-sao-border">
              {STATS.map((s) => (
                <div key={s.l} className="bg-sao-surface px-2 py-4 text-center">
                  <div className="text-2xl font-bold text-white">{s.v}</div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-sao-muted">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Solution ────────────────────────────────────────────────────── */}
      <section id="solution" className="border-t border-sao-border">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="font-mono text-xs uppercase tracking-widest text-sao-muted">— La solution</p>
          <h2 className="mt-4 max-w-2xl text-4xl font-extrabold tracking-tight text-white">
            Trois missions. Un seul centre de contrôle.
          </h2>
          <p className="mt-4 max-w-2xl text-slate-400">
            Nous ne vendons pas un simple traceur : nous vous donnons le contrôle de votre flotte, comme un centre
            d’opérations.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {MISSIONS.map((m) => (
              <div
                key={m.n}
                className="rounded-2xl border border-sao-border bg-sao-surface p-6 transition hover:border-sao-blue/50"
              >
                <div className="font-mono text-sm text-sao-gold">{m.n}</div>
                <h3 className="mt-3 text-2xl font-bold text-white">{m.title}</h3>
                <div className="mt-1 font-mono text-[11px] uppercase tracking-widest text-sao-blue">{m.tag}</div>
                <p className="mt-4 text-sm text-slate-400">{m.desc}</p>
                <ul className="mt-5 space-y-3 border-t border-sao-border pt-5">
                  {m.items.map((it) => (
                    <li key={it} className="flex items-start gap-3 text-sm text-slate-300">
                      <Check />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Capacités ───────────────────────────────────────────────────── */}
      <section id="capacites" className="border-t border-sao-border bg-sao-surface/30">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="font-mono text-xs uppercase tracking-widest text-sao-muted">— Capacités</p>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-white">Tout l’arsenal, intégré.</h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CAPACITES.map((c) => (
              <div key={c.t} className="rounded-xl border border-sao-border bg-sao-surface p-5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-sao-blue/15 text-sao-blue">
                  <Check className="text-sao-blue" />
                </span>
                <h3 className="mt-4 font-semibold text-white">{c.t}</h3>
                <p className="mt-1 text-sm text-slate-400">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Console de scénarios ────────────────────────────────────────── */}
      <section id="scenarios" className="border-t border-sao-border">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="font-mono text-xs uppercase tracking-widest text-sao-muted">— Console de scénarios</p>
          <h2 className="mt-4 max-w-2xl text-4xl font-extrabold tracking-tight text-white">
            Que se passe-t-il quand un incident survient ?
          </h2>
          <p className="mt-4 max-w-2xl text-slate-400">
            Sélectionnez une situation. Voyez comment votre centre de contrôle SAO réagit, en direct.
          </p>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {/* Sélecteur */}
            <div className="grid gap-3 sm:grid-cols-2">
              {SCENARIOS.map((s) => {
                const active = s.id === scenario.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setScenario(s)}
                    className={`rounded-xl border p-4 text-left transition ${
                      active
                        ? 'border-sao-blue bg-sao-blue/10'
                        : 'border-sao-border bg-sao-surface hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`grid h-8 w-8 place-items-center rounded-lg ${
                          active ? 'bg-sao-blue/20 text-sao-blue' : 'bg-sao-surface2 text-slate-400'
                        }`}
                      >
                        ⚑
                      </span>
                      <span className="font-semibold text-white">{s.title}</span>
                    </div>
                    <div className="mt-2 font-mono text-[11px] uppercase tracking-widest text-sao-muted">
                      {s.sub}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Console */}
            <div className="overflow-hidden rounded-xl border border-sao-border bg-sao-bg">
              <div className="flex items-center justify-between border-b border-sao-border bg-sao-surface px-4 py-2.5">
                <span className="font-mono text-[11px] uppercase tracking-widest text-sao-muted">
                  SAO · Centre de contrôle
                </span>
                <span className={`flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest ${scenario.severityClass}`}>
                  <span className="h-2 w-2 rounded-full bg-current animate-live-dot" />
                  {scenario.severity}
                </span>
              </div>
              <div className="space-y-2 p-4 font-mono text-[12.5px] leading-relaxed text-slate-300">
                {scenario.log.map((line, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-sao-blue">›</span>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-sao-border bg-sao-surface px-4 py-3 text-sm text-slate-300">
                <span className="font-semibold text-sao-gold">Résultat — </span>
                {scenario.outcome}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Tarifs ──────────────────────────────────────────────────────── */}
      <section id="tarifs" className="border-t border-sao-border bg-sao-surface/30">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="font-mono text-xs uppercase tracking-widest text-sao-muted">— Tarifs</p>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-white">Simple, par véhicule.</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TARIFS.map((t) => (
              <div
                key={t.name}
                className={`relative rounded-2xl border p-6 ${
                  t.highlight ? 'border-sao-blue bg-sao-surface' : 'border-sao-border bg-sao-surface'
                }`}
              >
                {t.highlight && (
                  <span className="absolute -top-3 left-6 rounded-full bg-sao-blue px-3 py-0.5 font-mono text-[10px] uppercase tracking-widest text-white">
                    Populaire
                  </span>
                )}
                <h3 className="text-lg font-bold text-white">{t.name}</h3>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-3xl font-extrabold text-white">{t.price}</span>
                  <span className="mb-1 font-mono text-[11px] uppercase tracking-widest text-sao-muted">
                    {t.unit}
                  </span>
                </div>
                <ul className="mt-6 space-y-3">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-slate-300">
                      <Check className={t.highlight ? 'text-sao-blue' : 'text-sao-gold'} />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#contact"
                  className={`mt-8 block rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition ${
                    t.highlight
                      ? 'bg-sao-blue text-white hover:bg-[#1B86C2]'
                      : 'border border-sao-border bg-sao-surface2 text-white hover:border-slate-500'
                  }`}
                >
                  Réserver une démo
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA + Footer ────────────────────────────────────────────────── */}
      <section id="contact" className="border-t border-sao-border">
        <div className="mx-auto max-w-6xl px-5 py-20 text-center">
          <h2 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight text-white">
            Prêt à reprendre le contrôle de votre flotte ?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Réservez une démonstration : nous branchons un véhicule de test et vous montrons le centre de contrôle
            en direct.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="mailto:contact@sao-telematique.sn?subject=Demande%20de%20démo%20SAO%20Télématique"
              className="rounded-lg bg-sao-gold px-6 py-3 font-semibold text-[#0A0E14] transition hover:brightness-95"
            >
              Réserver une démo →
            </a>
            <Link
              to="/login"
              className="rounded-lg border border-sao-border bg-sao-surface2 px-6 py-3 font-semibold text-white transition hover:border-slate-500"
            >
              Accéder à la plateforme
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-sao-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-sao-muted sm:flex-row">
          <div>
            <span className="font-bold text-white">SAO Télématique</span> — Filiale de SAO Consulting Group
          </div>
          <div className="font-mono text-xs uppercase tracking-widest">Dakar · Sénégal · Supervision 24/7</div>
        </div>
      </footer>
    </div>
  );
}
