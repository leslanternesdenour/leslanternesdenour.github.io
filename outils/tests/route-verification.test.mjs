// Le parcours de test (mode bac à sable seulement) : un panneau qui téléporte à chaque étape clé et coche ce qui a été fait, pour tout vérifier sur un téléphone sans marcher 5,6 km.
import test from 'node:test';
import assert from 'node:assert/strict';

test('parcours de test : une étape par fonctionnalité, une destination valide, une condition de validation qui se coche toute seule', async () => {
  const { ETAPES_VERIF, progressionVerif } = await import('../../voyage/js/route/verification-plan.js');
  const { LIEUX_ROUTE } = await import('../../voyage/js/route/donnees.js');
  assert.ok(ETAPES_VERIF.length >= 14);
  assert.equal(new Set(ETAPES_VERIF.map(e => e.id)).size, ETAPES_VERIF.length, 'identifiants uniques');
  for (const e of ETAPES_VERIF) {
    assert.ok(e.titre && e.icone && e.quoi && e.quoi.length > 20, `${e.id} : titre, icône, ce qu'il faut vérifier`);
    assert.ok(['lieu', 'porte', 'halte', 'voyageur', 'collines'].includes(e.aller.type), `${e.id} : type de destination`);
    if (e.aller.type === 'lieu') assert.ok(LIEUX_ROUTE.some(l => l.id === e.aller.id), `${e.id} : lieu connu`);
    assert.equal(typeof e.fait, 'function');
  }
  const vide = { decouvertes: [], missions: {}, recits: {}, vu: {}, objets: [], repos: [] };
  assert.equal(progressionVerif(vide).faites, 0, 'rien de coché au départ');
  const plein = { decouvertes: ['oasis', 'cite-porte', 'atelier:tour', 'interieur:0:0'], missions: Object.fromEntries(['campement', 'portes', 'interieurs', 'troc', 'montees', 'nature', 'cite'].map(k => [k, { etat: 'finie' }])), recits: { 'hajar-ismail-zamzam': { carnet: true } }, vu: { metier_potier: true, sujetsRecompense: true, travRecompense: true }, objets: [], repos: [] };
  const p = progressionVerif(plein); assert.ok(p.faites >= 12 && p.total === ETAPES_VERIF.length && p.faites <= p.total, `coché quand c'est fait (${p.faites}/${p.total})`);
});

test('parcours de test : le panneau n\'existe que dans le bac à sable, il est tactile, se coche tout seul, et ne touche pas aux vrais profils', async () => {
  const fs = await import('node:fs');
  const j = fs.readFileSync(new URL('../../voyage/js/route/jeu-route.js', import.meta.url), 'utf8');
  const u = fs.readFileSync(new URL('../../voyage/js/route/verification-ui.js', import.meta.url), 'utf8');
  assert.match(j, /sandboxActif\(location\.hostname, location\.search\)/); assert.match(j, /creerVerificationUI\(/);
  assert.match(j, /if \(sandboxActif\(location\.hostname, location\.search\)\) creerVerificationUI/, 'créé seulement en mode test isolé');
  assert.match(u, /export function creerVerificationUI/); assert.match(u, /ETAPES_VERIF/); assert.match(u, /progressionVerif\(/);
  assert.match(u, /min-height:4[48]px/, 'cibles tactiles d\'au moins 44 px'); assert.match(u, /setInterval/, 'se met à jour tout seul');
  assert.ok(!/(fetch|XMLHttpRequest|localStorage)/.test(u), 'aucun réseau, aucun stockage');
});

test('parcours de test : « Ouvrir la Route » ouvre vraiment la région tout de suite (contrôle immédiat), le panneau du village ne dit plus « fermée »', async () => {
  const fs = await import('node:fs');
  const j = fs.readFileSync(new URL('../../voyage/js/route/jeu-route.js', import.meta.url), 'utf8');
  const i = j.indexOf('ouvrirRoute: () =>'); assert.ok(i > 0);
  const f = j.slice(i, i + 700);
  assert.match(f, /ctx\.regions\.verifier\(\)/, 'contrôle immédiat après avoir rempli les conditions');
  assert.ok(f.indexOf('ctx.regions.verifier()') < f.indexOf('J.x = 326'), 'avant de déplacer l\'enfant');
});
