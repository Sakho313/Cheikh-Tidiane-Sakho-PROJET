# CLAUDE.md

Ce fichier fournit des directives à Claude Code (claude.ai/code) lorsqu'il travaille sur le code de ce sous-projet.

## Présentation

Plateforme **télématique de gestion de flotte** : géolocalisation des véhicules, analyse du comportement de conduite (scoring), suivi du carburant, géofences, alertes et rapports. Projet **séparé** vivant dans `telematics/`, indépendant de la plateforme NIS2 à la racine du dépôt (stack et conventions réutilisées). C'est un **monorepo** :

- **Backend** (`telematics/`) — API REST Express + TypeScript + Prisma/PostgreSQL sous `/api/v1`, avec serveur temps réel **Socket.IO** pour le suivi live.
- **Frontend** (`telematics/frontend/`) — SPA Vite + React 18 + TanStack Query + Tailwind, en français, avec carte **multi-fournisseurs** (Leaflet / Mapbox / Google).

Le `Makefile` orchestre les deux moitiés (`make help`). Backend sur **:4000**, frontend sur **:5174**.

## Commandes

À lancer depuis `telematics/` sauf indication contraire.

```bash
make setup        # install backend+frontend, prisma db push, seed (bootstrap)
make dev          # API (:4000) + frontend (:5174) ensemble

# Backend (package.json racine telematics/)
npm run dev               # API seule, hot-reload, :4000 (+ WebSocket)
npm run build             # tsc -> dist/
npm run lint              # eslint, seuil zéro avertissement
npm run type-check        # tsc --noEmit
npm run format            # prettier --write

# Frontend (cd frontend d'abord)
npm run dev               # Vite :5174, proxifie /api -> :4000
npm run build / lint / type-check
```

### Base de données / Prisma

Synchronisation du schéma via **`prisma db push`** (pas de migrations). Après toute édition de `prisma/schema.prisma` :

```bash
npm run generate          # régénère le client Prisma
npx prisma db push        # applique le schéma
npm run seed              # idempotent : org démo, flotte, chauffeurs, télémétrie
```

## Architecture backend

Chaque domaine vit dans `src/modules/<nom>/` en quatre fichiers, découpage strict **`routes → controller → service → Prisma`** (identique au projet NIS2 voisin) :

- **routes** — `router.use(authenticate)` protège le module ; par route `authorize(Role.X, ...)` (RBAC) + `validate(Schema)` (Zod). Annotations `@swagger`.
- **controller** — fin : lit `req`, résout l'organisation via `resolveOrgId(req)`, appelle le service, répond via les helpers `response.ts`, transmet les erreurs avec `next(err)`.
- **service** — toute la logique ; seule couche qui parle à Prisma (singleton `src/config/database.ts`). Classe exportée + instance par défaut.
- **schemas** — Zod + types inférés (`z.nativeEnum(...)` pour les enums Prisma).

### Conventions transverses

- **Enveloppe de réponse** `{ success, data, message }` (+ `errors[]`) via `successResponse`/`errorResponse`/`paginatedResponse` (`src/shared/utils/response.ts`). Le `unwrap()` du frontend reflète cette forme.
- **Erreurs** — un service lève `Object.assign(new Error('msg'), { statusCode: 404 })`. Le gestionnaire global `src/shared/middleware/error.middleware.ts` mappe : Zod → 400, Prisma `P2002` → 409 / `P2025` → 404, JWT → 401, `statusCode` → ce code, sinon 500. Ne jamais `res.status().json()` une erreur dans un contrôleur.
- **Multi-tenant** — tout est cloisonné par `organizationId`. `resolveOrgId(req)` (`src/shared/utils/org.ts`) lit `req.user.organizationId` (ou `?organizationId` pour un ADMIN sans org).
- **Auth** — `authenticate` (JWT Bearer → `req.user`), `authorize(...roles)` (RBAC). Rôles : `ADMIN`, `FLEET_MANAGER`, `DISPATCHER`, `ANALYST`, `DRIVER`, `VIEWER`. Écriture = ADMIN/FLEET_MANAGER ; suppression = ADMIN.
- **Config** — `src/config/env.ts` valide l'environnement (Zod) à l'import et `process.exit(1)` si invalide. Secrets JWT **≥ 16 caractères**. Importer `env` depuis ce fichier.

### Ingestion télémétrique (3 modes)

Le module `telemetry` ingère les positions GPS de trois manières (choix utilisateur : « les 3 ») :

