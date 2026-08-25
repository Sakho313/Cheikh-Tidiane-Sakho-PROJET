# CLAUDE.md — SAO Sécurité (Gardiennage · Vidéosurveillance)

> Fichier de contexte pour **Claude Code**. À laisser à la racine du dépôt (lu automatiquement).
> Le site existant fonctionne : `index.html` + dossier `assets/`. Objectif : le maintenir/faire évoluer
> **sans jamais casser l'affichage des images**. Langue du projet : **français**.

---

## 0. ⚠️ RÈGLE N°1 — LES IMAGES (à lire en premier)

Le seul problème rencontré jusqu'ici : **les images ne s'affichent pas**. Cause unique et récurrente :
le fichier `index.html` a été ouvert/déployé **sans son dossier `assets/` à côté**. Toutes les images
utilisent des chemins **relatifs** `./assets/...` ; si le dossier `assets/` n'est pas livré avec la page,
tout casse (logo, hero, photos produits).

### Les règles à respecter absolument
1. **`index.html` et `assets/` voyagent TOUJOURS ensemble.** Jamais l'un sans l'autre.
2. **Déploiement** = on met en ligne **le dossier entier**, pas le seul fichier HTML.
   - **Netlify** : sur https://app.netlify.com/drop, glisser **le DOSSIER** (pas `index.html` seul).
   - **Vercel** : déployer **le dossier** (drag-drop) ou connecter le dépôt Git complet.
