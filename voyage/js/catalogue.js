// Le catalogue du souk : vêtements, accessoires, équipements de voyage, objets de collection.
// Univers inspiré de la péninsule Arabique du VIIe siècle : lin, laine, cuir, bois, terre cuite, fibres de palmier.
// « hist » dit d'où vient l'objet : 'attesté' (connu à l'époque), 'plausible' (reconstitution vraisemblable),
// 'imaginaire' (création du jeu, comme les lanternes dorées, emblème des Lanternes de Nour).
// Les motifs décoratifs sont des créations du jeu, pas des symboles historiques.
import * as THREE from 'three';
import { piece, fusion, M } from './formes.js?v=4';

export const RARETES = {
  commun:     { nom: 'Commun',      couleur: '#9a8f7a', fond: '#efe8da' },
  peu:        { nom: 'Peu commun',  couleur: '#3f9e6a', fond: '#e3f4ea' },
  rare:       { nom: 'Rare',        couleur: '#2d78c8', fond: '#e2eefb' },
  epique:     { nom: 'Épique',      couleur: '#7b4fa0', fond: '#efe6fa' },
  legendaire: { nom: 'Légendaire',  couleur: '#c8901c', fond: '#fff3d6' }
};

const B = () => new THREE.BoxGeometry(1, 1, 1);
const CYL = (a, b, h, s = 14) => new THREE.CylinderGeometry(a, b, h, s);
const SPH = (r, w = 14, h = 10) => new THREE.SphereGeometry(r, w, h);
const TOR = (r, t, a = Math.PI * 2) => new THREE.TorusGeometry(r, t, 8, 24, a);

// Les marchands (personnages fictifs du jeu)
export const MARCHANDS = {
  layla: { nom: 'Layla, la tisserande', icone: '🧵', accueil: 'Bienvenue ! Mes tissus sont filés et teints à la main : lin, laine, indigo et garance.' },
  karim: { nom: 'Karim, le marchand de voyage', icone: '🎒', accueil: 'Tout pour bien voyager : sacs, outres, sandales… et quelques trésors utiles !' },
  samira: { nom: 'Samira, la potière', icone: '🏺', accueil: 'Regarde mes poteries et mes objets pour décorer ta cour !' },
  amina: { nom: 'Amina, tapis de selle', icone: '🧶', accueil: 'Des tapis tissés à la main pour ta monture !' },
  hassan: { nom: 'Hassan, le sellier', icone: '🐪', accueil: 'Des selles et des sacoches solides, cousues main.' }
};

