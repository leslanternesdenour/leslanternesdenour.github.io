// RÉCUPÉRATION du pack Premium du Grand Voyage à partir de l'HISTORIQUE GIT (aucun contenu inventé).
//
// Le 21/11/2026 (commit 1ea5dbf « Bloc 3 »), les textes, versets, descriptions et les 21 voix des zones Premium ont été retirés du dépôt
// public et déplacés dans un pack privé qui n'existe plus sur aucune machine. Les originaux sont restés dans l'historique Git :
// ce script les relit TELS QUELS dans le commit précédent (1ea5dbf^) et les range dans le format du pack (« ldn-pack-voyage-1 »).
//
// Utilisation : node outils/recuperation/reconstituer-pack-voyage.mjs [dossier-de-sortie]   (défaut : ../premium-lanternes, hors dépôt)
// Refuse d'écraser un dossier non vide. Ne touche ni au dépôt, ni à R2.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const AVANT = '1ea5dbf^';
const SORTIE = path.resolve(process.argv[2] || path.join(RACINE, '..', 'premium-lanternes'));
if (SORTIE === RACINE || SORTIE.startsWith(RACINE + path.sep)) { console.error('Refusé : le pack est PRIVÉ, il ne doit jamais être écrit dans le dépôt.'); process.exit(1); }
if (fs.existsSync(SORTIE) && fs.readdirSync(SORTIE).length) { console.error('Refusé : ' + SORTIE + ' existe et n\'est pas vide (rien n\'est écrasé).'); process.exit(1); }

// Dans quelle zone se range chaque contenu (d'après les clés de contenu.js, `premium: <zone>`, et les quêtes de quetes.js).
const ZONE_DES_SPOTS = { wadi: 'wadi', gravures: 'rochers' };
// Voix des lieux (descriptions courtes) : DEC-028 à 032 ; voir contenu.js / main.js du commit précédent.
const VOIX_LIEU = { camp: 'NOUR-VOIX-DEC-028', dunes: 'NOUR-VOIX-DEC-029', montagnes: 'NOUR-VOIX-DEC-030', wadi: 'NOUR-VOIX-DEC-031', rochers: 'NOUR-VOIX-DEC-032' };
const DESCRIPTIONS_D_ORIGINE = {
  camp: 'Le camp où les caravanes se reposent le soir, près du feu, sous les tentes.',
  dunes: 'Le grand désert de sable, où le vent dessine des dunes et des vagues.',
  montagnes: 'Les montagnes de pierre, au nord du pays. Il y fait plus frais.',
  wadi: 'Le lit d\'une rivière souvent à sec, qui se couvre de fleurs après la pluie.',
  rochers: 'De gros rochers rouges, couverts de gravures très anciennes.'
};

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ldn-histo-'));
const archive = execFileSync('git', ['archive', AVANT, 'voyage/js', 'monde/socle', 'audio/voix.json', 'audio/fr/decouvertes'], { cwd: RACINE, maxBuffer: 1 << 30 });
fs.writeFileSync(path.join(tmp, 'a.tar'), archive); execFileSync('tar', ['-xf', 'a.tar'], { cwd: tmp });

const { POINTS } = await import(pathToFileURL(path.join(tmp, 'voyage/js/contenu.js')).href);
const { SPOTS } = await import(pathToFileURL(path.join(tmp, 'voyage/js/quetes.js')).href);
const { PHRASES } = await import(pathToFileURL(path.join(tmp, 'voyage/js/voix-textes.js')).href);
const VOIX = JSON.parse(fs.readFileSync(path.join(tmp, 'audio/voix.json'), 'utf8'));

