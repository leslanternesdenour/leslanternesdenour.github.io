// Ce que toutes les commandes partagent : noms, rôles, interrupteurs, réglages.
import fs from 'node:fs'; import path from 'node:path';
import { VARIABLES } from './cles.mjs';

export const NOMS = { claude: 'Claude', gpt: 'GPT', gemini: 'Gemini' };
const role = nom => fs.readFileSync(new URL(`../roles/${nom}.md`, import.meta.url), 'utf8');
export const consigne = nom => `${role('commun')}\n${role(nom)}`;

// Interrupteurs : la variable LDN_IA_<AGENT>=off l'emporte, puis le choix enregistré (activer/desactiver), puis la configuration.
export const etatFichier = dossier => path.join(dossier, 'etat.json');
export const lireEtat = dossier => fs.existsSync(etatFichier(dossier)) ? JSON.parse(fs.readFileSync(etatFichier(dossier), 'utf8')) : {};
export const estActif = (agent, { config, env, dossier }) => !/^(off|0|non|false)$/i.test(env[`LDN_IA_${agent.toUpperCase()}`] || '') && (lireEtat(dossier)[agent] ?? config.agents[agent].actif);
export const estSession = (agent, ctx) => ctx.config.agents[agent].type === 'session';
// Présence d'une clé, sans la déchiffrer.
export const aUneCle = (agent, { env, dossier }) => !!env[VARIABLES[agent]]?.trim() || fs.existsSync(path.join(dossier, 'cles', `${VARIABLES[agent]}.dpapi`));
export const disponible = (agent, ctx) => !!ctx.config.agents[agent] && estActif(agent, ctx) && (estSession(agent, ctx) || aUneCle(agent, ctx));
export const reglage = (agent, profil, config) => ({ ...config.agents[agent], ...config.profils[profil]?.[agent] });
