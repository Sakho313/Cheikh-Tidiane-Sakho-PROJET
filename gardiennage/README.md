# SAO Sécurité — Gardiennage · Vidéosurveillance

Site vitrine de la filiale sécurité du groupe SAO Consulting Group.
Statique (HTML/CSS/JS, aucune dépendance de build), destiné à
**securite.saoconsultingroup.com**.

Le cahier des charges et les garde-fous sont dans `CLAUDE.md` — **le lire avant
toute modification**, en particulier son §0 sur les images.

## Ce qu'il y a dans ce dossier

| Chemin | Rôle |
|---|---|
| **`site/`** | **Le dossier à déployer.** `index.html` + `assets/` + `api/contact.js` + `robots.txt` + `sitemap.xml` + `vercel.json`. |
| `index-autonome.html` | Le même site en **un seul fichier** (2,5 Mo, images en base64). Filet de sécurité : il n'a pas de dossier `assets/` à oublier. |
| `prototype/` | Aperçu d'origine, référence visuelle. **Ne pas déployer.** |
| `verifier-images.py` | Checklist §9 automatisée (voir plus bas). |
| `banc-dessai.js` | Serveur local qui monte la route `/api/contact` et intercepte Mailtrap, pour tester le formulaire sans rien envoyer. |
| `FORMULAIRE.md` | **Comment marche le formulaire et comment le configurer.** |
| `_DEPLOIEMENT-origine.md` | Notes de livraison initiales, conservées pour mémoire. |

## Déployer

### Option A — connecter le dépôt Git (la meilleure)

Vercel → **Add New → Project → Import Git Repository** → dossier racine
`gardiennage/site` · Framework **Other** · Build command vide.
Puis renseigner `MAILTRAP_TOKEN` dans **Settings → Environment Variables**
(voir `FORMULAIRE.md`).

C'est la seule option où la route `/api/contact` fonctionne : le formulaire
part alors par Mailtrap, sans clé visible dans la page.

### Option B — glisser-déposer du dossier

Vercel → **Add New → Project → Deploy** → glisser le dossier **`site/`**
(pas seulement `index.html`) · Framework **Other** · Build command vide ·
Output `.`. Sur Netlify : glisser `site/` sur <https://app.netlify.com/drop>.

Le formulaire bascule automatiquement sur Web3Forms — il marche, simplement
la clé est visible dans la page (c'est une clé publique, donc sans risque).

Dans les deux cas, brancher ensuite `securite.saoconsultingroup.com`.

### Option C — le fichier unique (si tout le reste a échoué)

Renommer `index-autonome.html` en `index.html`, le placer **seul** dans un
dossier vide, déployer ce dossier. Aucune image ne peut manquer : elles sont
toutes à l'intérieur du fichier. Le formulaire passe par Web3Forms.

C'est plus lourd au premier chargement (2,5 Mo d'un bloc, rien n'est mis en
cache séparément) — à réserver au dépannage, l'option A reste la bonne.

## Vérifier avant de mettre en ligne

```bash
python3 gardiennage/verifier-images.py   # aucune image cassée ?  (code 1 si problème)
node gardiennage/banc-dessai.js          # site + formulaire complet sur :8891
```

Le banc d'essai monte la vraie route `/api/contact` et intercepte Mailtrap :
tu vois l'email qui serait parti, sans rien envoyer.

Après toute modification de `site/index.html`, régénérer le fichier unique :

```bash
python3 outils/construire-autonome.py gardiennage/site
```

## Ce que fait le site

- **Hero** cinématographique, marquee, scrollspy, barre de progression de lecture.
- **§01 Expertise** — 7 domaines (CCTV/IP, anti-intrusion, contrôle d'accès,
  portails, alarmes techniques, télésurveillance, Smart Home) + encart
  cybersécurité + bloc « Sur le terrain » (gardiennage, événementiel, intervention).
- **§02 Boutique** — 26 produits, 6 filtres, **panier de devis** : la sélection
  est conservée d'une visite à l'autre (`localStorage`), se consulte dans un
  panneau récapitulatif d'où l'on peut retirer une ligne, et remplit le
  formulaire au moment de l'envoi. Tous les prix restent « Sur devis ».
- **§03 Télésurveillance**, **§04 Méthode**, **§05 Engagements**, bandeau agrément.
- **§06 Devis** — trois routes en cascade : `/api/contact` (Mailtrap, jeton
  côté serveur) → Web3Forms → WhatsApp. Honeypot anti-spam, validation
  serveur, protection contre l'injection d'en-têtes email. Détails et
  configuration dans **`FORMULAIRE.md`**.

## Notes techniques

- Les deux images les plus lourdes (mascotte, logo) sont servies en **WebP** via
  `<picture>`, avec le PNG en repli. La mascotte passe ainsi de 886 Ko à 68 Ko.
  **Ne pas supprimer les PNG** : ce sont les replis.
- Les images qui ne portent que `height` en CSS ont besoin de `width:auto`,
  sinon les attributs `width`/`height` du HTML les déforment.
- Le formulaire est en `novalidate` : la validation est faite en JavaScript
  (`champsManquants()`) **et** revérifiée côté serveur dans `api/contact.js`.
- La clé Web3Forms est publique par nature — sa présence en clair est normale.
  Le jeton Mailtrap, lui, ne doit jamais quitter les variables d'environnement.
