# Déploiement — Frontend sur Cloudflare Pages + API sur Render

Architecture cible :

| Composant | Hébergeur | URL |
|---|---|---|
| Frontend (SPA statique) | **Cloudflare Pages** | `https://telematique.saoconsultingroup.com` |
| API + Socket.IO + PostgreSQL | **Render** | `https://telematics-api.onrender.com` |

Le frontend appelle l'API **en cross-origin** (REST + WebSocket). L'origine du
frontend doit donc être autorisée par la CORS de l'API (`CORS_ORIGIN`).

> ⚠️ Cloudflare Pages **n'exécute pas** le backend Node/Express/PostgreSQL — il
> ne sert que le statique. D'où le backend séparé sur Render.

---

## Étape 1 — API sur Render

1. Place `telematics/render.yaml` à la racine du dépôt (ou déploie depuis un
   dépôt où `telematics/` est la racine).
2. Render → **New + → Blueprint** → sélectionne le dépôt et la branche.
3. Renseigne les secrets `sync: false` : `JWT_SECRET`, `JWT_REFRESH_SECRET`,
   `INGEST_API_KEY`, `ADMIN_PASSWORD`.
4. **Apply**. L'API se déploie (schéma `prisma db push` + seed automatiques).
5. Vérifie `https://telematics-api.onrender.com/health`.

> Plan gratuit : le service s'endort après inactivité (1er appel lent, ~30 s).
> Passe en plan payant pour l'éviter.

---

## Étape 2 — DNS (localiser la zone de `saoconsultingroup.com`)

Vérifie où pointent les serveurs de noms :

```bash
dig +short NS saoconsultingroup.com
```

- **NS = `*.ns.cloudflare.com`** → la zone est déjà sur Cloudflare → passe à
  l'étape 3 (le domaine perso se créera en 1 clic).
- **NS = `*.ovh.net` (ou autre)** → la zone est chez OVH. Recommandé : ajouter le
  domaine à Cloudflare :
  1. Cloudflare → **Add a site** → `saoconsultingroup.com` → plan **Free**.
  2. Cloudflare te donne **2 serveurs de noms** (`*.ns.cloudflare.com`).
  3. OVH → **Domaines → saoconsultingroup.com → Serveurs DNS** → remplace les NS
     par les 2 fournis par Cloudflare.
  4. Attends le passage en **Active** sur Cloudflare (quelques minutes à 24 h).

  *Alternative sans migrer la zone :* garder OVH et créer un **CNAME
  `telematique` → `telematique.pages.dev`** dans la zone OVH (étape 4).

---

## Étape 3 — Frontend sur Cloudflare Pages

### Option A — Intégration Git (recommandé : redeploy auto)

1. Cloudflare → **Workers & Pages → Create → Pages → Connect to Git** → dépôt +
   branche (`claude/amazing-goodall-kcjwvy`, ou `main` après merge).
2. **Build settings :**
   - Project name : `telematique`
   - Root directory : `telematics/frontend`
   - Framework preset : `Vite`
   - Build command : `npm run build`
   - Build output directory : `dist`
3. **Variables d'environnement (Production) :**
   - `VITE_API_URL` = `https://telematics-api.onrender.com`
   - `VITE_MAP_PROVIDER` = `leaflet`
   - `NODE_VERSION` = `20`
4. **Save and Deploy** → tu obtiens `https://telematique.pages.dev`.

### Option B — Upload direct (sans Git)

```bash
cd telematics/frontend
npm ci
VITE_API_URL=https://telematics-api.onrender.com VITE_MAP_PROVIDER=leaflet npm run build
npx wrangler login
npx wrangler pages deploy dist --project-name telematique
```

(ou glisse-dépose le dossier `dist/` — ou l'archive fournie — dans
Cloudflare Pages → **Upload assets**.)

---

## Étape 4 — Domaine perso

1. Cloudflare → Pages → projet `telematique` → **Custom domains → Set up a
   domain** → `telematique.saoconsultingroup.com`.
2. Si la zone est sur Cloudflare : le `CNAME` est créé automatiquement. Sinon,
   ajoute chez OVH : `CNAME telematique → telematique.pages.dev`.
3. Le certificat TLS est émis automatiquement.

---

## Étape 5 — Autoriser l'origine côté API (CORS)

Le service Render `telematics-api` doit accepter l'origine du frontend. Le
`render.yaml` fixe déjà :

```
CORS_ORIGIN = https://telematique.saoconsultingroup.com,https://telematique.pages.dev
```

Si ton URL `*.pages.dev` diffère, ajoute-la dans `CORS_ORIGIN` (Render →
Environment) et **Manual Deploy → Clear cache & deploy**.

---

## Récapitulatif

| | URL |
|---|---|
| Vitrine + application | `https://telematique.saoconsultingroup.com` |
| API (Swagger) | `https://telematics-api.onrender.com/api/docs` |
| Admin (seed) | `admin@telematics.example.com` / `ADMIN_PASSWORD` |

### Notes

- **SPA** : `public/_redirects` (`/* → /index.html 200`) gère le routage client.
- `VITE_API_URL` est **bakée au build** : si l'URL d'API change, rebuild le front.
- **Évolution** : pour une API sur `api.saoconsultingroup.com`, ajoute ce domaine
  perso au service Render, mets `VITE_API_URL` dessus et rebuild le frontend.
