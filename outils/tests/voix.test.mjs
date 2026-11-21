// Voix des jeux Ablutions et Prière : uniquement les voix ElevenLabs (un fichier par phrase, audio/fr/…) + 6 petits clips spéciaux « j3 » conservés ; plus aucun ancien long fichier.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs'; import path from 'node:path';
const J3 = { ablutions: ['j3_fin0', 'j3_fin'], priere: ['j3_h7', 'j3_h13', 'j3_h14', 'j3_fin'] };
for (const m of ['ablutions', 'priere']) test(`${m} : toutes les phrases utilisent les nouvelles voix, chaque fichier existe, aucun ancien fichier`, () => {
  const dossier = `${m}/voix`, v = JSON.parse(fs.readFileSync(`${dossier}/voix.json`, 'utf8'));
  assert.ok(Object.keys(v).length >= 60, 'catalogue complet');
  for (const [k, x] of Object.entries(v)) {
    assert.ok(fs.existsSync(path.resolve(dossier, x[0])), `${k} : fichier absent ${x[0]}`); assert.ok(x[2] > x[1], k);
    if (J3[m].includes(k)) assert.match(x[0], /^j3-[a-z0-9]+\.mp3$/, k + ' : clip spécial conservé'); else assert.match(x[0], /^\.\.\/\.\.\/audio\/fr\/(ablutions|priere)\/nour-voix-(abl|pri)-\d+\.mp3$/, k + ' : nouvelle voix');
  }
  const restes = fs.readdirSync(dossier).filter(f => /\.(mp3|zip)$/.test(f) && !/^j3-/.test(f)); assert.deepEqual(restes, [], 'aucun ancien enregistrement');
  assert.ok(!fs.existsSync(`${dossier}/voix-ancienne.json`) && !fs.existsSync(`${dossier}/voix-catalogue.json`));
});
test('les anciens fichiers supprimés ne sont plus référencés nulle part dans le code', () => {
  const trouves = []; (function parcourir(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (['.git', 'dist', 'node_modules', '_documentation'].includes(e.name)) continue; const p = path.join(d, e.name);
    if (e.isDirectory()) parcourir(p); else if (/\.(html|js|mjs|json|sh)$/.test(e.name) && !p.endsWith('voix.test.mjs') && /(1-etapes|2-astuces|3-messages|[4-7]-jeu\d?|P1-etapes|P2-paroles|P3-jeux|voix-priere-final|voix-ancienne)/.test(fs.readFileSync(p, 'utf8'))) trouves.push(p); } })('.');
  assert.deepEqual(trouves, []);
});
