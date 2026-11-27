// Correction : un modèle propose, l'outil essaie dans une copie, un autre modèle relit. L'intégration reste un geste distinct.
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
import { Refus } from './garde.mjs';
import { git } from './documents.mjs';
import { consulter } from './consultation.mjs';
import { SCHEMA, SCHEMA_PROPOSITION } from './agents.mjs';
import { copier, essayer, jeter, testerEnBacASable } from './correctif.mjs';
import { enregistrer, mesures, ouvrir } from './dossiers.mjs';
import { planifier } from './orientation.mjs';
import { NOMS, consigne, disponible, estSession, reglage } from './contexte.mjs';

const BRANCHES_PROTEGEES = new Set(['main', 'master', 'production']);
const empreinte = texte => crypto.createHash('sha256').update(texte).digest('hex');

export const resultatClaude = rapport => ({ agent: 'claude', modele: 'session Claude Code', statut: 'ok', detail: '', coutUSD: 0, texte: '', rapport });

export async function proposer(o, ctx) {
  const d = ouvrir(ctx.dossier, o.dossier), analyses = d.plan.analystes.map(a => d.analyses[a]).filter(a => a?.rapport);
  if (!analyses.length) throw new Refus('aucune analyse exploitable dans ce dossier');
  const verifie = Object.keys(d.jugements || {}).length > 0;
  if (d.comparaison?.desaccordImportant && !d.arbitrage && !verifie) throw new Refus('désaccord important non tranché : « arbitrer », ou vérifier un constat avec « juger »');
  const auteur = o.auteur || d.comparaison?.retenue || analyses[0].agent;
  if (!disponible(auteur, ctx)) throw new Refus(`${NOMS[auteur] || auteur} n'est pas disponible : choisir un autre modèle avec --auteur`);
  const texte = `${d.texte}\n\nANALYSES RETENUES :\n${JSON.stringify([...analyses.map(a => a.rapport), ...(d.arbitrage ? [d.arbitrage.resultat.rapport] : [])], null, 1)}\n\nPROPOSE UN CORRECTIF.`;
  d.auteur = auteur; delete d.proposition; delete d.controle; delete d.relecture; enregistrer(ctx.dossier, d);
  if (estSession(auteur, ctx)) {
    ctx.ecrire(`${texte}\n\nÀ Claude (cette session) : écrire la proposition (resume, correctif, tests_proposes, risques) puis « deposer --dossier ${d.id} --type proposition --fichier <proposition.json> ».`);
    return 0;
  }
  const r = await consulter(auteur, reglage(auteur, d.plan.profil, ctx.config), { consigne: consigne('proposition'), texte, images: d.images, schema: SCHEMA_PROPOSITION }, ctx);
  if (r.statut !== 'ok') { ctx.ecrire(`Proposition non obtenue (${NOMS[auteur]} : ${r.detail || r.statut})`); return 1; }
  return recevoirProposition(d, auteur, r.rapport, r.coutUSD, ctx);
}

export function recevoirProposition(d, auteur, rapport, coutUSD, ctx) {
  d.proposition = { auteur, ...rapport }; enregistrer(ctx.dossier, d);
  ctx.ecrire(`## Proposition de ${NOMS[auteur]} (coût ${coutUSD.toFixed(4)} $)\n${rapport.resume}\nRisques annoncés : ${rapport.risques.join(' ; ') || 'aucun'}\nSuite : « controler --dossier ${d.id} --test <fichier de test> ».`);
  return 0;
}

export function controler(o, ctx) {
  const d = ouvrir(ctx.dossier, o.dossier);
  if (!d.proposition) throw new Refus('aucune proposition dans ce dossier');
  const branche = git(d.racine, 'branch', '--show-current').trim();
  if (BRANCHES_PROTEGEES.has(branche)) throw new Refus(`branche « ${branche} » protégée : jamais de correctif sur main ou production`);
  const { copie, fichiers } = essayer(d.racine, d.proposition.correctif);
  d.controle = { empreinte: empreinte(d.proposition.correctif), fichiers, tests: null, date: ctx.maintenant().toISOString() };
  ctx.ecrire(`Correctif applicable dans une copie isolée : ${fichiers.join(', ')}`);
  try {
    if (!o.relu) ctx.ecrire(`${d.proposition.correctif}\nAucun code proposé n'a été exécuté. Lire ce correctif, puis relancer avec --relu --test <fichier>.`);
    else if (o.test?.length) essayerTests(d, o.test, copie, fichiers, ctx);
  } finally { jeter(copie); }
  enregistrer(ctx.dossier, d);
  return bilan(d, ctx);
}

