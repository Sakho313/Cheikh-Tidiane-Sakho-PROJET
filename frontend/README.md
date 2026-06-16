# SAO NIS2 — Frontend

Interface web de la plateforme de gestion de la conformité NIS2. Application
React (Vite + TypeScript) qui consomme l'API REST du backend.

## Stack

- **Vite** + **React 18** + **TypeScript** (strict)
- **React Router v6** — routing et routes protégées
- **TanStack Query v5** — récupération et cache des données serveur
- **axios** — client HTTP (intercepteurs Bearer + refresh automatique sur 401)
- **Tailwind CSS** — design system

## Prérequis

Le backend doit tourner sur `http://localhost:3000` (voir le README à la racine).
En développement, Vite proxifie `/api` vers ce backend.

## Démarrage

```bash
npm install
npm run dev      # http://localhost:5173
```

Identifiants de démonstration (seed du backend) :

- **Email** : `admin@nis2.example.com`
- **Mot de passe** : `Admin@1234`

## Scripts

```bash
npm run dev         # serveur de développement (HMR)
npm run build       # vérification des types + build de production (dist/)
npm run preview     # prévisualise le build de production
npm run lint        # ESLint
npm run type-check  # tsc --noEmit
npm run test:e2e    # tests E2E Playwright (API + base doivent tourner)
```

## Tests E2E (Playwright)

Les tests `e2e/` valident les parcours réels dans un navigateur Chromium :
authentification, routes protégées et **création** d'incidents, de risques et
d'organisations via les formulaires.

```bash
npx playwright install chromium   # 1ʳᵉ fois uniquement
npm run test:e2e                   # démarre Vite automatiquement, cible l'API :3000
npm run test:e2e:report            # génère un rapport HTML
```

Prérequis : le backend (`:3000`) et sa base doivent tourner et être seedés
(`make setup` à la racine s'en charge).

## Structure

```
src/
├── api/           # Client axios + modules par domaine (auth, organizations, …)
├── auth/          # AuthContext (login/logout/refresh) + ProtectedRoute
├── components/
│   ├── layout/    # AppLayout (sidebar + header)
│   ├── ui/        # Card, Button, Badge, Table, Spinner, PageHeader
│   └── OrgSelector.tsx
├── hooks/         # useOrganizations, useSelectedOrg
├── lib/           # libellés FR + mappings de couleurs + formatage de dates
├── pages/         # Login, Dashboard, Organizations, Compliance, Incidents,
│                  # Risks, Audits, Reports
├── types/         # Types miroir du backend
├── App.tsx        # Routes
└── main.tsx       # Point d'entrée (providers)
e2e/               # Tests Playwright (auth, incidents, risks, organizations)
```

## Fonctionnalités

- **Authentification** JWT avec rafraîchissement transparent du token.
- **Tableau de bord** : synthèse (score de conformité, incidents, risques, audits).
- **Organisations** : liste et statistiques agrégées.
- **Conformité** : score global et par domaine, état des contrôles Article 21.
- **Incidents** : suivi + notification à l'autorité (Article 23).
- **Risques** : matrice 5×5 (heatmap) et registre des risques.
- **Audits** : suivi des audits et de leurs constats.
- **Rapports** : génération et historique des rapports.

L'interface est entièrement en français.
