// Les données de La Route vers La Mecque (première tranche). Sans Three.js : testable seul.
import { pointChemin, DEC } from './relief.js';
// Tous les noms de lieux de cette tranche sont FICTIFS (en attendant les noms définitifs) : rien n'est présenté comme un lieu historique.
// Les textes religieux et historiques ne sont PAS ici : ils sont à part, avec le statut « À VALIDER » (contenu-a-valider.js).

// Les grandes régions, de bout en bout (s = distance depuis le village, en mètres). Chacune a son ambiance : brume, couleur du ciel, distance de vue.
export const REGIONS_ROUTE = [
  { id: 'sortie', nom: 'La piste de sortie', icone: '🪨', s0: -300, s1: 450, couleur: '#b98f5c',
    ambiance: { brume: '#e6cfa3', proche: 80, loin: 380, ciel: '#f2d9ab' } },
  { id: 'plaines', nom: 'Les grandes plaines', icone: '🏜️', s0: 450, s1: 1400, couleur: '#cfa56a',
    ambiance: { brume: '#ecd8b0', proche: 120, loin: 560, ciel: '#f5dfb4' } },
  { id: 'dunes', nom: 'Les dunes et les vallées', icone: '🌄', s0: 1400, s1: 2300, couleur: '#e0b46e',
    ambiance: { brume: '#f0d29a', proche: 100, loin: 480, ciel: '#f7d9a0' } },
  { id: 'oasis', nom: 'L\'oasis de la Source Claire', icone: '🌴', s0: 2300, s1: 3200, couleur: '#7fa65a',
    ambiance: { brume: '#dfe0b8', proche: 90, loin: 450, ciel: '#eadfb4' } },
  { id: 'montagnes', nom: 'Les montagnes et les cols', icone: '⛰️', s0: 3200, s1: 4750, couleur: '#a5543a',
    ambiance: { brume: '#cfd6df', proche: 70, loin: 420, ciel: '#d5dbe2' } },
  { id: 'chemins', nom: 'Les chemins vers la cité', icone: '🛤️', s0: 4750, s1: 5300, couleur: '#b88a56',
    ambiance: { brume: '#e6d4ae', proche: 100, loin: 520, ciel: '#efddb6' } },
  { id: 'arrivee', nom: 'La vallée de l\'arrivée', icone: '🌅', s0: 5300, s1: 5450, couleur: '#c4a77d',
    ambiance: { brume: '#efdcb4', proche: 140, loin: 700, ciel: '#f4e2b8' } },
  { id: 'cite', nom: 'La cité ancienne', icone: '🏘️', s0: 5450, s1: 6100, couleur: '#b79f78',
    ambiance: { brume: '#f2e2bf', proche: 130, loin: 650, ciel: '#f6e6c0' } }
];

// La région d'un endroit (au-delà des bords : la première ou la dernière)
export function regionA(s) {
  for (const r of REGIONS_ROUTE) if (s < r.s1) return r;
  return REGIONS_ROUTE[REGIONS_ROUTE.length - 1];
}

