#!/usr/bin/env bash
# Exercice de restauration chiffrée (données FICTIVES, aucun compte réel) :
# export → chiffrement age (clé publique) → « stockage » → déchiffrement (clé privée) → vérification à l'identique.
# Vérifie aussi qu'une mauvaise clé et un fichier altéré sont refusés.   Utilisation : bash outils/sauvegarde/exercice-restauration.sh
set -euo pipefail
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT; ok=0; ko=0
v() { if eval "$2"; then echo "✓ $1"; ok=$((ok+1)); else echo "✗ $1"; ko=$((ko+1)); fi; }
# 1. clé de TEST (en vrai : créée par le propriétaire sur son ordinateur, jamais par Claude ni sur un serveur)
age-keygen -o "$T/cle-privee-test.txt" 2>/dev/null; PUB=$(age-keygen -y "$T/cle-privee-test.txt")
age-keygen -o "$T/autre-cle.txt" 2>/dev/null
# 2. export fictif au format prévu (1 000 familles, enfants en sous-collection, droits, invitations, journal)
node -e '
const f={familles:{},enfants:{},droits:{},invitations:{},admin_logs:{}};
for(let i=0;i<1000;i++){const u="uid"+i;f.familles[u]={creeLe:1763550000000+i,consentements:{cgu:"2026-11-19",confidentialite:"2026-11-19",parent:true}};
 for(let k=0;k<(i%5)+1;k++)f.enfants[u+"/e"+k]={surnom:"Enfant"+k,tranche:k%2?"6-10":"3-5",avatar:k%2?"fille":"garcon",progression:{ablutions:{g1:3},priere:{learn:1}}};
 f.droits[u]={statut:["gratuit","abonne","invite"][i%3],niveau:["gratuit","premium","famille"][i%3]};}
f.droits["uidCreateur"]={statut:"creator",niveau:"createur"};
for(let i=0;i<20;i++)f.invitations["inv"+i]={email:"proche"+i+"@exemple.fr",niveau:"famille",expire:1764759600000,utilise:false};
process.stdout.write(JSON.stringify(f));' > "$T/export.json"
SHA=$(sha256sum "$T/export.json" | cut -d' ' -f1); TAILLE=$(stat -c%s "$T/export.json")
# 3. chiffrement avec la clé PUBLIQUE seulement (ce que fera la sauvegarde automatique)
gzip -9c "$T/export.json" | age -r "$PUB" -o "$T/firestore-2026-11-19.json.gz.age"
v "le fichier sauvegardé est chiffré (illisible sans la clé)" "! zcat -f '$T/firestore-2026-11-19.json.gz.age' 2>/dev/null | grep -q uidCreateur"
# 4. restauration avec la clé PRIVÉE
age -d -i "$T/cle-privee-test.txt" "$T/firestore-2026-11-19.json.gz.age" | gunzip > "$T/restaure.json"
v "restauration identique à l'octet près (empreinte SHA-256)" "[ \"\$(sha256sum '$T/restaure.json' | cut -d' ' -f1)\" = '$SHA' ]"
v "contenu restauré complet : 1 000 familles, 3 000 enfants, Créateur présent" "node -e 'const f=require(\"$T/restaure.json\");process.exit(Object.keys(f.familles).length===1000&&Object.keys(f.enfants).length===3000&&f.droits.uidCreateur.statut===\"creator\"?0:1)'"
# 5. sécurité
v "une mauvaise clé est refusée" "! age -d -i '$T/autre-cle.txt' '$T/firestore-2026-11-19.json.gz.age' >/dev/null 2>&1"
cp "$T/firestore-2026-11-19.json.gz.age" "$T/altere.age"; printf '\x00' | dd of="$T/altere.age" bs=1 seek=300 conv=notrunc status=none
v "un fichier altéré est détecté et refusé" "! age -d -i '$T/cle-privee-test.txt' '$T/altere.age' >/dev/null 2>&1"
echo "taille : export $((TAILLE/1024)) Ko → sauvegarde chiffrée $(( $(stat -c%s "$T/firestore-2026-11-19.json.gz.age")/1024 )) Ko"
echo "$ok vérifications réussies, $ko en échec."; [ "$ko" -eq 0 ]
