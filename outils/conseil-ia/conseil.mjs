// Conseil IA : chaque mission va au modèle le mieux placé (Claude, GPT ou Gemini). Mode d'emploi : LISEZ-MOI.md
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { parseArgs } from 'node:util';
import { configurer, dechiffrerWindows } from './lib/cles.mjs';
import { essai, etat, verifier } from './lib/entretien.mjs';
import { coutMaximal } from './lib/consultation.mjs';
import { Refus, masquerSecrets, verifierPresence } from './lib/garde.mjs';
import { lancerTests } from './lib/verification.mjs';
import { assembler, git, lireMission } from './lib/documents.mjs';
import { consulter } from './lib/consultation.mjs';
import { classer, planifier } from './lib/orientation.mjs';
import { comparer } from './lib/jugement.mjs';
import { SCHEMA, SCHEMA_ARBITRAGE, SCHEMA_PROPOSITION, conforme } from './lib/agents.mjs';
import { enMarkdown } from './lib/rapport.mjs';
import { enregistrer, mesures, nouvelIdentifiant, ouvrir } from './lib/dossiers.mjs';
import { NOMS, consigne, estActif, estSession, aUneCle, disponible, reglage, etatFichier, lireEtat } from './lib/contexte.mjs';
import { proposer, controler, relire, recevoirProposition, recevoirRelecture, resultatClaude } from './lib/propositions.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const OPTIONS = {
  mission: { type: 'string' }, 'mission-fichier': { type: 'string' }, fichier: { type: 'string', multiple: true, default: [] }, diff: { type: 'string' }, image: { type: 'string', multiple: true, default: [] },
  agents: { type: 'string' }, domaine: { type: 'string' }, complexite: { type: 'string' }, auteur: { type: 'string' }, dossier: { type: 'string' }, type: { type: 'string' },
  constat: { type: 'string' }, verdict: { type: 'string' }, test: { type: 'string', multiple: true }, humain: { type: 'string' }, relu: { type: 'boolean' }, simulation: { type: 'boolean' }, profil: { type: 'string' },
};

function interrupteur(commande, agent, ctx) {
  if (!ctx.config.agents[agent]) throw new Refus(`agent inconnu : ${agent} (choix : ${Object.keys(ctx.config.agents).join(', ')})`);
  fs.mkdirSync(ctx.dossier, { recursive: true });
  fs.writeFileSync(etatFichier(ctx.dossier), JSON.stringify({ ...lireEtat(ctx.dossier), [agent]: commande === 'activer' }));
  ctx.ecrire(`${NOMS[agent]} : ${commande === 'activer' ? 'activé' : 'désactivé'}`);
  return 0;
}