// Les lieux de la première tranche. Position : s (distance sur la piste) + dt (écart latéral à la piste), ou t absolu.
// type : seuil · balise · decouverte · repos · trace · campement · personnage · objet · oasis · cairn
// Règle de conception : jamais plus de 300 m de marche sans rien à voir ou à faire.
export const LIEUX_ROUTE = [
  { id: 'seuil', type: 'seuil', s: -30, dt: 0, nom: 'Le seuil de la grande route', icone: '🚏' },
  { id: 'balise1', type: 'balise', s: 140, dt: -6, nom: 'Une vieille balise de pierre', icone: '🚩', mission: 'chemin' },
  { id: 'rocher-aigle', type: 'decouverte', s: 300, dt: 42, nom: 'Le rocher de l\'aigle', icone: '🦅' },
  { id: 'balise2', type: 'balise', s: 420, dt: 8, nom: 'Une deuxième balise', icone: '🚩', mission: 'chemin' },
  { id: 'repos1', type: 'repos', s: 560, dt: 12, nom: 'Le rocher du premier repos', icone: '🪨' },
  { id: 'trace1', type: 'trace', s: 660, dt: 10, nom: 'Des petites traces dans le sable', icone: '🐾', mission: 'traces', animal: 'lezard' },
  { id: 'balise3', type: 'balise', s: 800, dt: 6, nom: 'La troisième balise', icone: '🚩', mission: 'chemin' },
  { id: 'acacias', type: 'decouverte', s: 930, dt: -18, nom: 'Les acacias de la plaine', icone: '🌳' },
  { id: 'campement', type: 'campement', s: 1100, dt: -34, nom: 'Le campement des Trois Tentes', icone: '⛺', recit: 'caravanes-hospitalite' },
  { id: 'voyageuse', type: 'personnage', s: 1112, dt: -26, nom: 'Une voyageuse du campement', icone: '🧕' },
  { id: 'objet1', type: 'objet', s: 1040, dt: -62, nom: 'un tapis roulé', icone: '🧶', mission: 'campement' },
  { id: 'objet2', type: 'objet', s: 1170, dt: -55, nom: 'une jarre en terre cuite', icone: '🏺', mission: 'campement' },
  { id: 'objet3', type: 'objet', s: 1095, dt: -96, nom: 'un petit sac de voyage', icone: '🎒', mission: 'campement' },
  { id: 'trace2', type: 'trace', s: 1250, dt: -8, nom: 'Des traces fines dans le sable', icone: '🐾', mission: 'traces', animal: 'gerboise' },
  { id: 'repos2', type: 'repos', s: 1420, dt: 10, nom: 'Le replat du deuxième repos', icone: '🪨' },
  { id: 'belvedere', type: 'decouverte', s: 1580, dt: -30, nom: 'Le belvédère des dunes', icone: '🌄' },
  { id: 'trace3', type: 'trace', s: 1780, dt: 6, nom: 'Des empreintes entre les dunes', icone: '🐾', mission: 'traces', animal: 'renard' },
  { id: 'citerne', type: 'decouverte', s: 2000, dt: 22, nom: 'La vieille citerne de pierre', icone: '🏺' },
  { id: 'repos3', type: 'repos', s: 2250, dt: -10, nom: 'Le dernier replat avant l\'oasis', icone: '🪨' },
  { id: 'oasis', type: 'oasis', s: 2476, t: 62, nom: 'L\'oasis de la Source Claire', icone: '🌴', recit: 'eau-desert' },
  { id: 'palmeraie', type: 'decouverte', s: 2650, dt: -14, nom: 'La palmeraie', icone: '🌴' },
  { id: 'puits-voyageurs', type: 'decouverte', s: 2860, dt: 14, nom: 'Le puits des voyageurs', icone: '🏺' },
  { id: 'plateau-plat', type: 'decouverte', s: 3060, dt: -22, nom: 'Le plateau de pierres plates', icone: '🪨' },
  { id: 'seuil-montagnes', type: 'decouverte', s: 3240, dt: 6, nom: 'Le seuil des montagnes', icone: '⛰️' },
  { id: 'col-porte', type: 'decouverte', s: 3400, dt: 0, nom: 'La porte de pierre', icone: '🚪' },
  { id: 'repos4', type: 'repos', s: 3560, dt: 12, nom: 'L\'abri sous la falaise', icone: '🪨' },
  { id: 'wadi-galets', type: 'decouverte', s: 3720, dt: -14, nom: 'Le lit de galets', icone: '🌊' },
  { id: 'belvedere-col', type: 'decouverte', s: 3880, dt: 18, nom: 'Le belvédère du premier col', icone: '🌄' },
  { id: 'repos5', type: 'repos', s: 4040, dt: -12, nom: 'Le replat de la vallée', icone: '🪨' },
  { id: 'cairn-fin', type: 'cairn', s: 4200, dt: 0, nom: 'Le grand cairn', icone: '🪨' },
  { id: 'col-vue', type: 'decouverte', s: 4400, dt: 0, nom: 'Le deuxième col', icone: '⛰️' },
  { id: 'repos6', type: 'repos', s: 4560, dt: 10, nom: 'Le replat des voyageurs', icone: '🪨' },
  { id: 'muret-pierre', type: 'decouverte', s: 4730, dt: -12, nom: 'Le muret de pierres sèches', icone: '🧱' },
  { id: 'puits-chemin', type: 'decouverte', s: 4900, dt: 14, nom: 'Un puits au bord du chemin', icone: '🏺' },
  { id: 'repos7', type: 'repos', s: 5060, dt: -10, nom: 'Le dernier replat avant la cité', icone: '🪨' },
  { id: 'carrefour', type: 'decouverte', s: 5120, dt: 12, nom: 'Le carrefour des sentiers', icone: '🔱' },
  { id: 'montagne-nord-pied', type: 'decouverte', s: 5250, t: -390, nom: 'Au pied de la grande montagne du nord', icone: '⛰️' },
  { id: 'jardins', type: 'decouverte', s: 5260, dt: 14, nom: 'Les premiers jardins', icone: '🌿' },
  { id: 'crete-vue', type: 'decouverte', s: 5380, dt: 0, nom: 'La dernière crête', icone: '🌅' },
  { id: 'cite-porte', type: 'decouverte', s: 5470, dt: 0, nom: 'La porte de la cité', icone: '🚪', mission: 'cite' },
  { id: 'cite-atelier', type: 'decouverte', s: 5530, dt: 22, nom: 'L\'atelier du potier', icone: '🏺', mission: 'cite', recit: 'metier-potier' },
  { id: 'cite-colline-b', type: 'decouverte', s: 5540, dt: -208, nom: 'La première colline', icone: '⛰️', mission: 'collines' },
  { id: 'collines-chemin-1', type: 'decouverte', s: 5600, t: -157, nom: 'Premier point d\'observation', icone: '👀', mission: 'parcours-collines' },
  { id: 'collines-chemin-2', type: 'decouverte', s: 5640, t: -155, nom: 'Deuxième point d\'observation', icone: '👂', mission: 'parcours-collines' },
  { id: 'collines-chemin-3', type: 'decouverte', s: 5688, t: -152, nom: 'Troisième point d\'observation', icone: '🪨', mission: 'parcours-collines' },
  { id: 'cite-place', type: 'decouverte', s: 5606, dt: 14, nom: 'La grande place', icone: '🕌', mission: 'cite' },
  { id: 'cite-puits', type: 'decouverte', s: 5690, dt: 30, nom: 'Le puits de la place', icone: '🏺' },
  { id: 'cite-colline-a', type: 'decouverte', s: 5740, dt: -198, nom: 'La seconde colline', icone: '⛰️', mission: 'collines' },
  { id: 'cite-marche', type: 'decouverte', s: 5800, dt: 60, nom: 'Le marché', icone: '🛍️', mission: 'cite', recit: 'marche-echanges' },
  { id: 'montagne-sud-pied', type: 'decouverte', s: 5840, t: 420, nom: 'Au pied de la grande montagne du sud', icone: '⛰️' },
  { id: 'cite-fin', type: 'cairn', s: 5880, dt: 0, nom: 'La limite de la cité', icone: '🪨' }
];