1. **REST par lots** — `POST /api/v1/telemetry/ingest`. Middleware `authenticateIngest` : accepte une **clé boîtier** (`x-api-key` = `INGEST_API_KEY`) **ou** un JWT utilisateur. Body = une position ou `{ positions: [...] }`.
2. **Temps réel** — à chaque position ingérée, le service émet via **Socket.IO** (`src/realtime/socket.ts`) sur la room `org:<id>` : `vehicle:position`, `driving:event`, `alert:new`, `geofence:event`. Le frontend (LiveMap) s'abonne avec son token.
3. **Import de fichiers** — `POST /api/v1/telemetry/import` (multipart, champ `file`) : CSV (`csv-parse`) ou Excel (`xlsx`).

À l'ingestion, le service : rattache la position à un **trajet** (Trip) en cours (ouvre/clôture selon un gap > 5 min), détecte les **événements de conduite** (excès de vitesse vs `vehicle.maxSpeedKmh` ou `DEFAULT_SPEED_LIMIT_KMH` ; freinage/accélération brusques via le delta de vitesse entre positions), évalue les **transitions de géofences** (entrée/sortie ; alerte sur zone `RESTRICTED`), met à jour l'odomètre et `device.lastSeenAt`, et émet en temps réel.

### Score de conduite

Calculé dans `analytics` : `score = 100 − pénalités pondérées par 100 km`, borné [0, 100]. Poids par type d'événement (SPEEDING 2, HARSH_BRAKING 3, PHONE_USE 5, …) × multiplicateur de sévérité (LOW 0.5 → CRITICAL 2). `Driver.behaviorScore` met en cache le score courant ; `DriverScore` stocke des instantanés par période.

### Géolocalisation

`src/shared/utils/geo.ts` : `haversineKm`, `bearingDegrees`, `pathDistanceKm` (distance d'un trajet), `isPointInCircle`, `isPointInPolygon` (géofences). `@turf/turf` est disponible pour des opérations géospatiales avancées.

### Modèle de données

`prisma/schema.prisma` — 14 modèles : `Organization`, `User`, `Vehicle`, `Device`, `Driver`, `Trip`, `GpsPosition`, `DrivingEvent`, `FuelRecord`, `Geofence`, `GeofenceEvent`, `Alert`, `Maintenance`, `Report`, `DriverScore`. `Organization` est la racine du tenant (cascade). `GpsPosition` est la table à fort volume (indexée `[vehicleId, timestamp]`).

## Architecture frontend

`frontend/src/` : `api/` (client axios + module par domaine), `auth/`, `components/map/`, `hooks/`, `lib/`, `pages/`, `types/`. Le client (`api/client.ts`) reproduit le pattern du projet NIS2 : intercepteur Bearer + refresh-queue sur 401 ; tokens dans `localStorage` (`telematics.accessToken` / `telematics.refreshToken`).

### Carte multi-fournisseurs

`components/map/FleetMap.tsx` est une **abstraction** : elle rend `LeafletMap`, `MapboxMap` ou `GoogleMap` selon `VITE_MAP_PROVIDER` (`leaflet` par défaut, sans clé). Les pages utilisent `<FleetMap markers polylines />` sans connaître le fournisseur. Clés : `VITE_MAPBOX_TOKEN`, `VITE_GOOGLE_MAPS_KEY`. Le temps réel passe par `socket.io-client` (`lib/socket.ts`).

## Documentation de l'API & rôles

- Swagger UI : `http://localhost:4000/api/docs` ; OpenAPI JSON : `/api/docs.json`.
- Routes `/api/v1` protégées par JWT sauf `POST /auth/{register,login,refresh}` et l'ingestion par clé boîtier (`x-api-key`).
- Admin du seed : `admin@telematics.example.com` / `Admin@1234` (dev ; prod via `ADMIN_PASSWORD`).

## Variables d'environnement

Voir `.env.example`. Spécifiques à la télématique : `INGEST_API_KEY` (clé partagée des boîtiers GPS), `DEFAULT_SPEED_LIMIT_KMH` (limite par défaut pour la détection d'excès de vitesse).

## Notes

- Lors d'un changement de contrat d'API, mettre à jour ensemble : le schéma Zod (`*.schemas.ts`), les annotations Swagger, et les `types/` + `api/` du frontend.
- Le serveur HTTP et Socket.IO partagent le même port (`src/server.ts` crée le `http.Server`, `app.ts` n'écoute pas).
