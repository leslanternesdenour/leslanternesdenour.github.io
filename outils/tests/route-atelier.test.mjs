// L'atelier du potier : un vrai bâtiment dans lequel on entre (ouvert sur l'avant), avec un tour de potier et un four à observer.
import test from 'node:test';
import assert from 'node:assert/strict';

const RAYON_ENFANT = 0.45;
const libre = (x, z, cols) => cols.every(c => Math.hypot(x - c.x, z - c.z) > c.r + RAYON_ENFANT);

test('atelier : on entre par l\'avant et on atteint le tour et le four sans traverser un mur ; les murs, eux, bloquent', async () => {
  const { planAtelier } = await import('../../voyage/js/route/atelier-plan.js');
  for (const rot of [0, -0.4, 1.2]) {
    const a = planAtelier(100, 200, rot), cols = a.colliders;
    assert.ok(libre(a.entree.x, a.entree.z, cols), 'l\'entrée est libre');
    for (const o of a.objets) {
      assert.ok(libre(o.poseX, o.poseZ, cols), `${o.id} : on peut se tenir devant`);
      for (let k = 0; k <= 20; k++) assert.ok(libre(a.entree.x + (o.poseX - a.entree.x) * k / 20, a.entree.z + (o.poseZ - a.entree.z) * k / 20, cols), `${o.id} : chemin libre depuis l'entrée (rot ${rot})`);
    }
    for (const m of [a.mur.fond, a.mur.gauche, a.mur.droit]) assert.ok(!libre(m.x, m.z, cols), 'un mur bloque');
    assert.deepEqual(a.objets.map(o => o.id), ['tour', 'four']);
  }
});

test('atelier : le bâtiment 3D est dessiné et rendu solide avec le même plan, il n\'est plus un bloc plein', async () => {
  const fs = await import('node:fs');
  const l = fs.readFileSync(new URL('../../voyage/js/route/lieux-3d.js', import.meta.url), 'utf8');
  assert.match(l, /import \{ ATELIER, planAtelier \} from '\.\/atelier-plan\.js'/);
  assert.match(l, /planAtelier\(p\.x, p\.z, -0\.4\)/, 'colliders du plan, même rotation que le mesh');
  assert.ok(!/bloquer\(p\.x, p\.z, 2\.8\)/.test(l), 'plus de cylindre plein au milieu de l\'atelier');
  assert.match(l, /atelier: /, 'le plan est rendu disponible pour les interactions intérieures');
});

test('atelier : dedans() sait si l\'enfant est à l\'intérieur (le toit s\'efface alors pour garder la vue dégagée)', async () => {
  const { planAtelier } = await import('../../voyage/js/route/atelier-plan.js');
  for (const rot of [0, -0.4, 2.5]) {
    const a = planAtelier(-50, 300, rot);
    for (const o of a.objets) assert.ok(a.dedans(o.poseX, o.poseZ), `${o.id} : devant le ${o.id}, on est dedans`);
    assert.ok(!a.dedans(a.entree.x, a.entree.z), 'sur le seuil extérieur, on est dehors');
    assert.ok(!a.dedans(a.mur.gauche.x + (a.mur.gauche.x - -50) * 0.6, a.mur.gauche.z + (a.mur.gauche.z - 300) * 0.6), 'derrière un mur, on est dehors');
    assert.ok(!a.dedans(-50 + 40, 300), 'loin, on est dehors');
  }
});

test('atelier : le tour et le four ont chacun un court texte pour les 3–5 ans et un texte pour les 6–10 ans, sobres et sans religion', async () => {
  const { FAITS_ATELIER } = await import('../../voyage/js/route/textes-route.js');
  assert.deepEqual(Object.keys(FAITS_ATELIER), ['tour', 'four']);
  for (const f of Object.values(FAITS_ATELIER)) {
    assert.ok(f.nom && f.icone && f.label, 'nom, icône et libellé du bouton');
    assert.ok(f.petit.length > 20 && f.petit.length <= 110 && f.grand.length > 60 && f.grand.length <= 330);
    assert.ok(!/(allah|coran|kaaba|zamzam|proph|hadith|prière|mecque)/i.test(f.petit + f.grand));
  }
});

test('atelier : on observe le tour et le four depuis l\'intérieur, une découverte et une petite récompense la première fois seulement', async () => {
  const fs = await import('node:fs');
  const j = fs.readFileSync(new URL('../../voyage/js/route/jeu-route.js', import.meta.url), 'utf8');
  assert.match(j, /FAITS_ATELIER/); assert.match(j, /L\.atelier\.objets/); assert.match(j, /route:atelier:/);
  assert.match(j, /R\.decouvertes\.includes\('atelier:' \+ o\.id\)/, 'une seule récompense par objet');
  assert.match(j, /gagner\('atelier:' \+ o\.id, 10/);
});
