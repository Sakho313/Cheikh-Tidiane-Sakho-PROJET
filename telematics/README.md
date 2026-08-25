# SAO Telematics — Plateforme télématique de flotte

Outil de **géolocalisation et de gestion de flotte** : suivi des véhicules en
temps réel, **analyse du comportement de conduite** (scoring), gestion du
**carburant** (pleins, consommation, détection de vol), géofences, alertes,
entretien et **rapports** exportables.

> Projet indépendant vivant dans `telematics/`, distinct de la plateforme NIS2 à
> la racine du dépôt. Stack et conventions volontairement réutilisées.

## Stack

- **Backend** — Node.js 18+, TypeScript, Express, Prisma + PostgreSQL, JWT,
  Zod, Swagger, **Socket.IO** (temps réel), multer + csv-parse + xlsx (import),
  exceljs + pdfkit (export), @turf/turf (géospatial).
- **Frontend** — Vite + React 18 + TypeScript, TanStack Query, Tailwind, axios,
  **cartes multi-fournisseurs** (Leaflet / Mapbox / Google), recharts,
  socket.io-client.

## Démarrage rapide

Prérequis : Node.js 18+ et une instance PostgreSQL accessible.

```bash
cd telematics
cp .env.example .env          # renseigner DATABASE_URL + secrets JWT
cp frontend/.env.example frontend/.env

make setup                    # install + db push + seed
make dev                      # API :4000 + frontend :5174
```

Connexion de démonstration : `admin@telematics.example.com` / `Admin@1234`.

## Fonctionnalités

| Module | Description |
|--------|-------------|
| **Vehicles / Devices** | Parc de véhicules et boîtiers GPS associés. |
| **Drivers** | Chauffeurs, score de comportement, statistiques. |
| **Telemetry** | Ingestion GPS en **3 modes** : REST par lots, **temps réel** (WebSocket), import CSV/Excel. |
| **Trips** | Trajets reconstitués depuis les positions (distance, durée, vitesse, tracé GeoJSON). |
| **Events** | Événements de conduite (excès de vitesse, freinage/accélération brusques…). |
| **Fuel** | Pleins, consommation L/100km, statistiques, **détection de vol**. |
| **Geofences** | Zones (cercle/polygone), entrées/sorties, alertes sur zones restreintes. |
| **Alerts** | Alertes temps réel (vitesse, géofence, carburant…) avec acquittement/résolution. |
| **Maintenance** | Entretiens planifiés/réalisés par véhicule. |
| **Analytics** | Tableau de bord flotte, **scores de conduite**, conso carburant, utilisation. |
| **Reports** | Génération de rapports (comportement, carburant, sécurité…) + export CSV/Excel/PDF. |

## Cartographie multi-fournisseurs

Le frontend bascule de fournisseur via `VITE_MAP_PROVIDER` dans `frontend/.env` :

- `leaflet` — gratuit, sans clé (par défaut).
- `mapbox` — `VITE_MAPBOX_TOKEN` requis.
- `google` — `VITE_GOOGLE_MAPS_KEY` requis.

Les pages utilisent un composant unique `<FleetMap />` ; aucun code applicatif
ne dépend du fournisseur choisi.

## Ingestion depuis un boîtier GPS

```bash
curl -X POST http://localhost:4000/api/v1/telemetry/ingest \
  -H "x-api-key: $INGEST_API_KEY" -H "Content-Type: application/json" \
  -d '{"positions":[{"vehicleId":"<id>","latitude":14.71,"longitude":-17.46,"speedKmh":52}]}'
```

## Documentation API

Swagger UI : `http://localhost:4000/api/docs`.

## Déploiement (Docker)

```bash
docker compose up -d --build         # Postgres + API
docker compose exec api npx prisma db push
docker compose exec api npm run seed
```

## Licence

MIT
