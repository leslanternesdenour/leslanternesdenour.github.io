// Orchestration de la génération des candidats (ElevenLabs et fichiers injectés : testable sans réseau ni clé).
// Appels autorisés : GET /v1/voices, GET /v1/user/subscription, POST /v1/text-to-speech/<voix Nour>. Aucune voix n'est créée, clonée, modifiée ni supprimée.
import { ALPHABET } from '../../../ecole-arabe/commun/langue/alphabet.js';
import { VOIX_NOUR, MODELE_SYNTHESE, fiche } from './donnees.js';
import { planGeneration, caracteres } from './generation.js';
import { executerPlan } from './executer.js';
const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const MANIFESTE = 'outils/voix/lettres-candidats/_synthese/manifeste.json';
export async function lancer({ cle, args = [], api, fs }) {
  const journal = [];
  if (!cle) return { code: 2, journal: ['Clé ElevenLabs absente de l\'environnement.'] };
  const option = n => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : null; };
  const lettres = option('lettres') && new Set(option('lettres').split(',')), voix = option('voix') && new Set(option('voix').split(','));
  // Les 10 voix « Nour » doivent exister dans le compte, avec le nom attendu : sinon arrêt avant toute génération.
  const rv = await api('/v1/voices');
  if (!rv.ok) return { code: 1, journal: ['Liste des voix refusée (HTTP ' + rv.status + ') : rien généré.'] };
  const compte = (await rv.json()).voices || [];
  for (const [nom, v] of Object.entries(VOIX_NOUR)) { const c = compte.find(x => x.voice_id === v.id); if (!c || norm(c.name) !== norm(v.nom)) return { code: 1, journal: ['Voix « Nour » introuvable ou renommée : ' + nom + ' → arrêt, rien généré.'] }; }
  journal.push('Les 10 voix « Nour » sont présentes et conformes.');
  const plan = planGeneration(fiche(ALPHABET).filter(l => !lettres || lettres.has(l.id)), Object.fromEntries(Object.entries(VOIX_NOUR).filter(([c]) => !voix || voix.has(c))), MODELE_SYNTHESE).filter(j => !fs.existe(j.fichier));
  journal.push(`${plan.length} clips à générer (${caracteres(plan)} caractères).`);
  // Crédits : volume très faible, mais on vérifie le solde (avec une marge ×2) avant de lancer.
  const rs = await api('/v1/user/subscription');
  if (rs.ok) { const s = await rs.json(), reste = (s.character_limit || 0) - (s.character_count || 0); journal.push(`Crédits restants : ${reste} caractères.`); if (reste < caracteres(plan) * 2) return { code: 1, journal: [...journal, 'Solde de crédits insuffisant (marge de sécurité) : arrêt, rien généré.'] }; }
  const appeler = async j => {
    const r = await api(`/v1/text-to-speech/${j.voixId}?output_format=mp3_44100_64`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(j.corps) });
    if (!r.ok) { let m = ''; try { const e = await r.json(); m = (e.detail && (e.detail.message || e.detail.status)) || ''; } catch (e) {} return { ok: false, status: r.status, message: m }; }
    return { ok: true, status: r.status, octets: Buffer.from(await r.arrayBuffer()) };
  };
  const res = await executerPlan(plan, { appeler, ecrire: fs.ecrire, existe: fs.existe });
  let manif = { avertissement: 'Candidats de synthèse NON validés, voix « Nour » existantes uniquement.', modele: MODELE_SYNTHESE, voix: VOIX_NOUR, clips: {} };
  try { const ancien = JSON.parse(await fs.lire(MANIFESTE)); manif.clips = ancien.clips || {}; } catch (e) {}
  const date = new Date().toISOString(); for (const [f, c] of Object.entries(res.clips)) manif.clips[f] = { ...c, date };
  await fs.ecrire(MANIFESTE, JSON.stringify(manif, null, 1));
  journal.push(`${res.faits} clips générés, ${res.utilises} caractères utilisés. Rien n'a été remplacé sur le site.`);
  if (res.erreur) { journal.push(`Échec HTTP ${res.erreur.status} pour ${res.erreur.voix}/${res.erreur.lettre}/${res.erreur.element} : ${res.erreur.message} → arrêt, aucun autre crédit utilisé.`); return { code: 1, journal }; }
  return { code: 0, journal };
}
