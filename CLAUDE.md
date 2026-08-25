# CLAUDE.md

Ce fichier fournit des directives à Claude Code (claude.ai/code) lorsqu'il travaille sur le code de ce dépôt.

## Présentation

Une plateforme de gestion de la conformité NIS2 (directive européenne sur la cybersécurité). C'est un **monorepo** :

- **Backend** (racine du dépôt) — API REST Express + TypeScript + Prisma/PostgreSQL exposée sous `/api/v1`.
- **Frontend** (`frontend/`) — SPA Vite + React 18 + TanStack Query + Tailwind qui consomme l'API. L'interface est entièrement en français.

Les deux moitiés ont des `package.json` distincts et des `node_modules` distincts. Le `Makefile` à la racine orchestre les deux et constitue le moyen le plus rapide de s'orienter (`make help`).

> **Sous-projet séparé `telematics/`** — une plateforme télématique de flotte
> indépendante (géolocalisation, comportement de conduite, carburant, rapports)
> réutilise la même stack mais vit dans `telematics/` avec son propre
> `package.json`, son schéma Prisma et son `telematics/CLAUDE.md`. Backend sur
> `:4000`, frontend sur `:5174`. Voir `telematics/CLAUDE.md` pour les détails.

## Commandes

À lancer depuis la racine du dépôt sauf indication contraire. Les cibles `make` enveloppent les deux moitiés ; les commandes `npm` brutes n'agissent que sur une seule.

```bash
make setup        # installe les deps backend+frontend, prisma db push, seed  (bootstrap initial)
make dev          # lance l'API (:3000) ET le frontend (:5173) ensemble
make build        # build les deux ; make lint / make typecheck couvrent de même les deux

# Backend (package.json racine)
npm run dev               # API seule, hot-reload, :3000
npm run build             # tsc -> dist/
npm run lint              # eslint, seuil zéro avertissement (lint:fix pour corriger)
npm run type-check        # tsc --noEmit
npm run format            # prettier --write (format:check en CI)

# Frontend (faire cd frontend d'abord)
npm run dev               # serveur de dev Vite :5173, proxifie /api -> :3000
npm run build             # tsc && vite build
npm run lint / type-check
```

### Base de données / Prisma

Ce projet synchronise le schéma avec **`prisma db push`**, et non avec des migrations. `npm run migrate` existe mais le README, le Makefile, Docker et les chemins de déploiement utilisent tous `db push`. Après toute modification de `prisma/schema.prisma` :

```bash
npm run generate          # régénère le client Prisma (à faire après une édition du schéma)
npx prisma db push        # applique le schéma à la base
npm run seed              # idempotent : contrôles NIS2 + données admin/démo
```

### Tests

Trois niveaux, chacun avec son propre exécuteur :

```bash
# Unitaires — mocke Prisma ; couvre services/utils/middleware ; seuil de couverture 70 %
npm test
npm run test:coverage
npm test -- tests/unit/risk.service.test.ts        # un seul fichier
npm test -- -t "calculates risk score"             # un seul test par son nom

# Intégration — vrai PostgreSQL, supertest contre l'app Express, en série
npm run test:integration

# E2E — Playwright (Chromium) contre la pile complète, depuis frontend/
cd frontend && npx playwright install chromium      # première exécution uniquement
cd frontend && npm run test:e2e
```

- **Unitaires** — config `jest.config.ts`. Elle ignore `tests/integration/`, donc `npm test` ne touche jamais à une base.
- **Intégration** — config `jest.integration.config.ts`. `tests/integration/setup.ts` définit les variables d'environnement (dont une valeur par défaut de `DATABASE_URL` à `postgresql://nis2:nis2@localhost:5433/nis2_test`) **avant** le chargement de tout module applicatif — nécessaire car `src/config/env.ts` valide l'environnement à l'import et quitte le processus en cas d'échec. `tests/integration/helpers/db.ts#resetDatabase` vide les tables dans l'ordre des clés étrangères entre les tests.
- **E2E** — requiert que le backend soit déjà lancé et seedé sur `:3000` ; Playwright démarre automatiquement le serveur Vite. Voir `frontend/playwright.config.ts`.

## Architecture backend

Chaque domaine vit dans `src/modules/<nom>/` sous forme de quatre fichiers, avec un découpage en couches strict : **`routes → controller → service → Prisma`**.

- **routes** — câblent les URLs aux contrôleurs et empilent les middlewares. Convention : `router.use(authenticate)` pour protéger tout le module, puis par route `authorize(Role.X, ...)` pour le RBAC et `validate(Schema)` pour les entrées. `src/modules/risks/risk.routes.ts` est l'exemple canonique.
- **controller** — fin. Lit `req`, appelle le service, formate la réponse avec les helpers de `response.ts`, et transmet les erreurs via `try/catch → next(err)`. Aucune logique métier ici.
- **service** — toute la logique, et la seule couche qui parle à Prisma (le singleton de `src/config/database.ts`). Une instance exportée par défaut est consommée par le contrôleur ; la classe est exportée pour les tests unitaires.
- **schemas** — schémas Zod + types d'entrée inférés, partagés par `validate()` et les génériques de requête du contrôleur.

### Conventions transverses (à suivre lors de l'ajout de code)

