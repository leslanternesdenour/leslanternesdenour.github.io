// Le balisage de la grande piste : des poteaux bien visibles tout le long (l'enfant ne se perd pas), une piste plus claire, un message doux si l'on s'en éloigne.
import test from 'node:test';
import assert from 'node:assert/strict';

test('balisage : un poteau tous les 30 m de chaque côté de la piste, du début à la cité, jamais dans la cité, à une distance qui laisse la piste libre', async () => {
  const { semerTuile } = await import('../../voyage/js/route/decor-plan.js');
  const { TAILLE_TUILE } = await import('../../voyage/js/route/tuiles-plan.js');
  const { pointChemin, distanceChemin, CITE, S_DEBUT } = await import('../../voyage/js/route/relief.js');
  const poteaux = [];
  for (let i = Math.floor(S_DEBUT / TAILLE_TUILE); i * TAILLE_TUILE < 5400; i++) for (let j = -3; j <= 3; j++) poteaux.push(...semerTuile(i, j).filter(o => o.type === 'poteau'));
  poteaux.sort((a, b) => a.s - b.s);
  assert.ok(poteaux.length > 150, `assez de poteaux (${poteaux.length})`);
  for (const p of poteaux) { const d = distanceChemin(p.s, p.t); assert.ok(d > 3.6 && d < 6, `à 4–5 m du centre (${d.toFixed(1)})`); assert.ok(Math.hypot(p.s - CITE.s, p.t - CITE.t) > CITE.rayon + 20, 'jamais dans la cité'); }
  let trous = 0; for (let k = 1; k < poteaux.length; k++) if (poteaux[k].s - poteaux[k - 1].s > 70) trous++; assert.equal(trous, 0, 'aucun trou de plus de 70 m');
  const cotes = poteaux.map(p => Math.sign(p.t - pointChemin(p.s).t)); assert.ok(cotes.includes(1) && cotes.includes(-1), 'des deux côtés');
  assert.deepEqual(semerTuile(3, 0), semerTuile(3, 0), 'toujours les mêmes');
});

test('balisage : le poteau a un modèle 3D visible de loin (crème et rouge), et la piste est plus claire que le sable', async () => {
  const fs = await import('node:fs');
  const m = fs.readFileSync(new URL('../../voyage/js/route/monde.js', import.meta.url), 'utf8');
  assert.match(m, /poteau: \{ cap: 900/); assert.match(m, /#f3ecd8/); assert.match(m, /#c0392b/);
  const couleur = m.match(/chemin = C\('(#[0-9a-f]{6})'\)/)[1], clair = c => { const n = parseInt(c.slice(1), 16); return ((n >> 16) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11) / 255; };
  assert.ok(clair(couleur) > 0.86, `piste claire (luminosité ${clair(couleur).toFixed(2)})`); assert.ok(clair(couleur) - clair('#e9c88f') > 0.07, 'nettement plus claire que le sable');
  assert.match(m, /r\.surChemin \* 0\.9/, 'piste plus marquée');
});

test('balisage : on dit doucement à l\'enfant de revenir quand il s\'éloigne trop de la piste, sauf aux endroits voulus (sentiers, montagnes, hameau, cité, oasis)', async () => {
  const { loinDeLaPiste } = await import('../../voyage/js/route/piste-plan.js');
  const { pointChemin, HAMEAU, CITE, MONTAGNE_NORD, DEC, sentiers } = await import('../../voyage/js/route/relief.js');
  const loin = (s, d) => loinDeLaPiste(s, pointChemin(s).t + d);
  assert.equal(loin(800, 20), false, 'sur la piste'); assert.equal(loin(800, 80), false, 'à 80 m : encore bon'); assert.equal(loin(800, 140), true, 'à 140 m : trop loin'); assert.equal(loin(1300, -160), true);
  assert.equal(loinDeLaPiste(HAMEAU.s, HAMEAU.t), false, 'au hameau'); const S = sentiers()[0]; assert.equal(loinDeLaPiste(S[2][0], S[2][1]), false, 'sur un sentier');
  assert.equal(loinDeLaPiste(CITE.s, CITE.t + 150), false, 'dans la cité'); assert.equal(loinDeLaPiste(MONTAGNE_NORD.s, MONTAGNE_NORD.t + 100), false, 'sur la montagne'); assert.equal(loinDeLaPiste(6040, 0), false, 'dans une maison');
  const fs = await import('node:fs'); const { MESSAGES } = await import('../../voyage/js/route/textes-route.js');
  const j = fs.readFileSync(new URL('../../voyage/js/route/jeu-route.js', import.meta.url), 'utf8');
  assert.ok(MESSAGES.horsPiste && MESSAGES.horsPiste.length <= 120 && !/(vite|danger|perdu|peur)/i.test(MESSAGES.horsPiste), 'message rassurant');
  assert.match(j, /loinDeLaPiste\(J\.z - DEC, J\.x\)/); assert.match(j, /MESSAGES\.horsPiste/); assert.match(j, /!dansMaison/);
});