// La position (s, t) d'un lieu
export function positionLieu(l) { return { s: l.s, t: l.t != null ? l.t : pointChemin(l.s).t + (l.dt || 0) }; }

// Les vitesses RÉELLES du jeu (main.js : à pied 3,3 m/s, en courant 6,2 m/s ; monture 5,5 à 11 m/s selon la monture)
export const VITESSES = { marche: 3.3, course: 6.2, monture: [5.5, 11] };
export const DISTANCE_TOTALE = 5600;       // objectif de conception du grand voyage complet (m)
export const dureeMinutes = (metres, vitesse) => metres / vitesse / 60;

// Le sac de voyage : six objets à préparer. Chacun sert à quelque chose, aucun n'est obligatoire et rien ne s'épuise (aucune jauge de survie).
export const SAC_ROUTE = [
  { id: 'gourde', nom: 'La gourde', icone: '💧', utilite: 'Elle se remplit à l\'eau de l\'oasis. Tu peux en offrir une gorgée à une voyageuse.' },
  { id: 'sac', nom: 'Le sac de voyage', icone: '🎒', utilite: 'Il garde tes trouvailles de la route, pour les retrouver dans ton carnet.' },
  { id: 'tissu', nom: 'Le tissu de protection', icone: '🧣', utilite: 'Il protège du soleil et du vent de sable : quand tu le portes, la route te paraît plus douce.' },
  { id: 'lanterne', nom: 'La petite lanterne', icone: '🏮', utilite: 'Elle brille doucement près de toi quand la lumière baisse, et aux points de repos.' },
  { id: 'provisions', nom: 'Les provisions', icone: '🥜', utilite: 'Des dattes et des noix à partager avec les voyageurs que tu croises.' },
  { id: 'carte', nom: 'La carte ancienne', icone: '🗺️', utilite: 'Elle montre la grande route, ta position et les lieux déjà découverts.' }
];

