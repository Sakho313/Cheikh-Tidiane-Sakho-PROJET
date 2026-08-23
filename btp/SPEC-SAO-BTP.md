# SPEC — Site SAO BTP · Immobilier · Topographie

> Spécification fonctionnelle, éditoriale et technique.
> Cahier des charges pour le développement (voir `CLAUDE.md` pour l'implémentation).
> Base de référence : le prototype `index.html` (one-page) déjà réalisé.

---

## 1. Contexte & objectif

Site vitrine de la filiale **SAO BTP · Immobilier · Topographie** de **SAO Consulting Group**.
Objectif : présenter l'offre, inspirer confiance (sécurité juridique du foncier), et **générer des demandes de devis** qualifiées (particuliers, diaspora, professionnels).

- **Positionnement** : « Du terrain sécurisé à l'ouvrage livré. »
- **Différenciateur clé** : la **sécurisation foncière** (vérification vendeur -> DSCOS -> Domaines), cohérent avec l'ADN sécurité du groupe.
- **Cibles** : acquéreurs de terrains/maisons, **diaspora** (gestion locative à distance), promoteurs, particuliers voulant construire une villa.
- **Langue** : français (option EN à prévoir). **Zone** : Sénégal (Dakar) + France.

## 2. Marque & identité

- **Nom** : SAO BTP · Immobilier · Topographie — filiale de SAO Consulting Group.
- **Slogan groupe** : « Sécuriser aujourd'hui, protéger demain. » · Signature : « Votre sérénité, notre expertise. »
- **Mascotte** : **SAOTY** (cloud + cadenas + bouclier SAO), gardien de confiance.
- **Domaine** : `saoconsultingroup.com` (sous-domaine cible : `btp.` ou `immobilier.saoconsultingroup.com`).
- **Contacts** : +221 77 776 26 93 (SN) · +33 6 05 77 52 87 (FR) · contact@saoconsultingroup.com · Keur Massar, Dakar.
- **Engagement affiché** : zéro litige, transparence totale.

## 3. Design system

| Token | Valeur | Usage |
|---|---|---|
| `--deep` | `#03393B` | Fond profond (teal) |
| `--obsidian` | `#071311` | Fond principal sombre |
| `--ink` / `--panel` | `#0a1614` / `#0b2224` | Panneaux |
| `--aqua` / `--aqua2` | `#0782AD` / `#28b6e6` | Accent primaire / lignes blueprint |
| `--blue` | `#0984E3` | Halos, dégradés |
| `--gold` | `#E9C735` | Accent structurel (CTA, cotes, pastilles) |
| `--mist` / `--muted` | `#EAF3F3` / `#9FB6B5` | Texte clair / atténué |

- **Typographie** : **Montserrat** (display), **Inter** (corps), **Space Mono** (labels techniques, cotes, eyebrows `§0X`).
- **Direction artistique** : « plan d'architecte / blueprint » — grille fine, tracés SVG qui se dessinent (élévation immeuble, villa, parcelle bornée), cotes et libellés mono, **panneaux à équerres d'angle** (`.tick`), l'or = acier/structure.
- **Effets premium** : **aurores animées** (halos bleu + or) dans le hero, boutons dorés à reflet, cartes à halo aqua au survol, liseré de lumière interne sur panneaux.
- **Motion** : reveals au scroll (IntersectionObserver), SVG auto-dessinés (stroke-dashoffset), flottement de la mascotte. **Respecter `prefers-reduced-motion`**.
- **Accessibilité** : contrastes AA, focus visibles, `aria-*`, navigation clavier, cibles tactiles >= 40 px.

## 4. Arborescence & contenu (sections §01 -> §11)

Header sticky : logo + nav (Immobilier, Gestion locative, Topographie, Foncier, Travaux, Villa, Surveillance, Sécurisation) + CTA « Devis ». Menu burger < 960 px.

**Hero** — « Du terrain sécurisé à l'ouvrage livré. » Blueprint parcelle+bâtiment animé, mascotte SAOTY, CTA « Demander un devis » / « Nos services ».

1. **§01 Immobilier** — Vente & location-vente : terrains sécurisés (habitat/investissement), location-vente de maisons (paiement échelonné), conseil personnalisé, vérification foncière complète. Badge « zéro litige · transparence totale ».
2. **§02 Gestion immobilière premium** — pensée pour la **diaspora**. 3 formules : **Essentiel**, **Sérénité**, **Gold Patrimoine** (tarif « à partir de / % du loyer mensuel » — *valeurs à confirmer par le client*). Points : loyer garanti, « vous ne gérez plus rien », « comme si vous étiez sur place », **tableau comparatif** des formules, **configurateur « composez votre gestion sur mesure »**, parcours « confier votre bien en 5 étapes », CTA « Estimer mon loyer gratuitement ».
3. **§03 Topographie & études foncières** — levé **par drone**, implantation & délimitation, études techniques, plans exploitables (permis, travaux).
4. **§04 Bornage & lotissement** — bornage officiel (géomètre agréé), lotissement conforme, viabilisation, accompagnement administratif.
5. **§05 Travaux publics & génie civil** — 4 sous-services : terrassement & préparation, démolition & déblaiement, coupage & dégagement, location d'engins lourds (bulldozer + chauffeur).
6. **§06 Villa clé en main** — parcours 7 étapes (Étude & conception -> Plans & architecture -> Permis -> Fondations & gros œuvre -> Second œuvre -> Finitions -> Livraison clés en main). Volet **architecture & conseil** (conseil personnalisé, architecture sur mesure, budget optimisé, suivi transparent). Villa contemporaine dessinée + bloc « votre villa se construit ».
7. **§07 Surveillance de chantier à distance** — vidéosurveillance en direct, géolocalisation des engins, suivi d'avancement, **une seule application**. CTA « Sécuriser mon chantier ». *(Lien naturel avec le pôle Télématique du groupe.)*
8. **§08 Sécurisation foncière (service spécial)** — **interactif signature** : stepper 3 contrôles -> **Documents du vendeur -> Recherche DSCOS -> Service des Domaines** (authenticité TF/Bail), livrables + barre de progression.
9. **§09 Notre engagement** — fiabilité & transparence, normes & délais, sécurité juridique & technique, satisfaction client.
10. **§10 Partenaires & collaborations** — Cabinet **Alpha Mané** (géomètre agréé), Maître **Djibi Diagne** (notaire/avocat), **Cadastre & Domaines** (DSCOS).
11. **§11 Devis & contact** — coordonnées + formulaire (voir §6). CTA finale + footer.

## 5. Fonctionnalités interactives

- **Stepper sécurisation foncière** : 3 boutons -> titre/description/livrables + barre de progression (`renderPhase`).
- **Timeline villa** : 7 étapes verticales à pastilles dorées.
- **Formules de gestion** : 3 cartes + **tableau comparatif** + **configurateur** (options -> périmètre personnalisé) + **estimateur de loyer** (formulaire simple -> fourchette indicative ou redirection devis).
- **Reveals au scroll**, header condensé, menu burger mobile, mascotte animée.

## 6. Formulaire & intégrations

- **Service** : **Web3Forms** (email sans backend). Clé d'accès en variable d'environnement (`PUBLIC_WEB3FORMS_KEY`) — clé publique par nature.
- **Champs** : nom (requis), organisation, téléphone/WhatsApp, email (requis), type de besoin (liste : achat terrain, location-vente, gestion locative, topographie/drone, bornage/lotissement, sécurisation foncière, villa clé en main, surveillance chantier, terrassement, démolition, location d'engins, autre), localisation, message (requis). **Honeypot** `botcheck`.
- **Repli WhatsApp** : bouton `wa.me/221777762693` avec message pré-rempli (aucune perte de demande).
- **Retour** : message succès/erreur inline, sans rechargement.
- **Destinataire** : contact@saoconsultingroup.com.
- **Évolution** : option fonction serverless `/api/contact` (Resend/Mailtrap) si envoi maîtrisé requis (clé côté serveur).

## 7. SEO & performance

- `<title>` + meta description ; **JSON-LD** `GeneralContractor` + `RealEstateAgent` (gestion) + `Service` par prestation ; Open Graph ; favicon ; `canonical`.
- `sitemap.xml`, `robots.txt` ; **hreflang** fr/en si version EN.
- Mots-clés : *immobilier Dakar, terrain sécurisé Sénégal, gestion locative diaspora, bornage lotissement, levé topographique drone, construction villa clé en main Dakar, sécurisation foncière DSCOS*.
- **Performance** : Lighthouse >= 95 — images WebP + lazy-load, polices `display=swap`, CSS/JS minifiés, zéro librairie lourde.

## 8. Contenu à fournir / produire

- **Photos réelles** : terrains, chantiers, villas livrées, levés drone, engins (remplacer les blueprints, gardés en complément stylistique).
- **Tarifs des formules** de gestion (Essentiel / Sérénité / Gold) à confirmer.
- **Réalisations** : 3–8 projets (photo, type, lieu, descriptif).
- **Mentions légales & confidentialité** (RGPD / données du formulaire). Logos partenaires si autorisés.

## 9. Responsive & compatibilité

Mobile-first ; ruptures ~ 560 / 960 / 1024 px. Navigateurs modernes + iOS/Android récents. Mascotte hero masquée < 960 px.

## 10. Déploiement

- Statique : **Netlify** (drop) ou **Vercel**. Domaine `saoconsultingroup.com` -> sous-domaine dédié.
- En-têtes sécurité (`vercel.json` / `_headers`) : `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, cache long des assets.
- Variables d'env : `PUBLIC_WEB3FORMS_KEY` (+ tokens si serverless).

## 11. Évolutions prévues (backlog)

- Galerie **modèles de villas** (plans + prix) + page « Construire ma villa ».
- **Estimateur de loyer** interactif (gestion).
- **Espace client / diaspora** : suivi chantier en direct (webcam + avancement) + reporting locatif (lien Télématique).
- Pages dédiées par prestation (SEO). Version **anglaise**. Connexion CRM (HubSpot).