// Mêmes tests avant et après le correctif, chacun dans une copie jetable.
function essayerTests(d, demandes, copie, fichiers, ctx) {
  for (const f of demandes) if (!fs.existsSync(path.join(copie, f))) throw new Refus(`test introuvable : ${f}`);
  const apres = testerEnBacASable(copie, demandes), existants = demandes.filter(f => fs.existsSync(path.join(d.racine, f)));
  let echouaientAvant = true; // un test qui n'existait pas ne pouvait pas passer
  if (existants.length) { const temoin = copier(d.racine); try { echouaientAvant = testerEnBacASable(temoin, existants).code !== 0; } finally { jeter(temoin); } }
  const bloque = /ERR_ACCESS_DENIED/.test(apres.sortie) && apres.code !== 0;
  // Un test écrit ou modifié par le correctif ne peut pas prouver ce correctif.
  const independants = demandes.filter(f => !fichiers.includes(f.replaceAll('\\', '/').replace(/^\.\//, '')));
  d.controle.tests = { fichiers: demandes, code: apres.code, bloque, independants, echouaientAvant };
  const cle = `proposition:${d.proposition.auteur}`; delete d.jugements?.[cle];
  if (!bloque && independants.length === demandes.length && (apres.code !== 0 || echouaientAvant)) (d.jugements ||= {})[cle] = { agent: d.proposition.auteur, verdict: apres.code ? 'rejete' : 'confirme', preuve: { type: 'test', detail: demandes.join(' ') } };
  if (apres.code) ctx.ecrire(apres.sortie);
}

export async function relire(o, ctx) {
  const d = ouvrir(ctx.dossier, o.dossier);
  if (!d.proposition) throw new Refus('aucune proposition dans ce dossier');
  const { auteur, correctif } = d.proposition, demandes = o.agents?.split(',');
  if (demandes?.[0] === auteur) throw new Refus(`${NOMS[auteur]} ne relit pas son propre correctif`);
  const candidats = (demandes || Object.keys(ctx.config.agents)).filter(a => a !== auteur && disponible(a, ctx));
  const relecteur = planifier({ domaine: d.classement.domaine, complexite: 'moyenne' }, { candidats, mesures: mesures(ctx.dossier, d.classement.domaine) }, ctx.config).analystes[0];
  if (!relecteur) throw new Refus('aucun autre modèle disponible pour la relecture');
  const texte = `${d.texte}\n\nCORRECTIF À RELIRE :\n${correctif}`;
  d.relecteur = relecteur; enregistrer(ctx.dossier, d);
  if (estSession(relecteur, ctx)) {
    ctx.ecrire(`${texte}\n\nÀ Claude (cette session) : relire ce correctif puis « deposer --dossier ${d.id} --type relecture --fichier <analyse.json> ».`);
    return 0;
  }
  const r = await consulter(relecteur, reglage(relecteur, d.plan.profil, ctx.config), { consigne: consigne('relecture'), texte, images: d.images, schema: SCHEMA }, ctx);
  if (r.statut !== 'ok') { ctx.ecrire(`Relecture non obtenue (${NOMS[relecteur]} : ${r.detail || r.statut})`); return 1; }
  return recevoirRelecture(d, relecteur, r.rapport, ctx);
}

export function recevoirRelecture(d, agent, rapport, ctx) {
  d.relecture = { agent, empreinte: empreinte(d.proposition.correctif), rapport }; enregistrer(ctx.dossier, d);
  ctx.ecrire(`## Relecture par ${NOMS[agent]} : ${rapport.verdict}\n${rapport.resume}\n${rapport.constats.map(c => `- ${c.gravite} ${c.fichier ?? ''}:${c.ligne ?? ''} ${c.constat}`).join('\n')}`);
  return bilan(d, ctx);
}

// Les quatre conditions avant intégration. Elles portent toutes sur la même version du correctif.
function bilan(d, ctx) {
  const version = empreinte(d.proposition.correctif), c = d.controle?.empreinte === version ? d.controle : null, t = c?.tests, r = d.relecture?.empreinte === version ? d.relecture : null;
  const manques = [
    !c && 'correctif non contrôlé',
    !t ? 'aucun test exécuté' : t.bloque ? 'tests non exécutables en bac à sable : les lancer à la main après relecture' : t.code !== 0 ? 'tests en échec' : !t.independants.length && 'tous les tests exécutés viennent du correctif lui-même',
    !r ? 'relecture par un autre modèle manquante' : r.rapport.verdict === 'bloquant' && `relecture bloquante (${NOMS[r.agent]})`,
  ].filter(Boolean);
  if (t) ctx.ecrire(`tests : ${t.code === 0 ? 'réussis' : 'échoués'}${t.code === 0 && !t.echouaientAvant ? ' (ils passaient déjà avant : ils ne démontrent pas la correction)' : ''}`);
  if (manques.length) { ctx.ecrire(`PAS PRÊT : ${manques.join(' ; ')}.`); return 2; }
  ctx.ecrire('\nPRÊT À INTÉGRER. Rien n\'a été modifié : Claude applique le correctif avec ses outils d\'édition (le garde TDD et les règles git s\'appliquent), hors de main, puis relance les tests du projet.');
  return 0;
}
