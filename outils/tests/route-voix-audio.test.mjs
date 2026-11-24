// Chaque phrase prononcée dans la Route a son fichier audio Nour et sa durée dans la table.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { inventaire } from '../voix/route/inventaire-route.mjs';

const table = JSON.parse(fs.readFileSync(new URL('../../audio/route-voix.json', import.meta.url), 'utf8'));

test('voix de la Route : chaque texte du jeu a son fichier mp3 et une durée plausible', async () => {
  const inv = await inventaire();
  assert.ok(inv.length > 100);
  for (const p of inv) {
    assert.ok(fs.existsSync(new URL(`../../audio/fr/route/${p.id}.mp3`, import.meta.url)), 'mp3 manquant : ' + p.texte);
    const e = table[p.id]; assert.ok(Array.isArray(e), 'absent de la table : ' + p.id);
    assert.ok(e[2] > 0.5 && e[2] < 60, 'durée improbable : ' + p.id + ' ' + e[2]);
  }
});

test('voix de la Route : le texte enregistré est exactement le texte affiché, aucune phrase orpheline', async () => {
  const { PHRASES_ROUTE } = await import('../../voyage/js/route/voix-route.js');
  const inv = await inventaire(), parId = new Map(inv.map(p => [p.id, p.texte]));
  assert.equal(PHRASES_ROUTE.length, inv.length);
  for (const [id, texte] of PHRASES_ROUTE) assert.equal(texte, parId.get(id), 'texte différent pour ' + id);
});

test('voix de la Route : un message-indice n\'interrompt jamais une voix en cours, il attend sa fin', () => {
  const voix = fs.readFileSync(new URL('../../voyage/js/voix.js', import.meta.url), 'utf8'), main = fs.readFileSync(new URL('../../voyage/js/main.js', import.meta.url), 'utf8');
  assert.match(voix, /export function direApres\(/);
  assert.match(main, /direApres\(\[\{ t: html \}\]\)/, 'montrerIndice parle après la voix en cours');
});
