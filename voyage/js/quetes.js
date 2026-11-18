// Les quêtes en plus des grandes missions : apprendre des mots arabes, observer des plantes,
// résoudre les énigmes du souk, et la grande traversée (une quête exceptionnelle).
// Chaque quête a une catégorie, une difficulté (★ à ★★★), un objectif, une récompense et, si besoin, une destination.
// Les mots arabes sont écrits en écriture arabe, avec leur prononciation et leur sens ; ils ont été vérifiés.
import * as THREE from 'three';
import { piece, fusion, materiau, M } from './formes.js?v=3';
import { texRonde } from './decouverte.js?v=3';

const mat = materiau({ finesse: 2 });
const B = () => new THREE.BoxGeometry(1, 1, 1);
const CYL = (a, b, h, s = 8) => new THREE.CylinderGeometry(a, b, h, s);
const SPH = (r, w = 10, h = 8) => new THREE.SphereGeometry(r, w, h);

export const CATEGORIES_QUETES = {
  exploration: { nom: 'Explorer', icone: '🧭' }, education: { nom: 'Apprendre', icone: '📚' }, observation: { nom: 'Observer', icone: '🔍' },
  reflexion: { nom: 'Réfléchir', icone: '🧩' }, entraide: { nom: 'Aider', icone: '🤝' }, collection: { nom: 'Collectionner', icone: '🏺' },
  exceptionnelle: { nom: 'Grande aventure', icone: '🌟' }
};

// les mots du voyage (écriture arabe, prononciation, sens)
export const MOTS = [
  { id: 'bir', ar: 'بِئْر', dit: 'bi\'r', fr: 'le puits', x: 3.6, z: 1.6, phrase: 'C\'est là qu\'on puise l\'eau, au cœur du village.' },
  { id: 'jamal', ar: 'جَمَل', dit: 'jamal', fr: 'le chameau', x: 24, z: -4, phrase: 'Le compagnon des caravanes, qui marche longtemps sans boire.' },
  { id: 'souq', ar: 'سُوق', dit: 'soûq', fr: 'le marché', x: -62, z: 23, phrase: 'Le souk, où les marchands vendent tissus, poteries et épices.' },
  { id: 'nakhla', ar: 'نَخْلَة', dit: 'nakhla', fr: 'le palmier', x: 158, z: 33, phrase: 'Le palmier dattier, l\'arbre des oasis.' },
  { id: 'tamr', ar: 'تَمْر', dit: 'tamr', fr: 'les dattes', x: 154, z: 22, phrase: 'Les fruits sucrés du palmier, la nourriture des voyageurs.' },
  { id: 'maa', ar: 'مَاء', dit: 'mâ\'', fr: 'l\'eau', x: 166, z: 25, phrase: 'L\'eau, si précieuse dans le désert.' },
  { id: 'khayma', ar: 'خَيْمَة', dit: 'khayma', fr: 'la tente', x: -160, z: 52, phrase: 'La maison des voyageurs, qu\'on plie et qu\'on emporte.' },
  { id: 'najma', ar: 'نَجْمَة', dit: 'najma', fr: 'l\'étoile', x: 26, z: 196, phrase: 'La nuit, les étoiles aidaient les voyageurs à trouver leur chemin.' }
];
// les plantes à observer (faits vérifiés)
export const PLANTES = [
  { id: 'palmier', nom: 'Le palmier dattier', icone: '🌴', x: 150, z: 37, r: 0.6,
    texte: 'Le palmier dattier pousse dans les oasis, là où l\'eau est cachée sous le sable. Ses dattes sucrées nourrissent les voyageurs, et ses feuilles servent à tresser des paniers et des nattes.' },
  { id: 'acacia', nom: 'L\'acacia du désert', icone: '🌳', x: 21, z: 100, r: 1.3,
    texte: 'L\'acacia a des épines et une forme de parasol. Son ombre protège du soleil, et les chameaux mangent ses petites feuilles sans se piquer !' },
  { id: 'arak', nom: 'L\'arak', icone: '🌿', x: -110, z: 48, r: 1.0,
    texte: 'L\'arak est un arbuste du désert. On coupe ses petites branches pour se brosser les dents : c\'est le siwak, qu\'on appelle aussi miswak.' },
  { id: 'roseaux', nom: 'Les roseaux', icone: '🎋', x: 170, z: 40, r: 0,
    texte: 'Les roseaux poussent les pieds dans l\'eau. Avec leurs tiges, on fabriquait des nattes et des calames : les plumes pour écrire.' }
];
// les énigmes des marchands (réponses simples, adaptées aux enfants)
export const ENIGMES = {
  karim: { q: 'Je suis pleine le matin et légère le soir, après une longue marche. On me remplit au puits. Qui suis-je ?', r: ['L\'outre', 'La sandale', 'Le turban'], ok: 0, exp: 'C\'est l\'outre : un sac de cuir pour transporter l\'eau.' },
  amina: { q: 'J\'ai 3 tapis rouges et 2 tapis bleus. Combien de tapis ai-je en tout ?', r: ['4', '5', '6'], ok: 1, exp: '3 + 2 = 5 tapis.' },
  samira: { q: 'Je suis faite de terre, je passe dans le feu, et je garde l\'eau bien fraîche. Qui suis-je ?', r: ['Le panier', 'La cruche', 'Le coussin'], ok: 1, exp: 'C\'est la cruche en terre cuite : l\'eau s\'évapore doucement à travers la terre, et ça la rafraîchit.' },
  layla: { q: 'Avec moi, on croise les fils de laine pour faire des tapis et des habits. Qui suis-je ?', r: ['Le puits', 'Le métier à tisser', 'La selle'], ok: 1, exp: 'Le métier à tisser !' },
  hassan: { q: 'Un chameau a 4 pattes. Combien de pattes ont 2 chameaux ?', r: ['6', '8', '10'], ok: 1, exp: '4 + 4 = 8 pattes.' }
};
// la grande traversée : à dos de monture, dans l'ordre
export const TRAVERSEE = [
  { nom: 'L\'oasis', icone: '🌴', x: 160, z: 30 }, { nom: 'Le camp des caravanes', icone: '⛺', x: -165, z: 57 },
  { nom: 'Les grandes dunes', icone: '🏜️', x: 28, z: 200 }, { nom: 'Le col', icone: '🚪', x: 0, z: -150 }, { nom: 'Les montagnes', icone: '⛰️', x: 0, z: -255 }
];

