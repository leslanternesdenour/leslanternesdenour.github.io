// Logique pure des personnages N1 (aucune dépendance à three.js : testable seule).
// Spécification : docs/personnages-3d/SPECIFICATION-TESTS-PRIERE.md (partie A).

// Forme de tissu (morph target de la jupe, du hijab, du cuir…) selon la posture de prière.
const FORMES = { soujoud: 'prosterne', roukou: 'penche', penche: 'penche', assis: 'assis', tachahhoud: 'assis', salamDroite: 'assis', salamGauche: 'assis' };
export function formeTissu(posture) { return Object.prototype.hasOwnProperty.call(FORMES, posture) ? FORMES[posture] : null; }

// Le moteur de gestes écrit yeux.scale.y : 1 = ouverts, 0,15 = fermés. Ce n'est pas un os : on le traduit en formes du maillage « yeux ».
const FERME = 0.15;
const borne = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export function influenceClignement(echelleY) {
  const c = borne((1 - echelleY) / (1 - FERME));        // 0 = ouvert, 1 = fermé
  return { clignement: c, clignement_mi: borne(1 - Math.abs(2 * c - 1)) };   // « mi-clos » : maximal entre les deux
}

// Rapprochement exponentiel d'une influence vers sa cible (constante ≈ 0,25 s) : jamais de dépassement, même avec un grand pas de temps.
export const CONSTANTE_LISSAGE = 0.25;
export function lisserInfluence(courante, cible, dt) {
  if (!(dt > 0)) return courante;
  return borne(courante + (cible - courante) * (1 - Math.exp(-dt / CONSTANTE_LISSAGE)));
}

// Adresse du modèle, relative au dossier personnages3d/modeles/.
export function urlModele(genre) { return genre === 'garcon' ? 'garcon_N1.glb' : 'fille_N1.glb'; }

// 'ancien' (Voyageur, dessiné en code) ou 'nouveau' (modèle N1). L'interrupteur général coupé = arrêt d'urgence, prioritaire sur tout.
export function decisionSecours({ parametre, interrupteur, webgl } = {}) {
  if (interrupteur === false || webgl === false || parametre === 'ancien') return 'ancien';
  return 'nouveau';
}

// Charge le nouveau personnage ; en cas d'échec, de délai dépassé ou si on le demande, crée l'ancien (et seulement alors).
export async function creerAvecSecours({ charger, creerAncien, delaiMs = 8000, forcer } = {}) {
  const ancien = raison => ({ type: 'ancien', raison, personnage: creerAncien() });
  if (forcer === 'ancien') return ancien('forcé');
  let minuteur;
  try {
    const limite = new Promise((_, rejet) => { minuteur = setTimeout(() => rejet(new Error('délai dépassé (' + delaiMs + ' ms)')), delaiMs); });
    const personnage = await Promise.race([charger(), limite]);
    return { type: 'nouveau', personnage };
  } catch (e) { return ancien(String((e && e.message) || e)); }
  finally { clearTimeout(minuteur); }
}

// Teints du jeu (identiques à voyage/js/voyageur.js, copiés ici pour ne pas importer le Grand Voyage). Le teint d'origine du modèle est l'index 1.
const PEAUX = ['#f0c9a4', '#d9a27a', '#b97f58', '#8d5a3b'], ORIGINE = 1;
const lineaire = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const rvb = h => [1, 3, 5].map(i => lineaire(parseInt(h.slice(i, i + 2), 16)));
// Multiplicateur (r, g, b, en espace linéaire) à appliquer à la couleur du matériau de la peau pour passer du teint d'origine au teint demandé.
export function facteurTeint(indexPeau) {
  if (!Number.isInteger(indexPeau) || indexPeau < 0 || indexPeau >= PEAUX.length || indexPeau === ORIGINE) return [1, 1, 1];
  const a = rvb(PEAUX[ORIGINE]), b = rvb(PEAUX[indexPeau]);
  return b.map((v, i) => borne(v / a[i], 0.35, 2.0));
}
