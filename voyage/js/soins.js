// Soins des montures : besoins, actions, récompenses pédagogiques et poses 3D (sans Three.js pour la logique : testable seule).
// Règles du jeu : les besoins baissent LENTEMENT, jamais en dessous de PLANCHER, la monture ne meurt jamais et rien n'est puni.
// Un besoin bas est seulement signalé avec douceur ; prendre soin de sa monture rapporte de petites pièces et un petit fait à apprendre.

export const BESOINS = ['soif', 'faim', 'energie', 'repos', 'bienEtre'];
export const INFOS = {
  soif: { icone: '💧', nom: 'Soif', texte: 'a soif' },
  faim: { icone: '🌾', nom: 'Faim', texte: 'a faim' },
  energie: { icone: '⚡', nom: 'Énergie', texte: 'est fatigué' },
  repos: { icone: '🌙', nom: 'Repos', texte: 'a besoin de se reposer' },
  bienEtre: { icone: '💛', nom: 'Bien-être', texte: 'aimerait un câlin' }
};
export const PLANCHER = 20;       // jamais moins : aucune mécanique punitive
export const BAS = 40;            // en dessous : un signal doux
export const DEPART = 85;

// Lieux de soins (dans l'enclos de l'écurie) : objet (où il se trouve), stand (où se place la monture) et a (direction de son regard : cap = atan2(x, z)).
import { LIEUX } from './enclos-plan.js?v=1';
export const LIEUX_SOINS = LIEUX;      // l'abreuvoir, la mangeoire et la litière sont dans l'enclos de l'écurie (voir enclos-plan.js)
// Durées des actions (secondes) : marche d'approche, puis soin
export const DUREES = { boire: 6, manger: 7, repos: 6, dormir: 9, calin: 2.5 };

// Effet de chaque action sur les besoins
const EFFETS = {
  boire: { soif: 60, bienEtre: 5 },
  manger: { faim: 60, bienEtre: 5 },
  repos: { repos: 55, energie: 20, bienEtre: 5 },
  dormir: { repos: 40, energie: 60, bienEtre: 8 },
  calin: { bienEtre: 25 }
};
// Récompense (pièces) : petite, et limitée à 3 par jour et par action pour ne pas fausser l'économie
export const RECOMPENSE = { boire: 15, manger: 15, repos: 15, dormir: 20, calin: 5 };
export const MAX_PAR_JOUR = 3;

// Le petit fait appris à chaque soin (animaux de l'époque : dromadaire, cheval arabe ; chameau de Bactriane, éléphant : montures du jeu)
export const FAITS = {
  boire: {
    dromadaire: 'Un dromadaire très assoiffé peut boire plus de 100 litres d\'un coup, puis il tient plusieurs jours sans boire.',
    bactriane: 'Le chameau de Bactriane boit beaucoup d\'un seul coup, puis il peut marcher longtemps dans le désert.',
    cheval: 'Un cheval boit souvent 30 à 40 litres d\'eau par jour. L\'eau fraîche est très importante pour lui.',
    elephant: 'Un éléphant peut boire plus de 100 litres d\'eau en une journée : il aspire l\'eau avec sa trompe.'
  },
  manger: {
    dromadaire: 'Le dromadaire mange des plantes du désert et des feuilles de palmier. Il aime aussi les dattes !',
    bactriane: 'Le chameau mange des herbes sèches et des plantes du désert : il se contente de peu.',
    cheval: 'Un cheval mange surtout du foin et de l\'herbe, et parfois de l\'orge. Il mâche longtemps, doucement.',
    elephant: 'Un éléphant mange des feuilles, de l\'herbe et des branches, pendant presque toute la journée.'
  },
  repos: {
    dromadaire: 'Le dromadaire se couche en repliant ses pattes sous lui. Il se repose à l\'ombre quand il fait très chaud.',
    bactriane: 'Le chameau se repose en s\'allongeant, pattes repliées, pour garder sa chaleur et reprendre des forces.',
    cheval: 'Un cheval se repose souvent debout ! Pour bien dormir, il se couche quelques instants.',
    elephant: 'L\'éléphant dort peu : quelques heures seulement, parfois debout, parfois couché.'
  },
  dormir: {
    dromadaire: 'Quand il dort, le dromadaire se couche sur le ventre, le cou plié. Il dort peu, mais profondément.',
    bactriane: 'Le chameau dort couché sur le ventre, pattes repliées, la tête posée sur le sol.',
    cheval: 'Un cheval ne dort profondément que peu de temps, couché, quand il se sent en sécurité avec ses amis.',
    elephant: 'L\'éléphant dort peu : deux à quatre heures par nuit, et il aime se coucher près des siens.'
  },
  calin: {
    dromadaire: 'Les dromadaires reconnaissent la voix de ceux qui s\'occupent d\'eux, et ils s\'en souviennent.',
    bactriane: 'Un chameau doux aime les caresses sur le cou, quand on lui parle gentiment.',
    cheval: 'Les chevaux sentent nos émotions : un enfant calme et gentil les rassure.',
    elephant: 'Les éléphants ont une très bonne mémoire : ils n\'oublient pas ceux qui sont gentils avec eux.'
  }
};
export const fait = (action, espece) => (FAITS[action] || {})[espece] || (FAITS[action] || {}).dromadaire || '';

const borne = v => Math.max(PLANCHER, Math.min(100, v));

