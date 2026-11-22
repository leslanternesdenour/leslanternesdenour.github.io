#!/usr/bin/env bash
# Mode sans visage : vérification complète dans un vrai navigateur (ordinateur et téléphone), avec compte famille (émulateur). bash outils/tests/sans-visage.sh
set -u; cd "$(dirname "$0")/../.."; PORT=${PORT:-8796}
LDN_PREPROD=1 node outils/construire.mjs >/dev/null
LDN_EMULATEUR=1 LDN_EMUL_MDP_CREATEUR=createur-local-123 node outils/serveur-preprod.mjs $PORT >/tmp/ldn-sv.log 2>&1 & PID=$!
trap 'kill $PID 2>/dev/null' EXIT; sleep 1.5
node outils/tests/sans-visage.mjs http://localhost:$PORT
