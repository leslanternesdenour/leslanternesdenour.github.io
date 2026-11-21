#!/usr/bin/env bash
# Vérifications avec les émulateurs OFFICIELS Firebase (Firestore + Auth) : règles Firestore, base REST réelle, restauration, script du rôle Créateur.
# Prérequis : Java 21+ et Node. Les outils (firebase-tools…) s'installent HORS dépôt ($LDN_OUTILS_FIREBASE, défaut /tmp/ldn-outils-firebase). Aucun compte Firebase, aucune dépense.
set -eu; cd "$(dirname "$0")/../.."; RACINE=$(pwd); T="${LDN_OUTILS_FIREBASE:-${TMPDIR:-/tmp}/ldn-outils-firebase}"; mkdir -p "$T/proj"
[ -x "$T/node_modules/.bin/firebase" ] || (cd "$T" && npm init -y >/dev/null && npm i --no-audit --no-fund firebase-tools@15.37.0 @firebase/rules-unit-testing@6.0.0 firebase@13 >/dev/null)
P="$T/proj"; cp firestore.rules "$P/firestore.rules"
cp outils/tests/regles-firestore.test.mjs "$P/regles.test.mjs"; sed -i "s#'../../firestore.rules'#'./firestore.rules'#" "$P/regles.test.mjs"
for f in base-firestore-emulateur role-createur-emulateur; do cp "outils/tests/$f.test.mjs" "$P/$f.test.mjs"; sed -i "s#'\.\./\.\./serveur/#'$RACINE/serveur/#; s#'\.\./admin/#'$RACINE/outils/admin/#; s#'\.\./sauvegarde/#'$RACINE/outils/sauvegarde/#" "$P/$f.test.mjs"; done
echo '{"firestore":{"rules":"firestore.rules"},"emulators":{"firestore":{"port":8089},"auth":{"port":9099},"ui":{"enabled":false}}}' > "$P/firebase.json"
cd "$P" && ln -sfn ../node_modules node_modules
cat > lancer.sh <<FIN
c=0
node --test --test-concurrency=1 regles.test.mjs base-firestore-emulateur.test.mjs role-createur-emulateur.test.mjs > sortie.txt 2>&1 || c=1
(cd "$RACINE" && LDN_TEST_FIRESTORE=1 node --test --test-concurrency=1 outils/tests/api.test.mjs outils/tests/premium.test.mjs > "$P/sortie2.txt" 2>&1) || c=1
echo "── règles, base REST, restauration, rôle Créateur (émulateurs Firestore + Auth)"; grep -E "^(not ok)|^# (tests|pass|fail)" sortie.txt
echo "── API + Premium rejoués sur le VRAI Firestore (émulateur officiel)"; grep -E "^(not ok)|^# (tests|pass|fail)" "$P/sortie2.txt"
exit \$c
FIN
FIREBASE_TELEMETRY=0 ../node_modules/.bin/firebase emulators:exec --only firestore,auth --project demo-ldn 'bash lancer.sh'
