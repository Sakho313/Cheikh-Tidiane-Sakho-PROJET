#!/usr/bin/env python3
"""Génère la version « un seul fichier » d'un site statique du groupe SAO.

    python3 outils/construire-autonome.py gardiennage/site
    python3 outils/construire-autonome.py btp/site

Toutes les images de `<site>/assets/` sont encodées en base64 directement dans
le HTML. Le fichier produit n'a plus AUCUNE dépendance externe (hors polices
Google) : il ne peut donc plus souffrir du problème récurrent décrit au §0 du
CLAUDE.md de SAO Sécurité — « index.html déployé sans son dossier assets/ ».

Résultat écrit dans `<site>/../index-autonome.html`.

Trois points méritent une attention particulière :

* Quand un `<picture>` propose une source WebP, on ne garde qu'elle et on
  supprime le repli PNG : embarquer les deux doublerait le poids pour rien.
* Un PDF ne peut pas être un simple lien `data:` — Chrome et Firefox bloquent
  la navigation de premier niveau vers une URL `data:`. Il est donc embarqué
  puis rouvert via un Blob au clic.
* Les métadonnées Open Graph doivent rester des URL absolues : une image en
  base64 est inexploitable par les réseaux sociaux.
"""

from __future__ import annotations

import base64
import re
import sys
from pathlib import Path

TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".pdf": "application/pdf",
}

SCRIPT_PDF = """
<script>
/* Les PDF sont embarques : on les rouvre via un Blob, les navigateurs bloquant
   la navigation de premier niveau vers une URL data:. */
document.querySelectorAll('a[data-pdf]').forEach(function(lien){
  lien.addEventListener('click',function(e){
    e.preventDefault();
    try{
      var bin=atob(lien.getAttribute('data-pdf').split(',')[1]);
      var n=bin.length,arr=new Uint8Array(n);
      while(n--)arr[n]=bin.charCodeAt(n);
      var url=URL.createObjectURL(new Blob([arr],{type:'application/pdf'}));
      window.open(url,'_blank','noopener');
      setTimeout(function(){URL.revokeObjectURL(url)},60000);
    }catch(err){
      alert("Le document n'a pas pu être ouvert. Contactez-nous à contact@saoconsultingroup.com.");
    }
  });
});
</script>
"""


def data_uri(assets: Path, nom: str) -> str | None:
    chemin = assets / nom
    if not chemin.is_file():
        return None
    mime = TYPES.get(chemin.suffix.lower())
    if mime is None:
        return None
    return f"data:{mime};base64,{base64.b64encode(chemin.read_bytes()).decode()}"


def construire(site: Path) -> int:
    source = site / "index.html"
    assets = site / "assets"
    sortie = site.parent / "index-autonome.html"

    if not source.is_file():
        print(f"ÉCHEC — {source} introuvable.")
        return 1
    if not assets.is_dir():
        print(f"ÉCHEC — {assets} introuvable.")
        return 1

    html = source.read_text(encoding="utf-8")

    # 1. Ne conserver que la source WebP des <picture>, le repli PNG ferait doublon.
    def alleger_picture(m: re.Match[str]) -> str:
        bloc = m.group(0)
        webp = re.search(r'srcset="\./assets/([^"]+)\.webp"', bloc)
        if not webp:
            return bloc
        bloc = re.sub(r"<source[^>]*>", "", bloc)
        return bloc.replace(f"{webp.group(1)}.png", f"{webp.group(1)}.webp")

    html = re.sub(r"<picture[^>]*>.*?</picture>", alleger_picture, html, flags=re.S)

    # 2. Les PDF passent par un attribut de données, exploité par SCRIPT_PDF.
    pdfs = 0
    for nom in sorted({m for m in re.findall(r'\./assets/([^"\'\)\s>]+\.pdf)', html)}):
        uri = data_uri(assets, nom)
        if uri is None:
            continue
        html = re.sub(
            r'href="\./assets/' + re.escape(nom) + r'"(\s+target="_blank")?(\s+rel="noopener")?',
            f'href="#" data-pdf="{uri}"',
            html,
        )
        pdfs += 1

    # 3. Toutes les autres références deviennent des data: URI.
    manquants: list[str] = []
    embarques: set[str] = set()

    def remplacer(m: re.Match[str]) -> str:
        nom = m.group(1)
        uri = data_uri(assets, nom)
        if uri is None:
            manquants.append(nom)
            return m.group(0)
        embarques.add(nom)
        return uri

    html = re.sub(r'\./assets/([^"\'\)\s>]+)', remplacer, html)

    # 4. Open Graph et Twitter doivent garder des URL absolues.
    canonical = re.search(r'<link rel="canonical" href="([^"]+)"', html)
    if canonical:
        base = canonical.group(1).rstrip("/")
        html = re.sub(
            r'(<meta (?:property="og:image"|name="twitter:image") content=")data:[^"]+(")',
            rf"\1{base}/assets/logo.png\2",
            html,
        )

    if manquants:
        print("ÉCHEC — fichiers introuvables dans assets/ :")
        for f in sorted(set(manquants)):
            print(f"  ✗ {f}")
        return 1

    if pdfs:
        html = html.replace("</body>", SCRIPT_PDF + "</body>")

    reste = sorted(set(re.findall(r"\./assets/[^\"'\)\s>]+", html)))
    if reste:
        print("ÉCHEC — des chemins relatifs subsistent :", reste[:5])
        return 1

    sortie.write_text(html, encoding="utf-8")
    print(f"{sortie} — {sortie.stat().st_size / 1024 / 1024:.2f} Mo")
    print(f"{len(embarques)} fichiers embarqués ({pdfs} PDF), 0 dépendance externe.")
    print("À déployer seul : renommer en index.html, aucun dossier assets/ requis.")
    return 0


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    return construire(Path(sys.argv[1]).resolve())


if __name__ == "__main__":
    sys.exit(main())