// Les trois missions de la première tranche. Elles utilisent les pièces et les badges EXISTANTS (bourse.recompense) ; jamais de minuterie.
// « simple » : la consigne courte pour les 3–5 ans. « resume » : pour les 6–10 ans.
export const MISSIONS_ROUTE = {
  chemin: { titre: 'Retrouver le chemin de la grande route', icone: '🧭', total: 3, recompense: 150, categorie: 'exploration',
    simple: 'Cherche les trois vieilles balises de pierre.',
    resume: 'Le chemin de la grande route s\'efface par endroits. Retrouve les trois vieilles balises de pierre pour ne pas te perdre.' },
  traces: { titre: 'Les traces dans le sable', icone: '🐾', total: 3, recompense: 150, categorie: 'observation',
    simple: 'Regarde les traces dans le sable. Qui est passé ici ?',
    resume: 'Trois animaux du désert sont passés par là. Observe leurs traces et devine qui les a laissées.' },
  campement: { titre: 'Les affaires de la voyageuse', icone: '🎒', total: 3, recompense: 200, categorie: 'entraide',
    simple: 'Aide la voyageuse : retrouve ses trois affaires autour du campement.',
    resume: 'Une voyageuse a perdu un tapis, une jarre et un petit sac près du campement. Retrouve-les et rapporte-les-lui.' },
  cite: { titre: 'Découvrir la cité ancienne', icone: '🏘️', total: 4, recompense: 250, categorie: 'exploration',
    simple: 'Visite la porte, l\'atelier, la grande place et le marché de la cité.',
    resume: 'La cité est faite de maisons de pierre, de ruelles et de places. Visite la porte, l\'atelier du potier, la grande place et le marché pour la découvrir.' },
  collines: { titre: 'Les deux collines', icone: '⛰️', total: 2, recompense: 150, categorie: 'observation',
    simple: 'Va voir les deux collines, tranquillement.',
    resume: 'Deux petites collines dominent la cité. Va les observer l\'une après l\'autre, à ton rythme : il n\'y a ni course ni chronomètre.' },
  'parcours-collines': { titre: 'Le chemin entre les deux collines', icone: '🚶', total: 3, recompense: 120, categorie: 'observation',
    simple: 'Marche tranquillement entre les deux collines et regarde bien autour de toi.',
    resume: 'Un chemin plat relie les deux collines. Marche tranquillement et fais trois pauses d\'observation : la colline, le vent, le sol. Il n\'y a ni course, ni chronomètre, ni classement.' },
  rencontres: { titre: 'Les voyageurs de la cité', icone: '💬', total: 3, recompense: 150, categorie: 'connaissance',
    simple: 'Dis bonjour à trois voyageurs de la cité.',
    resume: 'La cité est pleine de voyageurs et d\'artisans venus de loin. Parle à trois d\'entre eux pour apprendre comment ils vivent, ce qu\'ils font et d\'où ils viennent.' },
  interieurs: { titre: 'Dans les maisons', icone: '🏡', total: 3, recompense: 150, categorie: 'exploration',
    simple: 'Entre dans trois maisons de la cité.',
    resume: 'Les habitants t\'invitent chez eux. Entre dans trois maisons différentes de la cité pour découvrir comment on y vit.' },
  portes: { titre: 'Frapper aux portes', icone: '🚪', total: 4, recompense: 120, categorie: 'connaissance',
    simple: 'Frappe à quatre portes de la cité et dis bonjour.',
    resume: 'Dans la cité, chaque maison a ses habitants. Frappe à quatre portes différentes, poliment, pour savoir qui vit là et ce qu\'ils font.' },
  montees: { titre: 'Monter doucement', icone: '⛰️', total: 6, recompense: 200, categorie: 'exploration',
    simple: 'Monte sur les deux montagnes, doucement, et regarde la vue.',
    resume: 'Un sentier monte sur chacune des deux grandes montagnes. Monte tranquillement, observe à chaque halte et regarde la vue du belvédère. Il n\'y a ni course ni chronomètre.' },
  troc: { titre: 'Au marché : échanger', icone: '🤝', total: 3, recompense: 180, categorie: 'connaissance',
    simple: 'Fais un échange avec trois marchands.',
    resume: 'Au marché, chacun a ce qui manque à l\'autre. Fais un échange avec trois marchands différents : à chaque fois, tout le monde y gagne.' }
};

