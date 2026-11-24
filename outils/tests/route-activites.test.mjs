// Les activités des métiers de la cité (potier, marchand) : trois questions douces, sans chronomètre ni punition, une voix Nour par métier.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('activités des métiers : un potier et un marchand, trois questions chacun, bonne réponse valide, textes sobres et voix Nour existante', async () => {
  const { ACTIVITES_METIERS, questionsMetier } = await import('../../voyage/js/route/activites-route.js');
  const { VOYAGEURS_VILLE } = await import('../../voyage/js/route/donnees.js');
  const roles = JSON.parse(fs.readFileSync(new URL('../voix/jeux/voix-roles.json', import.meta.url), 'utf8'));
  assert.deepEqual(Object.keys(ACTIVITES_METIERS), ['potier', 'marchand-dattes']);
  for (const [id, a] of Object.entries(ACTIVITES_METIERS)) {
    assert.ok(VOYAGEURS_VILLE.some(v => v.id === id), `${id} : le métier est enseigné par un voyageur de la cité`);
    assert.ok(roles[a.voix], `${id} : voix Nour inconnue`); assert.ok(a.icone && a.titre && a.recompense > 0);
    for (const age of ['3-5', '6-10']) {
      const q = questionsMetier(id, age);
      assert.equal(q.length, 3, `${id} ${age} : trois questions`);
      for (const x of q) {
        assert.ok(x.question.length > 15 && x.ok.length > 15 && x.ko.length > 15, `${id} : textes trop courts`);
        assert.equal(x.choix.length, age === '3-5' ? 2 : 3); assert.ok(Number.isInteger(x.bonne) && x.bonne >= 0 && x.bonne < x.choix.length);
        assert.ok(new Set(x.choix).size === x.choix.length, 'choix tous différents');
      }
      assert.ok(a.intro[age === '3-5' ? 'petit' : 'grand'] && a.fin[age === '3-5' ? 'petit' : 'grand']);
    }
    const tout = JSON.stringify(a);
    assert.ok(!/(allah|coran|kaaba|zamzam|proph|hadith|prière|mecque|dieu)/i.test(tout), `${id} : rien de religieux`);
    assert.ok(!/(chrono|temps limité|vite !|perdu|raté|nul|faux !|mauvaise)/i.test(tout), `${id} : jamais de ton punitif`);
  }
});

test('activités des métiers : le voyageur propose « Apprendre son métier », chaque question se réessaie sans pénalité, la récompense n\'est donnée qu\'une fois', () => {
  const j = fs.readFileSync(new URL('../../voyage/js/route/jeu-route.js', import.meta.url), 'utf8');
  assert.match(j, /ACTIVITES_METIERS\[n\.v\.id\]/); assert.match(j, /Apprendre son métier/); assert.match(j, /questionsMetier\(/);
  assert.match(j, /Réessayer/, 'une mauvaise réponse permet de réessayer');
  assert.match(j, /R\.vu\['metier_' \+ id\]/, 'la progression est sauvegardée');
  assert.match(j, /gagner\('metier:' \+ id/, 'récompense par le système existant (bourse)');
});
