// api/contact.js — Fonction serverless Vercel : envoie les demandes de devis
// à la boîte professionnelle SAO via l'API Mailtrap. Le jeton reste côté
// serveur, jamais exposé au navigateur.
//
// Variables d'environnement (Vercel → Settings → Environment Variables) :
//   MAILTRAP_TOKEN     (requis)  jeton d'API Mailtrap
//   MAILTRAP_INBOX_ID  (option)  si défini → mode bac à sable (test) au lieu de l'envoi réel
//   MAILTRAP_FROM      (option)  expéditeur, défaut noreply@saoconsultingroup.com
//   CONTACT_TO         (option)  destinataire, défaut contact@saoconsultingroup.com
//
// Sans MAILTRAP_TOKEN, la route répond 501 et le formulaire bascule
// automatiquement sur WhatsApp / email (aucune demande n'est perdue).

const LIMITS = { nom: 120, email: 160, tel: 40, service: 60, localisation: 120, dates: 80, volume: 60, message: 4000 };

function clean(v, max) {
  // Retire les caracteres de controle (protection contre l'injection d'en-tetes
  // email), en conservant les retours a la ligne du message.
  return String(v == null ? '' : v)
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '')
    .trim()
    .slice(0, max);
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!process.env.MAILTRAP_TOKEN) return res.status(501).json({ error: 'Envoi non configuré' });

    let b = req.body;
    if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
    b = b || {};

    // Piège à robots : champ invisible qui doit rester vide.
    if (clean(b.societe, 100)) return res.status(200).json({ ok: true });

    const d = {};
    for (const k of Object.keys(LIMITS)) d[k] = clean(b[k], LIMITS[k]);

    if (!d.nom || !d.email || !d.message) {
      return res.status(400).json({ error: 'Nom, email et message sont requis.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) {
      return res.status(400).json({ error: 'Adresse email invalide.' });
    }

    const to = process.env.CONTACT_TO || 'contact@saoconsultingroup.com';
    const from = process.env.MAILTRAP_FROM || 'noreply@saoconsultingroup.com';
    const inbox = process.env.MAILTRAP_INBOX_ID;
    const url = inbox
      ? `https://sandbox.api.mailtrap.io/api/send/${inbox}`
      : 'https://send.api.mailtrap.io/api/send';

    const lignes = [
      ['Nom', d.nom],
      ['Email', d.email],
      ['Téléphone', d.tel],
      ['Service', d.service],
      ['Localisation', d.localisation],
      ['Dates', d.dates],
      ['Surface / volume', d.volume],
    ].filter(([, v]) => v);

    const text =
      'Nouvelle demande depuis le site SAO BTP\n\n' +
      lignes.map(([k, v]) => `${k} : ${v}`).join('\n') +
      `\n\nMessage :\n${d.message}\n`;

    const html =
      '<div style="font-family:Arial,Helvetica,sans-serif;color:#0a1614">' +
      '<h2 style="color:#03393B;margin:0 0 4px">Nouvelle demande de devis</h2>' +
      '<p style="color:#6f6449;margin:0 0 18px">Envoyée depuis btp.saoconsultingroup.com</p>' +
      '<table cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-size:14px">' +
      lignes
        .map(
          ([k, v]) =>
            `<tr><td style="border:1px solid #e6e6e6;background:#faf8f3;font-weight:bold">${esc(k)}</td>` +
            `<td style="border:1px solid #e6e6e6">${esc(v)}</td></tr>`,
        )
        .join('') +
      '</table>' +
      `<h3 style="color:#03393B;margin:22px 0 6px">Message</h3>` +
      `<p style="font-size:14px;white-space:pre-wrap">${esc(d.message)}</p>` +
      '</div>';

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Api-Token': process.env.MAILTRAP_TOKEN },
      body: JSON.stringify({
        from: { email: from, name: 'SAO BTP — Site web' },
        to: [{ email: to }],
        reply_to: { email: d.email, name: d.nom },
        subject: `Demande de devis — ${d.service || 'BTP'}${d.localisation ? ' · ' + d.localisation : ''}`,
        text,
        html,
        category: 'Demande site',
      }),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      const detail = (data.errors && [].concat(data.errors).join(', ')) || data.message || 'Erreur Mailtrap';
      return res.status(502).json({ error: detail });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
