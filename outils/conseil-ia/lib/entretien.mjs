// État du conseil, vérification des clés (lecture gratuite) et essai réel minimal.
import { lireCle } from './cles.mjs';
import { requeteJson } from './reseau.mjs';
import { creerRegistre } from './budget.mjs';
import { consulter } from './consultation.mjs';
import { Refus, masquerSecrets } from './garde.mjs';
import { NOMS, aUneCle, consigne, estActif, estSession, reglage } from './contexte.mjs';

const ADRESSES = {
  gpt: (modele, cle) => [`https://api.openai.com/v1/models/${encodeURIComponent(modele)}`, { authorization: `Bearer ${cle}` }],
  gemini: (modele, cle) => [`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modele)}`, { 'x-goog-api-key': cle }],
};
const modelesDe = (agent, config) => [...new Set(Object.keys(config.profils).map(p => reglage(agent, p, config).modele))];

export function etat(ctx) {
  for (const agent of Object.keys(ctx.config.agents)) {
    const acces = estSession(agent, ctx) ? 'session Claude Code (pas de clé, pas de coût API)' : `${aUneCle(agent, ctx) ? 'clé enregistrée' : 'aucune clé'} · modèles : ${modelesDe(agent, ctx.config).join(', ')}`;
    ctx.ecrire(`${NOMS[agent]} : ${estActif(agent, ctx) ? 'activé' : 'désactivé'} · ${acces}`);
  }
  const { jour, mois } = creerRegistre(ctx.dossier, ctx.config.limites, ctx.maintenant).resume(), l = ctx.config.limites;
  ctx.ecrire(`Dépenses API estimées : aujourd'hui ${jour.coutUSD.toFixed(4)} $ sur ${l.parJourUSD} $, ce mois ${mois.coutUSD.toFixed(4)} $ sur ${l.parMoisUSD} $ (maximum ${l.parAppelUSD} $ par appel).`);
  ctx.ecrire(`Appels aujourd'hui : ${Object.entries(jour.appels).map(([a, n]) => `${NOMS[a]} ${n}`).join(', ') || 'aucun'} (limite ${l.appelsParJourParAgent} par agent).`);
  return 0;
}

// Liste des modèles que la clé peut réellement utiliser ; ✓ marque ceux de la configuration.
const LISTES = {
  gpt: { url: 'https://api.openai.com/v1/models', noms: r => (r.data || []).map(m => m.id).filter(n => n.startsWith('gpt-')) },
  gemini: { url: 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000', noms: r => (r.models || []).filter(m => m.supportedGenerationMethods?.includes('generateContent')).map(m => m.name.replace(/^models\//, '')).filter(n => n.startsWith('gemini-')) },
};

// Une mission minuscule, écrite ici : aucun fichier du projet ne part. Elle passe par le budget comme les autres.
const MISSION_ESSAI = 'MISSION :\nEssai de connexion. Cette fonction JavaScript calcule-t-elle la somme des prix ? `function total(p) { let t = 0; for (const x of p) t = x; return t; }` Réponds en deux constats au maximum.';

export async function essai(o, ctx) {
  const profil = o.profil || 'standard';
  if (!ctx.config.profils[profil]) throw new Refus(`profil inconnu : ${profil} (choix : ${Object.keys(ctx.config.profils).join(', ')})`);
  const agents = (o.agents?.split(',') || Object.keys(ADRESSES)).filter(a => ADRESSES[a] && ctx.config.agents[a] && estActif(a, ctx));
  if (!agents.length) throw new Refus('aucun modèle externe à essayer');
  let reussis = 0;
  for (const agent of agents) {
    const base = reglage(agent, profil, ctx.config), r = { ...base, jetonsSortieMax: Math.min(base.jetonsSortieMax, 4000) };
    const res = await consulter(agent, r, { consigne: consigne(agent), texte: MISSION_ESSAI, images: [] }, ctx);
    if (res.statut !== 'ok') { ctx.ecrire(`${NOMS[agent]} : échec (${res.statut}) · ${r.modele} · ${res.detail} · coût compté ${res.coutUSD.toFixed(4)} $`); continue; }
    reussis++;
    ctx.ecrire(`${NOMS[agent]} : réussi · demandé ${r.modele}, répondu ${res.modeleReel || 'non précisé'} · jetons ${res.jetons.entree} + ${res.jetons.sortie} · coût ${res.coutUSD.toFixed(4)} $\n  Réponse : ${masquerSecrets(res.rapport.resume).texte.replace(/\s+/g, ' ').slice(0, 300)}`);
  }
  return reussis === agents.length ? 0 : reussis ? 2 : 1;
}

export async function verifier(ctx) {
  let reussis = 0, echecs = 0;
  for (const agent of Object.keys(ADRESSES).filter(a => ctx.config.agents[a] && estActif(a, ctx))) {
    let cle; try { cle = lireCle(agent, ctx)?.valeur; } catch (e) { ctx.ecrire(`${NOMS[agent]} : ${e.message}`); }
    if (!cle) { ctx.ecrire(`${NOMS[agent]} : aucune clé utilisable (« conseil.mjs configurer » dans votre terminal)`); echecs++; continue; }
    const lire = (url, headers) => requeteJson(url, { headers }, { fetch: ctx.fetch, attendre: ctx.attendre, secrets: [cle], delaiMs: 30_000 });
    const configures = modelesDe(agent, ctx.config);
    for (const modele of configures) {
      try { await lire(...ADRESSES[agent](modele, cle)); ctx.ecrire(`${NOMS[agent]} ${modele} : accessible`); reussis++; }
      catch (e) { ctx.ecrire(`${NOMS[agent]} ${modele} : ${e.message}`); echecs++; }
    }
    try {
      const ouverts = LISTES[agent].noms(await lire(LISTES[agent].url, ADRESSES[agent]('', cle)[1])).sort();
      ctx.ecrire(`${NOMS[agent]}, modèles ouverts à cette clé (${ouverts.length}) : ${ouverts.map(n => configures.includes(n) ? `${n} ✓` : n).join(', ')}`);
    } catch (e) { ctx.ecrire(`${NOMS[agent]} : liste des modèles indisponible (${e.message})`); }
  }
  return echecs ? (reussis ? 2 : 1) : 0;
}