// Les habitants fictifs des maisons à porte (un par forme de maison ; aucun personnage historique ou religieux). Chacun parle avec une voix Nour déjà attribuée à un rôle du jeu.
export const HABITANTS_MAISONS = {
  0: { role: 'Une grand-mère', voix: 'perso-warda', petit: `Bonjour ! Entre dans l'ombre : chez moi, il fait frais.`, grand: `Bonjour, petit voyageur ! Ne reste pas au soleil. Mes murs sont épais : ils gardent la fraîcheur toute la journée. Assieds-toi un instant, je t'apporte de l'eau.` },
  1: { role: 'Un vendeur de dattes', voix: 'perso-karim', petit: `Regarde sur mon toit : des dattes qui sèchent au soleil !`, grand: `Sur mon toit plat, je fais sécher les dattes de l'oasis. Au soleil, elles se gardent des mois : c'est parfait pour les longs voyages.` },
  2: { role: 'Une couturière', voix: 'perso-salma', petit: `Je couds à l'ombre, dans le coin de ma maison.`, grand: `Je couds des manteaux pour les voyageurs, à l'ombre du coin de ma maison. Un bon manteau protège du soleil le jour et du froid la nuit.` },
  3: { role: 'Un berger', voix: 'perso-samir', petit: `Je monte sur mon toit pour surveiller mes moutons !`, grand: `Mon escalier est dehors : je monte sur le toit pour surveiller mes moutons. De là-haut, on voit toute la plaine et on repère les voyageurs de loin.` },
  4: { role: 'Un artisan', voix: 'perso-yacine', petit: `Dans ma cour, je répare des jarres et des outils.`, grand: `Dans ma cour, à l'abri du vent, je répare les jarres et les outils de mes voisins. Chacun a son savoir-faire, et on s'entraide.` },
  6: { role: 'Un gardien des provisions', voix: 'narrateur', petit: `Dans ma tour, il fait frais : je range le blé et les dattes.`, grand: `Dans ma petite tour, les murs épais gardent le blé et les dattes au frais. Ces provisions sont partagées avec ceux qui en ont besoin.` }
};

// ---------- le village : la sortie, le seuil et l'ouverture ----------
// La Route s'ouvre selon le MÊME modèle que le wadi et les rochers gravés (regions.js) : un lieu voisin découvert + UNE activité au choix.
export const REGION_ROUTE = {
  nom: 'La grande route', icone: '🐪',
  requis: { txt: 'découvrir l\'oasis et le camp des caravanes', ok: c => c.zones.includes('oasis') && c.zones.includes('camp') },
  auChoix: [
    { txt: 'réussir une grande mission', ok: c => Object.values(c.AV.missions || {}).some(m => m.etat === 'finie') },
    { txt: 'apprendre 4 mots arabes', ok: c => ((c.AV.quetes || {}).mots || []).length >= 4 },
    { txt: 'observer 3 animaux', ok: c => (c.AV.animaux || []).length >= 3 },
    { txt: 'trouver 6 lanternes cachées', ok: c => (c.AV.ramasses || []).filter(k => k.startsWith('lanterne')).length >= 6 }
  ]
};

