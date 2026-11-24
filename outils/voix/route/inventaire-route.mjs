// Inventaire des textes de la Route à prononcer, avec le rôle de voix Nour de chacun (voix existantes seulement : voir ../jeux/voix-roles.json).
// Les textes viennent DIRECTEMENT des données du jeu : l'audio correspond donc exactement au texte affiché.
// JAMAIS d'audio pour : les récits (« À VALIDER »), les lieux liés à un récit religieux (textes « À VALIDER »), les mots arabes.
import { normaliser } from '../../../voyage/js/voix.js';
export const normaliserTexte = normaliser;

// qui prononce quoi : un rôle = une voix Nour stable (déjà utilisée ailleurs dans le jeu)
const ROLE_VOYAGEUR = { 'marchand-dattes': 'perso-karim', tisserande: 'perso-warda', potier: 'perso-yacine', 'voyageuse-oasis': 'perso-salma', 'porteur-eau': 'perso-samir', 'marcheur-rue': 'narrateur', 'ancien-marche': 'perso-hakim', boulangere: 'perso-salma', 'jeune-berger': 'perso-samir', caravanier: 'narrateur' };

const hash8 = t => { let h = 0x811c9dc5; for (const c of Buffer.from(t, 'utf8')) { h ^= c; h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };

export async function inventaire() {
  const TR = await import('../../../voyage/js/route/troc-route.js'), A = await import('../../../voyage/js/route/activites-route.js'), D = await import('../../../voyage/js/route/donnees.js'), T = await import('../../../voyage/js/route/textes-route.js'), S = await import('../../../voyage/js/route/lieux-mecque-a-valider.js');
  const out = new Map();
  const ajouter = (role, texte, source) => { const n = normaliser(texte); if (!n || out.has(n)) return; out.set(n, { id: 'NOUR-VOIX-RTE-' + hash8(n), texte: texte.replace(/^[^\p{L}\p{N}«(]+/u, '').trim(), role, source }); };
  // les lieux (sauf ceux dont le texte attend une validation) : version 3–5 ans et 6–10 ans
  for (const l of D.LIEUX_ROUTE) { if (['objet', 'personnage'].includes(l.type) || S.LIEUX_SACRES[l.id]) continue; ajouter('narratrice', T.TEXTES_LIEUX[l.id].petit, 'lieu:' + l.id); ajouter('narratrice', T.TEXTES_LIEUX[l.id].grand, 'lieu:' + l.id); }
  // le guide, la voyageuse du campement
  for (const k of ['petit', 'grand']) { ajouter('narrateur', T.GUIDE.intro[k], 'guide'); for (const c of ['debut', 'attente', 'tout', 'merci']) ajouter('perso-warda', T.VOYAGEUSE[c][k], 'voyageuse:' + c); }
  ajouter('narrateur', T.GUIDE.fermeTexte, 'guide'); ajouter('narratrice', T.VOYAGEUSE.eau, 'voyageuse'); ajouter('narratrice', T.VOYAGEUSE.provisions, 'voyageuse');
  // les voyageurs de la cité (chacun sa voix) et les maisons
  for (const v of D.VOYAGEURS_VILLE) { ajouter(ROLE_VOYAGEUR[v.id], v.texte.petit, 'voyageur:' + v.id); ajouter(ROLE_VOYAGEUR[v.id], v.texte.grand, 'voyageur:' + v.id); }
  for (const [id, liste] of Object.entries(T.SUJETS_VOYAGEURS)) for (const x of liste) { ajouter(ROLE_VOYAGEUR[id], x.petit, 'sujet:' + id); ajouter(ROLE_VOYAGEUR[id], x.grand, 'sujet:' + id); }   // les questions posées aux habitants : chaque réponse a la voix de l'habitant
  for (const f of T.FAITS_MAISONS) { ajouter('narratrice', f.petit, 'maison'); ajouter('narratrice', f.grand, 'maison'); }
  for (const [id, f] of Object.entries(T.FAITS_ATELIER)) { ajouter('narratrice', f.petit, 'atelier:' + id); ajouter('narratrice', f.grand, 'atelier:' + id); }   // dans l'atelier du potier : le tour et le four
  for (const [g, f] of Object.entries(T.FAITS_INTERIEURS)) for (const o of f.objets) { const v = D.HABITANTS_MAISONS[g].voix; ajouter(v, o.petit, 'interieur:' + g); ajouter(v, o.grand, 'interieur:' + g); }   // dans les maisons : chaque objet est décrit par l'habitant
  for (const [g, h] of Object.entries(D.HABITANTS_MAISONS)) { ajouter(h.voix, h.petit, 'porte:' + g); ajouter(h.voix, h.grand, 'porte:' + g); }   // les habitants derrière les portes : chacun sa voix
  // les haltes du sentier de montée des deux montagnes (nature et géographie seulement)
  for (const [id, liste] of Object.entries(T.HALTES_MONTAGNE)) for (const x of liste) { ajouter('narratrice', x.petit, 'montee:' + id); ajouter('narratrice', x.grand, 'montee:' + id); }
  // le troc du marché : chaque marchand dit son offre, la réussite, le manque (et le cadeau de départ)
  for (const [id, t] of Object.entries(TR.TROCS)) for (const k of ['offre', 'ok', 'manque', 'cadeau']) if (t[k]) for (const a of ['petit', 'grand']) ajouter(t.voix, t[k][a], 'troc:' + id);
  // les activités des métiers : présentation, questions, explications, fin (chaque métier a sa voix)
  for (const [id, a] of Object.entries(A.ACTIVITES_METIERS)) { for (const k of ['petit', 'grand']) { ajouter(a.voix, a.intro[k], 'metier:' + id); ajouter(a.voix, a.fin[k], 'metier:' + id); }
    for (const age of ['3-5', '6-10']) for (const q of A.questionsMetier(id, age)) { ajouter(a.voix, q.question, 'metier:' + id); ajouter(a.voix, q.ok, 'metier:' + id); ajouter(a.voix, q.ko, 'metier:' + id); } }
  // les missions : titre, consigne courte (3–5 ans) et consigne complète (6–10 ans)
  for (const [id, m] of Object.entries(D.MISSIONS_ROUTE)) { ajouter('narratrice', m.titre, 'mission:' + id); ajouter('narratrice', m.simple, 'mission:' + id); ajouter('narratrice', m.resume, 'mission:' + id); }
  // régions, messages utiles, retours des activités
  for (const r of D.REGIONS_ROUTE) ajouter('narratrice', r.nom, 'region:' + r.id);
  const M = T.MESSAGES; for (const k of ['sacTexte', 'panneauOuvert', 'panneauFerme', 'lanterne', 'affairesRetrouvees', 'fin', 'etape1', 'etape1Cadeau', 'lanterneSac', 'maisonNote', 'nouvelleMission', 'histoireAjoutee', 'entreDans', 'citeApparait', 'decouvres', 'grandeRoute', 'gourdePleine', 'gourdeAbsente', 'chemin3', 'traversee', 'traversees3']) ajouter('narratrice', M[k], 'message:' + k);
  for (const t of Object.values(T.FEEDBACK)) ajouter('narratrice', t, 'retour');
  return [...out.values()];
}
