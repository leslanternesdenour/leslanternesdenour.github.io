// Génère les clips CANDIDATS (synthèse, NON validés) des 28 lettres avec les 10 voix « Nour » existantes. N'écrase jamais un fichier.
//   node --env-file=.env.local outils/voix/generer-lettres-candidats.mjs [--lettres ba,tha] [--voix karim,layla]
// La clé (ELEVENLABS_API_KEY) vient UNIQUEMENT de l'environnement, n'est jamais affichée ni écrite. Toute la logique est dans lettres-validation/lancer.js (testée).
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { lancer } from './lettres-validation/lancer.js';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), cle = process.env.ELEVENLABS_API_KEY, abs = p => path.join(RACINE, p);
const api = (chemin, opts = {}) => fetch('https://api.elevenlabs.io' + chemin, { ...opts, headers: { 'xi-api-key': cle, ...(opts.headers || {}) } });
const disque = { existe: p => fs.existsSync(abs(p)), lire: async p => fs.readFileSync(abs(p), 'utf8'), ecrire: async (p, d) => { fs.mkdirSync(path.dirname(abs(p)), { recursive: true }); fs.writeFileSync(abs(p), d); } };
const r = await lancer({ cle, args: process.argv.slice(2), api, fs: disque });
for (const l of r.journal) console.log(l);
process.exit(r.code);
