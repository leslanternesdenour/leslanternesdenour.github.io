// Production des voix de la Route (ElevenLabs) — À LANCER À LA MAIN, jamais depuis le jeu.
//   node outils/voix/route/produire-route.mjs --dry          compte les phrases et les caractères ; n'appelle RIEN, ne coûte rien
//   node outils/voix/route/produire-route.mjs [--max 40]     génère ce qui manque (saute tout ce qui existe déjà : aucun crédit gaspillé)
// Garanties : seules les 10 voix « Nour » de voix-nour.json sont utilisées (sinon REFUSÉ, rien n'est généré) ; aucune voix n'est créée, clonée ni modifiée ;
// la clé API n'est lue que dans .env.local et n'est jamais affichée ; aucun texte « À VALIDER » ni religieux n'est dans l'inventaire (voir inventaire-route.mjs).
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url'; import { execFileSync } from 'child_process';
import { inventaire } from './inventaire-route.mjs';
const ICI = path.dirname(fileURLToPath(import.meta.url)), RACINE = path.resolve(ICI, '../../..');
const opts = process.argv.slice(2), dry = opts.includes('--dry'), max = opts.includes('--max') ? Number(opts[opts.indexOf('--max') + 1]) : Infinity;
const AUTORISEES = JSON.parse(fs.readFileSync(path.join(ICI, '../jeux/voix-nour.json'), 'utf8')).voix;
const roles = JSON.parse(fs.readFileSync(path.join(ICI, '../jeux/voix-roles.json'), 'utf8')), R = roles.reglages;
const liste = await inventaire();
// GARDE-FOU : chaque rôle utilisé doit être l'une des 10 voix « Nour »
for (const r of new Set(liste.map(p => p.role))) if (!roles[r] || !AUTORISEES.some(a => a.id === roles[r])) { console.error(`REFUSÉ : le rôle « ${r} » n'utilise pas une voix Nour autorisée. Rien n'est généré.`); process.exit(1); }
const REGISTRE = path.join(RACINE, 'audio/route-voix.json'), DOSSIER = path.join(RACINE, 'audio/fr/route');
const registre = fs.existsSync(REGISTRE) ? JSON.parse(fs.readFileSync(REGISTRE, 'utf8')) : {};
const fichierDe = p => 'fr/route/' + p.id.toLowerCase() + '.mp3';
const aFaire = liste.filter(p => !(registre[p.id] && fs.existsSync(path.join(RACINE, 'audio', fichierDe(p)))));
const car = aFaire.reduce((s, p) => s + p.texte.length, 0);
console.log(`${liste.length} phrases dans l'inventaire ; ${liste.length - aFaire.length} déjà enregistrées ; ${aFaire.length} à générer (${car} caractères)`);
// la table des phrases du jeu et le manifeste d'écoute : toujours réécrits (sans coût)
function ecrireTables() {
  const sacre = p => /^(recit|sacre):/.test(p.source), toutes = liste.filter(p => registre[p.id]);
  const phrases = toutes.filter(p => !sacre(p)).map(p => [p.id, p.texte, 'exact']);
  // les récits et les lieux religieux validés vont dans leur PROPRE fichier « …-a-valider.js » : le contenu religieux ne se mélange jamais au reste du code
  fs.writeFileSync(path.join(RACINE, 'voyage/js/route/voix-recits-a-valider.js'), '// GÉNÉRÉ par outils/voix/route/produire-route.mjs — ne pas modifier à la main.\n// Les voix Nour des récits et des lieux religieux ou historiques VALIDÉS par le créateur (voir validation-contenu.js). Aucun verset récité.\nexport const PHRASES_RECITS = ' + JSON.stringify(toutes.filter(sacre).map(p => [p.id, p.texte, 'exact']), null, 1) + ';\n');
  fs.writeFileSync(path.join(RACINE, 'voyage/js/route/voix-route.js'), '// GÉNÉRÉ par outils/voix/route/produire-route.mjs — ne pas modifier à la main.\n// Les phrases de la Route qui ont une voix Nour enregistrée (jamais de récit « À VALIDER », jamais de contenu religieux, aucun mot arabe).\nexport const PHRASES_ROUTE = ' + JSON.stringify(phrases, null, 1) + ';\n');
  const manif = { jeu: 'route-voix', base: '/audio', total: toutes.length, phrases: toutes.map(p => ({ id: p.id, role: p.role, langue: 'fr', texte: p.texte, fichier: registre[p.id][0], duree: registre[p.id][2], prononciationVerifiee: false, voixId: roles[p.role] })) };
  fs.writeFileSync(path.join(RACINE, 'outils/voix/lettres-validation/manifestes/route-voix.json'), JSON.stringify(manif, null, 1));
  fs.writeFileSync(REGISTRE, JSON.stringify(registre, null, 1));
}
if (dry) { ecrireTables(); process.exit(0); }
const cle = ((fs.readFileSync(path.join(RACINE, '.env.local'), 'utf8').match(/^ELEVENLABS_API_KEY=(.+)$/m) || [])[1] || '').trim();
if (!cle) { console.error('Clé ElevenLabs absente de .env.local : rien généré.'); process.exit(1); }
const entetes = { 'xi-api-key': cle, 'Content-Type': 'application/json' };
// Contrôle : chaque voix doit exister dans le compte (aucune voix n'est créée ici)
{ const r = await fetch('https://api.elevenlabs.io/v1/voices', { headers: entetes }); if (!r.ok) { console.error('Accès ElevenLabs indisponible (' + r.status + ') : rien généré.'); process.exit(1); }
  const compte = (await r.json()).voices;
  for (const a of AUTORISEES) { const c = compte.find(v => v.voice_id === a.id); if (!c || c.name !== a.nom) { console.error('Voix « Nour » introuvable ou renommée dans le compte :', a.nom); process.exit(1); } } }
fs.mkdirSync(DOSSIER, { recursive: true });
let n = 0;
for (const p of aFaire) {
  if (n >= max) break;
  const sortie = path.join(DOSSIER, p.id.toLowerCase() + '.mp3');
  if (fs.existsSync(sortie) && fs.statSync(sortie).size > 2000) { /* fichier déjà là : on ne régénère pas */ } else {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${roles[p.role]}?output_format=mp3_44100_64`, { method: 'POST', headers: entetes,
      body: JSON.stringify({ text: p.texte, model_id: R.model_id, voice_settings: { stability: R.stability, similarity_boost: R.similarity_boost, style: R.style, use_speaker_boost: true, speed: R.speed } }) });
    if (!res.ok) { console.error('ERREUR', p.id, res.status); continue; }
    const buf = Buffer.from(await res.arrayBuffer()); if (buf.length < 2000) { console.error('ERREUR', p.id, 'fichier trop petit'); continue; }
    fs.writeFileSync(sortie, buf);
  }
  let duree = 0; try { duree = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', sortie]).toString().trim()); } catch (e) { duree = fs.statSync(sortie).size / 8000; }
  registre[p.id] = [fichierDe(p), 0, +duree.toFixed(2)]; n++; console.log('OK', p.id, p.role, duree.toFixed(1) + ' s');
  if (n % 20 === 0) ecrireTables();     // on garde le travail fait si quelque chose s'interrompt
}
ecrireTables(); console.log(n + ' phrase(s) générée(s).');
