#!/usr/bin/env bash
# Lance toutes les vérifications hors ligne (aucun réseau, aucun compte nécessaire) : bash outils/tests/tout.sh
set -u; cd "$(dirname "$0")/../.."; echec=0
etape() { echo "── $1"; shift; if "$@"; then :; else echec=1; fi; }
etape "Fichiers, liens, voix, règles de synthèse vocale" bash -c 'node outils/tests/verifier.mjs | tail -1'
etape "Droits (Créateur, invités, abonnés, gratuit)" bash -c 'node --test outils/tests/droits.test.mjs 2>&1 | grep -E "^# (pass|fail)" | tr "\n" " "; echo; node --test outils/tests/droits.test.mjs >/dev/null 2>&1'
etape "Jetons Firebase (vérification serveur)" bash -c 'node --test outils/tests/jeton.test.mjs 2>&1 | grep -E "^# (pass|fail)" | tr "\n" " "; echo; node --test outils/tests/jeton.test.mjs >/dev/null 2>&1'
etape "API (comptes, droits, invitations, admin, Stripe test, Premium, RGPD)" bash -c 'node --test --test-concurrency=1 outils/tests/api.test.mjs 2>&1 | grep -E "^# (pass|fail)" | tr "\n" " "; echo; node --test --test-concurrency=1 outils/tests/api.test.mjs >/dev/null 2>&1'
etape "Firestore REST (requêtes, conversions, compte de service)" bash -c 'node --test outils/tests/firestore.test.mjs 2>&1 | grep -E "^# (pass|fail)" | tr "\n" " "; echo; node --test outils/tests/firestore.test.mjs >/dev/null 2>&1'
etape "Dossier publié (aucune fuite)" bash -c 'node outils/construire.mjs >/dev/null && node outils/tests/verifier-dist.mjs | tail -1'
etape "Exercice de restauration chiffrée" bash -c 'bash outils/sauvegarde/exercice-restauration.sh | tail -1'
[ $echec -eq 0 ] && echo "TOUT EST VERT" || echo "AU MOINS UNE VÉRIFICATION A ÉCHOUÉ"; exit $echec