// La piste de sortie : elle part de la route de l'oasis (zone gratuite, jamais les zones Premium), passe au sud du lac et traverse le rempart de dunes à l'est. Coordonnées du village.
export const SORTIE_VILLAGE = [[95, 20], [130, 48], [175, 78], [230, 76], [285, 60], [346, 50]];
export const SEUIL_VILLAGE = { x: 346, z: 50 };
export const auSeuilVillage = (x, z) => x >= SEUIL_VILLAGE.x && Math.abs(z - SEUIL_VILLAGE.z) < 40;
// Passer au monde de la Route : même x, même direction, on arrive un peu avant le seuil de la Route (s = -20), la brume cache la couture
const S_ARRIVEE = -20, S_RETOUR = -75, X_RETOUR_VILLAGE = 326, T_PISTE = 46;
// la sortie du village est à l'est : en y entrant on regardait vers l'est, on regarde maintenant vers l'avant de la piste (quart de tour, caché par la brume)
const tour = a => { while (a > Math.PI) a -= Math.PI * 2; while (a <= -Math.PI) a += Math.PI * 2; return a; };
export const versLaRoute = p => ({ x: Math.max(16, Math.min(76, T_PISTE - (p.z - SEUIL_VILLAGE.z))), z: DEC + S_ARRIVEE, a: tour(p.a - Math.PI / 2) });
export const auRetourRoute = z => z - DEC <= S_RETOUR;
export const versLeVillage = p => ({ x: X_RETOUR_VILLAGE, z: Math.max(SEUIL_VILLAGE.z - 30, Math.min(SEUIL_VILLAGE.z + 30, SEUIL_VILLAGE.z - (p.x - T_PISTE))), a: tour(p.a + Math.PI / 2) });
export { positionLieu as positionDeLieu };

// Le relais de la grande route au village : le guide, la carte ancienne et le sac. Juste au bord du village, sur la piste du sud (hors des maisons).
export const RELAIS_VILLAGE = { x: 64, z: 30 };

// Marche plus naturelle sur la Route (demande du créateur) : à pied seulement, légèrement plus lente que dans le village. La distance du voyage ne change pas.
export const FACTEUR_MARCHE_ROUTE = 0.88;
export const VITESSES_ROUTE = { marche: VITESSES.marche * FACTEUR_MARCHE_ROUTE, course: VITESSES.course * FACTEUR_MARCHE_ROUTE };

