// api/contact.js — Fonction serverless Vercel : envoie les demandes de devis
// de SAO Sécurité à la boîte professionnelle via l'API Mailtrap. Le jeton reste
// côté serveur, jamais exposé au navigateur (contrairement à Web3Forms, dont la
// clé est forcément visible dans la page).
//
// Variables d'environnement (Vercel → Settings → Environment Variables) :
//   MAILTRAP_TOKEN     (requis)  jeton d'API Mailtrap
//   MAILTRAP_INBOX_ID  (option)  si défini → bac à sable (test) au lieu de l'envoi réel
//   MAILTRAP_FROM      (option)  expéditeur, défaut noreply@saoconsultingroup.com
//   CONTACT_TO         (option)  destinataire, défaut contact@saoconsultingroup.com
//
// Sans MAILTRAP_TOKEN, la route répond 501 et le formulaire bascule tout seul
// sur Web3Forms puis WhatsApp : aucune demande n'est perdue.

const LIMITES = {
  nom: 120,
  organisation: 140,
  telephone: 40,
  email: 160,
  type: 60,
  localisation: 140,
  message: 4000,
  materiel: 2000,
};

// Seuls ces deux champs ont un sens sur plusieurs lignes. Partout ailleurs un
// retour a la ligne n'est jamais legitime : on le retire.
const MULTILIGNES = new Set(['message', 'materiel']);

function nettoyer(v, max, multiligne) {
  // Retire les caracteres de controle (defense en profondeur contre l'injection
  // d'en-tetes email), en conservant les sauts de ligne la ou ils sont utiles.
  const controles = multiligne
    ? /[\u0000-\u0009\u000b-\u001f\u007f]/g // garde le saut de ligne, retire le retour chariot
    : /[\u0000-\u001f\u007f]/g; // retire tout, sauts de ligne compris
  return String(v == null ? '' : v)
    .replace(controles, '')
    .trim()
    .slice(0, max);
}

function echapper(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
}

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }
    if (!process.env.MAILTRAP_TOKEN) {
      // 501 = « pas configuré ici » : le navigateur bascule sur Web3Forms.
      return res.status(501).json({ error: 'Envoi non configuré' });
    }

    let corps = req.body;
    if (typeof corps === 'string') {
      try {
        corps = JSON.parse(corps);
      } catch {
        corps = {};
      }
    }
    corps = corps || {};

    // Piège à robots : champ invisible qui doit rester vide. On répond 200 pour
    // ne pas apprendre au robot qu'il a été repéré.
    if (nettoyer(corps.botcheck, 100)) return res.status(200).json({ ok: true });

    const d = {};
    for (const k of Object.keys(LIMITES)) d[k] = nettoyer(corps[k], LIMITES[k], MULTILIGNES.has(k));

    if (!d.nom || !d.email || !d.message) {
      return res.status(400).json({ error: 'Nom, email et demande sont requis.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) {
      return res.status(400).json({ error: 'Adresse email invalide.' });
    }

    const destinataire = process.env.CONTACT_TO || 'contact@saoconsultingroup.com';
    const expediteur = process.env.MAILTRAP_FROM || 'noreply@saoconsultingroup.com';
    const bacASable = process.env.MAILTRAP_INBOX_ID;
    const url = bacASable
      ? `https://sandbox.api.mailtrap.io/api/send/${bacASable}`
      : 'https://send.api.mailtrap.io/api/send';

    const lignes = [
      ['Nom', d.nom],
      ['Organisation', d.organisation],
      ['Téléphone', d.telephone],
      ['Email', d.email],
      ['Besoin', d.type],
      ['Localisation', d.localisation],
    ].filter(([, v]) => v);

    const texte =
      'Nouvelle demande depuis le site SAO Sécurité\n\n' +
      lignes.map(([k, v]) => `${k} : ${v}`).join('\n') +
      (d.materiel ? `\n\nMatériel souhaité :\n${d.materiel}` : '') +
      `\n\nMessage :\n${d.message}\n`;

    const html =
      '<div style="font-family:Arial,Helvetica,sans-serif;color:#0a1614">' +
      '<h2 style="color:#03393B;margin:0 0 4px">Nouvelle demande de devis</h2>' +
      '<p style="color:#7e9695;margin:0 0 18px">Envoyée depuis securite.saoconsultingroup.com</p>' +
      '<table cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-size:14px">' +
      lignes
        .map(
          ([k, v]) =>
            `<tr><td style="border:1px solid #e6e6e6;background:#f4f8f8;font-weight:bold">${echapper(k)}</td>` +
            `<td style="border:1px solid #e6e6e6">${echapper(v)}</td></tr>`,
        )
        .join('') +
      '</table>' +
      (d.materiel
        ? '<h3 style="color:#03393B;margin:22px 0 6px">Matériel souhaité</h3>' +
          `<pre style="white-space:pre-wrap;font-family:inherit;font-size:14px;margin:0">${echapper(d.materiel)}</pre>`
        : '') +
      '<h3 style="color:#03393B;margin:22px 0 6px">Message</h3>' +
      `<pre style="white-space:pre-wrap;font-family:inherit;font-size:14px;margin:0">${echapper(d.message)}</pre>` +
      '</div>';

    const reponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Api-Token': process.env.MAILTRAP_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: { email: expediteur, name: 'Site SAO Sécurité' },
        to: [{ email: destinataire }],
        // Permet de répondre directement au prospect depuis la boîte.
        reply_to: { email: d.email, name: d.nom },
        subject: `Demande — SAO Sécurité — ${d.type || 'Contact'} — ${d.nom}`,
        text: texte,
        html,
        category: 'SAO Sécurité',
      }),
    });

    if (!reponse.ok) {
      const detail = await reponse.text().catch(() => '');
      console.error('Mailtrap a refusé la demande :', reponse.status, detail.slice(0, 400));
      return res.status(502).json({ error: "L'envoi a échoué. Réessayez ou passez par WhatsApp." });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Erreur /api/contact :', err);
    return res.status(500).json({ error: 'Erreur interne. Utilisez WhatsApp en attendant.' });
  }
};
