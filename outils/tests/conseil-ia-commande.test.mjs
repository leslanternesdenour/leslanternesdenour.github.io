// Conseil IA : la commande complète, avec un faux réseau (aucun appel réel, aucune dépense).
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs'; import path from 'node:path';

const commande = () => import('../conseil-ia/conseil.mjs');
import { CLES, succes, banc, avecTexte, analyseClaude, empreinte } from './conseil-ia-banc.mjs';

const DEUX = ['--agents', 'gpt,gemini'];

test('mission : les deux agents sont consultés, le compte rendu est écrit hors du projet, le projet reste intact', async () => {
  const { executer } = await commande(); const b = banc(), avant = empreinte(b.racine);
  const code = await executer(['mission', '--mission', 'Vérifie page.js', '--fichier', 'page.js', ...DEUX], b.deps);
  assert.equal(code, 0, b.texte());
  assert.deepEqual(b.appels.map(a => new URL(a.url).hostname).sort(), ['api.openai.com', 'generativelanguage.googleapis.com']);
  for (const a of b.appels) assert.match(a.init.body, /1\| let a = 1;/);
  const fichiers = fs.readdirSync(path.join(b.dossier, 'rapports')).sort();
  assert.deepEqual(fichiers.map(f => path.extname(f)), ['.json', '.md']);
  assert.match(b.texte(), /## GPT — verdict : ok/); assert.match(b.texte(), /## Gemini — verdict : ok/);
  assert.equal(empreinte(b.racine), avant);
  for (const secret of Object.values(CLES)) for (const f of fichiers) assert.ok(!fs.readFileSync(path.join(b.dossier, 'rapports', f), 'utf8').includes(secret));
});

const idDossier = texte => texte.match(/Dossier : (\S+)/)[1];

test('orientation : une tâche courante va à un seul modèle ; une tâche critique attend l\'analyse indépendante de Claude avant tout appel externe', async () => {
  const { executer } = await commande();
  const courante = banc();
  assert.equal(await executer(['mission', '--mission', 'Le son ne démarre plus : trouver le bogue', '--fichier', 'page.js'], courante.deps), 0, courante.texte());
  assert.equal(courante.appels.length, 1); assert.match(courante.texte(), /domaine code, complexité moyenne/);
  const critique = banc();
  assert.equal(await executer(['mission', '--mission', 'Sécurité : vérifier ce traitement', '--fichier', 'page.js'], critique.deps), 0, critique.texte());
  assert.equal(critique.appels.length, 0, 'rien ne part avant l\'analyse de Claude'); assert.match(critique.texte(), /À Claude/);
  const id = idDossier(critique.texte());
  assert.equal(await executer(['deposer', '--dossier', id, '--fichier', analyseClaude(critique)], critique.deps), 0, critique.texte());
  assert.equal(critique.appels.length, 1); assert.ok(!critique.appels[0].init.body.includes('Constat de Claude'), 'le second modèle ne voit pas la première analyse');
  assert.match(critique.texte(), /Arbitrage requis/); assert.match(critique.texte(), /note de preuve/);
});

const decision = { points: [{ sujet: 'Constat de Claude', decision: 'A', justification: 'j', fichier: 'page.js', ligne: 1, preuve: 'let a = 1;' }], conclusion: 'A est démontrée.' };

test('arbitrage : seulement en cas de désaccord important, par un troisième modèle qui ne sait pas qui a écrit quoi', async () => {
  const { executer } = await commande();
  const b = banc({ reseau: (url, init) => init.body.includes('ANALYSE A') ? avecTexte(decision)(url) : succes(url) });
  await executer(['mission', '--mission', 'Sécurité : vérifier ce traitement', '--fichier', 'page.js'], b.deps);
  const id = idDossier(b.texte()); await executer(['deposer', '--dossier', id, '--fichier', analyseClaude(b)], b.deps);
  assert.equal(await executer(['arbitrer', '--dossier', id], b.deps), 0, b.texte());
  assert.equal(b.appels.length, 2); const envoi = b.appels[1];
  assert.match(envoi.url, /googleapis/); assert.match(envoi.init.body, /ANALYSE A[\s\S]*ANALYSE B/);
  assert.ok(!/claude|gpt-|openai/i.test(envoi.init.body), 'aucun nom de modèle dans le dossier d\'arbitrage');
  assert.match(b.texte(), /A est démontrée/); assert.match(b.texte(), /Analyse A = (Claude|GPT)/);
  assert.equal(await executer(['arbitrer', '--dossier', id], b.deps), 3, 'un seul arbitrage'); assert.equal(b.appels.length, 2);
  const accord = banc(); await executer(['mission', '--mission', 'm', '--complexite', 'complexe', '--domaine', 'histoire'], accord.deps);
  assert.equal(await executer(['arbitrer', '--dossier', idDossier(accord.texte())], accord.deps), 3); assert.match(accord.texte(), /pas de désaccord important/);
});

test('arbitrage par Claude : le compte rendu ne nomme pas les deux auteurs avant la décision, qui les dévoile', async () => {
  const { executer } = await commande();
  const contraire = { verdict: 'bloquant', resume: 'r', constats: [{ gravite: 'haute', categorie: 'c', fichier: 'page.js', ligne: 1, constat: 'Défaut', preuve: '`let a = 1;`', recommandation: 'r', confiance: 'haute' }], non_verifie: [] };
  const b = banc({ reseau: url => url.includes('openai') ? avecTexte(contraire)(url) : succes(url) });
  assert.equal(await executer(['mission', '--mission', 'Vérifier ce point', '--fichier', 'page.js', '--domaine', 'histoire', '--complexite', 'complexe'], b.deps), 0, b.texte());
  const id = idDossier(b.texte()), apres = b.texte().slice(b.texte().indexOf('# Conseil IA'));
  assert.match(apres, /Analyse A/); assert.ok(!/GPT|Gemini/.test(apres), apres);
  assert.equal(await executer(['arbitrer', '--dossier', id], b.deps), 0); assert.equal(b.appels.length, 2); assert.match(b.texte(), /type arbitrage/);
  const f = path.join(b.dossier, 'arbitrage.json'); fs.writeFileSync(f, JSON.stringify(decision));
  assert.equal(await executer(['deposer', '--dossier', id, '--type', 'arbitrage', '--fichier', f], b.deps), 0, b.texte());
  assert.match(b.texte(), /Analyse A = (GPT|Gemini) ; Analyse B = (GPT|Gemini)/);
});

test('interrupteurs : un agent désactivé (commande ou variable) n\'est jamais contacté et sa clé n\'est pas lue', async () => {
  const { executer } = await commande();
  const b = banc({ env: { OPENAI_API_KEY: CLES.OPENAI_API_KEY } });
  assert.equal(await executer(['desactiver', 'gemini'], b.deps), 0);
  assert.equal(await executer(['mission', '--mission', 'm', ...DEUX], b.deps), 0, b.texte());
  assert.deepEqual(b.appels.map(a => new URL(a.url).hostname), ['api.openai.com']); assert.match(b.texte(), /Gemini.*désactivé/);
  assert.equal(await executer(['activer', 'gemini'], b.deps), 0);
  const c = banc({ env: { ...CLES, LDN_IA_GPT: 'off' } });
  assert.equal(await executer(['mission', '--mission', 'm', ...DEUX], c.deps), 0, c.texte());
  assert.deepEqual(c.appels.map(a => new URL(a.url).hostname), ['generativelanguage.googleapis.com']);
  assert.equal(await executer(['mission', '--mission', 'm', '--agents', 'gpt'], c.deps), 3); assert.equal(c.appels.length, 1);
});

test('pannes : un agent sans clé ou en erreur n\'empêche pas l\'autre ; le code de sortie le signale', async () => {
  const { executer } = await commande();
  const sansCle = banc({ env: { OPENAI_API_KEY: CLES.OPENAI_API_KEY } });
  assert.equal(await executer(['mission', '--mission', 'm', ...DEUX], sansCle.deps), 2, sansCle.texte());
  assert.equal(sansCle.appels.length, 1); assert.match(sansCle.texte(), /Gemini — sans-clé/); assert.match(sansCle.texte(), /conseil\.mjs configurer/); assert.match(sansCle.texte(), /## GPT — verdict : ok/);
  const panne = banc({ reseau: url => url.includes('openai') ? new Response('{}', { status: 401 }) : succes(url) });
  assert.equal(await executer(['mission', '--mission', 'm', ...DEUX], panne.deps), 2); assert.match(panne.texte(), /GPT — erreur/); assert.match(panne.texte(), /401/); assert.match(panne.texte(), /## Gemini — verdict : ok/);
  const rien = banc({ env: {} });
  assert.equal(await executer(['mission', '--mission', 'm', ...DEUX], rien.deps), 1); assert.equal(rien.appels.length, 0);
  assert.equal(await executer(['mission', '--mission', 'm', '--agents', 'gpt'], rien.deps), 1);
});

test('coûts : chaque appel est soldé au coût réel, un appel perdu reste compté au maximum, un plafond atteint empêche l\'envoi', async () => {
  const { executer } = await commande();
  const registre = b => JSON.parse(fs.readFileSync(path.join(b.dossier, 'registre.json'), 'utf8'));
  const ok = banc(); await executer(['mission', '--mission', 'm', ...DEUX], ok.deps);
  // gpt-6.2-sol : 1000×2 + 500×10 ; gemini-3.8-flash : 1000×1,5 + 500×7,5 (dollars par million)
  assert.deepEqual(registre(ok).map(e => [e.agent, e.coutUSD, e.statut]).sort(), [['gemini', 0.00525, 'ok'], ['gpt', 0.007, 'ok']]);
  assert.match(ok.texte(), /coût 0\.0070 \$/);
  const perdu = banc({ reseau: () => { throw new TypeError('fetch failed'); } }); await executer(['mission', '--mission', 'm', '--agents', 'gpt'], perdu.deps);
  assert.equal(registre(perdu)[0].statut, 'incertain'); assert.ok(registre(perdu)[0].coutUSD > 0.15);
  const refuse = banc({ reseau: () => new Response('{}', { status: 401 }) }); await executer(['mission', '--mission', 'm', '--agents', 'gpt'], refuse.deps);
  assert.deepEqual([registre(refuse)[0].statut, registre(refuse)[0].coutUSD], ['erreur', 0]);
  const plein = banc();
  fs.writeFileSync(path.join(plein.dossier, 'registre.json'), JSON.stringify([{ id: 'x', date: '2026-11-26T08:00:00Z', agent: 'gpt', modele: 'm', coutUSD: 2.999, statut: 'ok' }]));
  assert.equal(await executer(['mission', '--mission', 'm', ...DEUX], plein.deps), 1); assert.equal(plein.appels.length, 0); assert.match(plein.texte(), /plafond du jour/);
});
