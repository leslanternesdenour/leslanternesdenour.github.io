import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { champsEnAttente, renseigner, CHAMPS } from '../legal/renseigner.mjs';

const page = readFileSync(new URL('../../conditions/index.html', import.meta.url), 'utf8');

test('mentions legales : tous les emplacements prevus existent, aucun n\'est invente', () => {
  const presents = new Set(champsEnAttente(page));
  for (const c of CHAMPS) assert.ok(presents.has(c), 'emplacement manquant : ' + c);
  for (const c of ['siren', 'adresse', 'statut', 'tva', 'nom', 'contact', 'directeur']) assert.ok(presents.has(c), c);
  assert.ok(!/\b\d{9}\b|\b\d{14}\b/.test(page.replace(/<[^>]+>/g, ' ')), 'un SIREN/SIRET semble ecrit en dur');
});

test('mentions legales : renseigner remplit seulement les champs fournis et echappe le HTML', () => {
  const r = renseigner(page, { siren: '<b>123 456 789</b>', nom: '  ' });
  assert.deepEqual(r.remplis, ['siren']);
  assert.ok(r.html.includes('&lt;b&gt;123 456 789&lt;/b&gt;'));
  assert.ok(r.restants.includes('nom') && !r.restants.includes('siren'));
});

test('mentions legales : tant qu\'un champ est en attente, la promotion en production est bloquee', () => {
  const garde = readFileSync(new URL('../migration/promouvoir.sh', import.meta.url), 'utf8');
  assert.ok(garde.includes('\\[EN ATTENTE'));
  assert.ok(/\[EN ATTENTE/.test(page));
});