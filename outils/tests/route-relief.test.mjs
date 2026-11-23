// La Route : le relief est une fonction pure (aucun fichier à télécharger), continue et praticable à pied.
import test from 'node:test'; import assert from 'node:assert/strict';

test('relief : la piste principale est praticable à pied (pente douce, du seuil jusqu\'au cairn de fin de tranche)', async () => {
  const { hauteur, pointChemin, S_DEBUT, S_FIN_TRANCHE } = await import('../../voyage/js/route/relief.js');
  let pireNombre = 0, pire = 0;
  for (let s = S_DEBUT; s < S_FIN_TRANCHE; s += 2) {
    const a = pointChemin(s), b = pointChemin(s + 2);
    const pente = Math.abs(hauteur(b.s, b.t) - hauteur(a.s, a.t)) / Math.hypot(b.s - a.s, b.t - a.t);
    if (pente > pire) { pire = pente; pireNombre = s; }
  }
  assert.ok(pire < 0.35, `pente max sur la piste ${pire.toFixed(2)} à s=${pireNombre}`);
});

test('relief : toute la plaine et les dunes à moins de 450 m de la piste se marchent (jamais de mur invisible)', async () => {
  const { hauteur, S_DEBUT, S_FIN_TRANCHE } = await import('../../voyage/js/route/relief.js');
  let pire = 0, ou = '';
  for (let s = S_DEBUT; s < S_FIN_TRANCHE; s += 4) for (let t = -450; t < 450; t += 4) {
    const h = hauteur(s, t), p = Math.max(Math.abs(hauteur(s + 4, t) - h), Math.abs(hauteur(s, t + 4) - h)) / 4;
    if (p > pire) { pire = p; ou = `s=${s} t=${t}`; }
  }
  assert.ok(pire < 0.9, `pente max ${pire.toFixed(2)} à ${ou} (le jeu bloque au-delà de 1,05)`);
});

test('relief : l\'oasis est plate avec un petit lac creusé ; le campement est plat ; les montagnes bordent l\'horizon', async () => {
  const { hauteur, relief, OASIS, CAMP } = await import('../../voyage/js/route/relief.js');
  const rive = hauteur(OASIS.s + OASIS.lac + 8, OASIS.t), eau = hauteur(OASIS.s, OASIS.t);
  assert.ok(rive - eau > 2.2, `le lac doit être creusé (${(rive - eau).toFixed(2)} m)`);
  assert.ok(relief(OASIS.s, OASIS.t).lac > 0.9);
  for (const a of [0, 1.5, 3, 4.5]) assert.ok(Math.abs(hauteur(CAMP.s + Math.cos(a) * 15, CAMP.t + Math.sin(a) * 15) - hauteur(CAMP.s, CAMP.t)) < 0.8, 'campement plat');
  assert.ok(hauteur(1000, 950) > 40 && hauteur(1000, -950) > 40, 'montagnes au loin des deux côtés');
  assert.ok(hauteur(1000, 10) < 4, 'la plaine reste basse');
});
