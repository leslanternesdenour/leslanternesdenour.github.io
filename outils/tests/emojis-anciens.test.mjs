// Les emojis du Grand Voyage doivent exister sur les anciens téléphones et sous Windows 10 : aucun emoji d'Unicode 12 et après (ils s'afficheraient en rectangle vide).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const RECENTS = /[\u{1FA70}-\u{1FAFF}\u{1F7E0}-\u{1F7EB}\u{1F6D5}\u{1F6FA}\u{1F94D}-\u{1F94F}\u{1F9A5}-\u{1F9AA}\u{1F9AE}\u{1F9AF}\u{1F9BA}-\u{1F9BF}\u{1F9C3}-\u{1F9CA}\u{1F9CD}-\u{1F9CF}\u{1F971}\u{1F972}\u{1F9A9}]/gu;

test('emojis : aucun emoji récent (Unicode 12 et après) dans le jeu du Grand Voyage', () => {
  const trouves = [];
  const racine = new URL('../../voyage/', import.meta.url);
  const marche = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) marche(p); else if (/\.(js|html|css)$/.test(e.name) && !/voix-route/.test(e.name)) { const m = fs.readFileSync(p, 'utf8').match(RECENTS); if (m) trouves.push(`${path.relative(racine.pathname.slice(1), p)} : ${[...new Set(m)].join(' ')}`); } } };
  marche(racine.pathname.replace(/^\/([A-Za-z]:)/, '$1'));
  assert.deepEqual(trouves, [], 'emojis récents à remplacer');
});
