# SAO — Diagnostics de conformité (NIS2 · DORA · AI Act)

Outil autonome (une seule page) : auto-diagnostic de maturité + feuille de route
priorisée, avec capture de leads par email. Styles et JavaScript sont inline dans
`index.html` — aucun build, aucune dépendance serveur.

## Déploiement (Vercel — recommandé)

1. Importer ce dépôt dans Vercel.
2. **Root Directory : `diagnostic`**
3. Deploy (site statique, aucun build à configurer).
4. Domaine : `diagnostic.saoconsultingroup.com` (enregistrement CNAME chez OVH → Vercel).

## Formulaire de contact

Les demandes sont envoyées par email via [Web3Forms](https://web3forms.com)
(constante `WEB3FORMS_KEY` dans `index.html`). Chaque envoi inclut le résultat du
diagnostic réalisé. En cas d'échec réseau, repli automatique sur `mailto:`.

## Fichiers

- `index.html` — l'outil complet.
- `og.png` — image d'aperçu de partage (Open Graph / LinkedIn / WhatsApp).
