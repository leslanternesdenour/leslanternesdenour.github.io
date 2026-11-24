// Référence linguistique unique (commun/langue/alphabet.js) : les 28 lettres, noms vocalisés, transcriptions, liaisons, familles, mots, audios rattachés explicitement à leur lettre.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'fs'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), imp = p => import(pathToFileURL(path.join(R, p)).href);
const { ALPHABET, NON_LIEES, FAMILLES_JUMELLES, ALIF, VOYELLES } = await imp('ecole-arabe/commun/langue/alphabet.js'), { LETTRES } = await imp('ecole-arabe/lettres/donnees/lettres.js'), { inventaire } = await imp('ecole-arabe/lettres/donnees/audio.js');
const man = JSON.parse(fs.readFileSync(path.join(R, 'audio/jeux/ecole-lettres/manifeste.json'), 'utf8')), roles = JSON.parse(fs.readFileSync(path.join(R, 'outils/voix/jeux/voix-roles.json'), 'utf8')), glyphes = JSON.parse(fs.readFileSync(path.join(R, 'ecole-arabe/lettres/donnees/glyphes.json'), 'utf8'));
// Liste de référence du fondateur (source indépendante du code testé)
const REF = ['ا أَلِف Alif', 'ب بَاء Bā', 'ت تَاء Tā', 'ث ثَاء Thā', 'ج جِيم Jīm', 'ح حَاء Ḥā', 'خ خَاء Khā', 'د دَال Dāl', 'ذ ذَال Dhāl', 'ر رَاء Rā', 'ز زَاي Zāy', 'س سِين Sīn', 'ش شِين Shīn', 'ص صَاد Ṣād', 'ض ضَاد Ḍād', 'ط طَاء Ṭā', 'ظ ظَاء Ẓā', 'ع عَيْن ʿAyn', 'غ غَيْن Ghayn', 'ف فَاء Fā', 'ق قَاف Qāf', 'ك كَاف Kāf', 'ل لَام Lām', 'م مِيم Mīm', 'ن نُون Nūn', 'ه هَاء Hā', 'و وَاو Wāw', 'ي يَاء Yā'].map(s => s.split(' '));
test('28 lettres : caractère, nom arabe vocalisé et transcription conformes à la liste de référence, dans l\'ordre', () => {
  assert.equal(ALPHABET.length, 28);
  REF.forEach(([ar, nom, tr], i) => { const a = ALPHABET[i]; assert.equal(a.num, i + 1); assert.equal(a.ar, ar, 'lettre ' + (i + 1)); assert.equal(a.nomAr, nom, 'nom arabe ' + ar); assert.equal(a.translit, tr, 'transcription ' + ar); });
  assert.equal(new Set(ALPHABET.map(a => a.id)).size, 28); assert.equal(new Set(ALPHABET.map(a => a.ar)).size, 28);
});
test('Alif : « أَلِف » / « Alif », jamais un autre mot ; formes أ إ آ ٱ présentées séparément ; hamza distincte', () => {
  const a = ALPHABET[0]; assert.equal(a.nomAr, 'أَلِف'); assert.equal(a.translit, 'Alif'); assert.deepEqual(ALIF.formes.map(f => f.ar), ['أ', 'إ', 'آ', 'ٱ']); assert.equal(ALIF.hamza.ar, 'ء');
  for (const k of ['hamza_dessus', 'hamza_dessous', 'madda', 'wasla']) assert.ok(glyphes.alifFormes[k].d.length > 50, 'contour ' + k);
  const nom = man.phrases.find(p => p.id === 'nom.alif'); assert.equal(nom.texte, 'أَلِف'); assert.ok(!/oustev/i.test(JSON.stringify(man.phrases.filter(p => p.id.endsWith('.alif'))))); assert.equal(man.phrases.find(p => p.id === 'son.alif').texte, 'ءَ', 'son d\'alif : « أَ » est lu « Ostev » par la synthèse');
});
test('Liaison : seuls ا د ذ ر ز و ne se lient pas (données, formes graphiques et référence cohérentes)', () => {
  assert.deepEqual([...NON_LIEES].sort(), ['alif', 'dal', 'dhal', 'ra', 'waw', 'zay']);
  for (const l of LETTRES) { assert.equal(l.joint, !NON_LIEES.includes(l.id), l.id); const f = Object.keys(glyphes.lettres[l.id]).sort(); assert.deepEqual(f, l.joint ? ['finale', 'initiale', 'isolee', 'mediane'] : ['finale', 'isolee'], 'formes de ' + l.id); }
});
test('Familles de lettres qui se ressemblent : exactement la liste de référence, et chaque lettre garde ses vrais points', () => {
  assert.deepEqual(FAMILLES_JUMELLES, [['ba', 'ta', 'tha'], ['jim', 'ha', 'kha'], ['dal', 'dhal'], ['ra', 'zay'], ['sin', 'shin'], ['sad', 'dad'], ['ta2', 'za2'], ['ayn', 'ghayn'], ['fa', 'qaf']]);
  for (const fam of FAMILLES_JUMELLES) assert.equal(new Set(fam.map(i => ALPHABET.find(a => a.id === i).famille)).size, 1);
  const pts = Object.fromEntries(ALPHABET.map(a => [a.id, a.points.join(':')]));
  assert.deepEqual([pts.ba, pts.ta, pts.tha], ['1:dessous', '2:dessus', '3:dessus']); assert.deepEqual([pts.jim, pts.ha, pts.kha], ['1:dessous', '0:', '1:dessus']); assert.deepEqual([pts.fa, pts.qaf], ['1:dessus', '2:dessus']);
  assert.deepEqual([pts.sin, pts.shin, pts.sad, pts.dad, pts.ta2, pts.za2, pts.ayn, pts.ghayn], ['0:', '3:dessus', '0:', '1:dessus', '0:', '1:dessus', '0:', '1:dessus']);
});
test('Mots d\'exemple : vocalisés, commencent par la bonne lettre, avec une illustration et une traduction', () => {
  const debut = { alif: 'أإآا' }; for (const a of ALPHABET) { const m = a.mot; assert.ok(/[َُِّْ]/.test(m.ar), 'vocalisé ' + a.id); assert.ok((debut[a.id] || a.ar).includes(m.ar[0]), 'initiale ' + a.id + ' ' + m.ar); assert.ok(m.emoji && m.fr && m.tr, a.id); }
  assert.ok(!ALPHABET.some(a => a.mot.fr.includes('huppe')), 'plus d\'illustration approximative (huppe)');
});
test('Noms vocalisés (une voyelle courte au moins) et sons distincts des noms : le son est la lettre + fatha, jamais le nom', () => {
  for (const a of ALPHABET) { assert.ok(/[َُِ]/.test(a.nomAr), a.id); assert.ok(a.syllabe.includes('َ'), 'son = lettre + fatha ' + a.id); assert.notEqual(a.syllabe, a.nomAr); }
});
test('Audios : chaque audio est rattaché EXPLICITEMENT à sa lettre (identifiant), texte = référence, fichier présent, voix autorisée, jamais « vérifié » sans validation humaine', () => {
  const par = Object.fromEntries(man.phrases.map(p => [p.id, p]));
  for (const a of ALPHABET) for (const [k, texte] of [['nom', a.nomAr], ['son', a.syllabeAudio || a.syllabe], ['mot', a.mot.ar]]) {
    const p = par[a.audio[k]]; assert.ok(p, a.id + ' ' + k); assert.equal(p.id, `${k}.${a.id}`); assert.equal(p.texte, texte, `${p.id} : texte audio = référence`); assert.equal(p.langue, 'ar'); assert.equal(p.role, 'narratrice'); assert.equal(p.voixId, roles.narratrice);
    assert.ok(p.fichier && fs.existsSync(path.join(R, 'audio/jeux/ecole-lettres', p.fichier)), 'fichier ' + p.id); assert.ok(p.duree > 0.3 && p.duree < 4, 'durée ' + p.id); assert.equal(p.prononciationVerifiee, a.statut[k] === 'valide', 'statut ' + p.id);
  }
  for (const p of inventaire().filter(x => x.lettre)) assert.equal(par[p.id].lettre, p.lettre, 'lettre associée ' + p.id);
});
test('Voyelles et signes (Jeu 2) : fatha, kasra, damma, soukoun, chadda, tanwin définis', () => { assert.deepEqual(VOYELLES.map(v => v.id), ['fatha', 'kasra', 'damma', 'soukoun', 'chadda', 'tanwin']); });
