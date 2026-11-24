// Parcours Nourania (préproduction) : carte des niveaux, statuts des clips, stockage séparé. node --test outils/tests/nourania.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { NIVEAUX } from '../../ecole-arabe/nourania/donnees/parcours.js';

test('les niveaux suivent la progression, du n0 au n8', () => {
  assert.deepEqual(NIVEAUX.map(n => n.id), ['n0', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8']);
});

test('chaque niveau porte son étape pédagogique, sans mélange', () => {
  assert.deepEqual(NIVEAUX.map(n => n.etape), ['reconnaissance', 'nom', 'son', 'fatha', 'kasra', 'damma', 'combinaisons', 'syllabes', 'exercices']);
});

test('seul un clip validé par un humain est jouable dans le parcours', async () => {
  const { jouable } = await import('../../ecole-arabe/nourania/donnees/parcours.js');
  assert.equal(jouable('valide_humain'), true);
  assert.equal(jouable('a_valider'), false);
  assert.equal(jouable('refuse'), false);
  assert.equal(jouable(undefined), false);
});

test("la progression du parcours a sa propre clé de stockage, distincte de celles des écoles et du profil", async () => {
  const { CLE_STOCKAGE } = await import('../../ecole-arabe/nourania/donnees/parcours.js');
  assert.equal(CLE_STOCKAGE, 'ecole_nourania_v1');
  for (const existante of ['ecole_lettres', 'ecole_lecture', 'ecole_chiffres', 'ldn_profil_actif', 'monde']) assert.notEqual(CLE_STOCKAGE, existante);
});

test('les niveaux nom, fatha, kasra et damma couvrent les 112 clips de référence, 28 par niveau', async () => {
  const { clipsDuNiveau } = await import('../../ecole-arabe/nourania/donnees/parcours.js');
  const tous = ['n1', 'n3', 'n4', 'n5'].flatMap(n => clipsDuNiveau(n));
  assert.equal(tous.length, 112);
  assert.equal(new Set(tous).size, 112);
  assert.deepEqual(clipsDuNiveau('n1').slice(0, 2), ['nom.alif', 'nom.ba']);
  assert.equal(clipsDuNiveau('n4')[1], 'kasra.ba');
  assert.deepEqual(clipsDuNiveau('n6'), []);
});

test("le niveau « son » donne un repère d'articulation aux 11 lettres difficiles, et à elles seules", async () => {
  const { LETTRES_DIFFICILES, besoinRepere } = await import('../../ecole-arabe/nourania/donnees/parcours.js');
  assert.deepEqual([...LETTRES_DIFFICILES].sort(), ['ayn', 'dad', 'dhal', 'ghayn', 'ha', 'kha', 'qaf', 'sad', 'ta2', 'tha', 'za2']);
  assert.equal(besoinRepere('qaf'), true);
  assert.equal(besoinRepere('ba'), false);
});
