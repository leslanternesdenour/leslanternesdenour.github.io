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

test('Voix des candidats de synthèse : EXACTEMENT les 10 voix « Nour » de voix-nour.json (aucune autre), chacune dans son sous-dossier interne ; les enregistrements humains gardent le chemin principal', async () => {
  const fs = await import('node:fs'), { fileURLToPath } = await import('node:url');
  const autorisees = JSON.parse(fs.readFileSync(fileURLToPath(new URL('../voix/jeux/voix-nour.json', import.meta.url)), 'utf8')).voix;
  assert.equal(autorisees.length, 10);
  assert.deepEqual(Object.values(donnees.VOIX_NOUR).map(v => v.id).sort(), autorisees.map(v => v.id).sort(), 'ni plus, ni moins, ni autre voix que les 10 voix Nour');
  assert.equal(donnees.urlCandidat('tha', 'nom', 'karim'), 'outils/voix/lettres-candidats/_synthese/karim/tha/nom.mp3');
  assert.equal(donnees.urlCandidat('tha', 'nom'), 'outils/voix/lettres-candidats/tha/nom.mp3');
  for (const [cle, v] of Object.entries(donnees.VOIX_NOUR)) assert.ok(/^[a-z]+$/.test(cle) && v.nom.startsWith('Nour - '), cle);
});

test('Plan de génération : 1 120 clips (112 × 10 voix Nour), voix identifiée dans chaque clip, jamais d\'écrasement, caractères comptés d\'avance', async () => {
  const { planGeneration, caracteres } = await import('../voix/lettres-validation/generation.js');
  const f = donnees.fiche(ALPHABET);
  const plan = planGeneration(f, donnees.VOIX_NOUR, donnees.MODELE_SYNTHESE, new Set());
  assert.equal(plan.length, 1120);
  const un = plan.find(j => j.voix === 'karim' && j.id === 'tha' && j.element === 'fatha');
  assert.equal(un.fichier, 'outils/voix/lettres-candidats/_synthese/karim/tha/fatha.mp3');
  assert.equal(un.voixId, donnees.VOIX_NOUR.karim.id);
  assert.deepEqual(un.corps, { text: 'ثَ', model_id: donnees.MODELE_SYNTHESE.model_id, voice_settings: donnees.MODELE_SYNTHESE.reglages });
  assert.equal(new Set(plan.map(j => j.voixId)).size, 10, 'les 10 voix, pas une de plus');
  const deja = new Set(['outils/voix/lettres-candidats/_synthese/karim/ba/nom.mp3']);
  assert.equal(planGeneration(f, donnees.VOIX_NOUR, donnees.MODELE_SYNTHESE, deja).length, 1119, 'un fichier existant n\'est jamais regénéré ni écrasé');
  assert.equal(caracteres(plan), plan.reduce((s, j) => s + [...j.corps.text].length, 0));
  assert.ok(caracteres(plan) < 6000, 'volume très faible de crédits : ' + caracteres(plan));
});

// ---- exécution du plan (ElevenLabs simulé : aucun réseau, aucune clé) ----
const jobs = () => [
  { voix: 'karim', voixId: donnees.VOIX_NOUR.karim.id, voixNom: donnees.VOIX_NOUR.karim.nom, id: 'ba', element: 'nom', fichier: 'outils/voix/lettres-candidats/_synthese/karim/ba/nom.mp3', corps: { text: 'بَاء', model_id: 'm' } },
  { voix: 'layla', voixId: donnees.VOIX_NOUR.layla.id, voixNom: donnees.VOIX_NOUR.layla.nom, id: 'tha', element: 'fatha', fichier: 'outils/voix/lettres-candidats/_synthese/layla/tha/fatha.mp3', corps: { text: 'ثَ', model_id: 'm' } }
];
test('Exécution : chaque clip est écrit, et le manifeste dit quelle voix Nour l\'a généré', async () => {
  const { executerPlan } = await import('../voix/lettres-validation/executer.js');
  const ecrits = [];
  const r = await executerPlan(jobs(), { appeler: async () => ({ ok: true, status: 200, octets: Buffer.from('mp3') }), ecrire: async (f, o) => { ecrits.push(f); }, existe: () => false, pause: async () => {} });
  assert.equal(r.faits, 2);
  assert.deepEqual(ecrits, jobs().map(j => j.fichier));
  const c = r.clips['outils/voix/lettres-candidats/_synthese/layla/tha/fatha.mp3'];
  assert.deepEqual([c.voix, c.voixId, c.voixNom, c.lettre, c.element, c.texte, c.modele], ['layla', donnees.VOIX_NOUR.layla.id, 'Nour - Layla (tisserande)', 'tha', 'fatha', 'ثَ', 'm']);
});

test('Exécution : un fichier déjà présent n\'est jamais regénéré ni écrasé, et ne coûte aucun appel', async () => {
  const { executerPlan } = await import('../voix/lettres-validation/executer.js');
  let appels = 0; const ecrits = [];
  const present = jobs()[0].fichier;
  const r = await executerPlan(jobs(), { appeler: async () => { appels++; return { ok: true, status: 200, octets: Buffer.from('x') }; }, ecrire: async f => { ecrits.push(f); }, existe: f => f === present, pause: async () => {} });
  assert.equal(appels, 1);
  assert.deepEqual(ecrits, [jobs()[1].fichier]);
  assert.equal(r.faits, 1);
});