3. **Chemins relatifs** : garder `./assets/monimage.jpg` (ne PAS mettre de chemin absolu type `C:\...`
   ni d'URL locale). En prod, `/assets/...` (à la racine) fonctionne aussi si le site est servi depuis la racine.
4. **Aperçu local** : ouvrir `index.html` par double-clic marche uniquement si `assets/` est dans le même
   dossier. En cas de doute, lancer un petit serveur local :
   `python3 -m http.server` puis ouvrir http://localhost:8000
5. **Ne jamais renommer/déplacer** un fichier de `assets/` sans mettre à jour la référence dans `index.html`.
6. **Vérification anti-régression** (voir §9) : après toute modification, lancer
   `python3 gardiennage/verifier-images.py`. Le script échoue (code 1) si une image manque.
7. **Filet de sécurité** : `gardiennage/index-autonome.html` contient le site entier dans un seul
   fichier (images en base64). Il n'a pas de dossier `assets/` à perdre — c'est le repli si un
   déploiement casse encore. Le régénérer après chaque modif :
   `python3 outils/construire-autonome.py gardiennage/site`.

### Si migration vers un framework (Astro / Vite / Next.js)
- Mettre **toutes les images dans `public/assets/`** → les chemins `/assets/...` restent valides tels quels.
- OU importer les images dans les composants (`import img from '../assets/x.jpg'`) et laisser le bundler gérer.
- **Ne pas** laisser des `<img src="./assets/...">` en dur si les fichiers ne sont pas copiés dans le build final.
- Toujours vérifier le dossier de sortie (`dist/`) : il DOIT contenir les images.

---

## 1. Vue d'ensemble

Site vitrine de la filiale **SAO Sécurité** (groupe SAO Consulting Group) : gardiennage, sécurité privée,
vidéosurveillance, télésurveillance, **et vente de matériel de sécurité** (boutique + panier de devis).
But : présenter l'offre et **générer des demandes de devis** (email + WhatsApp).

- Positionnement : « Vos sites protégés, 24 heures sur 24. »
- Cibles : entreprises, commerces, résidences, chantiers, particuliers.
- Zone : Sénégal (Dakar) + France.

## 2. Marque

- Filiale de **SAO Consulting Group** — Safety & Cybersecurity. Signature : « Votre sérénité, notre expertise. »
- Mascotte **SAOTY** (`assets/saoty2.png`). Logo : `assets/logo.png`. Favicon : `assets/favicon.png`.
- Contacts : **+221 77 776 26 93** · +33 6 05 77 52 87 · contact@saoconsultingroup.com · Keur Massar, Dakar.
- **WhatsApp** : `https://wa.me/221777762693` (bouton « Nous écrire sur WhatsApp » + repli formulaire).
- Sous-domaine cible : **securite.saoconsultingroup.com**.
- Société **agréée** : bouton « Consulter l'agrément » → `assets/agrement.pdf`.

## 3. Design system

- Couleurs (variables CSS) : `--deep #03393B`, `--obsidian #071311`, `--ink #0a1614`, `--panel #0b2224`,
  `--aqua #0782AD`, `--aqua2 #28b6e6`, `--blue #0984E3`, `--gold #E9C735`, `--red #ff5d5d`,
  `--mist #EAF3F3`, `--muted #9FB6B5`. **Ne pas hardcoder d'autres couleurs.**
- Typo : **Montserrat** (titres) + **Inter** (texte) + **Space Mono** (labels/eyebrows `§0X`).
- Style : sombre premium « salle de contrôle » — hero cinématographique (photo + effet Ken Burns), aurores,
  panneaux vitrés à équerres (`.tick`), boutons dorés à reflet, cartes à halo, barre de progression de lecture,
  navigation active au scroll (scrollspy), marquee. Respecter `prefers-reduced-motion`.

## 4. Structure de la page (sections)

Header (logo + nav : Services, Boutique, Télésurveillance, Méthode, Engagements, + bouton Devis).

1. **Hero cinématographique** — fond `guard-hero.jpg` (Ken Burns), scrim teal, HUD « LIVE · 24/7 »,
   carte flottante `control-room.jpg`, SAOTY, indicateur de défilement, boutons CTA.
2. **Marquee** — mots-clés défilants.
3. **§01 Expertise — Sécurité électronique, physique & cybersécurité** : 7 domaines détaillés
   (Vidéosurveillance CCTV/IP, Alarme anti-intrusion, Contrôle d'accès & biométrie, Portails/barrières,
   Alarmes techniques & détection, Télésurveillance & monitoring, Sécurité connectée & Smart Home) +
   encart **Cybersécurité SAO** + sous-bloc **« Sur le terrain »** (gardiennage, événementiel, intervention)
   avec duo photos `agent.jpg` / `walkie.jpg`.
4. **§02 Boutique matériel** — bannière `cam-residence.jpg`, filtres par catégorie, **fiches vedettes**
   (photos : IMOU PS7F, packs 4/8 caméras, projecteur solaire) + **catalogue** (19 photos `prod-*.jpg`).
   **Panier de devis** (voir §5). Prix : **« Sur devis »** (ne pas réafficher de montants sauf demande client).
5. **§03 Télésurveillance** — photo `cctv-wall.jpg` + points clés (supervision 24/7, levée de doute, alertes).
6. **§04 Méthode** — audit → dispositif → installation → supervision.
7. **§05 Engagements** — agents agréés, intervention rapide, supervision 24/7, discrétion.
8. **Bandeau « Société agréée »** — lien vers `assets/agrement.pdf`.
9. **SAOTY** + **§06 Devis/contact** (formulaire) + CTA finale + footer.

## 5. Boutique & panier de devis

- Chaque produit a un bouton **« Ajouter au devis »** (`data-name="..."`).
- Un **bouton flottant « Mon devis »** (compteur) apparaît dès qu'un produit est ajouté.
- Au clic : le type passe à « Vente de matériel », la liste des produits **remplit le message** du formulaire,
  et la page défile vers `#devis`. Départ email (Web3Forms) ou WhatsApp.
- Filtres : Tout / Caméras / Enregistrement / Alarme & détection / Contrôle d'accès / Smart Home / Accessoires.

## 6. Formulaire de contact

- **Web3Forms** (envoi email sans backend). Clé publique : `0ad28fb0-7b80-47e0-a5ae-8bd70ffd39bc`
  (champ caché `access_key`). Idéalement, en framework, la placer dans une variable d'env `PUBLIC_WEB3FORMS_KEY`.
- Champs : nom*, organisation, téléphone, email*, type de besoin, localisation, message*. Honeypot `botcheck`.
- **Repli WhatsApp** : bouton qui ouvre `wa.me/221777762693` avec message pré-rempli.
- Destinataire : contact@saoconsultingroup.com.

## 7. Stack & structure recommandées

- **Le plus simple** : garder le site **statique** actuel (HTML/CSS/JS dans `index.html` + `assets/`).
  Parfait pour Netlify/Vercel en glisser-déposer. **C'est la voie recommandée** si aucune fonctionnalité serveur n'est requise.
  C'est le choix retenu. Arborescence dans le dépôt :
  ```
  gardiennage/site/            <- LE DOSSIER A DEPLOYER (index.html + assets/ + robots/sitemap/vercel.json)
  gardiennage/index-autonome.html   <- le meme site en UN fichier (repli anti-assets-oublies)
  gardiennage/prototype/       <- reference visuelle, ne pas deployer
  gardiennage/verifier-images.py    <- checklist §9 automatisee
  outils/construire-autonome.py     <- regenere index-autonome.html
  ```
- **Si évolution en framework** : **Astro** (idéal, sortie statique). Structure proposée :
  ```
  /public/assets/        <- TOUTES les images ici (chemins /assets/... conservés)
  /src/layouts/Base.astro
  /src/components/        <- Header, Hero, Domaines, Boutique, Panier, ContactForm, Footer...
  /src/data/produits.json <- catalogue éditable (nom, catégorie, image, specs)
  /src/pages/index.astro
  ```
  Rappel §0 : en Astro, les images vont dans `public/assets/` pour ne pas casser les chemins.

## 8. Inventaire des assets (chemin → usage)

| Fichier (`assets/`) | Usage |
|---|---|
| `logo.png` + `logo.webp` | Logo (header + footer) — servi via `<picture>`, WebP d'abord |
| `favicon.png` | Favicon |
| `saoty2.png` + `saoty2.webp` | Mascotte SAOTY (hero + section SAOTY) — servi via `<picture>` |
| `saoty.png` | Mascotte (variante, réserve) |
| `guard-hero.jpg` | Fond du hero (agent de sécurité) |
| `control-room.jpg` | Carte flottante hero « Centre de supervision » |
| `cctv-wall.jpg` | Section Télésurveillance (mur d'écrans) |
| `cam-residence.jpg` | Bannière en tête de Boutique |
| `agent.jpg`, `walkie.jpg` | Duo « Sur le terrain » |
| `imou-ps7f.jpg` | Fiche vedette caméra IMOU PS7F |
| `kit-8cam.jpg` | Fiche vedette Kit 8 caméras 5MP |
| `pack4-dahua.jpg`, `pack4-hik.jpg`, `pack8.jpg` | Packs vidéosurveillance |
| `projecteur.jpg` | Projecteur solaire |
| `prod-*.jpg` (20) | Photos du catalogue (dôme, bullet, 4g, ptz, thermique, nvr, disque, alarme-centrale, det-mouvement, det-fumee, det-gaz, det-inondation, interphone, serrure, biometrie, clavier, portail, barriere-levante, onduleur, kit-maison) |
| `agrement.pdf` | Bouton « Consulter l'agrément » |
| `robots.txt`, `sitemap.xml`, `vercel.json` | À la racine de `site/`, pas dans `assets/` |

> **WebP** : les deux images les plus lourdes sont servies en WebP avec repli PNG
> (`<picture><source srcset="…webp"><img src="…png"></picture>`). Le PNG reste présent :
> **ne pas le supprimer**, c'est le repli. Règle §0 n°5 : on ne renomme rien.

## 9. Checklist de non-régression IMAGES (à faire après CHAQUE modif)

- [ ] Le dossier `assets/` existe et contient bien tous les fichiers listés au §8.
- [ ] Chaque référence `./assets/...` du HTML pointe vers un fichier réel (aucun 404).
      **Commande unique : `python3 gardiennage/verifier-images.py`** — elle contrôle aussi
      qu'aucun chemin absolu (`C:\…`, `file://`, `localhost`) ne s'est glissé dans le HTML.
- [ ] En local, tester via `python3 -m http.server` (pas seulement double-clic).
- [ ] Au déploiement, on met en ligne **le dossier entier** (index.html + assets/).
- [ ] Après mise en ligne, ouvrir l'URL et vérifier que logo + hero + photos produits s'affichent.
- [ ] Régénérer le fichier autonome : `python3 outils/construire-autonome.py gardiennage/site`.

## 10. Garde-fous

- Respecter la charte (couleurs, typo, mascotte, ton premium).
- Ne pas réintroduire de **prix** sans validation client (actuellement « Sur devis »).
- Ne pas casser le **panier de devis** ni le **formulaire** (Web3Forms + WhatsApp).
- Ne jamais committer de secret sensible ; la clé Web3Forms est publique par nature (OK en clair).
- Performances : images optimisées (déjà en place), `loading="lazy"`, viser Lighthouse ≥ 95.

## 11. Déploiement (rappel)

1. Netlify : glisser **le dossier** sur app.netlify.com/drop → brancher `securite.saoconsultingroup.com`.
2. Vercel : déployer le dossier (ou connecter Git). En Hobby = non commercial ; usage pro → plan Pro.
3. Vérifier l'affichage des images (checklist §9).
