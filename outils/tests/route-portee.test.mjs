// Performances : on ne dessine que les lieux assez proches pour être vus à travers le brouillard ; un objet ramassé reste caché, une marque cachée aussi.
import test from 'node:test';
import assert from 'node:assert/strict';

const objet = (x, z, extra = {}) => ({ position: { x, z }, visible: true, userData: { ...extra } });

test('portée : les lieux lointains sont cachés, les proches affichés, les objets retirés restent cachés, les exceptions sont ignorées', async () => {
  const { majPortee } = await import('../../voyage/js/route/portee-plan.js');
  const proche = objet(10, 10), loin = objet(900, 0), retire = objet(5, 5, { retire: true }), garde = objet(2000, 2000), diag = objet(300, 300);
  const n = majPortee([proche, loin, retire, garde, diag], 0, 0, 400, [garde]);
  assert.equal(proche.visible, true); assert.equal(loin.visible, false, 'lointain caché'); assert.equal(retire.visible, false, 'ramassé : jamais réaffiché');
  assert.equal(garde.visible, true, 'exception ignorée'); assert.equal(diag.visible, false, 'hypoténuse 424 > 400'); assert.equal(n, 3, 'compte des changements');
  loin.position.x = 100; majPortee([proche, loin, retire, garde, diag], 0, 0, 400, [garde]); assert.equal(loin.visible, true, 'réaffiché en s\'approchant');
  assert.equal(majPortee([proche, loin, retire, garde, diag], 0, 0, 400, [garde]), 0, 'rien ne change : aucun travail');
});

test('portée : branchée sur les lieux de la Route (portée = brouillard + marge), toit et murs de l\'atelier exceptés, objets et pierres dorées marqués', async () => {
  const fs = await import('node:fs');
  const l = fs.readFileSync(new URL('../../voyage/js/route/lieux-3d.js', import.meta.url), 'utf8');
  assert.match(l, /majPortee\(groupe\.children, joueur\.x, joueur\.z, Math\.max\(320, scene\.fog\.far \+ 120\), \[toitAt, mursAt\]\)/);
  assert.match(l, /meshes\[id\]\.userData\.retire = true/); assert.match(l, /gemmes\[id\]\.userData\.retire = !v/);
});
