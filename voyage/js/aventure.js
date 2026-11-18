// L'aventure : missions, objets cachés, Pièces de Nour, animaux à observer.
// Tout est gagné en jouant : aucun achat réel, aucun hasard, aucune boîte mystère.
import * as THREE from 'three';
import { piece, fusion, materiau } from './formes.js?v=3';
import { Enfant } from './personnages.js?v=3';
import { creerAnimaux, FICHES } from './animaux.js?v=3';
import { LIEUX } from './terrain.js?v=3';

const mat = materiau({ finesse: 1.6 });
const B = () => new THREE.BoxGeometry(1, 1, 1);
const SPH = (r, w = 10, h = 8) => new THREE.SphereGeometry(r, w, h);
const CYL = (a, b, h, s = 10) => new THREE.CylinderGeometry(a, b, h, s);

export const MISSIONS = {
  lanternes: { titre: 'Les lanternes cachées', icone: '🏮', total: 12, recompense: 200,
    resume: 'Douze petites lanternes dorées se sont cachées dans tout le pays de Nour. Retrouve-les toutes !' },
  objets: { titre: 'Les objets perdus de Nour', icone: '🧺', total: 3, recompense: 150,
    resume: 'Nour a perdu son seau, sa gourde et son arrosoir près de l\'oasis. Retrouve-les et rapporte-les-lui au village.' },
  tresor: { titre: 'Le trésor de l\'oasis', icone: '🗝️', total: 4, recompense: 250,
    resume: 'Suis les petits tas de pierres au ruban turquoise : chacun donne un indice. Le dernier mène au coffre.' },
  voyageur: { titre: 'Aider le voyageur', icone: '🤝', total: 4, recompense: 200,
    resume: 'Salim, le voyageur du camp, a besoin de 2 paniers de dattes et de 2 outres d\'eau. Va les chercher à l\'oasis et apporte-les-lui.' },
  animaux: { titre: 'Les animaux du désert', icone: '🦊', total: 7, recompense: 150,
    resume: 'Observe sept animaux différents et découvre comment ils vivent. Approche doucement, sans courir !' }
};

// Les objets à trouver (positions dans le monde)
const LANTERNES = [[-14, -31], [37, 29], [216, 4], [199, 61], [-196, 77], [-158, 86], [82, 262], [-22, 300], [-250, -40], [26, -163], [-26, -236], [9, -272]];
const OBJETS = [{ id: 'seau', nom: 'le seau', x: 171, z: 52 }, { id: 'gourde', nom: 'la gourde', x: 209, z: 7 }, { id: 'arrosoir', nom: 'l\'arrosoir', x: 228, z: 41 }];
const DATTES = [[181, -1], [206, 57]];
const EAU = { x: 167, z: 33 };
const CAIRNS = [
  { x: 161, z: 42, texte: "Premier indice : « Va de l'autre côté de l'eau, là où le soleil se lève. Cherche un tas de pierres près des roseaux. »" },
  { x: 214, z: 22, texte: "Deuxième indice : « Bravo ! Maintenant, marche vers le désert du sud. Cherche le tas de pierres au pied du grand palmier. »" },
  { x: 196, z: 70, texte: "Troisième indice : « Presque ! Le trésor est caché derrière les grosses pierres, au nord-est de l'oasis. »" }
];
const COFFRE = { x: 224, z: -14 };
const VOYAGEUR = { x: -163, z: 50 };
const GROTTE = { x: -13, z: -258 };

