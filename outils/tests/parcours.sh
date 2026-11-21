#!/usr/bin/env bash
# Lance la préproduction locale avec l'émulateur (SIMULATION), puis les parcours complets dans Chrome.
set -u; cd "$(dirname "$0")/../.."; PORT=${PORT:-8790}
node outils/construire.mjs >/dev/null
LDN_EMULATEUR=1 LDN_EMUL_MDP_CREATEUR=createur-local-123 node outils/serveur-preprod.mjs $PORT >/tmp/ldn-emulateur.log 2>&1 & PID=$!
trap 'kill $PID 2>/dev/null' EXIT; sleep 1.5
PLAYWRIGHT=${PLAYWRIGHT:-$(node -e "try{console.log(require.resolve(\"playwright\").replace(/\\/index\\.js$/,\"\"))}catch(e){console.log(\"/opt/npm-tools/node_modules/playwright\")}")} node outils/tests/parcours.mjs http://localhost:$PORT; R1=$?
PLAYWRIGHT=${PLAYWRIGHT:-$(node -e "try{console.log(require.resolve(\"playwright\").replace(/\\/index\\.js$/,\"\"))}catch(e){console.log(\"/opt/npm-tools/node_modules/playwright\")}")} node outils/tests/parcours-google.mjs http://localhost:$PORT; R2=$?
[ $R1 -eq 0 ] && [ $R2 -eq 0 ]
