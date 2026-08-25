# Le formulaire de devis — comment il marche, comment le configurer

Le formulaire essaie **trois routes dans l'ordre**. Dès qu'une aboutit, il
s'arrête. Aucune demande n'est perdue, quel que soit le mode de déploiement.

```
1. POST /api/contact   -> Mailtrap -> contact@saoconsultingroup.com
      |  route absente (404) ou sans jeton (501) ou en panne
      v
2. POST api.web3forms.com -> contact@saoconsultingroup.com
      |  échec réseau
      v
3. Le message invite à utiliser le bouton WhatsApp, qui reprend
   tous les champs saisis + le panier.
```

Une exception : si la route répond **400** (nom, email ou message manquant ou
invalide), on n'essaie pas Web3Forms. Les données seraient refusées pareil,
autant afficher tout de suite pourquoi.

## Quelle route va s'appliquer chez toi ?

| Mode de déploiement | Route utilisée | Où est la clé |
|---|---|---|
| Vercel **connecté à Git**, variables d'environnement remplies | `/api/contact` (Mailtrap) | Sur le serveur, invisible |
| Vercel/Netlify en **glisser-déposer** du dossier | Web3Forms | Dans la page (clé publique, c'est normal) |
| Fichier `index-autonome.html` seul | Web3Forms | Idem |

Les deux marchent. La première est meilleure : la clé n'est pas dans la page,
l'email part de ton domaine, et tu peux répondre directement au prospect
(le champ `reply_to` est son adresse).

## Configurer Mailtrap (option 1)

1. Créer un compte sur <https://mailtrap.io> → **Sending Domains** → ajouter
   `saoconsultingroup.com` et suivre la vérification DNS.
2. Récupérer le jeton d'API : **Settings → API Tokens**.
3. Dans Vercel → ton projet → **Settings → Environment Variables** :

| Variable | Requis | Valeur |
|---|---|---|
| `MAILTRAP_TOKEN` | oui | le jeton d'API Mailtrap |
| `CONTACT_TO` | non | destinataire, défaut `contact@saoconsultingroup.com` |
| `MAILTRAP_FROM` | non | expéditeur, défaut `noreply@saoconsultingroup.com` |
| `MAILTRAP_INBOX_ID` | non | **si renseigné, mode bac à sable** : rien ne part vraiment, tout arrive dans ta boîte de test Mailtrap |

4. Redéployer. **Ne mets jamais ces valeurs dans le code** — elles restent dans
   Vercel.

> Pour tester sans risquer d'envoyer de vraies demandes : renseigne
> `MAILTRAP_INBOX_ID` avec l'identifiant de ton inbox de test. Les emails
> arrivent dans Mailtrap au lieu de la vraie boîte. Retire la variable une fois
> les essais finis.

## Tester en local

```bash
node gardiennage/banc-dessai.js   # sert le site + monte la route + faux Mailtrap
```

Le banc d'essai intercepte les appels Mailtrap : il affiche l'email qui serait
parti sans rien envoyer. Utile pour vérifier la mise en forme avant de brancher
le vrai jeton.

## Ce qui est protégé

- **Honeypot** `botcheck` : champ invisible. S'il est rempli, la route répond
  `200` sans rien envoyer — le robot croit avoir réussi.
- **Injection d'en-têtes email** : tous les caractères de contrôle sont retirés.
  Les sauts de ligne ne survivent que dans `message` et `materiel`, où ils ont
  un sens ; un nom ou une localisation sur deux lignes est impossible.
- **Longueurs plafonnées** par champ (nom 120, message 4000…).
- **Validation côté serveur** en plus du navigateur : le formulaire est en
  `novalidate`, la route ne fait donc pas confiance à ce qu'elle reçoit.
- Le jeton n'apparaît jamais dans une réponse HTTP ni dans la page.

## Si le formulaire ne marche pas en ligne

1. Ouvrir la console du navigateur (F12) → onglet **Réseau** → envoyer le
   formulaire → regarder l'appel à `/api/contact`.
   - **404** : la route n'est pas déployée (tu es en glisser-déposer). Normal,
     Web3Forms prend le relais.
   - **501** : `MAILTRAP_TOKEN` n'est pas défini dans Vercel.
   - **502** : Mailtrap a refusé. Souvent un domaine expéditeur non vérifié.
     Les détails sont dans Vercel → **Logs**.
2. Le bouton WhatsApp fonctionne toujours, lui — il n'appelle aucun serveur.
