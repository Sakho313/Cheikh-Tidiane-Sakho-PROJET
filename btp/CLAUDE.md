# CLAUDE.md — SAO BTP · Immobilier · Topographie

> Fichier de contexte pour **Claude Code**. À placer à la racine du dépôt du site BTP
> (renommer ce fichier en `CLAUDE.md`). Lu automatiquement à chaque session.
> Cahier des charges détaillé : voir `SPEC-SAO-BTP.md`. Langue du projet : **français**.

---

## 1. Vue d'ensemble

Site vitrine de la filiale **SAO BTP · Immobilier · Topographie** (groupe SAO Consulting Group).
But : présenter l'offre, rassurer sur la **sécurité foncière**, et **générer des demandes de devis**.
Un prototype one-page existe déjà (`prototype/index.html`) — il fait référence pour le design et le contenu.
Objectif du développement : en faire un projet **propre, maintenable, performant et facile à faire évoluer**.

- **Positionnement** : « Du terrain sécurisé à l'ouvrage livré. »
- **Différenciateur** : sécurisation foncière (vendeur -> DSCOS -> Domaines).
- **Cibles** : acquéreurs, **diaspora** (gestion locative à distance), promoteurs, futurs propriétaires de villa.

## 2. Identité de marque (à respecter)

- Filiale de **SAO Consulting Group** — Safety & Cybersecurity.
- Signature : « Votre sérénité, notre expertise. » · Engagement : **zéro litige, transparence totale**.
- Mascotte **SAOTY** (cloud + cadenas + bouclier). Assets dans `public/brand/` (`logo.png`, `saoty2.png`, `favicon.png`).
- Domaine `saoconsultingroup.com` (sous-domaine `btp.` ou `immobilier.`). Contacts : +221 77 776 26 93 · +33 6 05 77 52 87 · contact@saoconsultingroup.com · Keur Massar, Dakar.

## 3. Design system

- Couleurs (tokens) : `--deep #03393B`, `--obsidian #071311`, `--ink #0a1614`, `--panel #0b2224`, `--aqua #0782AD`, `--aqua2 #28b6e6`, `--blue #0984E3`, `--gold #E9C735`, `--mist #EAF3F3`, `--muted #9FB6B5`. **Ne jamais hardcoder les hex** : passer par les tokens/variables.
- Typo : **Montserrat** (display) + **Inter** (corps) + **Space Mono** (labels/cotes, eyebrows `§0X`).
- DA : « **plan d'architecte / blueprint** » — grille fine, tracés SVG qui se dessinent, cotes mono, **panneaux à équerres** (`.tick`), l'or comme accent structurel. Aurores animées (hero), boutons dorés à reflet, cartes à halo au survol.
- Motion sobre + `prefers-reduced-motion` respecté. Accessibilité AA.

## 4. Stack recommandée

