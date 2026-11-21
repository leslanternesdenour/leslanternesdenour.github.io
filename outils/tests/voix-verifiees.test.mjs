// Les jeux Ablutions et Prière utilisent les voix VÉRIFIÉES (longs enregistrements découpés par plages).
// Les clips ElevenLabs audio/fr/ablutions et audio/fr/priere ont été trouvés « décalés » (#11) puis « mélangés » (#20 annulé par #21) :
// ils ne doivent PAS être rebranchés tant qu'une personne ne les a pas écoutés un par un.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs'; import path from 'node:path';
for (const m of ['ablutions', 'priere']) test(`${m} : voix.json n'utilise aucun clip audio/fr (non vérifié) ; tous les fichiers existent`, () => {
  const dossier = `${m}/voix`, v = JSON.parse(fs.readFileSync(`${dossier}/voix.json`, 'utf8'));
  for (const [k, x] of Object.entries(v)) { assert.ok(!/audio\/fr\//.test(x[0]), `${k} : clip ElevenLabs non vérifié (${x[0]})`); assert.ok(fs.existsSync(path.resolve(dossier, x[0])), `${k} : fichier absent ${x[0]}`); assert.ok(x[2] > x[1], k); }
});
