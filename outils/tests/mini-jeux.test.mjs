import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PAGES_PROTEGEES } from '../../serveur/garde-pages.js';
import { melanger, etoilesPour, construireQuestions, avecLeurres, lireEtoiles, listeDeTextes } from '../../aventures/commun/mini-logique.js';
import * as C5 from '../../aventures/cinq-prieres/contenu.js';
import * as TR from '../../aventures/tresor/contenu.js';
import * as O from '../../aventures/oasis/logique.js';

const lire = f => fs.readFileSync(new URL('../../' + f, import.meta.url), 'utf8');
const rngFixe = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; });
const JEUX = ['oasis', 'tresor', 'cinq-prieres'];

test('mini-jeux : étoiles (jamais zéro), mélange complet, leurres distincts de la bonne réponse', () => {
  assert.equal(etoilesPour(5, 5), 3); assert.equal(etoilesPour(3, 5), 2); assert.equal(etoilesPour(0, 5), 1);
  assert.deepEqual([...melanger([1, 2, 3, 4, 5], rngFixe())].sort(), [1, 2, 3, 4, 5]);
  for (let i = 0; i < 50; i++) { const c = avecLeurres('b', ['a', 'b', 'c', 'd'], 2); assert.equal(c[0], 'b'); assert.equal(new Set(c).size, c.length); }
  assert.deepEqual(lireEtoiles({ etoiles: { a: 9, b: -2, c: 'x' } }, ['a', 'b', 'c', 'd']), { a: 3, b: 0, c: 0, d: 0 });
  assert.deepEqual(listeDeTextes(['x', 1, 'x', 'y'], ['x']), ['x']);
});

test('mini-jeux : chaque question n\'a qu\'une seule bonne réponse, sans doublon de choix', () => {
  const jeux = [C5.questionsMoment(), C5.questionsRakat(), TR.questionsLettres(), TR.questionsMots(), TR.questionsSourates()];
  for (const qs of jeux) for (const q of construireQuestions(qs)) {
    assert.equal(q.choix.filter(c => c.bonne).length, 1, q.q); assert.equal(q.choix.length, 3, q.q);
    assert.equal(new Set(q.choix.map(c => c.t)).size, 3, 'choix en double : ' + q.q); assert.ok(q.choix[q.bonne].bonne);
  }
});

test('cinq prières : l\'ordre de la journée et les rak‘at des prières obligatoires (2, 4, 4, 3, 4)', () => {
  assert.deepEqual(C5.PRIERES.map(p => p.id), ['fajr', 'dhohr', 'asr', 'maghrib', 'icha']);
  assert.deepEqual(C5.PRIERES.map(p => p.rakat), [2, 4, 4, 3, 4]);
  for (const q of C5.questionsRakat()) { const p = C5.PRIERES.find(x => q.q.includes(x.nom)); assert.equal(q.choix[0], String(p.rakat)); }
  for (const q of C5.questionsMoment()) assert.ok(C5.NOMS.includes(q.choix[0]));
});

test('trésor : lettres, mots et noms des sourates viennent des références du dépôt ; aucun verset tapé', () => {
  assert.equal(TR.questionsLettres(Math.random, 6).length, 6);
  for (const q of TR.questionsLettres()) assert.match(q.ar, /[\u0600-\u06FF]/);
  assert.ok(TR.MOTS.length >= 14, 'mots avec émoji : ' + TR.MOTS.length);
  for (const id of Object.keys(TR.EMOJIS)) assert.ok(TR.MOTS.some(m => m.id === id), 'objet sans mot arabe : ' + id);
  assert.deepEqual(TR.SOURATES.map(s => s.num), [1, 112, 113, 114]);
  const src = lire('aventures/tresor/contenu.js').split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  for (const mot of [/بِسْمِ/, /الرَّحْمَٰنِ/, /قُلْ هُوَ/]) assert.ok(!mot.test(src), 'texte coranique tapé');
});

test('oasis : eau, plantation, arrosage, récolte ; jamais de perte ; étoiles aux jalons 3, 6 et 9 palmiers', () => {
  const e = O.etatInitial();
  assert.equal(O.agir(e, 0).ok, false); assert.equal(e.parcelles[0], 0, 'sans eau on ne peut rien planter');
  assert.equal(O.chercherEau(e, 0, 2).ok, false); assert.equal(e.gouttes, 0);
  assert.equal(O.chercherEau(e, 2, 2).ok, true); assert.equal(e.gouttes, 3);
  O.agir(e, 0); O.agir(e, 0); O.agir(e, 0); assert.equal(e.parcelles[0], 3); assert.equal(e.gouttes, 0);
  assert.equal(O.agir(e, 0).ok, true); assert.equal(e.dattes, 1); assert.equal(e.parcelles[0], 4, 'récolte sans eau');
  for (let i = 0; i < 6; i++) O.chercherEau(e, 1, 1);
  assert.equal(e.gouttes, O.GOURDE_MAX, 'la gourde est plafonnée'); assert.equal(O.chercherEau(e, 1, 1).ok, false);
  for (let p = 0; p < 9; p++) { e.gouttes = 5; for (let k = 0; k < 3 && e.parcelles[p] < 3; k++) O.agir(e, p); }
  assert.equal(O.palmiers(e), 9); assert.equal(O.etoiles(e), 3); assert.ok(O.termine(e));
  assert.deepEqual(O.lire({ gouttes: 99, dattes: -3, parcelles: [9, 'x', 2] }).parcelles.slice(0, 3), [0, 0, 2]);
  assert.equal(O.lire(null).parcelles.length, 9); assert.equal(O.lire({ gouttes: 99 }).gouttes, O.GOURDE_MAX);
  assert.equal(O.invites({ dattes: 7 }), 2);
});

test('mini-jeux : pages protégées, garde d\'accès, mode sans visage, aucune synthèse vocale ni voix tierce', () => {
  for (const j of JEUX) {
    assert.ok(PAGES_PROTEGEES.includes(`/aventures/${j}/`), j + ' : page non protégée');
    const h = lire(`aventures/${j}/index.html`);
    assert.ok(h.includes('sans-visage.js'), j + ' : sans-visage'); assert.ok(h.includes('compte/acces-logique.js') && h.includes('compte/acces.js'), j + ' : garde');
    assert.ok(lire('_routes.json').includes(`"/aventures/${j}/index.html"`), j + ' : _routes.json');
    for (const f of [`aventures/${j}/jeu.js`, 'aventures/commun/mini.js']) assert.ok(!/speechSynthesis|SpeechSynthesisUtterance|new Audio\(|<audio/.test(lire(f)), f + ' : audio non autorisé');
    assert.ok(!/<img|<video|\.glb/i.test(h), j + ' : aucune image (aucun personnage ni prophète représenté)');
  }
  assert.match(lire('compte/client.js'), /'aventure_oasis', 'aventure_tresor', 'aventure_cinq'/);
  const a = lire('aventures/aventures.js'); for (const j of ['oasis/', 'tresor/', 'cinq-prieres/']) assert.ok(a.includes(`lien: '${j}'`), j);
});

test('mini-jeux : la page Aventures ne montre plus « Bientôt » pour ces trois jeux', () => {
  const a = lire('aventures/aventures.js');
  for (const id of ['oasis', 'tresor', 'cinq']) assert.ok(new RegExp(`id: '${id}', lien:`).test(a), id);
});