// Données de la page de validation des prononciations des 28 lettres (outil interne, préproduction seulement). node --test outils/tests/lettres-validation.test.mjs
import test from 'node:test'; import assert from 'node:assert/strict';
import { ALPHABET } from '../../ecole-arabe/commun/langue/alphabet.js';
import { MAKHRAJ } from '../voix/lettres-validation/donnees.js';
import * as donnees from '../voix/lettres-validation/donnees.js';

test('Fiche d\'enregistrement : 4 clips par lettre (nom, fatha, damma, kasra), 112 fichiers aux noms uniques, textes arabes vocalisés exacts', () => {
  const f = donnees.fiche(ALPHABET);
  assert.equal(f.length, 112);
  assert.equal(new Set(f.map(x => x.fichier)).size, 112, 'noms de fichiers uniques');
  const de = (id, el) => f.find(x => x.id === id && x.element === el);
  assert.equal(de('ba', 'nom').texte, 'بَاء');
  assert.deepEqual(['fatha', 'damma', 'kasra'].map(v => de('ba', v).texte), ['بَ', 'بُ', 'بِ']);
  assert.deepEqual(['fatha', 'damma', 'kasra'].map(v => de('alif', v).texte), ['ءَ', 'ءُ', 'ءِ'], 'l\'alif porte ses voyelles par la hamza');
  assert.equal(de('tha', 'kasra').fichier, 'tha/kasra.mp3');
});

test('Audios actuels (en lecture seule) : le nom et le son « fatha » existent pour les 28 lettres ; les candidats ont leur propre dossier interne, jamais celui du site', async () => {
  const fs = await import('node:fs'), path = await import('node:path'), { fileURLToPath } = await import('node:url');
  const racine = fileURLToPath(new URL('../../', import.meta.url));
  for (const a of ALPHABET) {
    const x = donnees.audioActuel(a.id);
    assert.ok(fs.existsSync(path.join(racine, x.nom)), x.nom);
    assert.ok(fs.existsSync(path.join(racine, x.fatha)), x.fatha);
  }
  assert.equal(donnees.urlCandidat('ba', 'damma'), 'outils/voix/lettres-candidats/ba/damma.mp3');
  assert.ok(!donnees.urlCandidat('ba', 'damma').startsWith('audio/'), 'jamais dans le dossier audio du site (publié en production)');
});

test('Lettres proches à comparer : groupes valides, et toutes les lettres difficiles citées (ث ح خ ذ ص ض ط ظ ع غ ق) y figurent', () => {
  const ids = new Set(ALPHABET.map(a => a.id));
  for (const g of donnees.PROCHES) { assert.ok(g.ids.length >= 2 && g.titre); for (const id of g.ids) assert.ok(ids.has(id), id); }
  const couverts = new Set(donnees.PROCHES.flatMap(g => g.ids));
  for (const id of ['tha', 'ha', 'kha', 'dhal', 'sad', 'dad', 'ta2', 'za2', 'ayn', 'ghayn', 'qaf']) assert.ok(couverts.has(id), id + ' à comparer');
});

test('Point d\'articulation : une indication (arabe + français) pour chacune des 28 lettres de la référence, et aucune lettre inconnue', () => {
  const ids = ALPHABET.map(a => a.id);
  assert.equal(ids.length, 28);
  assert.deepEqual(Object.keys(MAKHRAJ).sort(), [...ids].sort());
  for (const id of ids) {
    assert.ok(MAKHRAJ[id].ar && /[؀-ۿ]/.test(MAKHRAJ[id].ar), id + ' : indication en arabe');
    assert.ok(MAKHRAJ[id].fr && MAKHRAJ[id].fr.length > 15, id + ' : indication en français');
  }
});