// Les 21 phrases Premium : NOUR-VOIX-DEC-005 à 011, 013, 014, 028 à 039 (liste donnée par le commit 1ea5dbf lui-même).
const IDS = [5, 6, 7, 8, 9, 10, 11, 13, 14, ...Array.from({ length: 12 }, (_, i) => 28 + i)].map(n => 'NOUR-VOIX-DEC-' + String(n).padStart(3, '0'));
const phrase = id => { const p = PHRASES.find(x => x[0] === id); if (!p) throw new Error('phrase absente : ' + id); return p; };
const norm = t => String(t).replace(/\s+/g, ' ').trim();
const ZONES = ['camp', 'dunes', 'montagnes', 'wadi', 'rochers'];
const attribuees = new Set(), packs = {};
for (const zone of ZONES) {
  const points = {}; const textes = [];
  for (const [k, p] of Object.entries(POINTS)) if (['wadi', 'rochers', 'camp', 'dunes', 'etoiles', 'montagnes'].includes(k) && (k === zone || (k === 'etoiles' && zone === 'dunes'))) {
    points[k] = {}; for (const c of ['texte', 'arabe', 'sens', 'source', 'decouverte']) if (typeof p[c] === 'string') points[k][c] = p[c];
    textes.push(p.texte);
  }
  const spots = {}; for (const s of SPOTS) if (ZONE_DES_SPOTS[s.quete] === zone) { spots[s.id] = { texte: s.texte }; textes.push(s.texte); }
  textes.push(DESCRIPTIONS_D_ORIGINE[zone]);
  packs[zone] = { format: 'ldn-pack-voyage-1', zone, points, lieu: DESCRIPTIONS_D_ORIGINE[zone], spots, phrases: [], voix: {} };
  // phrases de la zone : texte identique à un texte de la zone, ou « sens du verset » d'un de ses lieux
  for (const id of IDS) {
    const [, t] = phrase(id); const n = norm(t);
    const sensDeLaZone = Object.values(points).some(p => p.sens && norm(p.sens).replace(/^Sens du verset : /, '') === n.replace(/^Le sens de ce verset : /, ''));
    if (textes.some(x => norm(x) === n) || sensDeLaZone) { if (attribuees.has(id)) throw new Error('phrase en double : ' + id); attribuees.add(id); packs[zone].phrases.push(phrase(id)); }
  }
}
const manquantes = IDS.filter(id => !attribuees.has(id));
if (manquantes.length) { console.error('Phrases non rattachées à une zone : ' + manquantes.join(', ')); process.exit(1); }
for (const [zone, id] of Object.entries(VOIX_LIEU)) if (!packs[zone].phrases.some(p => p[0] === id)) { console.error('Voix du lieu non rattachée : ' + zone); process.exit(1); }

let mp3 = 0;
for (const zone of ZONES) {
  const dossier = path.join(SORTIE, 'voyage', zone); fs.mkdirSync(path.join(dossier, 'voix'), { recursive: true });
  for (const [id] of packs[zone].phrases) {
    const v = VOIX[id]; if (!Array.isArray(v)) throw new Error('voix absente de audio/voix.json : ' + id);
    const nom = path.basename(v[0]); fs.copyFileSync(path.join(tmp, 'audio', v[0]), path.join(dossier, 'voix', nom)); mp3++;
    packs[zone].voix[id] = ['/api/premium/voyage/' + zone + '/voix/' + nom, v[1], v[2]];   // adresse servie par /api/premium (voir monde/socle/voix.js)
  }
  fs.writeFileSync(path.join(dossier, 'contenu.json'), JSON.stringify(packs[zone], null, 2) + '\n');
}
fs.rmSync(tmp, { recursive: true, force: true });
fs.writeFileSync(path.join(SORTIE, 'LISEZMOI.txt'), 'Pack Premium du Grand Voyage, RÉCUPÉRÉ depuis l\'historique Git (commit 1ea5dbf^) par outils/recuperation/reconstituer-pack-voyage.mjs.\n' +
  'Textes, versets, descriptions et voix identiques aux originaux retirés du dépôt public le 21/11/2026. Aucun contenu ajouté.\n' +
  'NON récupérés (jamais présents dans Git) : maisons/mots (index.html, jeu.css, jeu.js, mots.json).\nCe dossier est PRIVÉ : ne jamais le copier dans le dépôt.\n');
console.log(`Pack reconstitué dans ${SORTIE} : ${ZONES.length} zones, ${mp3} voix (${IDS.length} attendues).`);
if (mp3 !== IDS.length) process.exit(1);
