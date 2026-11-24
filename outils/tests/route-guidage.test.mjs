// Le guidage de la Route : de petites lumières dorées au sol (comme au village) qui mènent à la destination choisie sur la carte, à la place de la seule flèche.
import test from 'node:test';
import assert from 'node:assert/strict';

test('guidage : la trace de lumières rejoint la piste, la suit, puis prend le sentier qui mène à la destination ; seulement la partie proche, régulièrement espacée', async () => {
  const { traceLumineuse } = await import('../../voyage/js/route/trace-plan.js');
  const { pointChemin, distanceChemin, sentiers, HAMEAU } = await import('../../voyage/js/route/relief.js');
  const j = { s: 1000, t: pointChemin(1000).t + 60 };
  const t1 = traceLumineuse(j, { s: 1800, t: pointChemin(1800).t });
  assert.ok(t1.length >= 8 && t1.length <= 24, `un nombre raisonnable de lumières (${t1.length})`);
  assert.ok(Math.hypot(t1[0].s - j.s, t1[0].t - j.t) < 20, 'la première lumière est tout près de l\'enfant');
  for (let k = 1; k < t1.length; k++) { const d = Math.hypot(t1[k].s - t1[k - 1].s, t1[k].t - t1[k - 1].t); assert.ok(d > 5 && d < 14, `espacement régulier (${d.toFixed(1)})`); }
  assert.ok(t1.at(-1).s > t1[0].s + 100, 'elles avancent vers la destination'); assert.ok(distanceChemin(t1.at(-1).s, t1.at(-1).t) < 6, 'et suivent la piste');
  const S = sentiers().find(p => Math.hypot(p.at(-1)[0] - HAMEAU.s, p.at(-1)[1] - HAMEAU.t) < 40), pied = { s: S[0][0], t: pointChemin(S[0][0]).t + 20 };
  const t2 = traceLumineuse(pied, { s: HAMEAU.s, t: HAMEAU.t });   // tout près du départ du sentier du hameau : la trace doit s'engager sur le sentier
  assert.ok(t2.some(p => Math.abs(p.t - pointChemin(p.s).t) > 60), 'elles s\'engagent sur le sentier du hameau, hors de la piste');
  assert.deepEqual(traceLumineuse(j, { s: j.s + 5, t: j.t }), [], 'arrivé : plus de lumières');
});

test('guidage : les lumières dorées sont dessinées au sol (une seule géométrie répétée), suivent la destination de la carte, disparaissent à l\'arrivée ; la flèche tournante est remplacée', async () => {
  const fs = await import('node:fs');
  const g = fs.readFileSync(new URL('../../voyage/js/route/guidage-3d.js', import.meta.url), 'utf8'), c = fs.readFileSync(new URL('../../voyage/js/route/carte-route.js', import.meta.url), 'utf8'), j = fs.readFileSync(new URL('../../voyage/js/route/jeu-route.js', import.meta.url), 'utf8');
  assert.match(g, /export function creerGuidage3D/); assert.match(g, /traceLumineuse\(/); assert.match(g, /InstancedMesh/); assert.match(g, /#ffd36b/); assert.match(g, /Math\.sin\(t \* 4/, 'les lumières avancent en vague');
  assert.match(c, /cap: \(\) => cap/, 'la carte donne la destination choisie'); assert.ok(!/rc-fleche'\)\.style\.transform/.test(c), 'plus de flèche qui tourne');
  assert.match(j, /creerGuidage3D\(/); assert.match(j, /G3\.maj\(dt, t, J, carte\.cap\(\)/); assert.match(j, /G3\.groupe\.visible = v/);
});

test('carte : les noms des régions ne se superposent plus (texte réduit à la largeur de la bande, une région sur deux décalée d\'une ligne)', async () => {
  const fs = await import('node:fs');
  const c = fs.readFileSync(new URL('../../voyage/js/route/carte-route.js', import.meta.url), 'utf8');
  assert.match(c, /measureText\(txt\)\.width > bw \* 0\.96/); assert.match(c, /idxReg\+\+ % 2\) \* 15 \* d/); assert.match(c, /etiquettes\.push\(\{ txt, x: c\.x, y: c\.y - dy, tp \}\)/, 'noms mis de côté'); assert.ok(c.indexOf('for (const e of etiquettes)') > c.indexOf('des montagnes dessinées'), 'dessinés après les montagnes, par-dessus');
});
