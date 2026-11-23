// Socle commun — récompenses du village, calculées à partir de ce que les jeux ont VRAIMENT sauvegardé.
// Les jeux gardent leurs propres clés (« ablutions », « priere », « lanternes2 », « monde_voyage ») : on ne les modifie jamais,
// on les lit seulement. Le résultat est toujours recalculé (jamais additionné) : recharger la page ne donne rien en double.
//   ⭐ étoiles   = étoiles des jeux des ablutions (12 max) + de la prière (9 max) + jeux réussis du calendrier
//                 + étoiles de la Chasse aux mots (clé « maison_mots », 6 max : 3 par jeu)
//   🏮 lanternes = lanternes allumées dans le calendrier du Ramadan (tous les profils) + lanternes cachées trouvées dans le Grand Voyage

// L'École arabe de Maktoub : le jeu « Les chiffres et les nombres arabes » (clé « ecole_chiffres ») compte dans les étoiles et les lanternes du village.
import { lire as lireChiffres, recompenses as recompensesChiffres } from '../../ecole-arabe/chiffres/moteur.js';

const JEUX_ABLUTIONS = ['g1', 'g2', 'g3', 'g4'];
const JEUX_PRIERE = ['g1', 'g3', 'g4'];

const etoilesDe = (p, jeux) => p ? jeux.reduce((s, k) => s + Math.max(0, Math.min(3, Number(p[k]) || 0)), 0) : 0;

// lire(cle) → objet JSON ou null
export function calculerRecompenses(lire) {
  const abl = lire('ablutions'), pri = lire('priere'), cal = lire('lanternes2'), voy = lire('monde_voyage'), mots = lire('maison_mots'), chiffresEt = lireChiffres(lire('ecole_chiffres'));
  const chiffres = recompensesChiffres(chiffresEt);

  const ablutions = etoilesDe(abl, JEUX_ABLUTIONS);
  const priere = etoilesDe(pri, JEUX_PRIERE);
  const chasse = mots && mots.etoiles ? etoilesDe(mots.etoiles, ['paires', 'bonmot']) : 0;

  let lanternesRamadan = 0;
  const jeuxRamadan = new Set();
  if (cal && Array.isArray(cal.kids)) cal.kids.forEach(k => {
    if (!k) return;
    lanternesRamadan += Object.keys(k.lit || {}).filter(d => k.lit[d]).length;
    Object.keys(k.jeux || {}).forEach(j => { if (k.jeux[j]) jeuxRamadan.add(j); });
  });

  const ramasses = voy && voy.aventure && Array.isArray(voy.aventure.ramasses) ? voy.aventure.ramasses : [];
  const lanternesVoyage = new Set(ramasses.filter(k => typeof k === 'string' && k.startsWith('lanterne'))).size;

  return {
    etoiles: ablutions + priere + jeuxRamadan.size + chasse + chiffres.etoiles,
    lanternes: lanternesRamadan + lanternesVoyage + chiffres.lanternes,
    jeux: {
      ablutions: { etoiles: ablutions, appris: !!(abl && abl.learned) },
      priere: { etoiles: priere, appris: !!(pri && pri.learn) },
      ramadan: { etoiles: jeuxRamadan.size, lanternes: lanternesRamadan },
      desert: { lanternes: lanternesVoyage },
      mots: { etoiles: chasse },
      ecole_chiffres: { etoiles: chiffres.etoiles, lanternes: chiffres.lanternes }
    }
  };
}

export function lireLocal(cle) {
  try { return JSON.parse(localStorage.getItem(cle) || 'null'); } catch (e) { return null; }
}