// Les vêtements suivent la forme du personnage : robes et voiles pour la fille, tuniques et coiffes pour le garçon.
// Tous restent amples et couvrants, y compris les plus rares.
export const ARTICLES = [
  // ---------- Layla : vêtements ----------
  { id: 'robe-longue', marchand: 'layla', cat: 'vetement', emplacement: 'corps', forme: 'robe', couleurs: ['#e9d8b8', '#2b8f9a'], nom: 'Robe longue brodée', icone: '👗', prix: 160, rarete: 'peu', hist: 'plausible', desc: 'Une robe ample jusqu\'aux chevilles, avec une bordure brodée.' },
  { id: 'robe-garance', marchand: 'layla', cat: 'vetement', emplacement: 'corps', forme: 'robe', couleurs: ['#a8503e', '#efd9a8'], nom: 'Robe teinte à la garance', icone: '👗', prix: 240, rarete: 'rare', hist: 'attesté', rotation: true, desc: 'La garance est une racine qui donne une belle teinture rouge.' },
  { id: 'robe-indigo', marchand: 'layla', cat: 'vetement', emplacement: 'corps', forme: 'robe', couleurs: ['#3d4f86', '#e8c87a'], nom: 'Robe d\'indigo brodée', icone: '👗', prix: 650, rarete: 'epique', hist: 'plausible', desc: 'Un bleu profond tiré d\'une plante, l\'indigotier, et une broderie dorée.' },
  { id: 'robe-soir', marchand: 'layla', cat: 'vetement', emplacement: 'corps', forme: 'robe', couleurs: ['#2c3566', '#f2cf72'], nom: 'Robe des étoiles du soir', icone: '🌙', prix: 1200, rarete: 'legendaire', hist: 'imaginaire', rotation: true, desc: 'Bleu nuit, brodée d\'étoiles. Une création du jeu, pas un habit historique.' },
  { id: 'tunique-sable', marchand: 'layla', cat: 'vetement', emplacement: 'corps', forme: 'tunique', couleurs: ['#cfa36a', '#8a6440'], nom: 'Tunique couleur sable', icone: '👕', prix: 90, rarete: 'commun', hist: 'plausible', desc: 'Une tunique longue de laine fine, couleur du désert.' },
  { id: 'tunique-indigo', marchand: 'layla', cat: 'vetement', emplacement: 'corps', forme: 'tunique', couleurs: ['#3a4f9a', '#e8c87a'], nom: 'Tunique teinte à l\'indigo', icone: '👕', prix: 150, rarete: 'peu', hist: 'attesté', desc: 'L\'indigo est une teinture végétale bleue connue depuis l\'Antiquité.' },
  { id: 'tunique-rayee', marchand: 'layla', cat: 'vetement', emplacement: 'corps', forme: 'tunique', couleurs: ['#e2d3b0', '#8a3e30'], nom: 'Tunique à bordure rayée', icone: '👕', prix: 240, rarete: 'rare', hist: 'plausible', rotation: true, desc: 'Une tunique claire avec une large bordure tissée.' },
  { id: 'tunique-soir', marchand: 'layla', cat: 'vetement', emplacement: 'corps', forme: 'tunique', couleurs: ['#2c3566', '#f2cf72'], nom: 'Tunique des étoiles du soir', icone: '🌙', prix: 1200, rarete: 'legendaire', hist: 'imaginaire', rotation: true, desc: 'Bleu nuit, brodée d\'étoiles. Une création du jeu, pas un habit historique.' },
  { id: 'voile-lin', marchand: 'layla', cat: 'vetement', emplacement: 'coiffe', forme: 'voile', couleurs: ['#f6f0e2', '#c9b48a'], nom: 'Voile de lin fin', icone: '🧕', prix: 80, rarete: 'commun', hist: 'plausible', desc: 'Un voile léger qui couvre la tête, le cou et les épaules.' },
  { id: 'voile-bleu', marchand: 'layla', cat: 'vetement', emplacement: 'coiffe', forme: 'voile', couleurs: ['#8fa9cc', '#e8c87a'], nom: 'Voile bleu à bordure', icone: '🧕', prix: 150, rarete: 'peu', hist: 'plausible', rotation: true, desc: 'Un voile bleu pâle avec une fine bordure dorée.' },
  { id: 'voile-brode', marchand: 'layla', cat: 'vetement', emplacement: 'coiffe', forme: 'voile', couleurs: ['#efe4cc', '#8a3e30'], nom: 'Voile brodé de perles', icone: '🧕', prix: 280, rarete: 'rare', hist: 'plausible', desc: 'Un voile crème, brodé de petites perles.' },
  { id: 'calotte-brodee', marchand: 'layla', cat: 'vetement', emplacement: 'coiffe', forme: 'calotte', couleurs: ['#efe4cc', '#2b8f9a'], nom: 'Calotte brodée', icone: '🧢', prix: 80, rarete: 'commun', hist: 'plausible', desc: 'Un petit bonnet de tissu brodé.' },
  { id: 'cheche-bleu', marchand: 'layla', cat: 'vetement', emplacement: 'coiffe', forme: 'cheche', couleurs: ['#5d8fd6', '#3d6fb6'], nom: 'Foulard bleu', icone: '🧣', prix: 80, rarete: 'commun', hist: 'plausible', desc: 'Un foulard qui protège du soleil et du sable.' },
  { id: 'cheche-vert', marchand: 'layla', cat: 'vetement', emplacement: 'coiffe', forme: 'cheche', couleurs: ['#6f9e72', '#4f7e52'], nom: 'Foulard vert', icone: '🧣', prix: 80, rarete: 'commun', hist: 'plausible', desc: 'Un foulard qui protège du soleil et du sable.' },
  { id: 'turban', marchand: 'layla', cat: 'vetement', emplacement: 'coiffe', forme: 'turban', couleurs: ['#faf6ec', '#e8dcc4'], nom: 'Turban blanc', icone: '👳', prix: 120, rarete: 'peu', hist: 'attesté', desc: 'Une longue bande de tissu enroulée autour de la tête.' },
  { id: 'cape-laine', marchand: 'layla', cat: 'vetement', emplacement: 'manteau', forme: 'cape', couleurs: ['#8a6a4a', '#e2cfa8'], nom: 'Cape de laine', icone: '🧥', prix: 200, rarete: 'peu', hist: 'plausible', desc: 'Une cape chaude pour les nuits fraîches du désert.' },
  { id: 'manteau-raye', marchand: 'layla', cat: 'vetement', emplacement: 'manteau', forme: 'manteau', couleurs: ['#5a4434', '#e2cfa8'], nom: 'Manteau rayé', icone: '🧥', prix: 300, rarete: 'rare', hist: 'plausible', desc: 'Un manteau ample, ouvert devant, tissé de rayures.' },
  { id: 'manteau-caravane', marchand: 'layla', cat: 'vetement', emplacement: 'manteau', forme: 'manteau', couleurs: ['#7a3e2e', '#f2cf72'], nom: 'Manteau des caravanes', icone: '🧥', prix: 700, rarete: 'epique', hist: 'plausible', rotation: true, desc: 'Un long manteau de laine teinte, aux bordures dorées.' },
  { id: 'ceinture-tissee', marchand: 'layla', cat: 'vetement', emplacement: 'ceinture', forme: 'ceinture', couleurs: ['#b8503c', '#f2cf72'], nom: 'Ceinture tissée à motifs', icone: '🎗️', prix: 100, rarete: 'peu', hist: 'plausible', desc: 'Une ceinture de laine tissée aux couleurs vives.' },
  // ---------- Karim : voyage et cuir ----------
  { id: 'sandales', marchand: 'karim', cat: 'vetement', emplacement: 'pieds', forme: 'sandales', couleurs: ['#9a6a42', '#6b4428'], nom: 'Sandales de cuir clair', icone: '👡', prix: 60, rarete: 'commun', hist: 'attesté', desc: 'Des sandales à semelle de cuir et lanières.' },
  { id: 'sandales-tressees', marchand: 'karim', cat: 'vetement', emplacement: 'pieds', forme: 'sandales', couleurs: ['#c9a26a', '#8a5a35'], nom: 'Sandales tressées', icone: '👡', prix: 140, rarete: 'peu', hist: 'plausible', rotation: true, desc: 'Des sandales aux lanières tressées à la main.' },
  { id: 'ceinture-cuir', marchand: 'karim', cat: 'vetement', emplacement: 'ceinture', forme: 'ceinture', couleurs: ['#6b4428', '#c9a14a'], nom: 'Ceinture de cuir', icone: '🎗️', prix: 60, rarete: 'commun', hist: 'attesté', desc: 'Une ceinture de cuir avec une boucle de cuivre.' },
  { id: 'sac-marche', marchand: 'karim', cat: 'accessoire', emplacement: 'sac', forme: 'besace', couleurs: ['#d8c9a6', '#8a5a35'], nom: 'Sac de marché en toile', icone: '👜', prix: 50, rarete: 'commun', hist: 'plausible', desc: 'Un sac de toile porté en bandoulière.' },
  { id: 'panier', marchand: 'karim', cat: 'accessoire', emplacement: 'main', forme: 'panier', couleurs: ['#c9a26a', '#8a6440'], nom: 'Panier en feuilles de palmier', icone: '🧺', prix: 40, rarete: 'commun', hist: 'attesté', desc: 'Tressé avec des feuilles de palmier, comme dans les oasis.' },
  { id: 'outre', marchand: 'karim', cat: 'accessoire', emplacement: 'hanche', forme: 'outre', couleurs: ['#7a5636', '#c9a14a'], nom: 'Outre en cuir', icone: '💧', prix: 70, rarete: 'commun', hist: 'attesté', desc: 'Une outre de cuir pour garder l\'eau en voyage.' },
  { id: 'bracelets', marchand: 'karim', cat: 'accessoire', emplacement: 'poignets', forme: 'bracelets', couleurs: ['#c9773f', '#e8b05a'], nom: 'Bracelets de cuivre', icone: '📿', prix: 80, rarete: 'peu', hist: 'plausible', desc: 'Des bracelets de cuivre martelé.' },
  { id: 'sac', marchand: 'karim', cat: 'outil', emplacement: 'sac', forme: 'sacdos', couleurs: ['#a7744a', '#6b4428'], nom: 'Grand sac de voyage', icone: '🎒', prix: 400, rarete: 'rare', hist: 'plausible', desc: 'Un sac solide de cuir et de toile.', effet: 'Tu peux porter 6 objets au lieu de 3.' },
  { id: 'lanterne', marchand: 'karim', cat: 'outil', nom: 'Lampe à huile de voyage', icone: '🏮', prix: 350, rarete: 'rare', hist: 'attesté', desc: 'Une petite lampe de terre cuite qui brûle de l\'huile d\'olive.', effet: 'Éclaire autour de toi la nuit, et permet d\'explorer la grotte des montagnes.' },
  { id: 'boussole', marchand: 'karim', cat: 'outil', nom: 'L\'étoile du guide', icone: '✨', prix: 600, rarete: 'rare', hist: 'plausible', desc: 'Les voyageurs du désert se repéraient grâce aux étoiles. Celle-ci te montre le chemin.', effet: 'Une étoile à l\'écran montre toujours la direction de ta destination ou de ta mission.' },
  { id: 'carte', marchand: 'karim', cat: 'outil', nom: 'La carte des secrets', icone: '📜', prix: 600, rarete: 'rare', hist: 'imaginaire', desc: 'Un vieux parchemin couvert de petits signes mystérieux.', effet: 'Sur ta carte du pays, elle montre les endroits secrets et la grotte des montagnes.' },
  { id: 'jumelles', marchand: 'karim', cat: 'outil', nom: 'Le faucon du voyageur', icone: '🦅', prix: 1000, rarete: 'epique', hist: 'attesté', desc: 'La chasse au faucon était connue en Arabie. Ton faucon vole au loin et repère ce qui est caché.', effet: 'Bouton 🦅 : ton faucon regarde au loin, et les lanternes cachées brillent.' },
  // ---------- Samira : poteries et objets pour ta cour ----------
  { id: 'lampe-huile', marchand: 'samira', cat: 'collection', forme: 'lampe', nom: 'Lampe à huile', icone: '🏮', prix: 40, rarete: 'commun', hist: 'attesté', desc: 'Une petite lampe en terre cuite.' },
  { id: 'cruche', marchand: 'samira', cat: 'collection', forme: 'cruche', nom: 'Cruche à eau', icone: '🏺', prix: 50, rarete: 'commun', hist: 'attesté', desc: 'Sa terre poreuse garde l\'eau fraîche.' },
  { id: 'jarre', marchand: 'samira', cat: 'collection', forme: 'jarre', nom: 'Grande jarre', icone: '🏺', prix: 70, rarete: 'commun', hist: 'attesté', desc: 'Pour conserver les dattes, l\'huile ou les grains.' },
  { id: 'plat', marchand: 'samira', cat: 'collection', forme: 'plat', nom: 'Plat de terre cuite peint', icone: '🍽️', prix: 90, rarete: 'peu', hist: 'plausible', rotation: true, desc: 'Un grand plat aux motifs peints.' },
  { id: 'palmier-pot', marchand: 'samira', cat: 'collection', forme: 'palmier', nom: 'Jeune palmier en pot', icone: '🌴', prix: 120, rarete: 'peu', hist: 'plausible', desc: 'Il deviendra un grand dattier !' },
  { id: 'coussins', marchand: 'samira', cat: 'collection', forme: 'coussins', nom: 'Coussins brodés', icone: '🛋️', prix: 110, rarete: 'peu', hist: 'plausible', rotation: true, desc: 'Pour s\'asseoir à l\'ombre et discuter.' },
  { id: 'coffre-bois', marchand: 'samira', cat: 'collection', forme: 'coffre', nom: 'Coffre de bois clouté', icone: '🧰', prix: 350, rarete: 'rare', hist: 'plausible', desc: 'Un coffre solide pour ranger tes trésors.' },
  { id: 'metier', marchand: 'samira', cat: 'collection', forme: 'metier', nom: 'Métier à tisser', icone: '🧵', prix: 500, rarete: 'rare', hist: 'attesté', desc: 'Pour tisser la laine et faire des tapis.' },
  { id: 'tapis-mural', marchand: 'samira', cat: 'collection', forme: 'tapismural', nom: 'Grand tapis tissé', icone: '🧶', prix: 450, rarete: 'rare', hist: 'plausible', rotation: true, desc: 'Un tapis de laine aux motifs géométriques.' },
  { id: 'lanterne-cuivre', marchand: 'samira', cat: 'collection', forme: 'lanternedoree', nom: 'Lanterne dorée de Nour', icone: '🏮', prix: 900, rarete: 'epique', hist: 'imaginaire', desc: 'L\'emblème des Lanternes de Nour. Une création du jeu, pas un objet historique.' },
  { id: 'arbre-lumiere', marchand: 'samira', cat: 'collection', forme: 'arbrelumiere', nom: 'Le dattier aux lanternes', icone: '🌟', prix: 1500, rarete: 'legendaire', hist: 'imaginaire', rotation: true, desc: 'Un dattier où brillent de petites lanternes, le soir. Une création du jeu.' },
  // ---------- Amina : tapis de selle et parures de monture ----------
  { id: 'tapis-rouge', marchand: 'amina', cat: 'monture', type: 'tapis', motifTapis: 'rayures', couleurs: ['#c94f3c', '#f5b942'], nom: 'Tapis de selle à rayures', icone: '🧶', prix: 100, rarete: 'commun', hist: 'plausible', desc: 'Tissé de larges rayures rouges et dorées.' },
  { id: 'tapis-turquoise', marchand: 'amina', cat: 'monture', type: 'tapis', motifTapis: 'losanges', couleurs: ['#2bb3c0', '#fff8e7'], nom: 'Tapis de selle à losanges', icone: '🔷', prix: 120, rarete: 'peu', hist: 'plausible', desc: 'Des losanges turquoise et blancs.' },
  { id: 'tapis-violet', marchand: 'amina', cat: 'monture', type: 'tapis', motifTapis: 'etoiles', couleurs: ['#7b4fa0', '#f5b942'], nom: 'Tapis de selle aux étoiles', icone: '⭐', prix: 160, rarete: 'peu', hist: 'imaginaire', desc: 'Brodé d\'étoiles à huit branches (motif du jeu).' },
  { id: 'tapis-nuit', marchand: 'amina', cat: 'monture', type: 'tapis', motifTapis: 'nuit', couleurs: ['#2d3a7a', '#ffe3a3'], nom: 'Tapis du ciel de nuit', icone: '🌙', prix: 260, rarete: 'rare', hist: 'imaginaire', desc: 'Bleu nuit, avec un croissant et des étoiles.' },
  { id: 'couverture', marchand: 'amina', cat: 'monture', type: 'couverture', couleurs: ['#8a6a4a', '#efe4cc'], nom: 'Couverture de laine roulée', icone: '🧶', prix: 70, rarete: 'commun', hist: 'attesté', desc: 'Roulée derrière la selle, pour les nuits fraîches.' },
  { id: 'lanterne-sablo', marchand: 'amina', cat: 'monture', type: 'deco', nom: 'Petite lanterne de selle', icone: '🏮', prix: 120, rarete: 'peu', hist: 'imaginaire', desc: 'Elle se balance quand ta monture marche.' },
  { id: 'pompons', marchand: 'amina', cat: 'monture', type: 'pompons', nom: 'Collier à pompons', icone: '🎀', prix: 100, rarete: 'commun', hist: 'plausible', desc: 'Des pompons de laine de toutes les couleurs.' },
  // ---------- Hassan : selles et sacoches ----------
  { id: 'selle-cuir', marchand: 'hassan', cat: 'monture', type: 'selle', couleur: '#8a5a35', nom: 'Selle de cuir', icone: '🐪', prix: 120, rarete: 'commun', hist: 'attesté', desc: 'Solide et confortable.' },
  { id: 'selle-doree', marchand: 'hassan', cat: 'monture', type: 'selle', couleur: '#e0a838', nom: 'Selle aux clous de laiton', icone: '💺', prix: 300, rarete: 'rare', hist: 'plausible', desc: 'Ornée de clous de laiton qui brillent au soleil.' },
  { id: 'selle-artisanale', marchand: 'hassan', cat: 'monture', type: 'selle', couleur: '#a7744a', bois: true, nom: 'Selle de bois sculpté', icone: '🌲', prix: 450, rarete: 'rare', hist: 'plausible', desc: 'Un bât de bois sculpté par un artisan.' },
  { id: 'sacoches', marchand: 'hassan', cat: 'monture', type: 'sacoches', nom: 'Sacoches brodées', icone: '👜', prix: 150, rarete: 'peu', hist: 'plausible', desc: 'Deux sacoches de cuir de chaque côté.' }
];
export const article = id => ARTICLES.find(a => a.id === id);