async function mission(o, ctx) {
  const { config, ecrire } = ctx;
  const texteMission = o['mission-fichier'] ? lireMission(ctx.cwd, o['mission-fichier']) : o.mission;
  if (!texteMission?.trim()) throw new Refus('mission vide (option --mission ou --mission-fichier)');
  let racine = ctx.cwd; try { racine = git(ctx.cwd, 'rev-parse', '--show-toplevel').trim(); } catch { /* hors dépôt git */ }
  const joint = assembler({ racine, mission: texteMission, fichiers: o.fichier, diff: o.diff, images: o.image, limites: config.limites });
  const classement = classer({ mission: texteMission, fichiers: joint.documents.map(d => d.chemin), taille: joint.texte.length, images: joint.images.length, domaine: o.domaine, complexite: o.complexite }, config);
  if (!config.orientation.niveaux[classement.complexite]) throw new Refus(`complexité inconnue : ${classement.complexite}`);

  const demandes = o.agents?.split(',') ?? Object.keys(config.agents), candidats = [];
  for (const agent of demandes) {
    if (!config.agents[agent] || !estActif(agent, ctx)) { ecrire(`${NOMS[agent] || agent} : désactivé ou inconnu, non consulté.`); continue; }
    // Choix automatique : un modèle sans clé ne peut pas être choisi. Demande explicite : il apparaît avec son erreur.
    if (!o.agents && !estSession(agent, ctx) && !aUneCle(agent, ctx)) { ecrire(`${NOMS[agent]} : aucune clé, écarté du choix.`); continue; }
    candidats.push(agent);
  }
  const automatique = planifier(classement, { candidats, mesures: mesures(ctx.dossier, classement.domaine), auteur: o.auteur }, config);
  const plan = o.agents ? { ...automatique, analystes: candidats, arbitre: null, mode: 'imposé', raisons: ['modèles imposés par --agents'] } : automatique;
  if (!plan.analystes.length) throw new Refus('aucun modèle disponible pour cette mission');

  if (o.simulation) {
    ecrire(`SIMULATION, rien n'est envoyé : domaine ${classement.domaine}, complexité ${classement.complexite}. Choisi : ${plan.analystes.map(a => NOMS[a]).join(' + ')}.`);
    for (const raison of [...classement.signaux, ...plan.raisons]) ecrire(`- ${raison}`);
    for (const agent of plan.analystes) {
      const r = reglage(agent, plan.profil, config);
      ecrire(estSession(agent, ctx) ? `${NOMS[agent]} : session en cours, aucun coût API` : `${NOMS[agent]} : ${r.modele}, coût maximal ${coutMaximal(config, r, { consigne: consigne(agent), texte: joint.texte, images: joint.images }).toFixed(4)} $`);
    }
    return 0;
  }

  const date = ctx.maintenant().toISOString();
  const d = { id: nouvelIdentifiant(date), date, racine, mission: masquerSecrets(texteMission).texte, classement, plan, texte: joint.texte, documents: joint.documents, images: joint.images, masques: joint.masques, analyses: {} };
  enregistrer(ctx.dossier, d);
  ecrire(`Dossier : ${d.id}\nOrientation : domaine ${classement.domaine}, complexité ${classement.complexite}. Choisi : ${plan.analystes.map(a => NOMS[a]).join(' + ')}${plan.arbitre ? ` (arbitre en cas de désaccord : ${NOMS[plan.arbitre]})` : ''}.`);
  for (const raison of [...classement.signaux, ...plan.raisons]) ecrire(`- ${raison}`);
  for (const ecarte of joint.ecartes) ecrire(`Non joint : ${ecarte}`);

  // L'analyse de la session Claude est écrite d'abord : ainsi aucun des deux avis ne peut influencer l'autre.
  if (plan.analystes.includes('claude')) {
    ecrire(`À Claude (cette session) : analyser la mission, écrire le résultat en JSON (verdict, resume, constats, non_verifie), puis lancer « deposer --dossier ${d.id} --fichier <analyse.json> ».`);
    return 0;
  }
  return consulterExternes(d, ctx);
}

async function consulterExternes(d, ctx) {
  const restants = d.plan.analystes.filter(a => !d.analyses[a]);
  const resultats = await Promise.all(restants.map(agent => consulter(agent, reglage(agent, d.plan.profil, ctx.config), { consigne: consigne(agent), texte: d.texte, images: d.images }, ctx)));
  for (const r of resultats) d.analyses[r.agent] = r;
  enregistrer(ctx.dossier, d);
  return conclure(d, ctx);
}

// Désignation anonyme des deux analyses ; l'ordre dépend du dossier, pas du modèle.
const alias = d => { const paire = [...d.plan.analystes]; if (parseInt(d.id.slice(-1), 16) % 2) paire.reverse(); return { A: paire[0], B: paire[1] }; };
const anonymiser = t => t.replace(/\b(claude|anthropic|gpt|openai|chatgpt|gemini|google deepmind)(-[\w.-]+)?\b/gi, '[modèle]');
const devoilement = noms => `Analyse A = ${NOMS[noms.A]} ; Analyse B = ${NOMS[noms.B]}.`;

