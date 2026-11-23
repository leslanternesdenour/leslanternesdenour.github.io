// LA VEILLE DE LOUMI : elle regarde l'état RÉEL de la monture choisie (les besoins de soins.js : soif, faim, énergie, repos, bien-être)
// et décide, avec parcimonie, s'il faut un petit rappel. Elle n'invente rien et n'a aucune valeur fictive.
// Règles : un rappel seulement pour le besoin le plus urgent ; un seul rappel par besoin tant qu'il n'a pas EMPIRÉ ; un besoin redevenu bon est oublié
// (s'il retombe plus tard, c'est une vraie nouvelle situation) ; rien n'est répété pendant une session ni d'une session à l'autre sans évolution.
// Mémoire PROPRE à Loumi (etat.loumi.rappels) : séparée des missions et de la progression de Nour. Sans Three.js : testable seule (outils/tests/veille.test.mjs).
import { BESOINS, BAS } from './soins.js?v=2';

export const CRITIQUE = 25;                                   // en dessous : le besoin est vraiment important (palier 2)
// ordre de priorité à valeur égale : boire avant manger avant se reposer
const PRIORITE = ['soif', 'faim', 'repos', 'energie', 'bienEtre'];

export const palier = v => (v < CRITIQUE ? 2 : v < BAS ? 1 : 0);          // 0 = bon, 1 = bas, 2 = critique

// Les phrases (courtes, simples). « ${nom} » = le nom de la monture ; fem = monture féminine.
export function texte(besoin, p, nom, fem = false) {
  const il = fem ? 'elle' : 'il', fatigue = fem ? 'fatiguée' : 'fatigué';
  const T = {
    faim: [`${nom} commence à avoir faim. Il serait temps de lui donner du foin.`, `${nom} a vraiment faim ! Un peu de foin, vite ?`],
    soif: [`${nom} aurait bien besoin d'un peu d'eau.`, `${nom} a très soif ! Allons à l'abreuvoir.`],
    repos: [`Je crois que ${nom} a besoin de se reposer.`, `${nom} a vraiment besoin de repos.`],
    energie: [`Je crois que ${nom} a besoin de se reposer.`, `${nom} est très ${fatigue}. Un peu de repos ?`],
    bienEtre: [`${nom} aimerait un petit câlin.`, `${nom} a besoin de câlins !`]
  };
  const t = T[besoin]; return t ? t[Math.min(1, Math.max(0, p - 1))] : '';
}

// memoire : l'objet persistant { [idMonture]: { [besoin]: palier déjà signalé } } (créé si absent)
export function creerVeille({ soins, memoire, nom, fem = () => false }) {
  const mem = id => (memoire[id] = memoire[id] && typeof memoire[id] === 'object' ? memoire[id] : {});
  // le besoin le plus urgent (valeur la plus basse sous BAS ; priorité à valeur égale), ou null
  function prioritaire(id) {
    const n = soins.niveaux(id); let best = null;
    for (const b of BESOINS) if (n[b] < BAS && (!best || n[b] < n[best] - 1e-9 || (Math.abs(n[b] - n[best]) < 1e-9 && PRIORITE.indexOf(b) < PRIORITE.indexOf(best)))) best = b;
    return best;
  }
  return {
    prioritaire,
    // un rappel à faire MAINTENANT ? { besoin, palier, texte } ou null. N'écrit rien : on confirme avec marquer().
    aSignaler(id) {
      this.oublierSatisfaits(id);
      const b = prioritaire(id); if (!b) return null;
      const p = palier(soins.niveau(id, b)); if (p <= (mem(id)[b] || 0)) return null;       // déjà signalé à ce niveau (ou pire) : silence
      return { besoin: b, palier: p, texte: texte(b, p, nom(id), fem(id)) };
    },
    marquer(id, besoin, p) { mem(id)[besoin] = p; },
    // un besoin redevenu bon est oublié : s'il retombe, ce sera une nouvelle situation
    oublierSatisfaits(id) { const m = mem(id), n = soins.niveaux(id); for (const b of Object.keys(m)) if (n[b] >= BAS) delete m[b]; },
    // le besoin signalé est-il encore d'actualité ? (la bulle disparaît dès qu'il est satisfait)
    encoreVrai(id, besoin) { return soins.niveau(id, besoin) < BAS; },
    memoire: id => ({ ...mem(id) })
  };
}