// Collections thématiques : quand elle est complète, une récompense
export const COLLECTIONS = [
  { id: 'voyageur', nom: 'La collection du voyageur', icone: '🧭', objets: ['sac', 'outre', 'couverture', 'sandales', 'selle-artisanale'], pieces: 500 },
  { id: 'potiere', nom: 'La collection de la potière', icone: '🏺', objets: ['lampe-huile', 'cruche', 'jarre', 'plat'], pieces: 300 },
  { id: 'soir', nom: 'Les étoiles du soir', icone: '🌙', objets: ['tapis-nuit', 'lanterne-sablo', 'lanterne-cuivre', 'arbre-lumiere'], pieces: 1000 },
  { id: 'tisserand', nom: 'La collection du tisserand', icone: '🧵', objets: ['cape-laine', 'ceinture-tissee', 'metier', 'tapis-mural'], pieces: 600 },
  { id: 'cour', nom: 'Une belle cour', icone: '🏡', objets: ['palmier-pot', 'coussins', 'coffre-bois', 'lanterne-cuivre'], pieces: 800 }
];

// Articles du jour : certains reviennent seulement certains jours (les objets utiles sont toujours là)
export function articlesDuJour(jour) {
  let h = 2166136261; for (const c of jour) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  const tournants = ARTICLES.filter(a => a.rotation);
  const choisis = new Set();
  while (choisis.size < Math.ceil(tournants.length / 2)) { h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0; choisis.add(tournants[h % tournants.length].id); }
  return id => { const a = article(id); return !a || !a.rotation || choisis.has(id); };
}