function dossierArbitrage(d) {
  const noms = alias(d);
  return `${d.texte}\n\n${['A', 'B'].map(l => `ANALYSE ${l} :\n${anonymiser(JSON.stringify(d.analyses[noms[l]].rapport, null, 1))}`).join('\n\n')}\n\nPOINTS DE DÉSACCORD :\n${anonymiser(d.comparaison.motifs.map(m => `- ${m}`).join('\n'))}`;
}

function afficherArbitrage(d, ctx) {
  const { rapport } = d.arbitrage.resultat;
  ctx.ecrire(`## Arbitrage\n\n${rapport.points.map(p => `- ${p.sujet} → ${p.decision} : ${p.justification}`).join('\n')}\n\nConclusion : ${rapport.conclusion}\n\n${devoilement(d.arbitrage.alias)}`);
  return 0;
}

async function arbitrer(o, ctx) {
  const d = ouvrir(ctx.dossier, o.dossier);
  if (!d.comparaison?.desaccordImportant) throw new Refus('pas de désaccord important : aucun arbitrage (un troisième modèle coûterait pour rien)');
  if (d.arbitrage) throw new Refus('ce dossier a déjà été arbitré');
  const arbitre = [d.plan.arbitre, ...Object.keys(ctx.config.agents)].find(a => a && !d.plan.analystes.includes(a) && disponible(a, ctx));
  if (!arbitre) throw new Refus('aucun troisième modèle disponible : trancher avec un test');
  if (arbitre === 'claude') {
    ctx.ecrire(`${dossierArbitrage(d)}\n\nÀ Claude (cette session) : arbitrer sans chercher les auteurs, puis « deposer --dossier ${d.id} --type arbitrage --fichier <arbitrage.json> » (points, conclusion).`);
    return 0;
  }
  const resultat = await consulter(arbitre, reglage(arbitre, d.plan.profil, ctx.config), { consigne: consigne('arbitre'), texte: dossierArbitrage(d), images: d.images, schema: SCHEMA_ARBITRAGE }, ctx);
  if (resultat.statut !== 'ok') { ctx.ecrire(`Arbitrage non obtenu (${NOMS[arbitre]} : ${resultat.detail})`); return 1; }
  d.arbitrage = { agent: arbitre, alias: alias(d), resultat }; enregistrer(ctx.dossier, d);
  ctx.ecrire(`Arbitre : ${NOMS[arbitre]} (coût ${resultat.coutUSD.toFixed(4)} $)`);
  return afficherArbitrage(d, ctx);
}

// Un constat n'entre dans les mesures qu'avec une preuve : un test exécuté, ou une vérification humaine décrite.
function juger(o, ctx) {
  const d = ouvrir(ctx.dossier, o.dossier), [agent, numero] = (o.constat || '').split(':');
  if (!d.analyses[agent]?.rapport?.constats[numero - 1]) throw new Refus(`constat inconnu : ${o.constat} (forme attendue : gpt:1)`);
  if (!['confirme', 'rejete'].includes(o.verdict)) throw new Refus('--verdict : confirme ou rejete');
  let preuve;
  if (o.test?.length) {
    const fichiers = o.test.map(f => verifierPresence(d.racine, f));
    const r = lancerTests(d.racine, fichiers);
    if ((o.verdict === 'confirme') !== (r.code !== 0)) throw new Refus(`le test ${r.code ? 'échoue' : 'passe'} : « confirme » demande un test qui échoue (défaut reproduit), « rejete » un test qui passe`);
    preuve = { type: 'test', detail: fichiers.join(' '), code: r.code };
  } else if (o.humain?.trim()) preuve = { type: 'humain', detail: o.humain.trim() };
  else throw new Refus('preuve manquante : --test <fichier> ou --humain "qui a vérifié quoi"');
  (d.jugements ||= {})[o.constat] = { agent, verdict: o.verdict, preuve, date: ctx.maintenant().toISOString() };
  enregistrer(ctx.dossier, d); ctx.ecrire(`${NOMS[agent]} constat ${numero} : ${o.verdict} (${preuve.type})`);
  return 0;
}

