#!/usr/bin/env bash
# Bloc 3 : préproduction locale (SIMULATION) + pack Premium privé simulé (R2) + parcours dans Chrome. Le pack reste hors du dépôt.
set -u; cd "$(dirname "$0")/../.."; PORT=${PORT:-8793}
PACK=${LDN_PREMIUM_DIR:-$(cd .. && pwd)/premium-lanternes}
[ -d "$PACK/maisons/mots" ] || { echo "Pack privé introuvable ($PACK) : parcours du bloc 3 sautés"; exit 0; }
node outils/construire.mjs >/dev/null
LDN_EMULATEUR=1 LDN_EMUL_MDP_CREATEUR=createur-local-123 LDN_PREMIUM_DIR="$PACK" node outils/serveur-preprod.mjs $PORT >/tmp/ldn-emulateur-b3.log 2>&1 & PID=$!
trap 'kill $PID 2>/dev/null' EXIT; sleep 1.5
PLAYWRIGHT=${PLAYWRIGHT:-$(node -e "try{console.log(require.resolve(\"playwright\").replace(/\\/index\\.js$/,\"\"))}catch(e){console.log(\"/opt/npm-tools/node_modules/playwright\")}")} node outils/tests/parcours-bloc3.mjs http://localhost:$PORT
