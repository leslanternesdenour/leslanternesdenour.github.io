// Les sentiers de montée des deux grandes montagnes : un vrai chemin praticable du pied jusqu'au belvédère, avec trois haltes à observer.
import test from 'node:test';
import assert from 'node:assert/strict';

test('sentiers de montée : un chemin continu, jamais trop raide pour la règle de pente du jeu, du pied de la terrasse jusqu\'au belvédère', async () => {
  const { sentierMontee, MONTEES } = await import('../../voyage/js/route/sentier-montee.js');
  const { hauteur, TERRASSES } = await import('../../voyage/js/route/relief.js');
  assert.deepEqual(Object.keys(MONTEES), ['nord', 'sud']);
  for (const [id, M] of Object.entries(MONTEES)) {
    const p = sentierMontee(id), T = TERRASSES.find(x => x.id === (id === 'nord' ? 'pied-nord' : 'pied-sud'));
    assert.ok(p.pts.length > 20, `${id} : un vrai chemin`);
    assert.ok(Math.hypot(p.pts[0][0] - T.s, p.pts[0][1] - T.t) < 4, `${id} : part du pied de la montagne (la terrasse)`);
    assert.ok(p.pts.at(-1)[2] >= M.hauteurBelvedere - 0.5, `${id} : arrive au belvédère`);
    for (let k = 1; k < p.pts.length; k++) {
      const a = p.pts[k - 1], b = p.pts[k], d = Math.hypot(b[0] - a[0], b[1] - a[1]); assert.ok(d < 5, 'pas plus long que 5 m');
      for (let u = 0; u <= d; u += 1) { const f = u / d, h1 = hauteur(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f), h2 = hauteur(a[0] + (b[0] - a[0]) * Math.min(1, (u + 1) / d), a[1] + (b[1] - a[1]) * Math.min(1, (u + 1) / d)); assert.ok(Math.abs(h2 - h1) / Math.min(1, 1) <= 1.05, `${id} : pente franchissable (le jeu bloque au-delà de 1,05 par mètre)`); }
    }
  }
});

test('haltes de montée : trois par montagne, de plus en plus haut, bien espacées, textes sobres de nature et de géographie (aucun récit religieux)', async () => {
  const { sentierMontee } = await import('../../voyage/js/route/sentier-montee.js');
  const { HALTES_MONTAGNE } = await import('../../voyage/js/route/textes-route.js');
  assert.deepEqual(Object.keys(HALTES_MONTAGNE), ['nord', 'sud']);
  for (const [id, liste] of Object.entries(HALTES_MONTAGNE)) {
    const h = sentierMontee(id).haltes; assert.equal(liste.length, 3); assert.equal(h.length, 3);
    assert.ok(h[0].h < h[1].h && h[1].h < h[2].h, `${id} : de plus en plus haut`);
    for (let k = 1; k < 3; k++) assert.ok(Math.hypot(h[k].s - h[k - 1].s, h[k].t - h[k - 1].t) > 20, `${id} : haltes espacées`);
    for (const x of liste) {
      assert.ok(x.nom && x.icone && x.label, 'nom, icône, libellé');
      assert.ok(x.petit.length > 20 && x.petit.length <= 110 && x.grand.length > 60 && x.grand.length <= 330, `${x.nom} : longueurs`);
      assert.ok(!/(allah|coran|kaaba|zamzam|proph|hadith|prière|mecque|dieu|jabal|grotte|hira|thawr|nour\b)/i.test(x.petit + x.grand + x.nom), `${x.nom} : rien de religieux ni de nom de lieu sacré`);
    }
  }
});

test('montée : le sentier est dessiné (cairns, haltes, belvédère), visible seulement sur la Route, et chaque halte avance la mission « Monter doucement »', async () => {
  const fs = await import('node:fs');
  const j = fs.readFileSync(new URL('../../voyage/js/route/jeu-route.js', import.meta.url), 'utf8');
  const m = fs.readFileSync(new URL('../../voyage/js/route/montee-3d.js', import.meta.url), 'utf8');
  assert.match(m, /export function creerMontee3D/); assert.match(m, /sentierMontee\(/); assert.match(m, /haltes/);
  assert.match(j, /creerMontee3D\(/); assert.match(j, /HALTES_MONTAGNE/); assert.match(j, /etape\('montees', id \+ ':' \+ k\)/);
  assert.match(j, /groupe\.visible = v; V\.montrer\(v\); M3\.groupe\.visible = v/, 'le sentier suit la visibilité du monde de la Route');
});
