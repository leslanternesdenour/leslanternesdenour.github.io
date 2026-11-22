// Inventaire AUDIO d'un jeu des Aventures des Lanternes : génère audio/jeux/<jeu>/manifeste.json à partir des textes du jeu (source unique).
// Utilisation : node outils/voix/jeux/inventaire.mjs            (crée ou met à jour le manifeste ; ne touche JAMAIS aux fichiers déjà enregistrés)
// Chaque phrase : id unique, texte source, rôle vocal, langue, sous-titre (= le texte), fichier (null tant que l'audio n'existe pas), durée, prononciation vérifiée.
// RÈGLE : « fichier » n'est renseigné que par le script de production, quand le fichier existe réellement. Un audio absent n'est jamais annoncé.
import fs from 'fs'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
export const JEUX = { 'chasse-aux-mots': 'aventures/chasse-aux-mots/mots.js', 'mysteres-desert': 'aventures/mysteres-desert/contenu.js', 'quiz-nour': 'aventures/quiz-nour/contenu.js', 'ecole-lettres': 'ecole-arabe/lettres/donnees/audio.js', 'ecole-lecture': 'ecole-arabe/lecture/donnees/audio.js' };
export async function construire(jeu) {
  const m = await import(pathToFileURL(path.join(RACINE, JEUX[jeu])).href);
  const dossier = path.join(RACINE, 'audio/jeux', jeu), fich = path.join(dossier, 'manifeste.json');
  fs.mkdirSync(dossier, { recursive: true });
  const roles = JSON.parse(fs.readFileSync(path.join(RACINE, 'outils/voix/jeux/voix-roles.json'), 'utf8'));
  let ancien = {}; if (fs.existsSync(fich)) for (const p of JSON.parse(fs.readFileSync(fich, 'utf8')).phrases || []) ancien[p.id] = p;
  const phrases = m.inventaire().map(p => {
    const a = ancien[p.id], present = a && a.fichier && fs.existsSync(path.join(dossier, a.fichier)) && a.texte === p.texte && a.voixId === roles[p.role];       // texte modifié OU voix différente de celle du rôle = à régénérer
    return { id: p.id, ...(p.lettre ? { lettre: p.lettre } : {}), role: p.role, langue: p.langue, texte: p.texte, sousTitre: p.texte, fichier: present ? a.fichier : null, duree: present ? a.duree : 0, prononciationVerifiee: present ? !!a.prononciationVerifiee : false, voixId: present ? a.voixId || null : null };
  });
  const sortie = { jeu, genere: 'inventaire.mjs', total: phrases.length, enregistrees: phrases.filter(p => p.fichier).length, phrases };
  fs.writeFileSync(fich, JSON.stringify(sortie, null, 1) + '\n'); return sortie;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) for (const j of process.argv[2] ? [process.argv[2]] : Object.keys(JEUX)) { const r = await construire(j); console.log(`${j} : ${r.total} phrases, ${r.enregistrees} enregistrées, ${r.total - r.enregistrees} à produire`); }
