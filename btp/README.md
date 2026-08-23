# SAO BTP — site vitrine

Site statique de la division **Bâtiment & Génie civil** de SAO Consulting Group.
Même identité visuelle que SAO Voyage (palette, logo, composants), contenu
propre au BTP.

Destination : `btp.saoconsultingroup.com` (Vercel).

## État actuel : châssis prêt, contenu à intégrer

| Élément | État |
|---|---|
| Palette SAO, typographies, responsive | ✅ en place |
| Logo (or + argent en réserve), favicon | ✅ en place |
| En-tête, navigation, pied de page | ✅ en place (ancres à ajuster) |
| Hero | ✅ structure + texte provisoire |
| Formulaire de devis + `api/contact.js` | ✅ adapté BTP, testé |
| Boutons flottants WhatsApp / Instagram / haut de page | ✅ en place |
| `vercel.json` (cache, en-têtes de sécurité) | ✅ en place |
| **Sections de contenu** | ⏳ **à écrire depuis le brief** |
| Photos | ⏳ à fournir |

Dans `index.html`, la zone à remplir est balisée :

```html
<!-- ═══ SECTIONS BTP — à remplir depuis le brief (.md) ═══ -->
```

## Composants réutilisables

Tous disponibles dans le CSS, éprouvés sur le site Voyage :

| Classe | Usage |
|---|---|
| `.grid.g2/.g3/.g4` + `.card` | grilles de cartes (métiers, services, réalisations) |
| `.sand-sec` | section fond sable clair (contraste avec le fond sombre) |
| `.media[data-img="clé"]` | bannière ou vignette photo, avec illustration de secours |
| `.acc` + `<details>` | accordéon (FAQ) |
| `.steps` | étapes numérotées (phases de chantier) |
| `.route` + `.offer` | frise verticale + encart offre |
| `.gallery` | galerie 3×3 |
| `.search` | bloc de formulaire encadré |

## Images

Piloté par `window.IMAGES` en tête de `index.html` : une clé par emplacement,
la valeur étant le chemin du fichier dans `assets/`. Tant qu'un chemin est vide,
une illustration vectorielle s'affiche — le site n'est jamais cassé.

## Formulaire de devis

`api/contact.js` envoie les demandes à `contact@saoconsultingroup.com` via
Mailtrap. Champs : nom, email, téléphone, nature des travaux, localisation du
chantier, échéance, surface/volume, message. Le `reply_to` est l'email du
client ; un champ piège bloque les robots.

## Déploiement (Vercel)

1. Dépôt Git ou glisser-déposer du dossier sur [vercel.com/new](https://vercel.com/new)
2. **Framework Preset = Other**, *Build Command* vide, *Output Directory* = `.`
3. **Settings → Domains** → `btp.saoconsultingroup.com`
4. **Settings → Environment Variables** → voir `.env.example`