// Les voyageurs FICTIFS de la cité (aucun personnage historique ni religieux) : certains restent à leur poste, d'autres marchent le long d'un trajet (s, t).
// tenue : couleurs du personnage (modèle du jeu). mission : « rencontres » (parler à trois d'entre eux).
export const VOYAGEURS_VILLE = [
  { id: 'marchand-dattes', role: 'Un marchand de dattes', s: 5797, t: 67, tenue: { tunique: '#7a5a3a', pantalon: '#cfc2a8', cheche: '#e8dcc4', peau: '#b57e58', sac: false, barbe: '#3a2a20' }, mission: 'rencontres',
    texte: { petit: 'Bonjour ! Mes dattes viennent d\'une oasis lointaine.', grand: 'Bonjour, voyageur ! Mes dattes viennent d\'une oasis lointaine. Elles se conservent longtemps : c\'est parfait pour les longs voyages.' } },
  { id: 'tisserande', role: 'Une tisserande', s: 5783, t: 51, tenue: { tunique: '#46587a', pantalon: '#cdbb96', cheche: '#e8dcc4', voile: '#46587a', peau: '#c08a62', sac: false }, mission: 'rencontres',
    texte: { petit: 'Je tisse la laine pour faire des tentes et des tapis.', grand: 'Je tisse la laine des moutons pour faire un tissu solide : les tentes, les tapis et les vêtements sont faits ainsi. Chaque couleur vient d\'une plante ou d\'une terre.' } },
  { id: 'potier', role: 'Un potier', s: 5537, t: 30, tenue: { tunique: '#a85a40', pantalon: '#cfc2a8', cheche: '#e8dcc4', peau: '#b57e58', sac: false }, mission: 'rencontres',
    texte: { petit: 'Avec de l\'argile et du feu, je fais des jarres.', grand: 'Avec de l\'argile et du feu, je fais des jarres. Une jarre en terre cuite garde l\'eau fraîche, même quand il fait très chaud.' } },
  { id: 'voyageuse-oasis', role: 'Une voyageuse', tenue: { tunique: '#7a3b4d', pantalon: '#cdbb96', cheche: '#e8dcc4', voile: '#7a3b4d', peau: '#c08a62', sac: true }, mission: 'rencontres', vitesse: 1.1,
    trajet: [[5778, 48], [5790, 38], [5802, 48], [5790, 78], [5778, 70]],
    texte: { petit: 'Je viens du campement des Trois Tentes. Là-bas, on partage l\'eau.', grand: 'Je viens du campement des Trois Tentes, très loin d\'ici. Là-bas, on partage toujours l\'eau et le pain avec les voyageurs : c\'est une belle habitude.' } },
  { id: 'porteur-eau', role: 'Un porteur d\'eau', tenue: { tunique: '#6b4a30', pantalon: '#cfc2a8', cheche: '#c9a26a', peau: '#a56a48', sac: true }, vitesse: 1.2, trajet: [[5692, 34], [5736, 40], [5772, 52]],
    texte: { petit: 'Je porte l\'eau du puits jusqu\'au marché.', grand: 'Je porte l\'eau du puits jusqu\'au marché, dans des jarres. L\'eau est précieuse : on ne la gaspille jamais.' } },
  { id: 'marcheur-rue', role: 'Un voyageur', tenue: { tunique: '#2bb3c0', pantalon: '#3a4f7a', cheche: '#fff3dc', peau: '#d9a27a', sac: true }, vitesse: 1.3, trajet: [[5486, 2], [5540, 3], [5596, 2]],
    texte: { petit: 'Je viens de traverser les montagnes. Quel long chemin !', grand: 'Je viens de traverser les montagnes et le désert. Le chemin est long, mais on y fait de belles rencontres et on apprend beaucoup.' } },
  { id: 'ancien-marche', role: 'Un ancien du marché', s: 5526, t: 72, tenue: { tunique: '#8a7a64', pantalon: '#cdbb96', cheche: '#f1ead8', peau: '#a56a48', sac: false, barbe: '#e8e4dc' },
    texte: { petit: `Je viens ici tous les jours pour regarder les caravanes arriver.`, grand: `Je viens au marché tous les jours : j'aime regarder les caravanes arriver et écouter les nouvelles des routes lointaines.` } },
  { id: 'boulangere', role: 'Une boulangère', s: 5805, t: 55, tenue: { tunique: '#c9a26a', pantalon: '#cdbb96', cheche: '#e8dcc4', voile: '#e8dcc4', peau: '#c08a62', sac: false },
    texte: { petit: `Mon pain chaud sort du four !`, grand: `Mon pain sort du four : il est chaud, doré, et il sent bon dans toute la rue. Veux-tu savoir comment on le fait ?` } },
  { id: 'jeune-berger', role: 'Un jeune berger', tenue: { tunique: '#5f7a56', pantalon: '#cfc2a8', cheche: '#c9a26a', peau: '#b57e58', sac: true }, vitesse: 1.15, trajet: [[5614, -96], [5626, -88], [5630, -98], [5618, -102]],
    texte: { petit: `Je garde mes chèvres : elles aiment grimper partout !`, grand: `Je garde mes chèvres. Elles grimpent partout et trouvent de l'herbe là où personne n'en voit. Il faut les compter chaque soir.` } },
  { id: 'caravanier', role: 'Un caravanier', tenue: { tunique: '#7a3b2e', pantalon: '#3a4f7a', cheche: '#d9c9a0', peau: '#a56a48', sac: true, barbe: '#2a2018' }, vitesse: 1.2, trajet: [[5620, -26], [5650, -32], [5680, -26]],
    texte: { petit: `Ma caravane repart demain, avec dix chameaux.`, grand: `Ma caravane repart demain avec dix chameaux chargés. Nous voyageons en groupe : c'est plus sûr, et on partage l'eau.` } }
];