// les découvertes des régions à débloquer
const RW = { x: -245, z: 175 }, RR = { x: 150, z: -95 };
export const SPOTS = [
  { id: 'ghadir', quete: 'wadi', titre: 'La mare du wadi', icone: '💧', x: -244, z: 180, arabe: 'غَدِير',
    texte: 'Après la pluie, l\'eau reste quelques jours dans les creux du wadi : c\'est un ghadir, une petite mare. Les animaux et les oiseaux viennent y boire.' },
  { id: 'traces', quete: 'wadi', titre: 'Des traces dans le sable', icone: '🐾', x: -228, z: 190,
    texte: 'Regarde ces petites traces dans le sable humide : un lièvre est passé par ici ! Les traces racontent qui vit dans le désert, même quand on ne voit personne.' },
  { id: 'galets', quete: 'wadi', titre: 'Les galets tout ronds', icone: '🪨', x: -266, z: 162,
    texte: 'Ces cailloux sont tout ronds parce que l\'eau les a roulés pendant très longtemps. C\'est la preuve que de l\'eau coule ici, de temps en temps !' },
  { id: 'g-chameau', quete: 'gravures', titre: 'La gravure du chameau', icone: '🐪', bloc: [RR.x + 6, RR.z - 6, 3.4], dessin: 'chameau',
    texte: 'Un chameau gravé dans la pierre. Il y a très longtemps, les gens dessinaient déjà les animaux qui comptaient pour eux.' },
  { id: 'g-bouquetin', quete: 'gravures', titre: 'La gravure du bouquetin', icone: '🐐', bloc: [RR.x - 12, RR.z - 10, 2.8], dessin: 'bouquetin',
    texte: 'Un bouquetin, avec ses grandes cornes recourbées. Il vit dans les montagnes rocheuses et grimpe partout sans tomber.' },
  { id: 'g-autruche', quete: 'gravures', titre: 'La gravure de l\'autruche', icone: '🪶', bloc: [RR.x + 16, RR.z + 8, 3.0], dessin: 'autruche',
    texte: 'Une autruche ! Autrefois, des autruches vivaient en Arabie. Elles y ont disparu au siècle dernier.' },
  { id: 'g-chiens', quete: 'gravures', titre: 'La gravure des chiens', icone: '🐕', bloc: [RR.x - 4, RR.z + 16, 2.6], dessin: 'chiens',
    texte: 'Des chiens à la queue enroulée, gravés il y a très longtemps. Ils accompagnaient les chasseurs.' }
];

