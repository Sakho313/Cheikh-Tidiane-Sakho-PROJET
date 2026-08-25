#!/usr/bin/env python3
"""Checklist §9 du CLAUDE.md — non-régression des images.

À lancer après CHAQUE modification de site/index.html :

    python3 gardiennage/verifier-images.py

Contrôle, dans l'ordre des règles du §0 :
  1. le dossier assets/ existe ;
  2. chaque `./assets/...` du HTML pointe vers un fichier réel (aucun 404) ;
  3. aucun chemin absolu (C:\\..., file://, http://localhost) ne s'est glissé dans le HTML ;
  4. l'inventaire du §8 est complet ;
  5. les fichiers présents mais jamais référencés sont signalés (info, pas une erreur).

Sortie : code 0 si tout est bon, 1 sinon — utilisable en CI.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent
SITE = RACINE / "site"
HTML = SITE / "index.html"
ASSETS = SITE / "assets"

# §8 du CLAUDE.md — doit toujours être livré, même si le HTML n'y fait pas appel.
INVENTAIRE_MINIMAL = {
    "logo.png",
    "favicon.png",
    "saoty2.png",
    "guard-hero.jpg",
    "control-room.jpg",
    "cctv-wall.jpg",
    "cam-residence.jpg",
    "agent.jpg",
    "walkie.jpg",
    "agrement.pdf",
}

# Réserve documentée au §8 : présente exprès, non référencée.
TOLERES_NON_REFERENCES = {"saoty.png"}

CHEMINS_INTERDITS = (
    (r"[A-Za-z]:\\", "chemin Windows absolu (C:\\...)"),
    (r"file://", "URL file://"),
    (r"https?://localhost", "URL localhost"),
    (r"https?://127\.0\.0\.1", "URL 127.0.0.1"),
)


def main() -> int:
    erreurs: list[str] = []
    infos: list[str] = []

    if not HTML.exists():
        print(f"ÉCHEC — {HTML} est introuvable.")
        return 1
    if not ASSETS.is_dir():
        print(f"ÉCHEC — le dossier {ASSETS} est absent : toutes les images casseront.")
        return 1

    html = HTML.read_text(encoding="utf-8")
    presents = {p.name for p in ASSETS.iterdir() if p.is_file()}
    references = set(re.findall(r'(?:\./|/)assets/([^"\'\)\s>]+)', html))

    # 2. références cassées
    for manquant in sorted(references - presents):
        erreurs.append(f"référencé dans index.html mais absent de assets/ : {manquant}")

    # 3. chemins non déployables
    for motif, libelle in CHEMINS_INTERDITS:
        for trouve in sorted(set(re.findall(motif + r"[^\"'\s>]*", html)))[:5]:
            erreurs.append(f"{libelle} dans le HTML : {trouve}")

    # 4. inventaire minimal
    for attendu in sorted(INVENTAIRE_MINIMAL - presents):
        erreurs.append(f"inventaire §8 incomplet, il manque assets/{attendu}")

    # 5. fichiers orphelins (information)
    for inutilise in sorted(presents - references - TOLERES_NON_REFERENCES):
        infos.append(f"présent dans assets/ mais jamais référencé : {inutilise}")

    print(f"index.html      : {HTML.relative_to(RACINE)}")
    print(f"références      : {len(references)}")
    print(f"fichiers assets : {len(presents)}")
    print()

    for info in infos:
        print(f"  · {info}")
    if infos:
        print()

    if erreurs:
        print(f"ÉCHEC — {len(erreurs)} problème(s) :")
        for e in erreurs:
            print(f"  ✗ {e}")
        print()
        print("Rappel §0 : index.html et assets/ voyagent TOUJOURS ensemble.")
        return 1

    print("OK — aucune image cassée. Le dossier site/ est déployable tel quel.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
