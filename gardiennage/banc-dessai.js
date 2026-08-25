/* Banc d'essai local du formulaire SAO Securite.

   Sert gardiennage/site/ en statique, monte la VRAIE fonction api/contact.js,
   et intercepte les appels Mailtrap pour afficher l'email qui serait parti
   — sans rien envoyer. Aucun jeton reel necessaire.

     node gardiennage/banc-dessai.js               route configuree
     node gardiennage/banc-dessai.js --sans-jeton  route en 501, on voit le repli

   Puis ouvrir http://127.0.0.1:8891  ·  GET /__envois liste les emails captures.
*/
const http = require('http');
const fs = require('fs');
const path = require('path');

const RACINE = path.join(__dirname, 'site');
const SANS_JETON = process.argv.includes('--sans-jeton');

if (!SANS_JETON) {
  process.env.MAILTRAP_TOKEN = 'jeton-de-test';
  process.env.MAILTRAP_INBOX_ID = '1234567';
}

// --- Faux Mailtrap : capture ce que la fonction lui envoie -------------------
const envois = [];
const vraiFetch = global.fetch;
global.fetch = async (url, opts) => {
  if (String(url).includes('mailtrap.io')) {
    envois.push({ url: String(url), entetes: opts.headers, corps: JSON.parse(opts.body) });
    return { ok: true, status: 200, text: async () => '{"success":true}' };
  }
  return vraiFetch(url, opts);
};

const contact = require(path.join(RACINE, 'api', 'contact.js'));

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.pdf': 'application/pdf', '.json': 'application/json', '.xml': 'application/xml',
  '.txt': 'text/plain',
};

http.createServer(async (req, res) => {
  // Petite API d'inspection pour le test automatise.
  if (req.url === '/__envois') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(envois));
  }

  if (req.url.startsWith('/api/contact')) {
    let brut = '';
    for await (const c of req) brut += c;
    // Emule l'enveloppe Vercel (req.body deja parse, res.status().json()).
    req.body = brut;
    res.status = (c) => { res.statusCode = c; return res; };
    res.json = (o) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); };
    res.setHeader = res.setHeader.bind(res);
    return contact(req, res);
  }

  const rel = decodeURIComponent(req.url.split('?')[0]);
  const f = path.join(RACINE, rel === '/' ? 'index.html' : rel);
  if (!f.startsWith(RACINE) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    res.writeHead(404); return res.end('404');
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(8891, () => {
  console.log('banc d essai sur http://127.0.0.1:8891  |  jeton :', SANS_JETON ? 'ABSENT (501 attendu)' : 'present');
});