export const QUETES = {
  coins: { titre: 'Les quatre coins du pays', icone: '🗺️', cat: 'exploration', diff: 2, total: 4, recompense: 200,
    desc: 'Découvre l\'oasis, le camp des caravanes, les grandes dunes et les montagnes.', objectif: 'Découvrir 4 régions' },
  mots: { titre: 'Les mots du voyage', icone: '📖', cat: 'education', diff: 1, total: MOTS.length, recompense: 250,
    desc: 'Des petites étoiles dorées cachent des mots arabes près des lieux du pays. Trouve-les et apprends-les !', objectif: `Apprendre ${MOTS.length} mots arabes` },
  plantes: { titre: 'Les plantes du désert', icone: '🌿', cat: 'observation', diff: 2, total: PLANTES.length, recompense: 200,
    desc: 'Observe quatre plantes du pays de Nour et découvre à quoi elles servent.', objectif: 'Observer 4 plantes' },
  enigmes: { titre: 'Les énigmes du souk', icone: '🧩', cat: 'reflexion', diff: 1, total: Object.keys(ENIGMES).length, recompense: 150,
    desc: 'Chaque marchand du souk a une petite énigme pour toi. Réfléchis bien : tu peux réessayer autant que tu veux.', objectif: 'Résoudre 5 énigmes' },
  wadi: { titre: 'Les secrets du wadi', icone: '🌼', cat: 'observation', diff: 2, total: 3, recompense: 200, region: 'wadi',
    desc: 'Dans le wadi, observe la mare, les traces dans le sable et les galets : que racontent-ils ?', objectif: 'Faire 3 découvertes dans le wadi' },
  gravures: { titre: 'Les rochers gravés', icone: '🪨', cat: 'observation', diff: 2, total: 4, recompense: 250, region: 'rochers',
    desc: 'Sur les gros rochers rouges, retrouve quatre gravures d\'animaux très anciennes (des reconstitutions du jeu).', objectif: 'Trouver 4 gravures' },
  traversee: { titre: 'La grande traversée', icone: '🐪', cat: 'exceptionnelle', diff: 3, total: TRAVERSEE.length, recompense: 600,
    desc: 'Comme les caravanes d\'autrefois, traverse tout le pays à dos de ta monture : l\'oasis, le camp, les dunes, le col et les montagnes, dans cet ordre.', objectif: 'Rejoindre 5 étapes à dos de monture' }
};