- **Enveloppe de réponse** — chaque réponse est `{ success, data, message }` (plus `errors[]` en cas d'échec). Toujours la construire via `successResponse` / `errorResponse` / `paginatedResponse` dans `src/shared/utils/response.ts`. La fonction `unwrap()` du frontend dans `frontend/src/api/client.ts` reflète exactement cette forme — gardez-les synchronisées.
- **Gestion des erreurs** — les services signalent une erreur HTTP en levant une `Error` simple marquée d'un code de statut : `Object.assign(error, { statusCode: 404 })`. Le gestionnaire global `src/shared/middleware/error.middleware.ts` est le seul endroit qui mappe les erreurs aux réponses : Zod → 400 avec erreurs par champ, Prisma `P2002` → 409, `P2025` → 404, erreurs JWT → 401, erreurs marquées d'un `statusCode` → ce code, tout le reste → 500. Ne faites pas `res.status().json()` pour les erreurs depuis les contrôleurs — faites `next(err)` et laissez le gestionnaire normaliser.
- **Validation** — `validate(schema)` parse et **remplace** `req.body` par la sortie typée avant l'exécution du contrôleur.
- **Auth** — `authenticate` vérifie un token d'accès `Bearer` et peuple `req.user: AuthPayload` ; `authorize(...roles)` filtre par `Role`. Les helpers JWT vivent dans `src/shared/utils/jwt.ts` (les secrets d'accès et de refresh sont séparés).
- **Configuration** — `src/config/env.ts` est le seul endroit qui lit `process.env` ; il valide via Zod à l'import et fait `process.exit(1)` en cas de config invalide. Les secrets JWT requièrent **≥ 16 caractères** (et non 32). Importez `env` depuis ce fichier plutôt que de toucher à `process.env`.
- **Routage/sécurité** dans `src/app.ts` — `/health` est enregistré **avant** le rate limiter (pour que les health checks des PaaS ne soient pas limités) ; CORS construit sa liste d'autorisation à partir de `CORS_ORIGIN` (séparée par des virgules) et autorise en plus toute origine `*.onrender.com`.

### Modèle de données

`prisma/schema.prisma` définit 9 modèles — `Organization`, `User`, `ComplianceControl`, `ComplianceAssessment`, `Incident`, `Risk`, `Audit`, `AuditFinding`, `Report` — ainsi que les enums qui pilotent la logique métier (secteurs, sévérités, statuts). `Organization` est la racine du locataire (tenant) ; la plupart des enregistrements sont supprimés en cascade depuis elle. `Risk.riskScore` est toujours dérivé comme `likelihood × impact` dans le service, jamais accordé de confiance depuis l'entrée.

## Architecture frontend

`frontend/src/` est organisé par responsabilité : `api/` (client axios + un module par domaine), `auth/` (AuthContext + ProtectedRoute), `hooks/`, `lib/` (libellés français, mappings de couleurs, helpers de domaine NIS2/EBIOS), `pages/`, `types/` (miroirs des types du backend).

Le cœur est `frontend/src/api/client.ts` : un intercepteur de requête attache le token bearer ; un intercepteur de réponse capture le `401`, appelle `/auth/refresh` une seule fois, **met en file d'attente** les requêtes échouées concurrentes, les rejoue avec le nouveau token, et redirige vers `/login` si le refresh échoue. Les tokens vivent dans `localStorage` sous `nis2.accessToken` / `nis2.refreshToken`. `VITE_API_URL` sélectionne l'origine de l'API (retombe sur le proxy Vite relatif `/api/v1` en dev).

## Documentation de l'API & rôles

- Swagger UI sur `http://localhost:3000/api/docs` ; JSON OpenAPI brut sur `/api/docs.json` (spec assemblée dans `src/config/swagger.ts`).
- Toutes les routes `/api/v1` requièrent un JWT sauf `POST /auth/register`, `POST /auth/login` et `POST /auth/refresh`.
- Rôles : `ADMIN` (tout + suppressions), `COMPLIANCE_OFFICER` (gestion au sein de l'org), `AUDITOR` (lecture + constats d'audit), `VIEWER` (lecture seule).
- Admin du seed : `admin@nis2.example.com` / `Admin@1234` (dev uniquement ; la prod utilise `ADMIN_PASSWORD`).

## Déploiement

- **Docker** — `docker-compose.yml` pour le dev (Postgres + API), `docker-compose.prod.yml` pour la pile de prod complète (Postgres + API + frontend servi par nginx qui fait aussi office de reverse-proxy `/api`).
- **Render** — le blueprint `render.yaml` provisionne la base + l'API + le frontend statique ; à chaque déploiement, l'API exécute `prisma db push` puis le seed idempotent. Les secrets marqués `sync: false` (`JWT_SECRET`, `JWT_REFRESH_SECRET`, `ADMIN_PASSWORD`) se renseignent dans le tableau de bord Render.
- **CI** — `.github/workflows/ci.yml` : qualité du code (type-check/lint/format:check) → tests unitaires → tests d'intégration (contre un service Postgres) → build du frontend → E2E Playwright → builds d'images Docker.

## Notes

- `.claude/settings.json` enregistre le serveur MCP Playwright, disponible pour l'inspection du frontend en cours d'exécution pilotée par navigateur.
- Lors d'un changement de contrat d'API, mettez à jour trois endroits ensemble : le schéma Zod (`*.schemas.ts`), les annotations Swagger, et les `types/` + le module `api/` du frontend.
