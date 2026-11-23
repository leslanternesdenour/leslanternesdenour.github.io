// Grand Voyage : chaque mot arabe découvert (le puits, le chameau…) et chaque parole de Loumi a sa voix enregistrée. node --test outils/tests/voyage-voix.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { idsPour } from '../../voyage/js/voix.js';

const lire = chemin => fs.readFileSync(new URL('../../' + chemin, import.meta.url), 'utf8');
const registre = JSON.parse(lire('audio/voix.json'));
const clipPresent = id => Boolean(registre[id]) && fs.existsSync(new URL('../../audio/' + registre[id][0], import.meta.url));

test('chacun des 8 mots arabes de la découverte a sa voix enregistrée (le mot lui-même, pas seulement son explication)', () => {
  const mots = [...lire('voyage/js/quetes.js').matchAll(/^\s*\{ id: '[a-z]+', ar: '([^']+)'/gm)].map(m => m[1]);
  assert.equal(mots.length, 8);
  for (const mot of mots) {
    const ids = idsPour(mot);
    assert.ok(ids.length > 0 && ids.every(clipPresent), `pas de voix enregistrée pour ${mot}`);
  }
});

test('chaque parole de Loumi (au toucher comme au clavier) a sa voix enregistrée', async () => {
  const { NOEUDS, noeud } = await import('../../voyage/js/loumi-dialogues.js');
  const paroles = Object.keys(NOEUDS).flatMap(id => [true, false].map(tactile => noeud(id, { tactile }).texte));
  assert.ok(paroles.length >= 12);
  for (const texte of new Set(paroles)) assert.ok(idsPour(texte).length > 0 && idsPour(texte).every(clipPresent), `pas de voix pour : ${texte.slice(0, 50)}`);
});
