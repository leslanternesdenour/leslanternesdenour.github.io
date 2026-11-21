#!/usr/bin/env bash
# Service worker du calendrier (cache hors-ligne, purge, aucune donnée /api/ en cache) contre le serveur local.
set -u; cd "$(dirname "$0")/../.."; PORT=${PORT:-8793}
node outils/construire.mjs >/dev/null
LDN_TEST=1 LDN_EMULATEUR=1 node outils/serveur-preprod.mjs $PORT >/tmp/ldn-pwa.log 2>&1 & PID=$!
trap 'kill $PID 2>/dev/null' EXIT; sleep 1.5
PLAYWRIGHT=${PLAYWRIGHT:-$(node -e "try{console.log(require.resolve(\"playwright\").replace(/\\/index\\.js$/,\"\"))}catch(e){console.log(\"/opt/npm-tools/node_modules/playwright\")}")} node outils/tests/pwa.mjs http://localhost:$PORT