export function creerQuetes({ scene, terrain, colliders, AV, etat, enregistrer, donner, ui, ombres }) {
  const H = (x, z) => terrain.hauteur(x, z);
  const Q = AV.quetes = Object.assign({ mots: [], plantes: [], enigmes: [], traversee: 0, finies: [], wadi: [], gravures: [] }, AV.quetes || {});
  if (!Q.wadi) Q.wadi = []; if (!Q.gravures) Q.gravures = [];
  const fini = id => Q.finies.includes(id);
  function nombre(id) {
    if (id === 'coins') return ['oasis', 'camp', 'dunes', 'montagnes'].filter(z => etat.zones.includes(z)).length;
    if (id === 'mots') return Q.mots.length; if (id === 'plantes') return Q.plantes.length;
    if (id === 'enigmes') return Q.enigmes.length; if (id === 'traversee') return Q.traversee;
    if (id === 'wadi') return Q.wadi.length; if (id === 'gravures') return Q.gravures.length;
    return 0;
  }
  function verifier(id) {
    if (fini(id) || nombre(id) < QUETES[id].total) return;
    Q.finies.push(id); enregistrer();
    donner('quete:' + id, QUETES[id].recompense, 'Quête réussie : ' + QUETES[id].titre);
    ui.bandeau('Quête réussie !', `${QUETES[id].icone} ${QUETES[id].titre}`);
  }
  // ---------- dans le monde : petites étoiles dorées (mots) et plantes ----------
  // un petit livre ouvert qui flotte et brille : là, un mot arabe attend l'enfant (la lettre noûn en or, comme Nour)
  const etoile = (() => { const p = [];
    for (const sx of [-1, 1]) { p.push(piece(B(), '#8a4e2a', { p: [sx * 0.2, 0, -0.005], r: [0, sx * -0.35, 0], s: [0.42, 0.52, 0.03] }), piece(B(), '#fff6dc', { p: [sx * 0.19, 0, 0.02], r: [0, sx * -0.35, 0], s: [0.36, 0.46, 0.03] })); }
    for (let k = 0; k < 3; k++) p.push(piece(B(), '#c9b48a', { p: [-0.2, 0.12 - k * 0.08, 0.045], r: [0, 0.35, 0], s: [0.22, 0.02, 0.01] }));
    p.push(piece(B(), '#e0a020', { p: [0, 0, -0.02], s: [0.06, 0.52, 0.04] }), piece(new THREE.TorusGeometry(0.075, 0.022, 6, 14, Math.PI), '#e0a020', { p: [0.2, -0.02, 0.05], r: [0, -0.35, Math.PI] }), piece(SPH(0.025, 6, 5), '#e0a020', { p: [0.2, 0.1, 0.05] }));
    return fusion(p); })();
  const matEtoile = new THREE.MeshBasicMaterial({ vertexColors: true }), matAnneau = new THREE.MeshBasicMaterial({ color: '#ffd36b' });
  const marques = MOTS.map(m => { const e = new THREE.Mesh(etoile, matEtoile); e.position.set(m.x, H(m.x, m.z) + 1.3, m.z); scene.add(e); return { m, e }; });
  const halo = new THREE.Points(new THREE.BufferGeometry().setFromPoints(MOTS.map(m => new THREE.Vector3(m.x, H(m.x, m.z) + 1.3, m.z))),
    new THREE.PointsMaterial({ map: texRonde(), color: '#ffd36b', size: 1.8, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(halo);
  // les plantes (leurs modèles), avec une petite loupe brillante au-dessus tant qu'on ne les a pas observées
  const modeles = {
    palmier: () => fusion([piece(CYL(0.16, 0.22, 3.4), '#7a5636', { p: [0, 1.7, 0], m: M.bois }), ...[0, 1, 2, 3, 4, 5, 6].map(i => { const g = new THREE.ConeGeometry(0.28, 2.2, 4); g.translate(0, 1.1, 0); return piece(g, '#4f9a45', { p: [0, 3.35, 0], r: [0, i * 0.9, -1.95 - (i % 2) * 0.3], s: [0.3, 1, 1] }); }),
      ...[0, 1, 2].map(i => piece(SPH(0.22), '#a8582c', { p: [Math.cos(i * 2.1) * 0.25, 3.0, Math.sin(i * 2.1) * 0.25], s: [1, 1.5, 1] }))]),
    acacia: () => fusion([piece(CYL(0.13, 0.2, 2.2), '#6b4a30', { p: [0, 1.1, 0], r: [0, 0, 0.12], m: M.bois }), piece(CYL(0.07, 0.1, 1.2), '#6b4a30', { p: [0.4, 2.2, 0], r: [0, 0, -0.7], m: M.bois }),
      piece(CYL(2.0, 1.4, 0.45, 12), '#6f8f3a', { p: [0.2, 2.75, 0] }), piece(CYL(1.5, 1.9, 0.3, 12), '#7f9f48', { p: [0.2, 3.05, 0] })]),
    arak: () => fusion([...[0, 1, 2, 3, 4].map(i => piece(SPH(0.55), i % 2 ? '#5f8a46' : '#6f9a50', { p: [Math.cos(i * 1.3) * 0.5, 0.55 + (i % 3) * 0.2, Math.sin(i * 1.3) * 0.5], s: [1, 0.8, 1] })),
      ...[0, 1, 2].map(i => piece(CYL(0.03, 0.04, 0.8), '#8a6a4a', { p: [Math.cos(i * 2) * 0.3, 0.3, Math.sin(i * 2) * 0.3], r: [0.3, 0, 0.3 * (i - 1)], m: M.bois }))]),
    roseaux: () => fusion(Array.from({ length: 16 }, (_, i) => { const a = i * 2.4, r = 0.2 + (i % 4) * 0.25; return piece(CYL(0.025, 0.035, 2 + (i % 3) * 0.4, 5), i % 2 ? '#7f9a4a' : '#9aa85a', { p: [Math.cos(a) * r, 1 + (i % 3) * 0.2, Math.sin(a) * r], r: [Math.cos(a) * 0.12, 0, Math.sin(a) * 0.12] }); }))
  };
  const plantes = PLANTES.map(pl => {
    const m = new THREE.Mesh(modeles[pl.id](), mat); m.castShadow = ombres; m.position.set(pl.x, H(pl.x, pl.z) - 0.05, pl.z); scene.add(m);
    if (pl.r) colliders.push({ x: pl.x, z: pl.z, r: pl.r });
    const loupe = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 6, 16), matAnneau); loupe.position.set(pl.x, H(pl.x, pl.z) + (pl.id === 'arak' ? 2.0 : pl.id === 'roseaux' ? 3.0 : 4.4), pl.z); scene.add(loupe);
    return { pl, m, loupe };
  });
  // les gravures (dessins à la manière des gravures anciennes : traits faits de petits points) et les repères
  function texGravure(sorte) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 192; const x = c.getContext('2d');
    x.fillStyle = 'rgba(244,222,190,.92)';
    const trait = (pts, ep = 7) => { for (let i = 0; i < pts.length - 1; i++) { const [a, b] = pts[i], [cc, d] = pts[i + 1], L = Math.hypot(cc - a, d - b); for (let k = 0; k <= L; k += 4) { const t = k / L; x.beginPath(); x.arc(a + (cc - a) * t + (Math.random() - 0.5) * 2, b + (d - b) * t + (Math.random() - 0.5) * 2, ep / 2 * (0.7 + Math.random() * 0.4), 0, 7); x.fill(); } } };
    if (sorte === 'chameau') { trait([[40, 120], [70, 80], [110, 60], [140, 80], [170, 80], [190, 50], [205, 40], [215, 50]]); trait([[70, 80], [70, 150]]); trait([[95, 85], [95, 150]]); trait([[150, 85], [150, 150]]); trait([[170, 85], [172, 150]]); trait([[40, 120], [55, 100]]); }
    else if (sorte === 'bouquetin') { trait([[60, 100], [180, 100], [195, 80]]); trait([[195, 80], [185, 40], [160, 25], [135, 35]]); trait([[200, 80], [205, 70]]); for (const xx of [75, 100, 160, 175]) trait([[xx, 100], [xx, 150]]); trait([[60, 100], [50, 90]]); }
    else if (sorte === 'autruche') { trait([[90, 110], [120, 85], [160, 90], [175, 110], [150, 125], [110, 125], [90, 110]]); trait([[160, 90], [175, 50], [180, 25], [192, 25]]); trait([[125, 125], [120, 170]]); trait([[140, 125], [150, 170]]); }
    else { for (const ox of [0, 120]) { trait([[30 + ox, 110], [100 + ox, 110], [110 + ox, 95], [118 + ox, 92]]); trait([[30 + ox, 110], [20 + ox, 95], [28 + ox, 85], [36 + ox, 92]]); for (const xx of [40, 55, 85, 98]) trait([[xx + ox, 110], [xx + ox, 145]], 6); } }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const spots = SPOTS.map(sp => {
    let x = sp.x, z = sp.z, gr = null;
    if (sp.bloc) {   // la gravure est posée sur le flanc du rocher, tournée vers l'arrivée de la piste
      const [bx, bz, bs] = sp.bloc, ax = 140, az = -83, L = Math.hypot(ax - bx, az - bz) || 1, dx = (ax - bx) / L, dz = (az - bz) / L;
      gr = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.25), new THREE.MeshLambertMaterial({ map: texGravure(sp.dessin), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }));
      gr.position.set(bx + dx * bs * 0.86, H(bx, bz) + bs * 0.5, bz + dz * bs * 0.86); gr.rotation.y = Math.atan2(dx, dz); scene.add(gr);
      x = bx + dx * (bs + 1.6); z = bz + dz * (bs + 1.6);
    }
    const e = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 6, 16), matAnneau); e.position.set(x, H(x, z) + 2.4, z); scene.add(e);
    return { sp, x, z, e, gr };
  });
  function decouvrir(k) {
    const liste = Q[k.sp.quete], nouveau = !liste.includes(k.sp.id), q = QUETES[k.sp.quete];
    if (nouveau) { liste.push(k.sp.id); enregistrer(); majMarques(); }
    ui.decouverte({ type: k.sp.quete === 'gravures' ? 'gravure' : 'nature', cle: k.sp.id, nom: k.sp.titre, icone: k.sp.icone, texte: k.sp.texte, arabe: k.sp.arabe, nouveau, x: k.x, z: k.z,
      progression: { n: liste.length, total: q.total, label: q.titre } });
    if (nouveau) { donner('spot:' + k.sp.id, 20, k.sp.titre); verifier(k.sp.quete); }
  }

  function majMarques() {
    for (const k of spots) k.e.visible = !Q[k.sp.quete].includes(k.sp.id);
    for (const k of marques) k.e.visible = !Q.mots.includes(k.m.id);
    halo.geometry.dispose(); halo.geometry = new THREE.BufferGeometry().setFromPoints(marques.filter(k => k.e.visible).map(k => k.e.position));
    for (const k of plantes) k.loupe.visible = !Q.plantes.includes(k.pl.id);
  }
  majMarques();

  function apprendre(m) {
    const nouveau = !Q.mots.includes(m.id);
    if (nouveau) { Q.mots.push(m.id); enregistrer(); majMarques(); }
    ui.decouverte({ type: 'mot', cle: m.id, nom: m.fr, arabe: m.ar, translit: m.dit, texte: m.phrase, nouveau, x: m.x, z: m.z, y: H(m.x, m.z) + 1.3,
      progression: { n: Q.mots.length, total: MOTS.length, label: Q.mots.length > 1 ? 'mots appris' : 'mot appris' } });
    if (nouveau) { donner('mot:' + m.id, 15, 'Nouveau mot : ' + m.fr); ui.evenement('mot'); verifier('mots'); }
  }
  function observer(k) {
    const nouveau = !Q.plantes.includes(k.pl.id);
    if (nouveau) { Q.plantes.push(k.pl.id); enregistrer(); majMarques(); }
    ui.decouverte({ type: 'plante', cle: k.pl.id, nom: k.pl.nom, icone: k.pl.icone, texte: k.pl.texte, nouveau, x: k.pl.x, z: k.pl.z,
      progression: { n: Q.plantes.length, total: PLANTES.length, label: Q.plantes.length > 1 ? 'plantes observées' : 'plante observée' } });
    if (nouveau) { donner('plante:' + k.pl.id, 20, 'Plante observée : ' + k.pl.nom); verifier('plantes'); }
  }
  function enigme(marchand, nom, voix, retour) {
    const e = ENIGMES[marchand]; if (!e) return;
    ui.dialogue({ titre: `🧩 L'énigme de ${nom}`, texte: e.q, voix, petitsBoutons: true, boutons: e.r.map((r, i) => ({ txt: r, fn: () => setTimeout(() => {
      if (i === e.ok) {
        const nouveau = !Q.enigmes.includes(marchand);
        if (nouveau) { Q.enigmes.push(marchand); enregistrer(); donner('enigme:' + marchand, 25, 'Énigme résolue'); verifier('enigmes'); }
        ui.dialogue({ titre: '✨ Bravo !', texte: e.exp, voix, boutons: [{ txt: 'Merci !', fn: () => retour && setTimeout(retour, 40) }] });
      } else ui.dialogue({ titre: 'Presque !', texte: 'Ce n\'est pas ça… Réfléchis encore un peu, tu peux réessayer !', voix, boutons: [{ txt: 'Réessayer', fn: () => setTimeout(() => enigme(marchand, nom, voix, retour), 40) }, { txt: 'Plus tard', fn: () => retour && setTimeout(retour, 40) }] });
    }, 40) })) });
  }

  return {
    Q, nombre, fini, verifier, enigme,
    enigmeFaite: m => Q.enigmes.includes(m),
    // ce qu'on peut faire tout près
    interaction(J) {
      let best = null, dmin = Infinity;
      for (const k of marques) if (k.e.visible) { const d = Math.hypot(k.m.x - J.x, k.m.z - J.z); if (d < 2.8 && d < dmin) { dmin = d; best = { label: 'Apprendre', icone: 'mots', faire: () => apprendre(k.m), d }; } }
      for (const k of plantes) { const d = Math.hypot(k.pl.x - J.x, k.pl.z - J.z); if (d < k.pl.r + 2.8 && d < dmin) { dmin = d; best = { label: 'Observer', icone: '🔍', faire: () => observer(k), d }; } }
      for (const k of spots) { const d = Math.hypot(k.x - J.x, k.z - J.z); if (d < 3.2 && d < dmin) { dmin = d; best = { label: 'Observer', icone: k.sp.icone, faire: () => decouvrir(k), d }; } }
      return best;
    },
    // la traversée et les régions (appelé régulièrement)
    maj(dt, t, pos, monte) {
      for (const k of marques) if (k.e.visible) { k.e.rotation.y = t * 1.5; k.e.position.y = H(k.m.x, k.m.z) + 1.3 + Math.sin(t * 2 + k.m.x) * 0.12; }
      for (const k of plantes) if (k.loupe.visible) k.loupe.rotation.y = t * 1.2;
      for (const k of spots) if (k.e.visible) k.e.rotation.y = t * 1.2;
      if (!fini('traversee') && monte && Q.traversee < TRAVERSEE.length) {
        const e = TRAVERSEE[Q.traversee];
        if (Math.hypot(e.x - pos.x, e.z - pos.z) < 16) {
          Q.traversee++; enregistrer();
          ui.bandeau(`Grande traversée : étape ${Q.traversee} sur ${TRAVERSEE.length}`, `${e.icone} ${e.nom}`);
          verifier('traversee');
        }
      }
      verifier('coins');
    },
    // où aller pour avancer dans une quête (pour « Me guider »)
    destination(id, J) {
      const proche = l => l.reduce((b, o) => !b || Math.hypot(o.x - J.x, o.z - J.z) < Math.hypot(b.x - J.x, b.z - J.z) ? o : b, null);
      if (fini(id)) return null;
      if (id === 'mots') { const m = proche(MOTS.filter(m => !Q.mots.includes(m.id))); return m && { x: m.x, z: m.z, nom: 'un mot arabe', icone: '📖', rayon: 2.5 }; }
      if (id === 'plantes') { const p = proche(PLANTES.filter(p => !Q.plantes.includes(p.id))); return p && { x: p.x, z: p.z, nom: p.nom, icone: p.icone, rayon: p.r + 2.5 }; }
      if (id === 'wadi' || id === 'gravures') { const k = proche(spots.filter(k => k.sp.quete === id && !Q[id].includes(k.sp.id))); return k && { x: k.x, z: k.z, nom: k.sp.titre, icone: k.sp.icone, rayon: 2.6 }; }
      if (id === 'traversee') { const e = TRAVERSEE[Q.traversee]; return e && { x: e.x, z: e.z, nom: e.nom, icone: e.icone, rayon: 14 }; }
      return null;
    }
  };
}
