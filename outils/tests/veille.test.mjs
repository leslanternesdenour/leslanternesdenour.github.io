// Étape 4 : la veille de Loumi — rappels fondés sur les VRAIS besoins (soins.js), discrets, non répétitifs, qui disparaissent quand le besoin est satisfait.
import test from 'node:test'; import assert from 'node:assert/strict';
const { creerSoins, BAS } = await import('../../voyage/js/soins.js');
const { creerVeille, texte, palier, CRITIQUE } = await import('../../voyage/js/veille.js');

function monde() {
  const A = {}; const soins = creerSoins({ A, enregistrer() {}, maintenant: () => Date.UTC(2026, 10, 22, 10) });
  const memoire = {}; const veille = creerVeille({ soins, memoire, nom: id => ({ sablo: 'Sablo', cannelle: 'Cannelle' })[id], fem: id => id === 'cannelle' });
  const regler = (id, b, v) => { soins.etat(id).niveaux[b] = v; };
  return { A, soins, memoire, veille, regler };
}

test('tout va bien : Loumi ne dit rien', () => { const m = monde(); assert.equal(m.veille.aSignaler('sablo'), null); });
test('les phrases : faim, soif, repos (mots du client), courtes et au bon genre', () => {
  assert.equal(texte('faim', 1, 'Sablo'), 'Sablo commence à avoir faim. Il serait temps de lui donner du foin.');
  assert.equal(texte('soif', 1, 'Sablo'), "Sablo aurait bien besoin d'un peu d'eau.");
  assert.equal(texte('repos', 1, 'Sablo'), 'Je crois que Sablo a besoin de se reposer.'); assert.equal(texte('energie', 1, 'Sablo'), 'Je crois que Sablo a besoin de se reposer.');
  assert.match(texte('energie', 2, 'Cannelle', true), /fatiguée/);
  for (const b of ['faim', 'soif', 'repos', 'energie', 'bienEtre']) for (const p of [1, 2]) assert.ok(texte(b, p, 'Sablo').length < 80, b + p);
});
test('un besoin réel sous le seuil est signalé avec son vrai texte ; une valeur fictive ne l\'est pas', () => {
  const m = monde(); m.regler('sablo', 'faim', BAS - 1); const r = m.veille.aSignaler('sablo'); assert.equal(r.besoin, 'faim'); assert.equal(r.palier, 1); assert.match(r.texte, /faim/);
  const n = monde(); n.regler('sablo', 'faim', BAS + 1); assert.equal(n.veille.aSignaler('sablo'), null, 'au-dessus du seuil : silence');
});
test('plusieurs besoins : le plus urgent d\'abord, un seul message', () => {
  const m = monde(); m.regler('sablo', 'faim', 35); m.regler('sablo', 'soif', 28); m.regler('sablo', 'repos', 39);
  assert.equal(m.veille.aSignaler('sablo').besoin, 'soif', 'la valeur la plus basse');
  const e = monde(); e.regler('sablo', 'faim', 30); e.regler('sablo', 'soif', 30); assert.equal(e.veille.aSignaler('sablo').besoin, 'soif', 'à égalité : boire avant manger');
});
test('un seul rappel par besoin tant qu\'il n\'a pas évolué (même session, même après rechargement)', () => {
  const m = monde(); m.regler('sablo', 'faim', 32); const r = m.veille.aSignaler('sablo'); m.veille.marquer('sablo', r.besoin, r.palier);
  for (let i = 0; i < 50; i++) assert.equal(m.veille.aSignaler('sablo'), null, 'aucun rappel répétitif');
  const apres = creerVeille({ soins: m.soins, memoire: JSON.parse(JSON.stringify(m.memoire)), nom: () => 'Sablo' });   // rechargement de la sauvegarde
  assert.equal(apres.aSignaler('sablo'), null, 'pas de rappel au rechargement : la situation n\'a pas changé');
});
test('évolution réelle : passage en niveau critique = un nouveau rappel (et un seul)', () => {
  const m = monde(); m.regler('sablo', 'soif', 33); let r = m.veille.aSignaler('sablo'); m.veille.marquer('sablo', r.besoin, r.palier);
  m.regler('sablo', 'soif', CRITIQUE - 1); r = m.veille.aSignaler('sablo'); assert.equal(r.palier, 2); assert.match(r.texte, /très soif/); m.veille.marquer('sablo', r.besoin, r.palier);
  assert.equal(m.veille.aSignaler('sablo'), null);
});
test('besoin satisfait : le rappel n\'est plus vrai, la mémoire est oubliée ; s\'il retombe c\'est une nouvelle situation', () => {
  const m = monde(); m.regler('sablo', 'faim', 30); const r = m.veille.aSignaler('sablo'); m.veille.marquer('sablo', 'faim', r.palier);
  assert.equal(m.veille.encoreVrai('sablo', 'faim'), true);
  m.soins.appliquer('sablo', 'manger', 'dromadaire'); assert.equal(m.veille.encoreVrai('sablo', 'faim'), false, 'le rappel disparaît');
  assert.equal(m.veille.aSignaler('sablo'), null); assert.deepEqual(m.veille.memoire('sablo'), {}, 'mémoire effacée');
  m.regler('sablo', 'faim', 30); assert.equal(m.veille.aSignaler('sablo').besoin, 'faim', 'retombé : nouveau rappel');
});
test('la mémoire est propre à chaque monture (aucune fuite de l\'une à l\'autre)', () => {
  const m = monde(); m.regler('sablo', 'faim', 30); m.regler('cannelle', 'faim', 30);
  const r = m.veille.aSignaler('sablo'); m.veille.marquer('sablo', r.besoin, r.palier); assert.equal(m.veille.aSignaler('cannelle').besoin, 'faim');
});
test('indépendance : la veille ne lit ni ne modifie les besoins, ni les missions, ni Nour', () => {
  const m = monde(); m.regler('sablo', 'faim', 30); const avant = JSON.stringify(m.A); m.veille.aSignaler('sablo'); m.veille.marquer('sablo', 'faim', 1); assert.equal(JSON.stringify(m.A), avant, 'les besoins ne sont jamais modifiés par la veille');
  assert.equal(palier(CRITIQUE - 0.1), 2); assert.equal(palier(CRITIQUE), 1); assert.equal(palier(BAS), 0);
});
