#!/usr/bin/env bash
# Amélioration des personnages (version de test) : expressions, animations, compatibilité mode sans visage. bash outils/tests/amelioration-personnages.sh
set -u; cd "$(dirname "$0")/../.."; PORT=${PORT:-8799}
LDN_PREPROD=1 node outils/construire.mjs >/dev/null
(cd dist && python3 -m http.server $PORT >/dev/null 2>&1 & echo $! > /tmp/ldn-am.pid); sleep 1
trap 'kill $(cat /tmp/ldn-am.pid) 2>/dev/null' EXIT
node outils/tests/amelioration-personnages.mjs http://localhost:$PORT