**Recommandation : Astro** (idéal pour un site marketing surtout statique, composants + SEO natif, build statique déployable partout, "islands" pour l'interactif).
- Astro + TypeScript, CSS (variables/design tokens ; Tailwind facultatif mais respecter les tokens).
- Interactivité en JS vanilla ou petits scripts d'îlot (steppers, configurateur, formulaire).
- **Alternative acceptable** : conserver un site statique **HTML/CSS/JS** propre (le prototype fonctionne déjà). Dans ce cas, factoriser header/footer, minifier, et garder un seul design system.

> Ne pas surdimensionner : pas de framework lourd ni de base de données tant qu'un back-office n'est pas requis.

## 5. Architecture des dossiers (Astro proposé)

```
/src
  /layouts/Base.astro          # <head>, SEO, header, footer
  /components/                 # Hero, SectionHead, Card, Stepper, VillaTimeline,
                               # GestionFormules, ContactForm, Saoty, Blueprint*
  /sections/                   # Immobilier, Gestion, Topographie, Foncier, Travaux,
                               # Villa, Surveillance, Securisation, Engagements, Partenaires
  /content/                    # data éditable : formules.json, realisations.json, partenaires.json
  /pages/index.astro           # assemble les sections
  /styles/tokens.css           # variables du design system
/public/brand/                 # logo.png, saoty2.png, favicon.png
/prototype/index.html          # référence design (ne pas déployer)
```

## 6. Sections à implémenter (cf. SPEC §4)

Hero + §01 Immobilier · §02 Gestion locative premium (formules Essentiel/Sérénité/Gold + comparatif + configurateur + estimateur) · §03 Topographie (drone) · §04 Bornage & lotissement · §05 Travaux (4 sous-services) · §06 Villa clé en main (7 étapes + conseil) · §07 Surveillance de chantier · §08 Sécurisation foncière (stepper 3 contrôles) · §09 Engagements · §10 Partenaires · §11 Devis.

## 7. Interactivité (îlots)

- **Stepper sécurisation** (3 contrôles) et **timeline villa** (7 étapes) : reprendre le comportement du prototype (`renderPhase`).
- **Formules de gestion** : cartes + tableau comparatif + **configurateur** (options -> périmètre) + **estimateur de loyer** (calcul simple d'une fourchette, sinon redirection devis).
- Reveals au scroll, header condensé, menu burger, mascotte animée.

## 8. Formulaire de contact (cf. SPEC §6)

- **Web3Forms** côté client. Clé dans `PUBLIC_WEB3FORMS_KEY` (import.meta.env) — clé publique par nature.
- Champs : nom*, organisation, téléphone, email*, type (liste métier), localisation, message*. **Honeypot** `botcheck`.
- **Repli WhatsApp** : `wa.me/221777762693` pré-rempli. Feedback succès/erreur inline.
- Évolution possible : route serverless `/api/contact` (Resend/Mailtrap) pour garder la clé côté serveur.

## 9. SEO & performance

- Métadonnées + **JSON-LD** (`GeneralContractor`, `RealEstateAgent`, `Service`), Open Graph, `canonical`, `sitemap.xml`, `robots.txt`.
- Images en **WebP** + lazy-load, polices `display=swap`, JS minimal. **Cible Lighthouse >= 95**.

## 10. Conventions de code

- TypeScript quand pertinent ; composants petits et réutilisables ; contenu éditable isolé dans `/content`.
- Aucune couleur/typo hors design system. Accessibilité et perf non négociables.
- Commits conventionnels (`feat:`, `fix:`, `chore:`), PR petites et thématiques. Secrets jamais commités.

## 11. Commandes

```bash
npm install
npm run dev       # dev local
npm run build     # build statique (dossier dist/)
npm run preview   # prévisualiser le build
```
Déploiement : déposer `dist/` (ou le dossier statique) sur **Netlify/Vercel** ; brancher le sous-domaine.

## 12. État actuel & feuille de route

- [x] Prototype one-page (design + contenu validés) -> `prototype/index.html`.
- [ ] Initialiser le projet, extraire tokens + layout + header/footer.
- [ ] Porter les 11 sections en composants ; contenu dans `/content`.
- [ ] Îlots interactifs (stepper, timeline, configurateur, estimateur).
- [ ] Formulaire Web3Forms + WhatsApp + honeypot.
- [ ] SEO complet + perf (Lighthouse >= 95).
- [ ] Remplacer les blueprints par de vraies **photos** (terrains, chantiers, villas, drone).
- [ ] Backlog : galerie villas, estimateur loyer, espace client diaspora (webcam/avancement), version EN, CRM.

## 13. Garde-fous (Do / Don't)

- Respecter design system, blueprint, mascotte, ton premium et l'engagement « zéro litige ».
- Ne pas inventer de **tarifs** de formules ni de chiffres/certifications : laisser des emplacements à confirmer par le client.
- Ne pas alourdir (pas de dépendance inutile). Ne pas committer de secrets.
- Contenu sensible (partenaires nommés : Cabinet Alpha Mané, Maître Djibi Diagne) : ne pas modifier sans validation.

## 14. Ressources

- `SPEC-SAO-BTP.md` — cahier des charges détaillé (source de vérité pour le contenu et les fonctionnalités).
- `prototype/index.html` — référence visuelle.
- Claude Code : https://docs.claude.com/en/docs/claude-code/overview
