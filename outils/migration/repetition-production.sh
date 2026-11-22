#!/usr/bin/env bash
# RÉPÉTITION GÉNÉRALE de la production, sans rien publier : construit le dossier de PRODUCTION (branche « main » simulée, wrangler.toml de production),
# le sert en local avec l'émulateur des comptes, puis rejoue les parcours complets (portail, comptes familiaux, profils enfants, progression).
set -u; cd "$(dirname "$0")/../.."; PORT=${PORT:-8805}
CF_PAGES_BRANCH=main LDN_WRANGLER=docs/migration/wrangler.production.toml node outils/construire.mjs | tail -1
grep -q '"branche":"main"' dist/version.json || { echo "dossier de production non construit"; exit 1; }
LDN_EMULATEUR=1 LDN_EMUL_MDP_CREATEUR=createur-local-123 node outils/serveur-preprod.mjs $PORT >/tmp/ldn-prod-rep.log 2>&1 & PID=$!
trap 'kill $PID 2>/dev/null' EXIT; sleep 1.5
node outils/tests/portail.mjs http://localhost:$PORT | tail -1; R1=${PIPESTATUS[0]}
PLAYWRIGHT=${PLAYWRIGHT:-$(node -e "try{console.log(require.resolve(\"playwright\").replace(/\\/index\\.js$/,\"\"))}catch(e){console.log(\"/opt/node-tools/node_modules/playwright\")}")} node outils/tests/parcours.mjs http://localhost:$PORT | tail -1; R2=${PIPESTATUS[0]}
echo "portail=$R1 parcours=$R2"; [ $R1 -eq 0 ] && [ $R2 -eq 0 ]
