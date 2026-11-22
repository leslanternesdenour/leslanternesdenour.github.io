// Vérification de TOUS les audios des jeux (lecture seule, aucun appel ElevenLabs, aucun crédit) :
// texte du manifeste = texte source du jeu ; fichier présent, lisible (MP3), durée plausible pour le texte ; voix = voix du rôle = l'une des 10 voix « Nour » ;
// mots arabes = « prononciation à valider ». Sortie : tableau de correspondance (voix, identifiant, personnage, nombre d'audios) -> docs/VOIX-ATTRIBUTION.md
import fs from 'fs'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url'; import { execFileSync } from 'child_process';
import { JEUX } from './inventaire.mjs';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'), lire = f => JSON.parse(fs.readFileSync(path.join(RACINE, f), 'utf8'));
const NOUR = lire('outils/voix/jeux/voix-nour.json'), ROLES = lire('outils/voix/jeux/voix-roles.json'), IDS = new Map(NOUR.voix.map(v => [v.id, v.nom]));
const problemes = [], compte = {}, parJeu = {}; let total = 0, arabes = 0;
for (const [jeu, src] of Object.entries(JEUX)) {
  const m = lire(`audio/jeux/${jeu}/manifeste.json`), source = (await import(pathToFileURL(path.join(RACINE, src)).href)).inventaire(); parJeu[jeu] = m.phrases.length;
  if (m.phrases.length !== source.length) problemes.push(`${jeu} : manifeste ≠ source`);
  for (const p of m.phrases) {
    total++; const s = source.find(x => x.id === p.id); if (!s || s.texte !== p.texte || s.role !== p.role) problemes.push(`${jeu}/${p.id} : texte ou rôle différent de la source`);
    if (!p.fichier) { problemes.push(`${jeu}/${p.id} : pas d'audio`); continue; }
    const f = path.join(RACINE, 'audio/jeux', jeu, p.fichier); if (!fs.existsSync(f)) { problemes.push(`${jeu}/${p.id} : fichier absent`); continue; }
    const t = fs.statSync(f).size; if (t < 2000) problemes.push(`${jeu}/${p.id} : fichier trop petit`);
    const b = fs.readFileSync(f); if (!(b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) && !(b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) problemes.push(`${jeu}/${p.id} : pas un MP3`);
    let d = p.duree; try { d = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim()); } catch (e) {}
    if (Math.abs(d - p.duree) > 0.3) problemes.push(`${jeu}/${p.id} : durée du manifeste (${p.duree}) ≠ fichier (${d.toFixed(2)})`);
    const cps = p.texte.length / d; if (p.langue === 'fr' && p.texte.length > 25 && (cps < 5 || cps > 24)) problemes.push(`${jeu}/${p.id} : durée suspecte (${cps.toFixed(1)} car./s)`);
    if (p.voixId !== ROLES[p.role]) problemes.push(`${jeu}/${p.id} : voix ${p.voixId} ≠ voix du rôle ${p.role}`);
    if (!IDS.has(p.voixId)) problemes.push(`${jeu}/${p.id} : VOIX NON AUTORISÉE ${p.voixId}`);
    if (p.langue === 'ar') { arabes++; if (p.prononciationVerifiee !== false) problemes.push(`${jeu}/${p.id} : arabe sans statut « à valider »`); }
    const k = p.voixId + '|' + p.role; compte[k] = compte[k] || { id: p.voixId, role: p.role, n: 0, jeux: {} }; compte[k].n++; compte[k].jeux[jeu] = (compte[k].jeux[jeu] || 0) + 1;
  }
}
console.log(`${total} audios contrôlés (${Object.entries(parJeu).map(([j, n]) => j + ' ' + n).join(', ')}) ; mots arabes « à valider » : ${arabes}`);
console.log('VOIX | IDENTIFIANT | PERSONNAGE / RÔLE | AUDIOS');
for (const v of Object.values(compte).sort((a, b) => b.n - a.n)) console.log(`${IDS.get(v.id) || '⚠ INCONNUE'} | ${v.id} | ${v.role} | ${v.n} (${Object.entries(v.jeux).map(([j, n]) => j + ' ' + n).join(', ')})`);
console.log(problemes.length ? 'PROBLÈMES :\n' + problemes.join('\n') : 'AUCUN PROBLÈME');
fs.writeFileSync(path.join(RACINE, 'audio/jeux/.verification.json'), JSON.stringify({ total, parJeu, compte: Object.values(compte), problemes, arabes }, null, 1));
process.exit(problemes.length ? 1 : 0);
