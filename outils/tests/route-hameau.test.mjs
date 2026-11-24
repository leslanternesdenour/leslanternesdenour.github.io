// Le hameau des puits : un lieu à l'écart de la grande piste, dans les dunes — un sentier, quatre lieux, un puisatier à qui parler, un métier à apprendre, une mission.
import test from 'node:test';
import assert from 'node:assert/strict';

const LIEUX = ['hameau-borne', 'hameau-puits', 'hameau-jardin', 'hameau-four'];

test('hameau : quatre lieux à découvrir (de la borne du sentier au four), textes sobres, mission « Le hameau des puits », un puisatier fictif qui reste au hameau', async () => {
  const { LIEUX_ROUTE, MISSIONS_ROUTE, VOYAGEURS_VILLE, positionDeLieu } = await import('../../voyage/js/route/donnees.js');
  const { TEXTES_LIEUX } = await import('../../voyage/js/route/textes-route.js');
  const { HAMEAU, pointChemin } = await import('../../voyage/js/route/relief.js');
  for (const id of LIEUX) {
    const l = LIEUX_ROUTE.find(x => x.id === id); assert.ok(l, id); assert.equal(l.type, 'decouverte'); assert.equal(l.mission, 'hameau');
    const t = TEXTES_LIEUX[id]; assert.ok(t.petit.length > 20 && t.petit.length <= 110 && t.grand.length > 60 && t.grand.length <= 330, `${id} : longueurs`);
    assert.ok(!/(allah|coran|kaaba|zamzam|proph|hadith|prière|mecque|dieu)/i.test(t.petit + t.grand + l.nom), `${id} : rien de religieux`);
    const p = positionDeLieu(l); if (id !== 'hameau-borne') assert.ok(Math.hypot(p.s - HAMEAU.s, p.t - HAMEAU.t) < HAMEAU.r, `${id} : dans le hameau`);
    else assert.ok(Math.abs(p.t - pointChemin(p.s).t) < 25, 'la borne est au départ du sentier, près de la piste');
  }
  const m = MISSIONS_ROUTE.hameau; assert.ok(m && m.total === 4 && m.icone && m.recompense > 0 && m.simple && m.resume && m.categorie === 'exploration');
  const v = VOYAGEURS_VILLE.find(x => x.id === 'puisatier'); assert.ok(v && !v.trajet && Math.hypot(v.s - HAMEAU.s, v.t - HAMEAU.t) < HAMEAU.r * 0.7, 'le puisatier reste au hameau');
  assert.ok(!/(allah|coran|proph|hadith|mecque|dieu)/i.test(v.role + v.texte.petit + v.texte.grand));
});

test('hameau : le puisatier répond à deux questions et enseigne son métier (3 questions), avec une voix Nour existante', async () => {
  const { SUJETS_VOYAGEURS } = await import('../../voyage/js/route/textes-route.js');
  const { ACTIVITES_METIERS, questionsMetier } = await import('../../voyage/js/route/activites-route.js');
  assert.equal(SUJETS_VOYAGEURS.puisatier.length, 2);
  const a = ACTIVITES_METIERS.puisatier; assert.ok(a && a.voix === 'perso-yacine'); for (const age of ['3-5', '6-10']) assert.equal(questionsMetier('puisatier', age).length, 3);
});
