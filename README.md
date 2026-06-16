# SAO NIS2 — Backend de Gestion de la Conformité NIS2

API REST de niveau production pour piloter la conformité à la **directive européenne NIS2** (Directive (UE) 2022/2555 sur la sécurité des réseaux et des systèmes d'information).

Cette plateforme permet aux organisations de suivre leur posture de conformité, de gérer les incidents de cybersécurité, d'évaluer et de traiter les risques, de conduire des audits et de générer des rapports exécutifs — le tout aligné sur les exigences de la directive NIS2.

---

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Architecture](#architecture)
- [Démarrage rapide](#démarrage-rapide)
- [Variables d'environnement](#variables-denvironnement)
- [Base de données](#base-de-données)
- [Documentation de l'API](#documentation-de-lapi)
- [Authentification & rôles](#authentification--rôles)
- [Tests](#tests)
- [Frontend](#frontend)
- [Intégration continue](#intégration-continue)
- [Déploiement](#déploiement)
- [Contexte NIS2](#contexte-nis2)

---

## Fonctionnalités

| Module | Description |
|--------|-------------|
| **Auth** | Inscription, connexion, refresh de token JWT, profil. Hachage bcrypt (12 tours), tokens d'accès courts + refresh longs. |
| **Organizations** | Gestion des entités régulées NIS2 (secteur + type *Essentielle*/*Importante*). Statistiques agrégées par organisation. |
| **Compliance** | Suivi des mesures de l'**Article 21**. Contrôles pré-chargés, évaluations par organisation, scoring par domaine et global. |
| **Incidents** | Cycle de vie complet des incidents aligné sur l'**Article 23** (notification à l'autorité, délais 24 h / 72 h). |
| **Risks** | Identification, évaluation et traitement des risques. Matrice 5×5 (probabilité × impact) et données de *heatmap*. |
| **Audits** | Audits internes, externes, réglementaires et fournisseurs, avec constats (*findings*) et suivi de remédiation. |
| **Reports** | Génération de rapports (conformité, incidents, risques, audits, synthèse exécutive) stockés en JSON avec support de période. |

---

## Stack technique

- **Runtime** : Node.js 18+
- **Langage** : TypeScript (mode strict)
- **Framework** : Express.js
- **ORM** : Prisma + PostgreSQL
- **Authentification** : JWT (access + refresh)
- **Hachage** : bcryptjs (12 tours)
- **Validation** : Zod
- **Sécurité** : Helmet, CORS, express-rate-limit
- **Documentation** : Swagger / OpenAPI 3.0
- **Tests** : Jest + ts-jest
- **Qualité** : ESLint (strict, type-checked) + Prettier
- **CI/CD** : GitHub Actions
- **Conteneurisation** : Docker (multi-stage) + Docker Compose

---

## Architecture

```
/
├── prisma/
│   ├── schema.prisma          # Schéma de base de données (9 modèles, 13 enums)
│   └── seed.ts                # Script de seed (admin, organisation, contrôles NIS2)
├── src/
│   ├── config/
│   │   ├── env.ts             # Variables d'environnement validées par Zod
│   │   ├── database.ts        # Client Prisma singleton
│   │   └── swagger.ts         # Spécification OpenAPI
│   ├── shared/
│   │   ├── types/             # Types TypeScript partagés
│   │   ├── utils/             # Réponses HTTP, JWT, pagination
│   │   └── middleware/        # Auth/RBAC, gestion d'erreurs, validation Zod
│   ├── modules/
│   │   ├── auth/              # Authentification
│   │   ├── organizations/     # Entités NIS2
│   │   ├── compliance/        # Conformité Article 21
│   │   ├── incidents/         # Incidents (Article 23)
│   │   ├── risks/             # Gestion des risques
│   │   ├── audits/            # Audits & constats
│   │   └── reports/           # Génération de rapports
│   ├── app.ts                 # Configuration de l'app Express
│   └── server.ts              # Point d'entrée + arrêt gracieux
├── tests/unit/                # Tests unitaires (services, utils, middleware)
├── .github/workflows/ci.yml   # Pipeline CI (qualité, tests, build Docker)
├── Dockerfile                 # Image de production multi-stage
└── docker-compose.yml         # Stack de développement (API + PostgreSQL)
```

Chaque module suit une architecture en couches : `routes → controller → service → Prisma`. Les contrôleurs sont de fines couches de délégation qui transmettent les erreurs au middleware global ; la logique métier vit dans les *services*.

---

## Démarrage rapide

### Option A — Makefile (le plus simple)

Avec Node.js 18+ et une instance PostgreSQL accessible (voir `.env`) :

```bash
make setup     # installe tout, applique le schéma et seed la base
make dev       # démarre l'API (:3000) ET le frontend (:5173)
```

Ouvrez ensuite **http://localhost:5173** et connectez-vous avec les
identifiants de démonstration ci-dessous. `make help` liste toutes les cibles.

### Option B — Docker Compose

Lance l'API **et** PostgreSQL en une commande :

```bash
docker compose up --build
```

L'API démarre sur `http://localhost:3000`. Dans un autre terminal, applique le schéma et le seed :

```bash
docker compose exec api npx prisma db push
docker compose exec api npm run seed
```

Pour la **stack de production complète** (PostgreSQL + API + frontend nginx) :

```bash
cp .env.production .env.prod.local        # renseigner les secrets
docker compose -f docker-compose.prod.yml --env-file .env.prod.local up -d --build
# → frontend servi sur http://localhost (port 80)
```

### Option C — Installation locale manuelle

**Prérequis** : Node.js 18+, une instance PostgreSQL accessible.

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env        # puis éditer les valeurs (DATABASE_URL, secrets JWT…)

# 3. Générer le client Prisma + créer le schéma
npm run generate
npx prisma db push

# 4. Peupler la base (admin, organisation d'exemple, contrôles NIS2)
npm run seed

# 5. Démarrer en mode développement (hot-reload)
npm run dev                 # API sur http://localhost:3000

# 6. Dans un autre terminal, démarrer le frontend
cd frontend && npm install && npm run dev   # http://localhost:5173
```

### Scripts disponibles

```bash
npm run dev            # Développement avec rechargement à chaud
npm run build          # Compilation TypeScript → dist/
npm start              # Démarrage du serveur de production
npm run migrate        # Migrations Prisma (dev)
npm run generate       # Génération du client Prisma
npm run seed           # Seed de la base
npm test               # Tests unitaires
npm run test:coverage  # Tests + rapport de couverture
npm run lint           # Analyse ESLint
npm run format         # Formatage Prettier
npm run type-check     # Vérification des types sans émission
```

---

## Variables d'environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DATABASE_URL` | Chaîne de connexion PostgreSQL | `postgresql://user:pass@localhost:5432/nis2_db` |
| `JWT_SECRET` | Secret des tokens d'accès (≥ 32 caractères) | `…` |
| `JWT_EXPIRES_IN` | Durée de vie du token d'accès | `7d` |
| `JWT_REFRESH_SECRET` | Secret des tokens de refresh (≥ 32 caractères) | `…` |
| `JWT_REFRESH_EXPIRES_IN` | Durée de vie du refresh token | `30d` |
| `PORT` | Port d'écoute | `3000` |
| `NODE_ENV` | Environnement | `development` |
| `CORS_ORIGIN` | Origine autorisée pour CORS | `http://localhost:5173` |
| `RATE_LIMIT_WINDOW_MS` | Fenêtre de limitation de débit (ms) | `900000` |
| `RATE_LIMIT_MAX` | Nombre max de requêtes par fenêtre | `100` |

---

## Base de données

Le schéma comprend 9 modèles : `User`, `Organization`, `ComplianceControl`, `ComplianceAssessment`, `Incident`, `Risk`, `Audit`, `AuditFinding`, `Report`.

```bash
npm run migrate      # Crée/applique les migrations en développement
npm run generate     # Régénère le client Prisma après modification du schéma
npm run seed         # Insère les données initiales
```

Le seed crée un compte administrateur, une organisation d'exemple et les contrôles de l'Article 21 NIS2.

---

## Documentation de l'API

Une fois le serveur démarré, la documentation **Swagger UI** interactive est disponible sur :

```
http://localhost:3000/api/docs
```

La spécification OpenAPI brute (JSON) est exposée sur `http://localhost:3000/api/docs.json`.

### Aperçu des endpoints

Toutes les routes sont préfixées par `/api/v1`. Sauf mention contraire, elles requièrent un token JWT (`Authorization: Bearer <token>`).

#### Auth — `/api/v1/auth`
| Méthode | Endpoint | Accès | Description |
|---------|----------|-------|-------------|
| `POST` | `/register` | Public | Inscription d'un utilisateur |
| `POST` | `/login` | Public | Connexion (retourne access + refresh) |
| `POST` | `/refresh` | Public | Renouvellement du token d'accès |
| `GET` | `/me` | Authentifié | Profil de l'utilisateur courant |

#### Organizations — `/api/v1/organizations`
| Méthode | Endpoint | Accès | Description |
|---------|----------|-------|-------------|
| `GET` | `/` | Authentifié | Liste paginée des organisations |
| `GET` | `/:id` | Authentifié | Détail d'une organisation |
| `GET` | `/:id/stats` | Authentifié | Statistiques agrégées |
| `POST` | `/` | COMPLIANCE_OFFICER+ | Création |
| `PUT` | `/:id` | COMPLIANCE_OFFICER+ | Mise à jour |
| `DELETE` | `/:id` | ADMIN | Suppression |

#### Compliance — `/api/v1/compliance`
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/controls` | Liste des contrôles NIS2 |
| `GET` | `/assessments/:orgId` | Évaluations d'une organisation |
| `GET` | `/score/:orgId` | Score de conformité (par domaine + global) |
| `POST` | `/assessments` | Crée/met à jour une évaluation |
| `PUT` | `/assessments/:id` | Met à jour une évaluation |
| `POST` | `/seed-controls` | (ADMIN) Initialise les contrôles |

#### Incidents — `/api/v1/incidents`
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/org/:orgId` | Incidents d'une organisation |
| `GET` | `/stats/:orgId` | Statistiques (sévérité / statut) |
| `GET` | `/:id` | Détail d'un incident |
| `POST` | `/` | Création |
| `PUT` | `/:id` | Mise à jour |
| `POST` | `/:id/report-to-authority` | Notification à l'autorité compétente |
| `DELETE` | `/:id` | (ADMIN) Suppression |

#### Risks — `/api/v1/risks`
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/org/:orgId` | Risques d'une organisation |
| `GET` | `/matrix/:orgId` | Matrice 5×5 + heatmap |
| `GET` | `/stats/:orgId` | Statistiques par catégorie |
| `GET` | `/:id` | Détail d'un risque |
| `POST` | `/` | Création (riskScore calculé) |
| `PUT` | `/:id` | Mise à jour |
| `DELETE` | `/:id` | (ADMIN) Suppression |

#### Audits — `/api/v1/audits`
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/org/:orgId` | Audits d'une organisation |
| `GET` | `/stats/:orgId` | Statistiques d'audit |
| `GET` | `/:id` | Détail d'un audit |
| `GET` | `/:id/findings` | Constats d'un audit |
| `POST` | `/` | Création d'un audit |
| `PUT` | `/:id` | Mise à jour d'un audit |
| `POST` | `/:id/findings` | Ajout d'un constat |
| `PUT` | `/:id/findings/:findingId` | Mise à jour d'un constat |
| `DELETE` | `/:id` | (ADMIN) Suppression |

#### Reports — `/api/v1/reports`
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/org/:orgId` | Liste des rapports |
| `GET` | `/:id` | Détail d'un rapport |
| `POST` | `/generate` | (ADMIN / COMPLIANCE_OFFICER) Génère un rapport |

### Format des réponses

```jsonc
// Succès
{ "success": true, "data": { /* … */ }, "message": "Optionnel" }

// Erreur
{ "success": false, "message": "Description", "errors": [ { "field": "email", "message": "Invalid email" } ] }
```

---

## Authentification & rôles

Le flux d'authentification repose sur deux tokens :

1. `POST /auth/login` retourne un **access token** (courte durée) et un **refresh token** (longue durée).
2. Les requêtes protégées incluent l'en-tête `Authorization: Bearer <access_token>`.
3. À expiration, `POST /auth/refresh` délivre un nouvel access token.

### Rôles (RBAC)

| Rôle | Permissions |
|------|-------------|
| `ADMIN` | Accès complet, y compris la gestion des organisations et les suppressions |
| `COMPLIANCE_OFFICER` | Gestion de la conformité, incidents, risques et audits de son organisation |
| `AUDITOR` | Lecture + création de constats d'audit |
| `VIEWER` | Lecture seule |

### Identifiants par défaut (seed)

| Champ | Valeur |
|-------|--------|
| Email | `admin@nis2.example.com` |
| Mot de passe | `Admin@1234` |

> ⚠️ À usage de développement uniquement. Changez ces identifiants en production.

---

## Tests

Trois niveaux de tests couvrent le backend et le frontend :

- **Tests unitaires** (180) — logique métier (services), utilitaires et middlewares ; mock de Prisma. Couverture ~99 %.
- **Tests d'intégration** (29) — bout en bout via **supertest** contre l'app Express et un vrai PostgreSQL (auth, organisations, conformité, incidents).
- **Tests E2E** (18, **Playwright**) — parcours utilisateur réels dans un navigateur Chromium contre la pile complète (frontend + API + base) : connexion/déconnexion, routes protégées, et **création** d'incidents, de risques et d'organisations via les formulaires.

```bash
# Backend
npm test                  # Tests unitaires
npm run test:coverage     # Unitaires + couverture (seuil 70 %)
npm run test:integration  # Tests d'intégration (PostgreSQL requis)

# Frontend E2E (API + base doivent tourner)
cd frontend
npx playwright install chromium   # 1ʳᵉ fois : télécharge le navigateur
npm run test:e2e
```

Le rapport HTML de couverture est généré dans `coverage/`. Les tests d'intégration
lisent `DATABASE_URL`. Les tests E2E démarrent automatiquement le serveur Vite et
ciblent l'API sur `http://localhost:3000`.

---

## Frontend

Une interface web React vit dans [`frontend/`](./frontend) (Vite + React 18 +
TypeScript, Tailwind, TanStack Query). Elle consomme cette API et couvre les
sept modules (tableau de bord, organisations, conformité, incidents, risques,
audits, rapports).

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173 (proxy /api → http://localhost:3000)
```

Voir [`frontend/README.md`](./frontend/README.md) pour les détails.

---

## Intégration continue

Le pipeline GitHub Actions (`.github/workflows/ci.yml`) comprend six jobs :

1. **Code Quality** — `type-check`, `lint`, `format:check`
2. **Unit Tests** — tests + couverture, artefact uploadé
3. **Integration Tests** — exécutés contre un service PostgreSQL (`prisma db push`)
4. **Frontend Build** — `lint` + `build` de l'application React
5. **E2E Tests** — Playwright contre la pile complète (backend buildé + seedé + frontend), rapport uploadé en cas d'échec
6. **Build Docker** — construction des images de production backend **et** frontend (avec cache)

Un job de **déploiement** (Render) est préconfiguré mais commenté dans le workflow,
prêt à activer sur la branche `main`.

---

## Déploiement

La plateforme se déploie de deux façons.

### Conteneurs (auto-hébergé)

La stack de production est décrite dans `docker-compose.prod.yml` : PostgreSQL,
l'API (image multi-stage non-root) et le frontend servi par **nginx** (qui fait
aussi office de reverse-proxy `/api` → API).

```bash
cp .env.production .env.prod.local     # renseigner DB_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET…
docker compose -f docker-compose.prod.yml --env-file .env.prod.local up -d --build
docker compose -f docker-compose.prod.yml exec api npx prisma db push   # init du schéma
docker compose -f docker-compose.prod.yml exec api npm run seed         # (optionnel)
```

Le frontend est alors accessible sur `http://localhost` (port 80). Seul ce port
est exposé : PostgreSQL et l'API restent sur le réseau interne Docker.

### PaaS — Render (un clic)

Le blueprint `render.yaml` provisionne trois ressources : une base PostgreSQL,
le service API (runtime **Node** natif) et le frontend (site statique avec
proxy `/api`). Marche à suivre :

1. Pousser le dépôt sur GitHub.
2. Dans Render : **New + → Blueprint**, puis sélectionner le dépôt.
3. Render lit `render.yaml` et crée les trois ressources.

À l'**Apply**, Render demande de renseigner les variables marquées
`sync: false` :

| Variable | Valeur |
| --- | --- |
| `JWT_SECRET` | chaîne aléatoire robuste — `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | autre chaîne aléatoire robuste (différente) |
| `ADMIN_PASSWORD` | mot de passe du compte `admin@nis2.example.com` |
| `OFFICER_PASSWORD` | *(optionnel)* mot de passe du compte officer de démo |

Toutes les autres variables sont déjà définies dans le blueprint (dont
`DATABASE_URL`, injectée automatiquement depuis la base).

À chaque déploiement, l'API exécute `prisma db push` (création/MAJ du schéma)
puis le seed idempotent (contrôles NIS2 + admin) — la base est prête au premier
démarrage. Le mot de passe admin provient de `ADMIN_PASSWORD` : le mot de passe
de démo n'est **jamais** utilisé en ligne.

Connexion : `admin@nis2.example.com` / *(votre `ADMIN_PASSWORD`)*.

> Si Render attribue à l'API un hôte différent de `nis2-api.onrender.com`,
> mettez à jour la destination de la règle `rewrite` `/api/*` (frontend) et la
> variable `CORS_ORIGIN`.

> Checklist production : secrets JWT forts et distincts, `ADMIN_PASSWORD`
> robuste, restreindre `CORS_ORIGIN` au domaine du frontend, ajuster
> `RATE_LIMIT_MAX`, et envisager un plan payant (les bases PostgreSQL gratuites
> de Render expirent).

---

## Contexte NIS2

La directive NIS2 renforce le niveau commun de cybersécurité dans l'UE. Les mesures de gestion des risques de l'**Article 21** couvertes par cette plateforme :

1. Analyse des risques et politiques de sécurité des systèmes d'information
2. Gestion des incidents
3. Continuité d'activité et gestion de crise
4. Sécurité de la chaîne d'approvisionnement
5. Sécurité dans l'acquisition, le développement et la maintenance des systèmes
6. Politiques d'évaluation de l'efficacité des mesures
7. Pratiques de cyber-hygiène et formation à la cybersécurité
8. Politiques de cryptographie et de chiffrement
9. Sécurité des ressources humaines et contrôle d'accès
10. Authentification multifacteur et communications sécurisées

L'**Article 23** impose la notification des incidents significatifs à l'autorité compétente (alerte précoce sous 24 h, notification sous 72 h) — flux pris en charge par le module *Incidents*.

---

## Licence

MIT