export function creerAventure({ scene, terrain, colliders, etat, enregistrer, ui, sons, ombres, donner, evenement = () => {} }) {
  const H = (x, z) => terrain.hauteur(x, z);
  const A = etat.aventure = Object.assign({ pieces: 0, missions: {}, ramasses: [], sac: [], capacite: 3, animaux: [], indices: 0, livres: 0, achats: [], equipement: {} }, etat.aventure || {});
  const libre = (x, z, r = 0.6) => { // sort un objet d'un obstacle s'il tombe dedans
    for (let k = 0; k < 3; k++) for (const c of colliders) { const dx = x - c.x, dz = z - c.z, d = Math.hypot(dx, dz), m = c.r + r; if (d < m && d > 1e-4) { x = c.x + dx / d * m; z = c.z + dz / d * m; } }
    return { x, z };
  };
  const mission = id => A.missions[id];
  function commencer(id, silencieux) {
    if (A.missions[id]) return;
    A.missions[id] = { etat: 'en_cours', n: 0, debut: Date.now() };
    enregistrer(); ui.majSuivi();
    if (!silencieux) { ui.bandeau('Nouvelle mission', MISSIONS[id].titre); sons.sonDecouverte(); }
  }
  function avancer(id, n = 1) {
    const m = A.missions[id]; if (!m || m.etat === 'finie') return;
    m.n = Math.min(MISSIONS[id].total, m.n + n);
    if (m.n >= MISSIONS[id].total) finir(id);
    enregistrer(); ui.majSuivi();
  }
  function finir(id) {
    const m = A.missions[id]; m.etat = 'finie'; m.fin = Date.now();
    gagner(MISSIONS[id].recompense, 'Mission réussie : ' + MISSIONS[id].titre, 'mission:' + id);
    setTimeout(() => { ui.bandeau('Mission réussie !', MISSIONS[id].titre); sons.sonPorte(); }, 700);
  }
  // les pièces tombent au sol près de l'enfant (voir economie.js) : une seule fois par identifiant
  function gagner(n, raison, id) { donner(id, n, raison); }

  // ---------- les modèles ----------
  const groupe = new THREE.Group(); scene.add(groupe);
  const objets3d = [];   // { cle, g, x, z, y, type, ... }
  const geoLanterne = fusion([
    piece(CYL(0.16, 0.19, 0.38, 8), '#ffd36b', { p: [0, 0.19, 0] }),
    ...[0, 1, 2, 3].map(i => piece(B(), '#b8741f', { p: [Math.cos(i * Math.PI / 2 + 0.78) * 0.18, 0.19, Math.sin(i * Math.PI / 2 + 0.78) * 0.18], s: [0.03, 0.42, 0.03] })),
    piece(new THREE.ConeGeometry(0.24, 0.22, 8), '#d9952a', { p: [0, 0.49, 0] }),
    piece(new THREE.TorusGeometry(0.06, 0.015, 5, 10), '#d9952a', { p: [0, 0.64, 0] }),
    piece(CYL(0.2, 0.2, 0.05, 8), '#b8741f', { p: [0, 0.0, 0] })
  ]);
  const matLanterne = materiau({ grain: 0 }); matLanterne.emissive = new THREE.Color('#5a3a08');
  const halo = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,230,150,.9)'); g.addColorStop(1, 'rgba(255,200,80,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const ajouterObjet = (cle, geo, x, z, type, extra = {}) => {
    const p = libre(x, z, 0.5);
    const g = new THREE.Group(); const m = new THREE.Mesh(geo, extra.mat || mat); m.castShadow = ombres; g.add(m);
    if (extra.halo) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 })); s.scale.setScalar(extra.halo); s.position.y = 0.3; g.add(s); }
    g.position.set(p.x, H(p.x, p.z), p.z); groupe.add(g);
    const o = { cle, g, m, x: p.x, z: p.z, type, ...extra }; objets3d.push(o); return o;
  };

  LANTERNES.forEach(([x, z], i) => { const cle = 'lanterne' + i; if (!A.ramasses.includes(cle)) ajouterObjet(cle, geoLanterne, x, z, 'lanterne', { mat: matLanterne, halo: 1.6, flotte: true }); });
  const geos = {
    seau: fusion([piece(CYL(0.22, 0.17, 0.32, 12), '#8a5a35', { p: [0, 0.16, 0] }), piece(CYL(0.225, 0.225, 0.04, 12), '#5a3a22', { p: [0, 0.27, 0] }), piece(new THREE.TorusGeometry(0.2, 0.015, 5, 14, Math.PI), '#4a3a5a', { p: [0, 0.3, 0] })]),
    gourde: fusion([piece(SPH(0.2, 12, 8), '#a7744a', { p: [0, 0.2, 0], s: [1, 1.1, 0.6] }), piece(CYL(0.05, 0.06, 0.14, 8), '#6b4428', { p: [0, 0.44, 0] }), piece(new THREE.TorusGeometry(0.21, 0.015, 5, 16), '#c94f3c', { p: [0, 0.22, 0], r: [0, Math.PI / 2, 0] })]),
    arrosoir: fusion([piece(CYL(0.17, 0.19, 0.3, 12), '#2bb3c0', { p: [0, 0.15, 0] }), piece(CYL(0.03, 0.045, 0.36, 8), '#2bb3c0', { p: [0.24, 0.22, 0], r: [0, 0, -0.9] }), piece(new THREE.TorusGeometry(0.1, 0.02, 5, 12, Math.PI), '#1d8f9c', { p: [-0.12, 0.3, 0], r: [0, 0, 0.6] })]),
    dattes: fusion([piece(CYL(0.28, 0.2, 0.25, 12), '#c9a26a', { p: [0, 0.125, 0] }), ...Array.from({ length: 10 }, (_, i) => piece(SPH(0.06, 6, 4), '#7a3a18', { p: [Math.cos(i * 1.7) * 0.15 * (i % 3) * 0.6, 0.27, Math.sin(i * 1.7) * 0.15 * (i % 3) * 0.6], s: [1, 0.8, 1.5] }))]),
    cairn: fusion([piece(new THREE.IcosahedronGeometry(0.4, 0), '#a89279', { p: [0, 0.25, 0], s: [1.2, 0.6, 1] }), piece(new THREE.IcosahedronGeometry(0.3, 0), '#b9a387', { p: [0, 0.6, 0], s: [1, 0.7, 0.9] }), piece(new THREE.IcosahedronGeometry(0.2, 0), '#c7b296', { p: [0, 0.86, 0] }), piece(B(), '#2bb3c0', { p: [0, 0.62, 0], s: [0.5, 0.06, 0.62] }), piece(B(), '#2bb3c0', { p: [0.2, 0.45, 0.25], r: [0.2, 0, 0.5], s: [0.08, 0.35, 0.02] })])
  };
  for (const o of OBJETS) if (!A.ramasses.includes(o.id) && !A.sac.includes(o.id) && !(A.missions.objets && A.missions.objets.etat === 'finie')) ajouterObjet(o.id, geos[o.id], o.x, o.z, 'objet', { nom: o.nom, halo: 1.1 });
  DATTES.forEach(([x, z], i) => { const cle = 'dattes' + i; if (!A.ramasses.includes(cle) && !A.sac.includes(cle)) ajouterObjet(cle, geos.dattes, x, z, 'dattes', { halo: 1 }); });
  CAIRNS.forEach((c, i) => ajouterObjet('cairn' + i, geos.cairn, c.x, c.z, 'cairn', { i, texte: c.texte, halo: 1.4 }));
  colliders.push(...CAIRNS.map(c => ({ x: c.x, z: c.z, r: 0.5 })));

  // le coffre (son couvercle s'ouvre)
  const coffre = (() => {
    const p = libre(COFFRE.x, COFFRE.z, 1);
    const g = new THREE.Group(); g.position.set(p.x, H(p.x, p.z), p.z); g.rotation.y = -2.2; groupe.add(g);
    const caisse = new THREE.Mesh(fusion([piece(B(), '#7b4f2e', { p: [0, 0.3, 0], s: [1.1, 0.6, 0.7] }), ...[-0.35, 0.35].map(x => piece(B(), '#f5b942', { p: [x, 0.3, 0], s: [0.08, 0.62, 0.72] })), piece(B(), '#f5b942', { p: [0, 0.42, 0.36], s: [0.16, 0.2, 0.04] })]), mat);
    caisse.castShadow = ombres; g.add(caisse);
    const couvercle = new THREE.Group(); couvercle.position.set(0, 0.6, -0.35); g.add(couvercle);
    couvercle.add(new THREE.Mesh(fusion([piece(CYL(0.36, 0.36, 1.1, 12, 1, false, 0, Math.PI), '#8a5a35', { p: [0, 0, 0.35], r: [0, 0, Math.PI / 2], s: [1, 1, 0.97] }), ...[-0.35, 0.35].map(x => piece(CYL(0.37, 0.37, 0.08, 12, 1, false, 0, Math.PI), '#f5b942', { p: [x, 0, 0.35], r: [0, 0, Math.PI / 2] }))]), mat));
    const ouvert = A.missions.tresor && A.missions.tresor.etat === 'finie';
    couvercle.rotation.x = ouvert ? -1.9 : 0;
    colliders.push({ x: p.x, z: p.z, r: 0.8 });
    return { g, couvercle, x: p.x, z: p.z, ouvert, angle: couvercle.rotation.x };
  })();

  // Salim, le voyageur (personnage fictif)
  const salim = new Enfant(ombres, { peau: '#c98e66', tunique: '#7a5a3a', pantalon: '#5a4434', cheche: '#f6f0e2', sac: false });
  salim.racine.scale.setScalar(1.28);
  const pv = libre(VOYAGEUR.x, VOYAGEUR.z, 0.6);
  salim.racine.position.set(pv.x, H(pv.x, pv.z), pv.z); salim.racine.rotation.y = 0.6; groupe.add(salim.racine);
  colliders.push({ x: pv.x, z: pv.z, r: 0.45 });

  // la grotte des montagnes (il faut une lanterne pour y entrer)
  const grotte = (() => {
    const p = libre(GROTTE.x, GROTTE.z, 2.5), g = new THREE.Group(); g.position.set(p.x, H(p.x, p.z) - 0.3, p.z); g.rotation.y = 1.2; groupe.add(g);
    const roc = (s, pos, r) => piece(new THREE.DodecahedronGeometry(1, 0), '#7e6a5e', { p: pos, r, s });
    const m = new THREE.Mesh(fusion([roc([1.6, 2.6, 1.6], [-2.1, 1.6, 0], [0.2, 0.4, 0.1]), roc([1.6, 2.4, 1.7], [2.1, 1.5, 0], [0.1, 1.2, -0.1]),
      roc([3.4, 1.2, 1.9], [0, 3.6, 0], [0.1, 0.2, 0.05]), roc([2.4, 1.6, 2.2], [0, 2.2, -1.4], [0, 0.6, 0])]), mat);
    m.castShadow = ombres; g.add(m);
    const trou = new THREE.Mesh(new THREE.CircleGeometry(1.35, 20), new THREE.MeshBasicMaterial({ color: '#120d10' }));
    trou.position.set(0, 1.45, 0.55); trou.scale.set(1, 1.15, 1); g.add(trou);
    colliders.push({ x: p.x, z: p.z, r: 2.2 });
    const devant = { x: p.x + Math.sin(1.2) * 3, z: p.z + Math.cos(1.2) * 3 };
    return { x: devant.x, z: devant.z };
  })();
  function explorerGrotte() {
    if (!A.equipement.lanterne) { ui.dialogue({ titre: 'Une grotte sombre', texte: 'Il fait tout noir là-dedans… Avec une lampe à huile de voyage, tu pourrais l\'explorer. Karim en vend au souk du village.' }); return; }
    if (A.ramasses.includes('jarre')) { ui.dialogue({ titre: 'La grotte des montagnes', texte: 'Ta lanterne éclaire les parois de pierre. Il fait frais et calme ici. Tu as déjà trouvé ce que la grotte cachait !' }); return; }
    A.ramasses.push('jarre'); enregistrer(); sons.sonPorte();
    gagner(100, 'La grotte des montagnes', 'grotte');
    ui.dialogue({ titre: '🪔 La grotte des montagnes', texte: 'Grâce à ta lanterne, tu vois au fond de la grotte une vieille jarre en terre cuite, posée là par des voyageurs d\'autrefois pour garder de l\'eau au frais. Elle rejoint ta collection !' });
  }

  // ---------- animaux ----------
  const animaux = creerAnimaux(scene, H, ombres, (x, z) => libre(x, z, 0.5));

  // ---------- petites étincelles quand on ramasse ----------
  const etincelles = [];
  function eclat(x, y, z) {
    const n = 18, pos = new Float32Array(n * 3), vit = [];
    for (let i = 0; i < n; i++) { pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; vit.push([(Math.random() - 0.5) * 3, 1.5 + Math.random() * 2, (Math.random() - 0.5) * 3]); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.5, map: halo, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: '#ffe08a' }));
    scene.add(pts); etincelles.push({ pts, vit, vie: 0 });
  }
  const envols = [];   // objets qui s'envolent vers l'enfant

  // ---------- ce qu'on peut faire près de l'enfant ----------
  function interaction(J) {
    let best = null, dmin = Infinity;
    const essai = (d, r, o) => { if (d < r && d < dmin) { dmin = d; best = { ...o, d }; } };
    for (const o of objets3d) {
      if (o.parti) continue;
      const d = Math.hypot(o.x - J.x, o.z - J.z);
      if (o.type === 'cairn') { if (o.i <= A.indices || mission('tresor')) essai(d, 2.8, { label: 'Lire', icone: '📜', faire: () => lireIndice(o) }); }
      else essai(d, 2.2, { label: 'Ramasser', icone: '🤲', faire: () => ramasser(o) });
    }
    essai(Math.hypot(coffre.x - J.x, coffre.z - J.z), 2.6, { label: 'Ouvrir', icone: '🗝️', faire: ouvrirCoffre });
    essai(Math.hypot(pv.x - J.x, pv.z - J.z), 3, { label: 'Parler', icone: '💬', faire: parlerSalim });
    essai(Math.hypot(grotte.x - J.x, grotte.z - J.z), 3.5, { label: 'Explorer', icone: '🪔', faire: explorerGrotte });
    if (mission('voyageur') && mission('voyageur').etat !== 'finie') essai(Math.hypot(EAU.x - J.x, EAU.z - J.z), 4, { label: 'Remplir', icone: '💧', faire: remplirEau });
    for (const a of animaux.liste) essai(Math.hypot(a.x - J.x, a.z - J.z), a.id === 'gazelle' ? 6 : 3, { label: 'Observer', icone: '🔍', faire: () => observer(a.id) });
    return best;
  }

  function placeDansSac() { return A.sac.length < A.capacite; }
  function ramasser(o) {
    if (o.type === 'objet' || o.type === 'dattes') {
      if (!placeDansSac()) { ui.indice('🎒 Ton sac est plein ! Va d\'abord donner ce que tu portes.', 3500); return; }
      if (o.type === 'objet') commencer('objets', !!mission('objets'));
      A.sac.push(o.cle); ui.indice(`🎒 Tu portes ${o.type === 'dattes' ? 'un panier de dattes' : o.nom} (${A.sac.length}/${A.capacite})`, 3000);
      if (o.type === 'dattes' && !mission('voyageur')) ui.indice('🎒 Un panier de dattes… quelqu\'un en a peut-être besoin au camp des caravanes !', 4000);
    } else if (o.type === 'lanterne') {
      commencer('lanternes', !!mission('lanternes'));
      A.ramasses.push(o.cle); gagner(20, 'Lanterne cachée trouvée', 'lanterne:' + o.cle);
      avancer('lanternes'); evenement('lanterne');
      const m = mission('lanternes'); if (m && m.etat !== 'finie') ui.indice(`🏮 Lanterne trouvée : ${m.n} sur 12`, 2500);
    }
    if (o.type !== 'lanterne') A.ramasses.push(o.cle);
    o.parti = true; envols.push({ o, t: 0, y0: o.g.position.y });
    eclat(o.x, o.g.position.y + 0.5, o.z); sons.sonRamasser();
    enregistrer(); ui.majSuivi();
  }
  function lireIndice(o) {
    if (!mission('tresor')) commencer('tresor');
    if (o.i > A.indices) { ui.indice('📜 Commence par le premier indice, près du bord ouest de l\'eau.', 3000); return; }
    ui.dialogue({ titre: '📜 Indice ' + (o.i + 1), texte: o.texte });
    if (o.i === A.indices) { A.indices++; avancer('tresor'); enregistrer(); }
  }
  function ouvrirCoffre() {
    if (coffre.ouvert) { ui.indice('Le coffre est vide : tu as déjà trouvé le trésor !', 2500); return; }
    if (A.indices < 3) { ui.dialogue({ titre: 'Un coffre fermé', texte: 'Il est bien fermé… Suis les trois indices des petits tas de pierres au ruban turquoise pour l\'ouvrir.' }); if (!mission('tresor')) commencer('tresor'); return; }
    coffre.ouvert = true; eclat(coffre.x, coffre.g.position.y + 0.8, coffre.z); sons.sonPorte();
    if (!A.ramasses.includes('medaillon')) A.ramasses.push('medaillon');
    avancer('tresor');
    ui.dialogue({ titre: '🗝️ Le trésor de l\'oasis !', texte: 'Le coffre contient des Pièces de Nour et un joli médaillon en forme d\'étoile. Il rejoint ta collection dans le carnet !' });
  }
  function remplirEau() {
    if (!placeDansSac()) { ui.indice('🎒 Ton sac est plein !', 2500); return; }
    if (A.sac.filter(k => k.startsWith('eau')).length + livresDe('eau') >= 2) { ui.indice('💧 Tu as déjà assez d\'eau pour Salim.', 2500); return; }
    A.sac.push('eau' + Date.now()); sons.sonRamasser(); enregistrer(); ui.majSuivi();
    ui.indice(`💧 Tu as rempli une outre d'eau (${A.sac.length}/${A.capacite})`, 2500);
  }
  const livresDe = type => (A.livraisons || []).filter(k => k.startsWith(type)).length;
  function parlerSalim() {
    const m = mission('voyageur');
    if (!m) {
      ui.dialogue({ titre: 'Salim, le voyageur', texte: "As-salâmou ʿalaykoum ! Je traverse le désert avec ma caravane, mais nos provisions sont presque finies. Peux-tu m'apporter 2 paniers de dattes et 2 outres d'eau ? Tu trouveras tout cela à l'oasis.",
        boutons: [{ txt: 'Oui, je t\'aide !', fn: () => commencer('voyageur') }, { txt: 'Plus tard', fn: () => {} }] });
      return;
    }
    if (m.etat === 'finie') { ui.dialogue({ titre: 'Salim, le voyageur', texte: 'Grâce à toi, la caravane peut repartir. Que ton voyage soit beau !' }); return; }
    const aDonner = A.sac.filter(k => k.startsWith('dattes') || k.startsWith('eau'));
    if (aDonner.length) {
      A.livraisons = (A.livraisons || []).concat(aDonner);
      A.sac = A.sac.filter(k => !aDonner.includes(k));
      avancer('voyageur', aDonner.length);
      enregistrer(); ui.majSuivi(); sons.sonDecouverte();
      if (mission('voyageur').etat === 'finie') ui.dialogue({ titre: 'Merci beaucoup !', texte: "Merci ! Partager son eau et sa nourriture avec un voyageur fatigué, c'est une très belle action. Tiens, voici des Pièces de Nour pour te remercier." });
      else {
        const d = 2 - livresDe('dattes'), e = 2 - livresDe('eau');
        const manque = [d > 0 ? `${d === 2 ? '2 paniers' : 'un panier'} de dattes` : '', e > 0 ? `${e === 2 ? '2 outres' : 'une outre'} d'eau` : ''].filter(Boolean).join(' et ');
        ui.dialogue({ titre: 'Salim, le voyageur', texte: `Merci ! Il me manque encore ${manque}.` });
      }
      return;
    }
    ui.dialogue({ titre: 'Salim, le voyageur', texte: "Il me faut toujours des dattes et de l'eau. Les palmiers de l'oasis donnent de bonnes dattes, et on remplit les outres au bord de l'eau, côté ouest." });
  }
  function observer(id) {
    const f = FICHES[id];
    commencer('animaux', !!mission('animaux'));
    const nouveau = !A.animaux.includes(id);
    if (nouveau) { A.animaux.push(id); gagner(30, 'Nouvel animal : ' + f.nom, 'animal:' + id); avancer('animaux'); }
    evenement('animal', id);
    const bete = animaux.liste.find(o => o.id === id);
    if (ui.decouverte) ui.decouverte({ type: 'animal', cle: id, nom: f.nom, icone: f.icone, texte: f.vie, sous: '🏠 Où il vit : ' + f.habitat, nouveau, objet: bete && bete.g, x: bete && bete.x, z: bete && bete.z,
      progression: { n: A.animaux.length, total: Object.keys(FICHES).length, label: A.animaux.length > 1 ? 'animaux observés' : 'animal observé' } });
    else ui.dialogue({ titre: f.icone + ' ' + f.nom, texte: f.vie, sous: '🏠 Où il vit : ' + f.habitat });
  }
  // Nour : donne les missions des lanternes et des objets, reçoit les objets
  function parlerNour(texteAccueil) {
    const mo = mission('objets'), ml = mission('lanternes');
    const objetsPortes = A.sac.filter(k => OBJETS.some(o => o.id === k));
    if (objetsPortes.length) {
      A.sac = A.sac.filter(k => !objetsPortes.includes(k));
      avancer('objets', objetsPortes.length); enregistrer(); ui.majSuivi(); sons.sonDecouverte();
      const reste = MISSIONS.objets.total - mission('objets').n;
      ui.dialogue({ titre: 'Nour', mascotte: 'nour', texte: reste ? `Merci, tu as retrouvé ${objetsPortes.length > 1 ? 'mes affaires' : 'une de mes affaires'} ! Il en manque encore ${reste}.` : 'Mon seau, ma gourde et mon arrosoir ! Merci mille fois. Grâce à toi, je peux arroser les fleurs du village.' });
      return;
    }
    if (!mo || !ml) {
      ui.dialogue({ titre: 'Nour', mascotte: 'nour', texte: (texteAccueil ? texteAccueil + ' ' : '') + "J'ai besoin de toi ! Douze petites lanternes se sont cachées dans tout le pays… et j'ai perdu mon seau, ma gourde et mon arrosoir près de l'oasis. Tu veux bien m'aider ?",
        boutons: [{ txt: 'Oui, je t\'aide !', fn: () => { commencer('lanternes', true); commencer('objets', true); ui.bandeau('Nouvelles missions', 'Lanternes et objets perdus'); sons.sonDecouverte(); } }, { txt: 'Plus tard', fn: () => {} }] });
      return;
    }
    const enCours = Object.keys(MISSIONS).filter(k => mission(k) && mission(k).etat !== 'finie');
    ui.dialogue({ titre: 'Nour', mascotte: 'nour', texte: enCours.length ? `Courage ! Regarde ton carnet pour suivre tes missions : ${enCours.map(k => MISSIONS[k].titre.toLowerCase()).join(', ')}.` : 'Tu as réussi toutes les missions ! Tu es un vrai explorateur du pays de Nour.' });
  }

  // ---------- chaque image ----------
  function maj(dt, t, J, rapide, nuit) {
    for (const o of objets3d) {
      if (o.parti) continue;
      if (o.flotte) { o.g.position.y = H(o.x, o.z) + 0.6 + Math.sin(t * 2 + o.x) * 0.12; o.m.rotation.y = t * 0.8; }
      else if (o.type === 'cairn' && o.g.children[1]) o.g.children[1].visible = o.i === A.indices && A.indices < 3;   // le prochain indice brille
    }
    for (let i = envols.length - 1; i >= 0; i--) {
      const e = envols[i]; e.t += dt;
      const k = Math.min(1, e.t / 0.6);
      e.o.g.position.set(e.o.x + (J.x - e.o.x) * k, e.y0 + Math.sin(k * Math.PI) * 1.4 + k * 1, e.o.z + (J.z - e.o.z) * k);
      e.o.g.scale.setScalar(1 - k * 0.9); e.o.m.rotation.y += dt * 10;
      if (k >= 1) { groupe.remove(e.o.g); envols.splice(i, 1); }
    }
    for (let i = etincelles.length - 1; i >= 0; i--) {
      const e = etincelles[i]; e.vie += dt;
      const p = e.pts.geometry.attributes.position;
      for (let j = 0; j < e.vit.length; j++) { e.vit[j][1] -= 4 * dt; p.setXYZ(j, p.getX(j) + e.vit[j][0] * dt, p.getY(j) + e.vit[j][1] * dt, p.getZ(j) + e.vit[j][2] * dt); }
      p.needsUpdate = true; e.pts.material.opacity = 1 - e.vie / 1.2;
      if (e.vie > 1.2) { scene.remove(e.pts); e.pts.geometry.dispose(); etincelles.splice(i, 1); }
    }
    // couvercle du coffre
    const cible = coffre.ouvert ? -1.9 : 0; coffre.angle += (cible - coffre.angle) * Math.min(1, dt * 3); coffre.couvercle.rotation.x = coffre.angle;
    // Salim regarde l'enfant
    const dS = Math.hypot(J.x - pv.x, J.z - pv.z);
    if (dS < 8) salim.racine.rotation.y += ((Math.atan2(J.x - pv.x, J.z - pv.z)) - salim.racine.rotation.y) * Math.min(1, dt * 3);
    salim.animer(dt, 0, t);
    animaux.maj(dt, t, J, rapide);
  }

  // Où aller ensuite ? (pour la boussole)
  function prochaineCible(J, seule = null) {
    const cand = [], pour = id => !seule || seule === id;
    const ml = mission('lanternes'); if (pour('lanternes') && ml && ml.etat !== 'finie') objets3d.filter(o => o.type === 'lanterne' && !o.parti).forEach(o => cand.push(o));
    const mo = mission('objets'); if (pour('objets') && mo && mo.etat !== 'finie') { if (A.sac.some(k => OBJETS.some(o => o.id === k)) && !placeDansSac()) cand.push({ x: -5.5, z: 5 }); else objets3d.filter(o => o.type === 'objet' && !o.parti).forEach(o => cand.push(o)); }
    const mt = mission('tresor'); if (pour('tresor') && mt && mt.etat !== 'finie') { const c = objets3d.find(o => o.type === 'cairn' && o.i === A.indices); cand.push(c || coffre); }
    const mv = mission('voyageur'); if (pour('voyageur') && mv && mv.etat !== 'finie') { if (A.sac.some(k => k.startsWith('dattes') || k.startsWith('eau'))) cand.push(pv); else { objets3d.filter(o => o.type === 'dattes' && !o.parti).forEach(o => cand.push(o)); cand.push(EAU); } }
    const ma = mission('animaux'); if (seule === 'animaux' && ma && ma.etat !== 'finie') animaux.liste.filter(o => !A.animaux.includes(o.id)).forEach(o => cand.push(o));
    let best = null, d = Infinity;
    for (const c of cand) { const dd = Math.hypot(c.x - J.x, c.z - J.z); if (dd < d) { d = dd; best = c; } }
    return best;
  }

  // les jumelles font briller les lanternes cachées de loin
  function reperes(actif) { for (const o of objets3d) if (o.type === 'lanterne' && !o.parti && o.g.children[1]) o.g.children[1].scale.setScalar(actif ? 7 : 1.6); }
  return { A, interaction, maj, parlerNour, gagner, prochaineCible, animaux, MISSIONS, objets3d, reperes, grotte, commencer };
}