function tableau(ctx) {
  ctx.ecrire('Mesures par domaine (constats vérifiés uniquement ; sans mesure, aucun modèle n\'est dit meilleur) :');
  for (const domaine of Object.keys(ctx.config.orientation.domaines)) for (const [agent, m] of Object.entries(mesures(ctx.dossier, domaine))) {
    const total = m.confirmes + m.rejetes;
    ctx.ecrire(`${domaine} | ${NOMS[agent]} | ${m.missions} mission(s) | ${m.confirmes} confirmé(s) | ${m.rejetes} écarté(s) | taux ${total ? `${Math.round(100 * m.confirmes / total)} %` : 'inconnu'}${total < ctx.config.orientation.mesuresMinimum ? ' (insuffisant)' : ''} | coût API ${m.coutUSD.toFixed(4)} $`);
  }
  return 0;
}

function conclure(d, ctx) {
  const resultats = d.plan.analystes.map(a => d.analyses[a]), lisibles = resultats.filter(r => r.rapport);
  const c = lisibles.length === 2 ? comparer(lisibles, d.documents) : null;
  if (c) { d.comparaison = c; enregistrer(ctx.dossier, d); }
  // Si Claude doit arbitrer deux autres modèles, il lit le compte rendu sans savoir qui a écrit quoi.
  const aveugle = c?.desaccordImportant && d.plan.arbitre === 'claude';
  const lettres = aveugle ? Object.fromEntries(Object.entries(alias(d)).map(([l, a]) => [a, `Analyse ${l}`])) : null;
  const nom = a => lettres?.[a] || NOMS[a];
  const montres = lettres ? resultats.map(r => ({ ...r, agent: lettres[r.agent], modele: 'masqué' })).sort((x, y) => x.agent.localeCompare(y.agent)) : resultats;
  let texte = enMarkdown({ mission: d.mission, date: d.date, masques: d.masques, resultats: montres });
  if (c) {
    texte += `\n## Décision\n\n${lisibles.map(r => `- ${nom(r.agent)} : note de preuve ${c.notes[r.agent] === null ? 'sans objet' : c.notes[r.agent].toFixed(2)} (part des constats dont l'extrait cité se retrouve dans les fichiers joints)`).sort().join('\n')}\n`;
    texte += c.retenue ? `\nAnalyse la mieux démontrée : ${nom(c.retenue)}. La note mesure la preuve, pas la justesse : vérifier avant d'agir.\n` : '\nAucune analyse ne se détache sur la preuve : vérifier les constats un par un.\n';
    const motifs = c.motifs.map(m => lettres ? Object.entries(lettres).reduce((t, [a, l]) => t.replaceAll(`par ${a} seul`, `par ${l} seul`), m) : m);
    if (c.desaccordImportant) texte += `\nArbitrage requis (${motifs.join(' ; ')}) : « arbitrer --dossier ${d.id} ».\n`;
  }
  const base = path.join(ctx.dossier, 'rapports', d.id);
  fs.mkdirSync(path.dirname(base), { recursive: true });
  fs.writeFileSync(`${base}.md`, texte); fs.writeFileSync(`${base}.json`, JSON.stringify({ id: d.id, mission: d.mission, resultats }, null, 1));
  ctx.ecrire(texte); ctx.ecrire(`Compte rendu enregistré : ${base}.md`);
  const reussis = resultats.filter(r => r.statut === 'ok').length;
  return reussis === resultats.length ? 0 : reussis ? 2 : 1;
}

// Ce que la session Claude produit elle-même est déposé ici, au même format que les autres.
const DEPOTS = {
  analyse: { schema: SCHEMA, attendu: d => d.plan.analystes.includes('claude') && !d.analyses.claude },
  arbitrage: { schema: SCHEMA_ARBITRAGE, attendu: d => d.comparaison?.desaccordImportant && !d.arbitrage && !d.plan.analystes.includes('claude') },
  proposition: { schema: SCHEMA_PROPOSITION, attendu: d => d.auteur === 'claude' && !d.proposition },
  relecture: { schema: SCHEMA, attendu: d => d.relecteur === 'claude' && d.proposition && d.proposition.auteur !== 'claude' },
};

async function deposer(o, ctx) {
  const d = ouvrir(ctx.dossier, o.dossier), fichier = o.fichier[0], type = o.type || 'analyse', depot = DEPOTS[type];
  if (!depot) throw new Refus(`type inconnu : ${type} (choix : ${Object.keys(DEPOTS).join(', ')})`);
  if (!fichier) throw new Refus('fichier à déposer manquant (option --fichier)');
  if (!depot.attendu(d)) throw new Refus(`ce dossier n'attend pas de « ${type} » de Claude`);
  let rapport; try { rapport = JSON.parse(fs.readFileSync(path.resolve(ctx.cwd, fichier), 'utf8')); } catch { throw new Refus(`${fichier} : JSON illisible`); }
  if (!conforme(rapport, depot.schema)) throw new Refus(`${type} incomplète : champs obligatoires ${depot.schema.required.join(', ')}`);
  if (type === 'analyse') { d.analyses.claude = resultatClaude(rapport); enregistrer(ctx.dossier, d); return consulterExternes(d, ctx); }
  if (type === 'proposition') return recevoirProposition(d, 'claude', rapport, 0, ctx);
  if (type === 'relecture') return recevoirRelecture(d, 'claude', rapport, ctx);
  d.arbitrage = { agent: 'claude', alias: alias(d), resultat: resultatClaude(rapport) }; enregistrer(ctx.dossier, d);
  return afficherArbitrage(d, ctx);
}

export async function executer(argv, deps) {
  try {
    const [commande, ...reste] = argv;
    const { values: o, positionals } = parseArgs({ args: reste, allowPositionals: true, options: OPTIONS });
    const ctx = { ...deps, config: deps.config ?? JSON.parse(fs.readFileSync(path.join(ICI, 'conseil.config.json'), 'utf8')) };
    if (commande === 'activer' || commande === 'desactiver') return interrupteur(commande, positionals[0], ctx);
    if (commande === 'mission') return await mission(o, ctx);
    if (commande === 'deposer') return await deposer(o, ctx);
    if (commande === 'arbitrer') return await arbitrer(o, ctx);
    if (commande === 'juger') return juger(o, ctx);
    if (commande === 'tableau') return tableau(ctx);
    if (commande === 'proposer') return await proposer(o, ctx);
    if (commande === 'controler') return controler(o, ctx);
    if (commande === 'relire') return await relire(o, ctx);
    if (commande === 'etat') return etat(ctx);
    if (commande === 'verifier') return await verifier(ctx);
    if (commande === 'configurer') return configurer(ctx);
    if (commande === 'essai') return await essai(o, ctx);
    throw new Refus(`commande inconnue : ${commande ?? '(aucune)'} (voir outils/conseil-ia/LISEZ-MOI.md)`);
  } catch (e) {
    if (!(e instanceof Refus) && !e.code?.startsWith?.('ERR_PARSE_ARGS')) throw e;
    deps.ecrire(`Refusé : ${e.message}`); return 3;
  }
}

if (import.meta.main) {
  // Les clés et les registres vivent dans le dossier personnel, jamais dans le dépôt.
  const dossier = path.join(os.homedir(), '.lanternes-ia');
  process.exitCode = await executer(process.argv.slice(2), { env: process.env, cwd: process.cwd(), dossier, fetch: globalThis.fetch, dechiffrer: dechiffrerWindows, maintenant: () => new Date(), ecrire: t => console.log(t), interactif: !!(process.stdin.isTTY && process.stdout.isTTY) });
}