test('Exécution : au premier échec de l\'API, arrêt immédiat (aucun autre appel), message sans secret', async () => {
  const { executerPlan } = await import('../voix/lettres-validation/executer.js');
  let appels = 0;
  const r = await executerPlan(jobs(), { appeler: async () => { appels++; return { ok: false, status: 401, message: 'clé refusée' }; }, ecrire: async () => { throw new Error('rien à écrire'); }, existe: () => false, pause: async () => {} });
  assert.equal(appels, 1);
  assert.equal(r.faits, 0);
  assert.deepEqual([r.erreur.status, r.erreur.voix, r.erreur.lettre, r.erreur.element, r.erreur.message], [401, 'karim', 'ba', 'nom', 'clé refusée']);
});

test('Exécution : limite de débit (429) → pause puis nouvelle tentative, et le clip est écrit', async () => {
  const { executerPlan } = await import('../voix/lettres-validation/executer.js');
  let appels = 0, pauses = 0;
  const r = await executerPlan([jobs()[0]], { appeler: async () => ++appels < 3 ? { ok: false, status: 429, message: 'trop vite' } : { ok: true, status: 200, octets: Buffer.from('x') }, ecrire: async () => {}, existe: () => false, pause: async () => { pauses++; } });
  assert.equal(r.faits, 1); assert.equal(appels, 3); assert.equal(pauses, 2);
});

// ---- orchestration (ElevenLabs et fichiers simulés) ----
const reponse = (corps, statut = 200, octets) => ({ ok: statut < 400, status: statut, json: async () => corps, arrayBuffer: async () => (octets || Buffer.from('mp3')).buffer.slice(0) });
const voixDuCompte = () => Object.values(donnees.VOIX_NOUR).map(v => ({ voice_id: v.id, name: v.nom }));
const fsFictif = () => { const f = new Map(); return { f, existe: p => f.has(p), ecrire: async (p, d) => { f.set(p, d); }, lire: async p => f.get(p) }; };
test('Orchestration : si une des 10 voix manque ou a changé de nom dans le compte, arrêt AVANT toute génération (aucun appel de synthèse)', async () => {
  const { lancer } = await import('../voix/lettres-validation/lancer.js');
  const appels = []; const compte = voixDuCompte().slice(1);
  const api = async (chemin, opts) => { appels.push(chemin); return chemin === '/v1/voices' ? reponse({ voices: compte }) : reponse({}, 500); };
  const r = await lancer({ cle: 'cle-factice', args: [], api, fs: fsFictif() });
  assert.equal(r.code, 1);
  assert.ok(!appels.some(c => c.startsWith('/v1/text-to-speech')), 'aucune synthèse lancée');
});

test('Orchestration : petit lot (lettre ba, voix karim) → 4 clips avec la bonne voix, manifeste écrit, clé jamais dans le compte rendu', async () => {
  const { lancer } = await import('../voix/lettres-validation/lancer.js');
  const tts = []; const fs = fsFictif();
  const api = async (chemin, opts) => {
    if (chemin === '/v1/voices') return reponse({ voices: voixDuCompte() });
    if (chemin === '/v1/user/subscription') return reponse({ character_limit: 100000, character_count: 10 });
    tts.push({ chemin, corps: JSON.parse(opts.body) }); return reponse({}, 200, Buffer.from('mp3'));
  };
  const r = await lancer({ cle: 'cle-factice-secrete', args: ['--lettres', 'ba', '--voix', 'karim'], api, fs });
  assert.equal(r.code, 0);
  assert.equal(tts.length, 4);
  assert.ok(tts.every(t => t.chemin.startsWith('/v1/text-to-speech/' + donnees.VOIX_NOUR.karim.id)));
  assert.ok(fs.f.has('outils/voix/lettres-candidats/_synthese/karim/ba/nom.mp3') && fs.f.has('outils/voix/lettres-candidats/_synthese/karim/ba/kasra.mp3'));
  const manif = JSON.parse(fs.f.get('outils/voix/lettres-candidats/_synthese/manifeste.json'));
  assert.equal(manif.clips['outils/voix/lettres-candidats/_synthese/karim/ba/nom.mp3'].voixNom, 'Nour - Karim (marchand)');
  assert.doesNotMatch(r.journal.join('\n') + JSON.stringify(manif), /cle-factice-secrete/);
});

test('Orchestration : crédits insuffisants (marge de sécurité ×2) → arrêt avant toute synthèse', async () => {
  const { lancer } = await import('../voix/lettres-validation/lancer.js');
  let tts = 0;
  const api = async chemin => chemin === '/v1/voices' ? reponse({ voices: voixDuCompte() }) : chemin === '/v1/user/subscription' ? reponse({ character_limit: 1000, character_count: 990 }) : (tts++, reponse({}));
  const r = await lancer({ cle: 'cle-factice', args: ['--lettres', 'ba', '--voix', 'karim'], api, fs: fsFictif() });
  assert.equal(r.code, 1);
  assert.equal(tts, 0);
  assert.match(r.journal.join(' '), /crédits|Solde/i);
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
