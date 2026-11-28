#!/usr/bin/env bash
# Prépare (ou met à jour) la branche « production » = « preproduction » + wrangler.toml de production. Ne touche JAMAIS à « main ».
# Utilisation : bash outils/migration/promouvoir.sh [--pousser]
# À relancer pour chaque nouvelle version à publier : « production » reprend « preproduction » et garde sa configuration de production.
set -eu; cd "$(dirname "$0")/../.."
[ "$(git rev-parse --abbrev-ref HEAD)" = "preproduction" ] || { echo "Se placer sur la branche preproduction (à jour) d'abord."; exit 1; }
git diff --quiet && git diff --cached --quiet || { echo "Des modifications non enregistrées : les valider d'abord."; exit 1; }
# Aucune information provisoire publiée comme définitive : les pages légales et tarifaires doivent être complétées et relues AVANT toute promotion.
if grep -nE '\[À (COMPLÉTER|FAIRE RELIRE|VÉRIFIER)|\[EN ATTENTE|BROUILLON EN PRÉPRODUCTION' conditions/index.html tarifs/index.html; then
  echo "ARRÊT : ces pages contiennent encore des champs « [EN ATTENTE…] » ou « [À COMPLÉTER…] » ou un bandeau « brouillon » (lignes ci-dessus). Renseignez les informations légales réelles, faites relire, puis relancez."; exit 1
fi
if git show-ref --verify --quiet refs/heads/production; then git checkout -q production; git merge -q --no-edit -X theirs preproduction; else git checkout -q -b production; fi
cp docs/migration/wrangler.production.toml wrangler.toml
git add wrangler.toml; git diff --cached --quiet || git commit -q -m "Production : wrangler.toml de production (ENVIRONNEMENT = \"production\")"
grep -q 'ENVIRONNEMENT = "production"' wrangler.toml || { echo "wrangler.toml de production absent"; exit 1; }
node --test outils/tests/garde-branche.test.mjs >/dev/null 2>&1 || { echo "Le garde-fou de build échoue : production NON publiable."; exit 1; }
echo "Branche production prête : $(git rev-parse --short HEAD)"
[ "${1:-}" = "--pousser" ] && git push -u origin production
git checkout -q preproduction
