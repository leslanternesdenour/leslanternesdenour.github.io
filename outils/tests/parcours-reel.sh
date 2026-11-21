#!/usr/bin/env bash
# Valide le parcours de compte contre le serveur LOCAL en simulation (même code que le parcours réel). Réel : node outils/tests/parcours-reel.mjs https://….pages.dev
set -u; cd "$(dirname "$0")/../.."; PORT=${PORT:-8792}
node outils/construire.mjs >/dev/null
LDN_EMULATEUR=1 LDN_EMUL_MDP_CREATEUR=createur-local-123 node outils/serveur-preprod.mjs $PORT >/tmp/ldn-emulateur-reel.log 2>&1 & PID=$!
trap 'kill $PID 2>/dev/null' EXIT; sleep 1.5
node outils/tests/parcours-reel.mjs http://localhost:$PORT --emulateur
