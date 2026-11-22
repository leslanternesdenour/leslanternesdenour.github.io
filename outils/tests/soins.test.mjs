// Soins des montures : logique des besoins (jamais punitive, lente, récompenses limitées) et poses 3D (aucune valeur NaN, retour à la normale).
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import { creerSoins, poseSoin, BESOINS, PLANCHER, BAS, DUREES, LIEUX_SOINS, RECOMPENSE, MAX_PAR_JOUR, fait } from '../../voyage/js/soins.js';

const nouveau = () => { const A = {}, t = { v: Date.UTC(2026, 10, 22, 10) }; const s = creerSoins({ A, enregistrer: () => {}, maintenant: () => t.v }); return { A, s, t }; };

test('les besoins démarrent hauts et baissent lentement', () => {
  const { s } = nouveau(); const n0 = s.niveaux('sablo');
  for (const b of BESOINS) assert.ok(n0[b] >= 80);
  s.tick('sablo', 600, { monte: false, vit: 0 });          // 10 minutes
  const n1 = s.niveaux('sablo');
  assert.ok(n1.soif < n0.soif && n1.soif > 40, 'la soif baisse mais reste confortable après 10 min');
  assert.equal(s.urgent('sablo'), null);
});
test('jamais punitif : plancher, aucune mort, aucun besoin sous le plancher', () => {
  const { s } = nouveau();
  for (let i = 0; i < 200; i++) s.tick('sablo', 600, { monte: true, vit: 12 });     // 33 heures de galop
  for (const b of BESOINS) assert.ok(s.niveau('sablo', b) >= PLANCHER, b);
  assert.ok(s.urgent('sablo'), 'un besoin bas est seulement signalé');
});
test('chaque soin remonte le bon besoin, plafonné à 100', () => {
  const { s } = nouveau(); s.tick('sablo', 3000, {});
  const av = s.niveaux('sablo');
  s.appliquer('sablo', 'boire', 'dromadaire'); assert.ok(s.niveau('sablo', 'soif') > av.soif);
  s.appliquer('sablo', 'manger', 'dromadaire'); assert.ok(s.niveau('sablo', 'faim') > av.faim);
  s.tick('sablo', 100, { monte: true, vit: 10 }); const r = s.niveau('sablo', 'repos');
  s.appliquer('sablo', 'dormir', 'dromadaire'); assert.ok(s.niveau('sablo', 'repos') > r);
  s.appliquer('sablo', 'calin', 'dromadaire'); for (const b of BESOINS) assert.ok(s.niveau('sablo', b) <= 100);
});
test('récompense : petite, limitée à 3 par jour et par soin, renouvelée le lendemain', () => {
  const { s, t } = nouveau(); let total = 0;
  for (let i = 0; i < 6; i++) total += s.appliquer('sablo', 'boire', 'cheval').pieces;
  assert.equal(total, RECOMPENSE.boire * MAX_PAR_JOUR);
  t.v += 86400000; assert.equal(s.appliquer('sablo', 'boire', 'cheval').pieces, RECOMPENSE.boire);
});
test('un petit fait pédagogique pour chaque soin et chaque espèce', () => {
  for (const a of ['boire', 'manger', 'repos', 'dormir', 'calin']) for (const e of ['dromadaire', 'bactriane', 'cheval', 'elephant']) assert.ok(fait(a, e).length > 20, a + e);
});
test('les durées des soins existent toutes (garde contre un nom masqué dans main.js)', () => {
  for (const a of ['boire', 'manger', 'repos', 'dormir']) assert.ok(DUREES[a] > 2, a);
  const src = fs.readFileSync(new URL('../../voyage/js/main.js', import.meta.url), 'utf8');
  assert.ok(/DUREES as DUREES_SOINS/.test(src) && !/[^_]DUREES\[soin\./.test(src), 'main.js a déjà sa propre constante DUREES : les soins utilisent DUREES_SOINS');
});
test('les lieux de soins : le point d\'arrêt est dégagé et près de l\'objet', () => {
  for (const [id, l] of Object.entries(LIEUX_SOINS)) {
    const d = Math.hypot(l.stand.x - l.objet.x, l.stand.z - l.objet.z); assert.ok(d < 2.5, id);
    assert.ok(Math.hypot(l.stand.x, l.stand.z) > 1.9, id + ' : hors du puits');
  }
});
// fausse monture avec les mêmes membres que Chameau / Cheval / Elephant
const R = () => ({ x: 0, y: 0, z: 0 });
const fausse = () => ({ hauteurDebout: 1.5, corps: { position: { y: 1.5 }, rotation: R() }, cou: { rotation: R() }, tete: { rotation: R() }, yeux: { scale: { y: 1 } },
  pattes: [0, 1, 2, 3].map(() => ({ haut: { rotation: R() }, bas: { rotation: R() } })) });
test('poses 3D : valeurs finies, k = 0 ne touche à rien, pose complète puis retour', () => {
  for (const type of ['boire', 'manger', 'repos', 'dormir']) {
    const m = fausse(); poseSoin(m, type, 0, 1); assert.equal(m.corps.position.y, 1.5, 'k=0 : rien ne bouge');
    for (const k of [0.2, 0.6, 1]) { const f = fausse(); poseSoin(f, type, k, 3.3);
      for (const v of [f.corps.position.y, f.cou.rotation.x, f.tete.rotation.x, ...f.pattes.map(p => p.haut.rotation.x + p.bas.rotation.x)]) assert.ok(Number.isFinite(v), type + ' k=' + k); }
  }
  const d = fausse(); poseSoin(d, 'dormir', 1, 0); assert.ok(d.corps.position.y < 1.5 * 0.6, 'couchée'); assert.ok(d.yeux.scale.y < 0.2, 'yeux fermés');
  const b = fausse(); poseSoin(b, 'boire', 1, 0); assert.ok(b.cou.rotation.x > 0.8, 'tête inclinée vers l\'eau');
});