// ---------- état et logique ----------
export function creerSoins({ A, enregistrer = () => {}, maintenant = () => Date.now() }) {
  A.soins = A.soins && typeof A.soins === 'object' ? A.soins : {};
  const jour = () => new Date(maintenant()).toISOString().slice(0, 10);
  const etat = id => {
    let s = A.soins[id];
    if (!s || typeof s !== 'object') s = A.soins[id] = { niveaux: {}, recompenses: {}, jour: jour(), dernier: maintenant() };
    s.niveaux = s.niveaux || {}; s.recompenses = s.recompenses || {};
    for (const b of BESOINS) if (!(s.niveaux[b] >= PLANCHER)) s.niveaux[b] = DEPART;
    // nouveau jour : les récompenses repartent de zéro (les besoins, eux, ne changent pas pendant l'absence : rien n'est puni)
    if (s.jour !== jour()) { s.jour = jour(); s.recompenses = {}; }
    return s;
  };
  const niveau = (id, b) => etat(id).niveaux[b];
  // vitesses de baisse (points par seconde de jeu) : lentes (soif ≈ 25 min, faim ≈ 40 min, bien-être ≈ 50 min pour passer de 100 à 40 environ)
  const BAISSE = { soif: 0.04, faim: 0.025, bienEtre: 0.02, energie: 0, repos: 0 };
  function tick(id, dt, { monte = false, vit = 0 } = {}) {
    const s = etat(id), n = s.niveaux;
    for (const b of ['soif', 'faim', 'bienEtre']) n[b] = borne(n[b] - BAISSE[b] * dt);
    if (monte && vit > 0.5) { n.energie = borne(n.energie - 0.05 * dt * Math.min(2, vit / 6)); n.repos = borne(n.repos - 0.03 * dt); }
    else if (!monte) n.energie = borne(n.energie + 0.01 * dt);        // au calme, l'énergie revient doucement
    s.dernier = maintenant();
    return n;
  }
  // applique une action ; renvoie { pieces, fait, gains } (pieces = 0 si la limite du jour est atteinte)
  function appliquer(id, action, espece) {
    const s = etat(id), eff = EFFETS[action]; if (!eff) return null;
    for (const [b, v] of Object.entries(eff)) s.niveaux[b] = Math.min(100, s.niveaux[b] + v);
    const deja = s.recompenses[action] || 0;
    let pieces = 0;
    if (deja < MAX_PAR_JOUR) { pieces = RECOMPENSE[action] || 0; s.recompenses[action] = deja + 1; }
    enregistrer();
    return { pieces, fait: fait(action, espece), restants: Math.max(0, MAX_PAR_JOUR - (s.recompenses[action] || 0)) };
  }
  // le besoin le plus bas, s'il passe sous BAS (sinon null)
  function urgent(id) {
    const n = etat(id).niveaux; let pire = null;
    for (const b of BESOINS) if (n[b] < BAS && (!pire || n[b] < n[pire])) pire = b;
    return pire;
  }
  return { etat, niveau, tick, appliquer, urgent, niveaux: id => ({ ...etat(id).niveaux }) };
}

// ---------- poses 3D ----------
// Appelée APRÈS monture.animer() à chaque image : elle ne fait rien tant que k = 0 (la monture n'est pas touchée).
// type : 'boire' | 'manger' | 'repos' | 'dormir' ; k : 0 (debout) → 1 (pose complète) ; t : temps (s).
// Fonctionne pour Chameau, Cheval et Elephant (mêmes membres : corps, cou, tete, pattes, yeux).
export function poseSoin(m, type, k, t) {
  if (!m || k <= 0.001) return;
  const e = x => x * x * (3 - 2 * x);                 // doux
  const kk = e(Math.max(0, Math.min(1, k)));
  const haut = m.hauteurDebout;
  if (type === 'boire' || type === 'manger') {
    // la tête s'incline vers l'eau / le foin ; on mâche (petits mouvements de la tête) ou on lape
    const mach = type === 'manger' ? Math.sin(t * 11) * 0.05 * kk : Math.sin(t * 5) * 0.025 * kk;
    m.cou.rotation.x = 0.95 * kk + mach;
    if (m.tete) m.tete.rotation.x = 0.35 * kk + (type === 'manger' ? Math.sin(t * 11 + 1) * 0.06 * kk : 0);
    m.corps.position.y = haut - 0.05 * kk;
    if (m.pattes && m.pattes[0]) { m.pattes[0].haut.rotation.x = -0.12 * kk; }
  } else if (type === 'repos') {
    // il se couche à moitié : pattes avant repliées, souffle calme
    m.corps.position.y = haut * (1 - 0.32 * kk) + Math.sin(t * 1.6) * 0.01 * kk;
    m.cou.rotation.x = 0.1 * kk;
    if (m.pattes) m.pattes.forEach((p, i) => { p.haut.rotation.x = (i < 2 ? -1.1 : 0.9) * kk; p.bas.rotation.x = (i < 2 ? 1.9 : -1.6) * kk; });
  } else if (type === 'dormir') {
    // couché sur le ventre, cou posé, yeux fermés, respiration lente
    m.corps.position.y = haut * (1 - 0.46 * kk) + Math.sin(t * 1.2) * 0.012 * kk;
    m.cou.rotation.x = 0.7 * kk; if (m.tete) m.tete.rotation.x = 0.4 * kk;
    if (m.pattes) m.pattes.forEach((p, i) => { p.haut.rotation.x = (i < 2 ? -1.25 : 1.05) * kk; p.bas.rotation.x = (i < 2 ? 2.1 : -1.9) * kk; });
    if (m.yeux) m.yeux.scale.y = 1 - 0.9 * kk;
  }
}
