# SAO Sécurité — Gardiennage · Vidéosurveillance

Site vitrine de la filiale sécurité du groupe SAO Consulting Group.
Statique (HTML/CSS/JS, aucune dépendance de build), destiné à
**securite.saoconsultingroup.com**.

Le cahier des charges et les garde-fous sont dans `CLAUDE.md` — **le lire avant
toute modification**, en particulier son §0 sur les images.

## Ce qu'il y a dans ce dossier

| Chemin | Rôle |
|---|---|
| **`site/`** | **Le dossier à déployer.** `index.html` + `assets/` + `robots.txt` + `sitemap.xml` + `vercel.json`. |
| `index-autonome.html` | Le même site en **un seul fichier** (2,5 Mo, images en base64). Filet de sécurité : il n'a pas de dossier `assets/` à oublier. |
| `prototype/` | Aperçu d'origine, référence visuelle. **Ne pas déployer.** |
| `verifier-images.py` | Checklist §9 automatisée (voir plus bas). |
| `_DEPLOIEMENT-origine.md` | Notes de livraison initiales, conservées pour mémoire. |

## Déployer

### Option A — le dossier (recommandée)

Vercel → **Add New → Project → Deploy** → glisser le dossier **`site/`**
(pas seulement `index.html`) · Framework **Other** · Build command vide ·
Output `.`. Sur Netlify : glisser `site/` sur <https://app.netlify.com/drop>.

Puis brancher le sous-domaine `securite.saoconsultingroup.com`.

### Option B — le fichier unique (si l'option A a déjà échoué)

Renommer `index-autonome.html` en `index.html`, le placer **seul** dans un
dossier vide, déployer ce dossier. Aucune image ne peut manquer : elles sont
toutes à l'intérieur du fichier.

C'est plus lourd au premier chargement (2,5 Mo d'un bloc, rien n'est mis en
cache séparément) — à réserver au dépannage, l'option A reste la bonne.

## Vérifier avant de mettre en ligne

```bash
python3 gardiennage/verifier-images.py        # aucune image cassée ?  (code 1 si problème)
cd gardiennage/site && python3 -m http.server # puis ouvrir http://localhost:8000
```

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
- **§06 Devis** — Web3Forms (clé publique) vers contact@saoconsultingroup.com,
  honeypot anti-spam, **repli WhatsApp** qui reprend tous les champs saisis et
  le panier.

## Notes techniques

- Les deux images les plus lourdes (mascotte, logo) sont servies en **WebP** via
  `<picture>`, avec le PNG en repli. La mascotte passe ainsi de 886 Ko à 68 Ko.
  **Ne pas supprimer les PNG** : ce sont les replis.
- Les images qui ne portent que `height` en CSS ont besoin de `width:auto`,
  sinon les attributs `width`/`height` du HTML les déforment.
- Le formulaire est en `novalidate` : la validation est faite en JavaScript
  (`champsManquants()`), sans quoi une demande vide partirait chez Web3Forms.
- La clé Web3Forms est publique par nature — sa présence en clair est normale.