// ---------- modèles des objets de collection (pour la cour et les aperçus) ----------
export function modeleObjet(forme) {
  const p = [];
  switch (forme) {
    case 'lampe': p.push(piece(SPH(0.16, 14, 8), '#b9652f', { s: [1, 0.45, 1.4], p: [0, 0.07, 0], m: M.terre }), piece(CYL(0.03, 0.05, 0.08), '#a5552a', { p: [0, 0.12, -0.18], r: [0.7, 0, 0] }), piece(SPH(0.035, 6, 5), '#ffcf6a', { p: [0, 0.16, -0.22] })); break;
    case 'cruche': p.push(piece(SPH(0.28, 16, 12), '#c9773f', { s: [1, 1.15, 1], p: [0, 0.32, 0], m: M.terre }), piece(CYL(0.09, 0.14, 0.22), '#b9652f', { p: [0, 0.7, 0], m: M.terre }), piece(TOR(0.12, 0.025, Math.PI), '#b9652f', { p: [0.24, 0.45, 0], r: [0, 0, -Math.PI / 2] })); break;
    case 'jarre': p.push(piece(SPH(0.42, 16, 12), '#c48452', { s: [1, 1.3, 1], p: [0, 0.55, 0], m: M.terre }), piece(CYL(0.18, 0.24, 0.2), '#b9652f', { p: [0, 1.15, 0], m: M.terre }), piece(TOR(0.34, 0.02), '#8a4a22', { p: [0, 0.75, 0], r: [Math.PI / 2, 0, 0] })); break;
    case 'plat': p.push(piece(CYL(0.42, 0.3, 0.08, 24), '#d9925a', { p: [0, 0.05, 0], m: M.terre }), piece(TOR(0.3, 0.02), '#2d5b8a', { p: [0, 0.095, 0], r: [Math.PI / 2, 0, 0] }), ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => piece(SPH(0.03, 5, 4), '#2bb3c0', { p: [Math.cos(i * 0.785) * 0.18, 0.095, Math.sin(i * 0.785) * 0.18] }))); break;
    case 'palmier': p.push(piece(CYL(0.25, 0.2, 0.35), '#b9652f', { p: [0, 0.18, 0], m: M.terre }), piece(CYL(0.05, 0.07, 0.7), '#7a5636', { p: [0, 0.65, 0], m: M.bois }), ...[0, 1, 2, 3, 4, 5].map(i => { const g = new THREE.ConeGeometry(0.12, 0.8, 4); g.translate(0, 0.4, 0); return piece(g, '#4fa645', { p: [0, 0.98, 0], r: [0, i * 1.05, -2.0], s: [0.25, 1, 1] }); })); break;
    case 'coussins': for (const [x, c] of [[-0.35, '#c94f3c'], [0.35, '#2bb3c0'], [0, '#f5b942']]) p.push(piece(SPH(0.32, 14, 8), c, { s: [1, 0.42, 0.85], p: [x, 0.13, x === 0 ? -0.35 : 0], m: M.tissu })); break;
    case 'coffre': p.push(piece(B(), '#7b4f2e', { p: [0, 0.28, 0], s: [0.9, 0.56, 0.55], m: M.bois }), piece(CYL(0.28, 0.28, 0.9, 14, 1, false, 0, Math.PI), '#8a5a35', { p: [0, 0.56, 0], r: [0, 0, Math.PI / 2], s: [1, 1, 0.98], m: M.bois }),
        ...[-0.3, 0.3].map(x => piece(B(), '#c9a14a', { p: [x, 0.3, 0], s: [0.06, 0.58, 0.57] })), ...[0, 1, 2, 3, 4].map(i => piece(SPH(0.025, 5, 4), '#e0b04e', { p: [-0.36 + i * 0.18, 0.15, 0.28] }))); break;
    case 'metier': p.push(...[-0.5, 0.5].map(x => piece(B(), '#8a6440', { p: [x, 0.6, 0], s: [0.08, 1.2, 0.08], m: M.bois })), piece(B(), '#8a6440', { p: [0, 1.15, 0], s: [1.1, 0.08, 0.08], m: M.bois }), piece(B(), '#8a6440', { p: [0, 0.25, 0], s: [1.1, 0.08, 0.08], m: M.bois }),
        piece(B(), '#c94f3c', { p: [0, 0.65, 0], s: [0.9, 0.6, 0.02], m: M.laine }), ...[0, 1, 2].map(i => piece(B(), '#f5b942', { p: [0, 0.45 + i * 0.2, 0.015], s: [0.9, 0.04, 0.01] }))); break;
    case 'tapismural': p.push(piece(B(), '#a8443a', { p: [0, 0.9, 0], s: [1.4, 1.6, 0.04], m: M.laine }), piece(B(), '#f3e3c3', { p: [0, 0.9, 0.025], s: [1.1, 1.3, 0.01], m: M.laine }),
        ...[0, 1, 2].map(i => piece(B(), '#2d5b8a', { p: [0, 0.5 + i * 0.4, 0.035], r: [0, 0, Math.PI / 4], s: [0.25, 0.25, 0.01] })), ...Array.from({ length: 8 }, (_, i) => piece(B(), '#f5b942', { p: [-0.6 + i * 0.17, 0.05, 0], s: [0.04, 0.12, 0.02] }))); break;
    case 'lanternedoree': p.push(piece(CYL(0.16, 0.19, 0.38, 8), '#ffd36b', { p: [0, 0.3, 0] }), ...[0, 1, 2, 3].map(i => piece(B(), '#b8741f', { p: [Math.cos(i * Math.PI / 2 + 0.78) * 0.18, 0.3, Math.sin(i * Math.PI / 2 + 0.78) * 0.18], s: [0.03, 0.42, 0.03] })), piece(new THREE.ConeGeometry(0.24, 0.22, 8), '#d9952a', { p: [0, 0.6, 0] }), piece(CYL(0.2, 0.22, 0.12, 8), '#b8741f', { p: [0, 0.06, 0] })); break;
    case 'arbrelumiere': p.push(piece(CYL(0.11, 0.17, 2.4, 10), '#7a5636', { p: [0, 1.2, 0], m: M.bois }), ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => { const g = new THREE.ConeGeometry(0.22, 1.5, 4); g.translate(0, 0.75, 0); return piece(g, '#4f9a45', { p: [0, 2.35, 0], r: [0, i * 0.785, -1.9 - (i % 2) * 0.35], s: [0.3, 1, 1] }); }),
        ...[0, 1, 2, 3, 4].map(i => piece(CYL(0.05, 0.06, 0.12, 6), '#ffd36b', { p: [Math.cos(i * 1.26) * 0.75, 1.9 - (i % 2) * 0.15, Math.sin(i * 1.26) * 0.75] }))); break;
    default: p.push(piece(SPH(0.2), '#ccc'));
  }
  return fusion(p);
}
