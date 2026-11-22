// Production des audios d'un jeu (ElevenLabs) — À LANCER À LA MAIN, une fois les textes relus, jamais depuis le jeu.
// Utilisation : node outils/voix/jeux/produire.mjs <jeu> --dry          (compte les caractères et les phrases ; n'appelle RIEN, ne coûte rien)
//               node outils/voix/jeux/produire.mjs <jeu> [--role narratrice] [--max 40]     (génère ; saute tout ce qui existe déjà)
// Garanties : ne régénère jamais une phrase déjà enregistrée (même texte) ; ne crée aucune voix ; n'enregistre le fichier dans le manifeste qu'APRÈS l'avoir écrit
// et contrôlé (taille, durée) ; les phrases arabes et les textes religieux restent « prononciationVerifiee: false » jusqu'à l'écoute par le fondateur.
// La clé API n'est jamais dans ce script : le proxy de la session l'injecte (lancer avec NODE_USE_ENV_PROXY=1 pour que Node utilise ce proxy).
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url'; import { execFileSync } from 'child_process';
import { construire } from './inventaire.mjs';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const [jeu, ...opts] = process.argv.slice(2); if (!jeu) { console.error('Indiquer le jeu (ex. chasse-aux-mots)'); process.exit(1); }
const dry = opts.includes('--dry'), role = opts.includes('--role') ? opts[opts.indexOf('--role') + 1] : null, max = opts.includes('--max') ? Number(opts[opts.indexOf('--max') + 1]) : Infinity;
const roles = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'voix-roles.json'), 'utf8')), R = roles.reglages;
const m = await construire(jeu), dossier = path.join(RACINE, 'audio/jeux', jeu), fich = path.join(dossier, 'manifeste.json');
const aFaire = m.phrases.filter(p => !p.fichier && (!role || p.role === role));
const faisables = aFaire.filter(p => roles[p.role]), sansVoix = aFaire.filter(p => !roles[p.role]);
const car = faisables.reduce((s, p) => s + p.texte.length, 0);
console.log(`${jeu} : ${m.enregistrees}/${m.total} déjà enregistrées ; ${faisables.length} faisables maintenant (${car} caractères) ; ${sansVoix.length} en attente d'une voix choisie (rôles : ${[...new Set(sansVoix.map(p => p.role))].join(', ') || '—'})`);
if (dry) process.exit(0);
// Contrôle : chaque voix attribuée doit exister dans le compte (aucune voix n'est créée ici)
{ const r = await fetch('https://api.elevenlabs.io/v1/voices'); if (!r.ok) { console.error('Accès ElevenLabs indisponible (' + r.status + ') : rien généré. Les textes et le manifeste sont prêts.'); process.exit(0); }
  const ids = new Set((await r.json()).voices.map(v => v.voice_id)); const inconnues = Object.entries(roles).filter(([k, v]) => typeof v === 'string' && !k.startsWith('_') && k !== 'reglages' && !ids.has(v));
  if (inconnues.length) { console.error('Voix introuvables dans le compte :', inconnues.map(([k]) => k).join(', ')); process.exit(1); } }
let n = 0;
for (const p of faisables) {
  if (n >= max) break;
  const fichier = p.id.replace(/[^a-z0-9._-]/gi, '_') + '.mp3', sortie = path.join(dossier, fichier);
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${roles[p.role]}?output_format=mp3_44100_64`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: p.texte, model_id: R.model_id, voice_settings: { stability: R.stability, similarity_boost: R.similarity_boost, style: R.style, use_speaker_boost: true, speed: R.speed }, ...(p.langue === 'ar' ? { language_code: 'ar' } : {}) }) });
  if (!res.ok) { console.error('ERREUR', p.id, res.status, (await res.text()).slice(0, 160)); continue; }
  const buf = Buffer.from(await res.arrayBuffer()); if (buf.length < 2000) { console.error('ERREUR', p.id, 'fichier trop petit'); continue; }
  fs.writeFileSync(sortie, buf);
  let duree = 0; try { duree = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', sortie]).toString().trim()); } catch (e) { duree = buf.length / 8000; }
  const mm = JSON.parse(fs.readFileSync(fich, 'utf8')); const q = mm.phrases.find(x => x.id === p.id); q.fichier = fichier; q.duree = +duree.toFixed(2); q.voixId = roles[p.role]; mm.enregistrees = mm.phrases.filter(x => x.fichier).length; fs.writeFileSync(fich, JSON.stringify(mm, null, 1) + '\n');
  n++; console.log('OK', p.id, q.duree + ' s');
}
console.log(n + ' phrase(s) générée(s).');
