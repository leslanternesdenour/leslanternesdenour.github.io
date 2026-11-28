// Accès au jeu : toutes les pages où l'enfant joue chargent la garde d'accès (compte parent + profil enfant) ; les pages de présentation, non.
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs';

const lire = f => fs.readFileSync(new URL('../../' + f, import.meta.url), 'utf8');

test('accès : le village, le Grand Voyage, les ablutions, la prière, le calendrier et les chiffres arabes chargent la garde d\'accès ; l\'accueil et la présentation, non', () => {
  const profondeur = f => f.split('/').length - 1;
  for (const f of ['monde/index.html', 'voyage/index.html', 'ablutions/index.html', 'ablutions/jeu3d/index.html', 'priere/index.html', 'priere/jeu3d/index.html', 'calendrier/index.html', 'aventures/index.html', 'aventures/chasse-aux-mots/index.html', 'aventures/mysteres-desert/index.html', 'aventures/quiz-nour/index.html', 'aventures/oasis/index.html', 'aventures/tresor/index.html', 'aventures/cinq-prieres/index.html', 'ecole-arabe/index.html', 'ecole-arabe/lettres/index.html', 'ecole-arabe/lecture/index.html', 'ecole-arabe/chiffres/index.html']) {
    const h = lire(f), pre = '../'.repeat(profondeur(f));
    assert.ok(h.includes(`src="${pre}compte/acces-logique.js`), f + ' : logique');
    assert.ok(h.includes(`src="${pre}compte/acces.js`), f + ' : garde');
    assert.ok(h.indexOf('acces-logique.js') < h.indexOf('acces.js'), f + ' : la logique est chargée avant la garde');
  }
  for (const f of ['index.html', 'decouvrir/index.html', 'soutenir/index.html']) assert.ok(!lire(f).includes('compte/acces.js'), f + ' reste ouverte aux visiteurs');
});
