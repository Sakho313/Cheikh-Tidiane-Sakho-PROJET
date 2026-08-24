# SAO BTP — site en production

Version **HTML/CSS/JS statique** actuellement déployée (choix validé : on reste
sur cette version plutôt que sur le projet Astro du dossier parent).

## Contenu

| Fichier | Usage |
|---|---|
| `index.html` + `assets/` | **Version recommandée** — images séparées, mises en cache par le navigateur, chargement plus rapide. Déposer le dossier entier sur Vercel. |
| `index-autonome.html` | Même site en **un seul fichier** (1,9 Mo, images en base64). À renommer `index.html`, seul dans un dossier, si l'on veut éviter toute gestion de fichiers. |
| `_photos-sources/` | Photos d'origine non optimisées, conservées pour pouvoir régénérer `assets/` autrement (autres dimensions, WebP…). Ne pas déployer. |

## Correctifs appliqués (par rapport à la première mise en ligne)

Le site appelait 10 images dans `./assets/` — dossier absent du déploiement,
d'où le logo cassé, le grand vide noir dans le hero et l'image « Ingénieur »
manquante.

1. Les 7 photos fournies (noms de hash) ont été **identifiées et renommées**
   selon ce que le code attend, puis **optimisées** : 2,5 Mo → 0,8 Mo
   (la photo de béton passe de 1,9 Mo à 235 Ko).
2. `logo.png` et `favicon.png` ajoutés depuis les assets de marque.
3. Menu : `white-space:nowrap` — « Gestion locative » ne se coupe plus en deux.
4. Garde-fou JS : une image optionnelle absente est masquée proprement au lieu
   d'afficher une icône cassée.

## Correspondance photos → emplacements

| Source | Fichier | Emplacement |
|---|---|---|
| `f1` géomètre au théodolite | `topographie.jpg` | section Topographie |
| `f2` villa blanche de nuit | `villa-luxe.jpg` | **fond du hero** + vignette |
| `f3` villa contemporaine | `villa-moderne.jpg` | section Villa |
| `f4` ouvrier, grues | `genie-civil.jpg` | section Travaux |
| `f5` ingénieur aux plans | `ingenieur.jpg` | encart du hero |
| `f6` suivi de chantier | `chantier-suivi.jpg` | section Suivi |
| `f7` coulage de béton | `gros-oeuvre.jpg` | section Gros œuvre |

## Reste à fournir

- **`saoty2.png`** — la mascotte SAOTY. Dans `index.html` les deux emplacements
  sont conservés et masqués automatiquement tant que le fichier est absent :
  il suffit de le déposer dans `assets/`. Dans `index-autonome.html` ils ont été
  retirés (section « Signé SAO » passée en pleine largeur).

## Déploiement

Vercel → **Add New → Project → Deploy** → glisser le dossier
(`index.html` + `assets/` à la racine) · Framework **Other** · Build command
vide · Output `.`
