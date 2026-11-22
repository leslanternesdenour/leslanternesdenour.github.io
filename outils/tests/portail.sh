#!/usr/bin/env bash
# Parcours complet du portail du Monde de Nour (parent → enfant → portail → monde → progression) sur le serveur LOCAL en simulation.
# Réel (site de préproduction) : les comptes réels ne sont pas créés par ce test ; il tourne avec l'émulateur. bash outils/tests/portail.sh
set -u; cd "$(dirname "$0")/../.."; PORT=${PORT:-8795}
node outils/construire.mjs >/dev/null
LDN_EMULATEUR=1 LDN_EMUL_MDP_CREATEUR=createur-local-123 node outils/serveur-preprod.mjs $PORT >/tmp/ldn-portail.log 2>&1 & PID=$!
trap 'kill $PID 2>/dev/null' EXIT; sleep 1.5
node outils/tests/portail.mjs http://localhost:$PORT
