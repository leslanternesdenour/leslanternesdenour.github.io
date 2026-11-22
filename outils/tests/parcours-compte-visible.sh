#!/usr/bin/env bash
# Parcours « compte visible » (visiteur → inscription → retour → session → déconnexion → Google → protections) sur le serveur LOCAL en simulation.
set -u; cd "$(dirname "$0")/../.."; PORT=${PORT:-8797}
node outils/construire.mjs >/dev/null
LDN_EMULATEUR=1 LDN_EMUL_MDP_CREATEUR=createur-local-123 node outils/serveur-preprod.mjs $PORT >/tmp/ldn-compte-visible.log 2>&1 & PID=$!
trap 'kill $PID 2>/dev/null' EXIT; sleep 1.5
node outils/tests/parcours-compte-visible.mjs http://localhost:$PORT
