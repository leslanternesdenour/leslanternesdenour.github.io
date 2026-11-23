// Les lieux de la première tranche de La Route, en 3D : balises, rochers, repos, traces, campement, oasis, cairn…
// Chaque lieu est UNE géométrie fusionnée (peu d'appels de dessin). Les noms sont fictifs ; aucun personnage historique ni religieux.
import * as THREE from 'three';
import { piece, fusion, materiau, M } from '../formes.js?v=4';
import { Enfant, Chameau } from '../personnages.js?v=4';
import { DEC, OASIS, CAMP, MONTAGNE_NORD, MONTAGNE_SUD } from './relief.js';
import { LIEUX_SACRES } from './lieux-mecque-a-valider.js';
import { LIEUX_ROUTE, positionDeLieu } from './donnees.js';

const B = () => new THREE.BoxGeometry(1, 1, 1), DOD = r => new THREE.DodecahedronGeometry(r, 0), CYL = (a, b, h, s = 8) => new THREE.CylinderGeometry(a, b, h, s);
const SPH = (r, w = 8, h = 6) => new THREE.SphereGeometry(r, w, h);

export function creerLieux3D({ scene, hauteur, colliders, ombres, TX }) {
  const mat = materiau({ finesse: 1.4 }), matVent = materiau({ balance: 1.5 });
  const groupe = new THREE.Group(); groupe.name = 'route-lieux'; scene.add(groupe);
  const lieux = {}, meshes = {};
  const pos = id => { const l = LIEUX_ROUTE.find(o => o.id === id), { s, t } = positionDeLieu(l); return { x: t, z: DEC + s }; };
  const monter = (geo, m, x, z, { dy = 0, rot = 0 } = {}) => { const o = new THREE.Mesh(geo, m); o.position.set(x, hauteur(x, z) + dy, z); o.rotation.y = rot; o.castShadow = ombres; o.receiveShadow = ombres; groupe.add(o); return o; };
  const bloquer = (x, z, r) => colliders.push({ x, z, r });
  // la petite pierre précieuse dorée : elle montre ce qu'il reste à trouver pour la mission
  const gemmeGeo = new THREE.OctahedronGeometry(0.26), gemmeMat = new THREE.MeshBasicMaterial({ color: '#ffd36b' });
  const gemmes = {};
  function gemme(id, x, z, haut = 2.3) { const g = new THREE.Mesh(gemmeGeo, gemmeMat); g.position.set(x, hauteur(x, z) + haut, z); g.userData.y0 = g.position.y; groupe.add(g); gemmes[id] = g; }
  const lueur = new THREE.MeshBasicMaterial({ color: '#ffd36b' });

  // ---- le seuil : deux piliers de pierre et un panneau de bois ----
  { const p = pos('seuil'), g = [];
    for (const s of [-1, 1]) g.push(piece(B(), '#b8a07a', { p: [s * 2.6, 1.4, 0], s: [0.9, 2.8, 0.9], m: M.pierre }), piece(B(), '#a58c64', { p: [s * 2.6, 2.9, 0], s: [1.15, 0.25, 1.15], m: M.pierre }));
    g.push(piece(B(), '#8a6440', { p: [0, 3.0, 0], s: [5.2, 0.22, 0.22], m: M.bois }), piece(B(), '#c9a26a', { p: [0, 2.35, 0], s: [2.6, 0.7, 0.08], m: M.bois }));
    monter(fusion(g), mat, p.x, p.z); bloquer(p.x - 2.6, p.z, 0.8); bloquer(p.x + 2.6, p.z, 0.8); lieux.seuil = { x: p.x, z: p.z + 3 }; }

  // ---- les trois balises de pierre ----
  for (const id of ['balise1', 'balise2', 'balise3']) {
    const p = pos(id), g = [piece(B(), '#b8a07a', { p: [0, 0.95, 0], s: [0.7, 1.9, 0.7], m: M.pierre }), piece(B(), '#a58c64', { p: [0, 2.0, 0], s: [0.95, 0.22, 0.95], m: M.pierre }),
      piece(B(), '#8a6440', { p: [0.55, 1.5, 0], s: [0.9, 0.5, 0.08], r: [0, 0, 0.1], m: M.bois }), piece(DOD(0.5), '#9a8062', { p: [0.7, 0.2, 0.6] }), piece(DOD(0.4), '#a8906e', { p: [-0.6, 0.15, -0.5] })];
    monter(fusion(g), mat, p.x, p.z, { rot: 0.4 * id.length }); bloquer(p.x, p.z, 0.8); gemme(id, p.x, p.z, 2.9); lieux[id] = { x: p.x, z: p.z - 1.8 };
  }
  // ---- le rocher de l'aigle : un grand affleurement de roche ----
  { const p = pos('rocher-aigle'), g = [piece(DOD(4.2), '#a08566', { p: [0, 2.2, 0], s: [1, 0.9, 1.1], r: [0.2, 0.5, 0.1] }), piece(DOD(3), '#8f7a5e', { p: [4.2, 1.2, 1.5], s: [1, 0.9, 1] }),
      piece(DOD(2.4), '#b09672', { p: [-3.5, 1.0, 2.2] }), piece(DOD(2.8), '#9a8062', { p: [1, 3.8, -0.5], s: [0.8, 1.3, 0.8], r: [0.4, 0, 0.3] }), piece(DOD(1.6), '#a8906e', { p: [-1.2, 5.5, -0.6], s: [0.7, 1.2, 0.7] })];
    monter(fusion(g), mat, p.x, p.z); bloquer(p.x, p.z, 4.6); bloquer(p.x + 4.2, p.z + 1.5, 2.8); bloquer(p.x - 3.5, p.z + 2.2, 2.2);
    lieux['rocher-aigle'] = { x: p.x - 7, z: p.z - 3 }; }
  // ---- les points de repos : une dalle de pierre et une petite lanterne ----
  for (const id of ['repos1', 'repos2', 'repos3', 'repos4', 'repos5', 'repos6', 'repos7']) {
    const p = pos(id), g = [piece(B(), '#a8906e', { p: [0, 0.22, 0], s: [3.2, 0.44, 1.4], m: M.pierre }), piece(DOD(0.9), '#9a8062', { p: [-2.2, 0.4, 0.3] }), piece(DOD(0.7), '#b09672', { p: [2.1, 0.3, -0.4] }),
      piece(CYL(0.16, 0.2, 0.5, 6), '#c9a26a', { p: [0.8, 0.7, 0.1] }), piece(CYL(0.2, 0.2, 0.05, 6), '#8a6440', { p: [0.8, 0.97, 0.1] })];
    monter(fusion(g), mat, p.x, p.z, { rot: 0 });
    const l = new THREE.Mesh(SPH(0.15, 8, 6), lueur); l.position.set(p.x + 0.8, hauteur(p.x, p.z) + 0.75, p.z + 0.1); groupe.add(l);
    bloquer(p.x - 2.2, p.z + 0.3, 0.9); bloquer(p.x + 2.1, p.z - 0.4, 0.7); lieux[id] = { x: p.x, z: p.z + 2.2 };
  }
  // ---- les traces dans le sable : des petites empreintes posées au sol, différentes pour chaque animal ----
  const empreintes = {
    lezard: [...Array.from({ length: 9 }, (_, k) => [k * 0.45 - 2, Math.sin(k * 1.1) * 0.25, 0.07, k * 0.5]), ...Array.from({ length: 6 }, (_, k) => [k * 0.4 - 2, Math.sin(k * 0.8) * 0.2 + 0.02, 0.025, 0])],
    gerboise: Array.from({ length: 8 }, (_, k) => [k * 0.9 - 3, (k % 2 ? 0.18 : -0.18) * 0.3, 0.06, 0]),
    renard: Array.from({ length: 8 }, (_, k) => [k * 0.7 - 2.6, (k % 2 ? 0.3 : -0.3), 0.1, k * 0.4])
  };
  for (const l of LIEUX_ROUTE.filter(o => o.type === 'trace')) {
    const p = pos(l.id), g = [], y0 = hauteur(p.x, p.z);
    for (const [dx, dz, r, rot] of empreintes[l.animal]) {
      const x = p.x + dx, z = p.z + dz;
      g.push(piece(new THREE.CircleGeometry(r, 6), '#a98a58', { p: [dx, hauteur(x, z) - y0 + 0.05, dz], r: [-Math.PI / 2, 0, rot], s: [1, 1.5, 1] }));
    }
    const o = monter(fusion(g), mat, p.x, p.z); o.castShadow = false; gemme(l.id, p.x, p.z, 1.5); lieux[l.id] = { x: p.x, z: p.z };
  }
  // ---- un petit bosquet d'acacias ----
  { const p = pos('acacias'), g = [];
    [[0, 0, 1.2], [5, 3, 1], [-4, 4, 0.9], [3, -5, 1.1]].forEach(([dx, dz, sc]) => g.push(piece(CYL(0.12 * sc, 0.2 * sc, 3 * sc, 5), '#6b4a30', { p: [dx, 1.5 * sc, dz] }), piece(SPH(2.1 * sc, 7, 4), '#7d8a45', { p: [dx, 3.2 * sc, dz], s: [1.2, 0.32, 1.2] })));
    monter(fusion(g), matVent, p.x, p.z); [[0, 0], [5, 3], [-4, 4], [3, -5]].forEach(([dx, dz]) => bloquer(p.x + dx, p.z + dz, 0.5)); lieux.acacias = { x: p.x + 2, z: p.z - 3 }; }
  // ---- le belvédère des dunes : une dalle et un petit cairn ----
  { const p = pos('belvedere'), g = [piece(B(), '#b09672', { p: [0, 0.3, 0], s: [4.5, 0.6, 3], m: M.pierre }), piece(DOD(0.6), '#a08566', { p: [1.2, 1.0, 0.3] }), piece(DOD(0.45), '#9a8062', { p: [1.3, 1.6, 0.35] }), piece(DOD(0.3), '#b8a07a', { p: [1.3, 2.0, 0.3] })];
    monter(fusion(g), mat, p.x, p.z, { rot: 0.5 }); bloquer(p.x + 1.2, p.z + 0.3, 0.8); lieux.belvedere = { x: p.x - 3, z: p.z }; }
  // ---- la vieille citerne de pierre ----
  { const p = pos('citerne'), g = [];
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; g.push(piece(B(), k % 2 ? '#a8906e' : '#b8a07a', { p: [Math.cos(a) * 1.9, 0.5, Math.sin(a) * 1.9], s: [1.1, 1.0, 0.6], r: [0, -a + Math.PI / 2, 0], m: M.pierre })); }
    g.push(piece(CYL(1.7, 1.7, 0.06, 14), '#4a3a28', { p: [0, 0.3, 0] }), piece(B(), '#8a6440', { p: [0, 1.7, 0], s: [0.12, 0.12, 4.4], m: M.bois }), piece(B(), '#8a6440', { p: [-1.9, 1.1, 0], s: [0.14, 2.2, 0.14] }), piece(B(), '#8a6440', { p: [1.9, 1.1, 0], s: [0.14, 2.2, 0.14] }));
    monter(fusion(g), mat, p.x, p.z); bloquer(p.x, p.z, 2.3); lieux.citerne = { x: p.x, z: p.z - 3.6 }; }

  // ---- les contreforts : puits, plateau, seuil, porte de pierre, lit de galets, belvédère du premier col ----
  { const p = pos('puits-voyageurs'), g = [];
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; g.push(piece(B(), k % 2 ? '#a8906e' : '#b8a07a', { p: [Math.cos(a) * 1.0, 0.45, Math.sin(a) * 1.0], s: [0.75, 0.9, 0.5], r: [0, -a + Math.PI / 2, 0], m: M.pierre })); }
    g.push(piece(CYL(0.85, 0.85, 0.05, 12), '#2f2a28', { p: [0, 0.35, 0] }), piece(B(), '#6b4a30', { p: [-1.05, 1.3, 0], s: [0.12, 2.0, 0.12], m: M.bois }), piece(B(), '#6b4a30', { p: [1.05, 1.3, 0], s: [0.12, 2.0, 0.12], m: M.bois }), piece(B(), '#6b4a30', { p: [0, 2.3, 0], s: [2.4, 0.12, 0.12], m: M.bois }));
    monter(fusion(g), mat, p.x, p.z); bloquer(p.x, p.z, 1.5); lieux['puits-voyageurs'] = { x: p.x, z: p.z - 2.4 }; }
  { const p = pos('plateau-plat'), g = [], y0 = hauteur(p.x, p.z);
    for (let k = 0; k < 14; k++) { const a = k * 2.1, r = 1 + (k % 5) * 1.5, dx = Math.cos(a) * r, dz = Math.sin(a) * r; g.push(piece(B(), k % 2 ? '#b09672' : '#a08a68', { p: [dx, hauteur(p.x + dx, p.z + dz) - y0 + 0.06, dz], s: [1.6 + (k % 3) * 0.5, 0.12, 1.2 + (k % 2) * 0.6], r: [0, k, 0], m: M.pierre })); }
    const o = monter(fusion(g), mat, p.x, p.z); o.castShadow = false; lieux['plateau-plat'] = { x: p.x, z: p.z }; }
  { const p = pos('seuil-montagnes'), g = [];
    for (const s of [-1, 1]) g.push(piece(DOD(1.3), '#8a4a38', { p: [s * 3.2, 1.6, 0], s: [0.9, 1.6, 0.9] }), piece(DOD(0.8), '#6b4a3a', { p: [s * 3.9, 0.5, 0.6] }));
    g.push(piece(B(), '#8a6440', { p: [4.6, 1.5, 0], s: [0.14, 3.0, 0.14], m: M.bois }), piece(B(), '#c9a26a', { p: [4.6, 2.9, 0.1], s: [1.5, 0.55, 0.07], m: M.bois }));
    monter(fusion(g), mat, p.x, p.z); bloquer(p.x - 3.2, p.z, 1.3); bloquer(p.x + 3.2, p.z, 1.3); lieux['seuil-montagnes'] = { x: p.x, z: p.z + 3 }; }
  { const p = pos('col-porte'), g = [piece(DOD(2.6), '#7a4a3a', { p: [-4.2, 2.6, 0], s: [0.9, 1.5, 1.0], r: [0.1, 0.4, 0.1] }), piece(DOD(2.4), '#6b4538', { p: [4.4, 2.4, 0], s: [0.9, 1.5, 1.0], r: [0.2, 1, 0] }),
      piece(DOD(1.9), '#8a5a44', { p: [-3.0, 5.6, 0], s: [1.6, 0.6, 1.1] }), piece(DOD(1.5), '#7d4e3c', { p: [3.2, 5.4, 0], s: [1.5, 0.6, 1.0] }), piece(DOD(0.9), '#9a6a50', { p: [-5.5, 0.5, 1.5] }), piece(DOD(0.8), '#6b4538', { p: [5.6, 0.4, -1.6] })];
    monter(fusion(g), mat, p.x, p.z); bloquer(p.x - 4.2, p.z, 2.5); bloquer(p.x + 4.4, p.z, 2.3); lieux['col-porte'] = { x: p.x, z: p.z - 3.5 }; }
  { const p = pos('wadi-galets'), g = [], y0 = hauteur(p.x, p.z);
    for (let k = 0; k < 40; k++) { const a = k * 2.399, r = 0.6 + Math.sqrt(k) * 1.1, dx = Math.cos(a) * r, dz = Math.sin(a) * r * 1.4; g.push(piece(DOD(0.16 + (k % 4) * 0.05), ['#8f8678', '#a39b8d', '#6f6a63', '#b0a79a'][k % 4], { p: [dx, hauteur(p.x + dx, p.z + dz) - y0 + 0.08, dz], s: [1.3, 0.6, 1] })); }
    const o = monter(fusion(g), mat, p.x, p.z); o.castShadow = false; lieux['wadi-galets'] = { x: p.x, z: p.z }; }
  { const p = pos('belvedere-col'), g = [piece(B(), '#a8906e', { p: [0, 0.35, 0], s: [5.5, 0.7, 3.4], m: M.pierre }), piece(DOD(0.7), '#9a8062', { p: [1.5, 1.1, 0.4] }), piece(DOD(0.5), '#a08566', { p: [1.6, 1.8, 0.45] }), piece(DOD(0.35), '#b8a07a', { p: [1.6, 2.25, 0.4] }),
      piece(B(), '#6b4a30', { p: [-1.6, 1.0, -0.6], s: [0.14, 2.0, 0.14], m: M.bois }), piece(B(), '#c9a26a', { p: [-1.6, 1.9, -0.55], s: [1.2, 0.5, 0.07], m: M.bois })];
    monter(fusion(g), mat, p.x, p.z, { rot: 0.3 }); bloquer(p.x + 1.5, p.z + 0.4, 0.9); lieux['belvedere-col'] = { x: p.x - 3.4, z: p.z }; }

  // ---- le campement des Trois Tentes ----
  const camp = { x: CAMP.t, z: DEC + CAMP.s };
  { const g = [], tentes = [[-5.5, -3, '#b5654a', 0.2], [4.5, -4.5, '#c9a26a', -0.4], [0.5, 6, '#8a6440', 0.9]];
    for (const [dx, dz, c, r] of tentes) {
      g.push(piece(new THREE.ConeGeometry(2.7, 2.6, 4), c, { p: [dx, 1.3, dz], r: [0, Math.PI / 4 + r, 0], s: [1, 1, 1.15], m: M.tissu }), piece(B(), '#3f2d1f', { p: [dx + Math.sin(r) * 1.3, 0.8, dz + Math.cos(r) * 1.4], s: [0.9, 1.5, 0.08], r: [0, r, 0] }));
      bloquer(camp.x + dx, camp.z + dz, 2.3);
    }
    g.push(piece(B(), '#c0504a', { p: [-1.5, 0.04, -4.2], s: [3, 0.07, 1.8], m: M.laine }), piece(B(), '#2bb3c0', { p: [-1.5, 0.05, -4.2], s: [2.3, 0.07, 1.2], m: M.laine }), piece(B(), '#c9a26a', { p: [2.5, 0.04, 1.2], s: [2.2, 0.07, 1.5], m: M.laine }));
    for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; g.push(piece(DOD(0.22), '#8f7a5e', { p: [Math.cos(a) * 0.8, 0.12, Math.sin(a) * 0.8 + 1.2] })); }
    g.push(piece(CYL(0.2, 0.28, 0.5, 8), '#b0643c', { p: [-3, 0.25, 1.5] }), piece(SPH(0.28), '#b0643c', { p: [-3, 0.6, 1.5] }), piece(CYL(0.2, 0.28, 0.5, 8), '#a35a34', { p: [-3.5, 0.25, 2.1] }), piece(B(), '#8a6440', { p: [6, 0.3, 1], s: [0.8, 0.6, 0.6] }), piece(B(), '#a7744a', { p: [6.2, 0.2, 2], s: [0.6, 0.4, 0.7] }));
    monter(fusion(g), mat, camp.x, camp.z);
    const l = new THREE.Mesh(SPH(0.17, 8, 6), lueur); l.position.set(camp.x + 0.2, hauteur(camp.x, camp.z) + 0.5, camp.z + 1.2); groupe.add(l);
    lieux.campement = { x: camp.x, z: camp.z + 3 }; }
  // une voyageuse et un dromadaire qui se repose
  const voyageuse = new Enfant(ombres, { tunique: '#7a3b4d', pantalon: '#cdbb96', cheche: '#e8dcc4', voile: '#7a3b4d', peau: '#c08a62', sac: false });
  { const p = pos('voyageuse'); voyageuse.racine.position.set(p.x, hauteur(p.x, p.z), p.z); voyageuse.racine.rotation.y = Math.PI * 0.9; groupe.add(voyageuse.racine); bloquer(p.x, p.z, 0.6); lieux.voyageuse = { x: p.x, z: p.z }; }
  const dromadaire = new Chameau(ombres, { robe: ['#d9b27a', '#c99a60', '#7a5636'] });
  { const x = camp.x + 7.5, z = camp.z - 1; dromadaire.racine.position.set(x, hauteur(x, z), z); dromadaire.racine.rotation.y = -0.7; dromadaire.agenouille = 1; groupe.add(dromadaire.racine); bloquer(x, z, 1.6); dromadaire.animer(0.016, 0, 0); }
  // les trois affaires perdues
  for (const [id, l] of [['objet1', 0], ['objet2', 1], ['objet3', 2]]) {
    const p = pos(id), g = l === 0 ? [piece(CYL(0.22, 0.22, 1.5, 10), '#c0504a', { p: [0, 0.25, 0], r: [0, 0, Math.PI / 2], m: M.laine }), piece(CYL(0.23, 0.23, 0.2, 10), '#2bb3c0', { p: [0.4, 0.25, 0], r: [0, 0, Math.PI / 2] })]
      : l === 1 ? [piece(CYL(0.3, 0.38, 0.6, 10), '#b0643c', { p: [0, 0.3, 0], m: M.terre }), piece(SPH(0.4, 10, 8), '#b0643c', { p: [0, 0.75, 0], s: [1, 0.9, 1], m: M.terre }), piece(CYL(0.16, 0.2, 0.18, 8), '#a35a34', { p: [0, 1.15, 0] })]
      : [piece(B(), '#8a6440', { p: [0, 0.25, 0], s: [0.7, 0.5, 0.35], m: M.cuir }), piece(B(), '#a7744a', { p: [0, 0.52, 0.02], s: [0.74, 0.12, 0.38] })];
    meshes[id] = monter(fusion(g), mat, p.x, p.z, { rot: 0.7 * l }); gemme(id, p.x, p.z, 1.6); lieux[id] = { x: p.x, z: p.z };
  }

  // ---- l'oasis : un lac et une petite jetée de bois ----
  const eau = new THREE.Mesh(new THREE.CircleGeometry(OASIS.lac + 8, 40).rotateX(-Math.PI / 2), new THREE.MeshPhongMaterial({ color: '#3f8fa0', transparent: true, opacity: 0.86, shininess: 90, specular: '#cfe9ee', depthWrite: false }));
  eau.position.set(OASIS.t, -0.32, DEC + OASIS.s); groupe.add(eau);
  let eauNormales = null;
  if (TX && TX.eau) { eauNormales = TX.eau.clone(); eauNormales.needsUpdate = true; eauNormales.wrapS = eauNormales.wrapT = THREE.RepeatWrapping; eauNormales.repeat.set(3, 3); eau.material.normalMap = eauNormales; eau.material.normalScale = new THREE.Vector2(0.4, 0.4); }
  { const p = pos('oasis'), g = [];
    for (let k = 0; k < 5; k++) g.push(piece(B(), '#8a6440', { p: [0, 0.2, k * 1.0 + 1], s: [1.5, 0.1, 0.95], m: M.bois }));
    monter(fusion(g), mat, p.x, p.z); lieux.oasis = { x: p.x, z: p.z }; }
  // ---- la palmeraie : un banc de pierre à l'ombre ----
  { const p = pos('palmeraie'), g = [piece(B(), '#b09672', { p: [0, 0.3, 0], s: [2.4, 0.3, 0.8], m: M.pierre }), piece(B(), '#a08566', { p: [-0.9, 0.12, 0], s: [0.3, 0.24, 0.7] }), piece(B(), '#a08566', { p: [0.9, 0.12, 0], s: [0.3, 0.24, 0.7] })];
    monter(fusion(g), mat, p.x, p.z, { rot: 0.4 }); lieux.palmeraie = { x: p.x, z: p.z - 1.8 }; }
  // ---- le grand cairn de fin de tranche : un tas de pierres et un panneau ----
  { const p = pos('cairn-fin'), g = [];
    for (let k = 0; k < 16; k++) { const a = k * 2.4, r = 1.8 - k * 0.09; g.push(piece(DOD(0.8 + (k % 3) * 0.2), k % 2 ? '#a8906e' : '#9a8062', { p: [Math.cos(a) * r, 0.5 + k * 0.17, Math.sin(a) * r], s: [1, 0.8, 1], r: [k, k * 0.7, 0] })); }
    g.push(piece(B(), '#8a6440', { p: [0, 2.6, 0], s: [0.14, 3.4, 0.14], m: M.bois }), piece(B(), '#c9a26a', { p: [0, 3.3, 0.1], s: [1.6, 0.6, 0.07], m: M.bois }));
    monter(fusion(g), mat, p.x, p.z); bloquer(p.x, p.z, 2.6); lieux['cairn-fin'] = { x: p.x, z: p.z - 4 };
    for (const dx of [-5, 5]) { monter(fusion([piece(DOD(1.6), '#a08566', { p: [0, 0.8, 0], s: [1.2, 0.9, 1] }), piece(DOD(1.0), '#8f7a5e', { p: [0.8, 0.5, 0.6] })]), mat, p.x + dx, p.z + 0.5); bloquer(p.x + dx, p.z + 0.5, 1.9); } }

  // ---- de la dernière montagne à la cité : cols, murets, puits, carrefour, pieds des deux grandes montagnes, jardins, porte, atelier, collines, place, marché ----
  const belvedere = (id, rot = 0.3) => { const p = pos(id), g = [piece(B(), '#a8906e', { p: [0, 0.35, 0], s: [5.5, 0.7, 3.4], m: M.pierre }), piece(DOD(0.7), '#9a8062', { p: [1.5, 1.1, 0.4] }), piece(DOD(0.5), '#a08566', { p: [1.6, 1.8, 0.45] }), piece(DOD(0.35), '#b8a07a', { p: [1.6, 2.25, 0.4] })];
    monter(fusion(g), mat, p.x, p.z, { rot }); bloquer(p.x + 1.5, p.z + 0.4, 0.9); lieux[id] = { x: p.x - 3.4, z: p.z }; };
  belvedere('col-vue'); belvedere('crete-vue', 0);
  { const p = pos('muret-pierre'), g = [];
    for (let r = 0; r < 4; r++) for (let k = 0; k < 7 - r; k++) g.push(piece(B(), (k + r) % 2 ? '#a8906e' : '#9a8e7c', { p: [-3.2 + k * 1.0 + r * 0.5, 0.2 + r * 0.38, 0], s: [0.95, 0.36, 0.55], m: M.pierre }));
    monter(fusion(g), mat, p.x, p.z, { rot: Math.PI / 2 }); for (let k = 0; k < 4; k++) bloquer(p.x, p.z - 2.4 + k * 1.6, 0.9); lieux['muret-pierre'] = { x: p.x + 2, z: p.z }; }
  const puits = id => { const p = pos(id), g = [];
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; g.push(piece(B(), k % 2 ? '#a8906e' : '#b8a07a', { p: [Math.cos(a) * 1.0, 0.45, Math.sin(a) * 1.0], s: [0.75, 0.9, 0.5], r: [0, -a + Math.PI / 2, 0], m: M.pierre })); }
    g.push(piece(CYL(0.85, 0.85, 0.05, 12), '#2f2a28', { p: [0, 0.35, 0] }), piece(B(), '#6b4a30', { p: [-1.05, 1.3, 0], s: [0.12, 2.0, 0.12], m: M.bois }), piece(B(), '#6b4a30', { p: [1.05, 1.3, 0], s: [0.12, 2.0, 0.12], m: M.bois }), piece(B(), '#6b4a30', { p: [0, 2.3, 0], s: [2.4, 0.12, 0.12], m: M.bois }), piece(CYL(0.2, 0.28, 0.5, 8), '#b0643c', { p: [1.6, 0.25, 0.8], m: M.terre }));
    monter(fusion(g), mat, p.x, p.z); bloquer(p.x, p.z, 1.5); lieux[id] = { x: p.x, z: p.z - 2.4 }; };
  puits('puits-chemin'); puits('cite-puits');
  { const p = pos('carrefour'), g = [piece(B(), '#6b4a30', { p: [0, 1.4, 0], s: [0.16, 2.8, 0.16], m: M.bois }), piece(B(), '#c9a26a', { p: [-0.7, 2.4, 0], s: [1.5, 0.45, 0.07], r: [0, 0, 0.12], m: M.bois }), piece(B(), '#c9a26a', { p: [0.7, 1.8, 0], s: [1.5, 0.45, 0.07], r: [0, 0, -0.12], m: M.bois }), piece(DOD(0.5), '#9a8062', { p: [0.6, 0.2, 0.6] })];
    monter(fusion(g), mat, p.x, p.z); bloquer(p.x, p.z, 0.4); lieux['carrefour'] = { x: p.x + 1.2, z: p.z - 1.6 }; }
  // les pieds des deux grandes montagnes : une terrasse, un petit panneau, et l'entrée d'une grotte vue de loin (fermée par un éboulis, jamais enterrée dans une scène)
  for (const [id, mt] of [['montagne-nord-pied', MONTAGNE_NORD], ['montagne-sud-pied', MONTAGNE_SUD]]) {
    const p = pos(id), cx = mt.t, cz = DEC + mt.s, dx = cx - p.x, dz = cz - p.z, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, gx = p.x + ux * 38, gz = p.z + uz * 38, face = Math.atan2(-ux, -uz);
    const g = [piece(B(), '#6b4a30', { p: [-2.5, 1.2, 0], s: [0.14, 2.4, 0.14], m: M.bois }), piece(B(), '#c9a26a', { p: [-2.5, 2.2, 0.05], s: [1.5, 0.55, 0.07], m: M.bois }), piece(B(), '#a8906e', { p: [0, 0.2, 0], s: [4, 0.4, 1.4], m: M.pierre })];
    monter(fusion(g), mat, p.x, p.z, { rot: face }); lieux[id] = { x: p.x, z: p.z };
    const grotte = [piece(DOD(5), '#6b5a4a', { p: [0, 2.2, 0], s: [1.4, 1.0, 0.8] }), piece(B(), '#14110f', { p: [0, 1.4, 0.8], s: [3.4, 2.8, 0.6] }), piece(DOD(1.6), '#7a6a58', { p: [-3.2, 1.0, 1.2] }), piece(DOD(1.4), '#7a6a58', { p: [3.3, 0.9, 1.1] }), piece(DOD(1.2), '#8a7a66', { p: [-1.2, 0.6, 2.2] }), piece(DOD(1.0), '#8a7a66', { p: [1.4, 0.5, 2.3] })];
    monter(fusion(grotte), mat, gx, gz, { rot: face }); bloquer(gx, gz, 4);
  }
  { const p = pos('jardins'), g = [];
    for (let k = 0; k < 8; k++) g.push(piece(B(), '#a8906e', { p: [-4 + k * 1.15, 0.3, -3], s: [1.1, 0.6, 0.5], m: M.pierre }), piece(B(), '#a8906e', { p: [-4 + k * 1.15, 0.3, 3], s: [1.1, 0.6, 0.5], m: M.pierre }));
    for (let r = 0; r < 4; r++) g.push(piece(B(), '#6f9a45', { p: [0, 0.08, -1.8 + r * 1.2], s: [7, 0.16, 0.6] }));
    [[-3, 0], [3.3, 0.6]].forEach(([dx, dz]) => g.push(piece(CYL(0.12, 0.18, 2.4, 5), '#6b4a30', { p: [dx, 1.2, dz] }), piece(SPH(1.4, 7, 5), '#6f9a45', { p: [dx, 3.0, dz], s: [1, 0.8, 1] })));
    monter(fusion(g), matVent, p.x, p.z, { rot: 0.1 }); lieux['jardins'] = { x: p.x, z: p.z - 4.2 }; }
  { const p = pos('cite-porte'), g = [];
    for (const sg of [-1, 1]) g.push(piece(B(), '#9a8e7c', { p: [sg * 3.4, 2.2, 0], s: [1.5, 4.4, 1.5], m: M.pierre }), piece(B(), '#847868', { p: [sg * 3.4, 4.6, 0], s: [1.9, 0.4, 1.9], m: M.pierre }));
    g.push(piece(B(), '#6e4e34', { p: [0, 4.4, 0], s: [8, 0.5, 0.7], m: M.bois }));
    monter(fusion(g), mat, p.x, p.z); bloquer(p.x - 3.4, p.z, 1.1); bloquer(p.x + 3.4, p.z, 1.1); lieux['cite-porte'] = { x: p.x, z: p.z + 4 }; }
  { const p = pos('cite-atelier'), g = [piece(B(), '#c4a77d', { p: [0, 1.2, 0], s: [4.4, 2.4, 3.4], m: M.terre }), piece(B(), '#6e4e34', { p: [0, 2.5, 1.9], s: [4.8, 0.1, 1.6], r: [0.25, 0, 0], m: M.bois }), piece(SPH(1.3, 10, 6), '#a8906e', { p: [3.6, 0.4, 0], s: [1, 0.8, 1] })];
    for (let k = 0; k < 6; k++) g.push(piece(CYL(0.22, 0.3, 0.6, 8), k % 2 ? '#b0643c' : '#a35a34', { p: [-2.6 + (k % 3) * 0.7, 0.3, 2.4 + Math.floor(k / 3) * 0.7], m: M.terre }), piece(SPH(0.3, 8, 6), '#b0643c', { p: [-2.6 + (k % 3) * 0.7, 0.75, 2.4 + Math.floor(k / 3) * 0.7], m: M.terre }));
    monter(fusion(g), mat, p.x, p.z, { rot: -0.4 }); bloquer(p.x, p.z, 2.8); lieux['cite-atelier'] = { x: p.x - 1.5, z: p.z + 4.8 }; }
  for (const id of ['cite-colline-a', 'cite-colline-b']) { const p = pos(id), g = [piece(B(), '#a8906e', { p: [0, 0.2, 0], s: [3, 0.4, 1.2], m: M.pierre }), piece(B(), '#6b4a30', { p: [-1.8, 1.1, 0], s: [0.14, 2.2, 0.14], m: M.bois }), piece(B(), '#c9a26a', { p: [-1.8, 2.0, 0.05], s: [1.2, 0.5, 0.07], m: M.bois })];
    monter(fusion(g), mat, p.x, p.z, { rot: 0.2 }); lieux[id] = { x: p.x + 1, z: p.z + 1.4 }; }
  { const p = pos('cite-place'), g = [];
    for (let k = 0; k < 3; k++) g.push(piece(B(), '#b09672', { p: [-2.2 + k * 2.2, 0.28, 0], s: [2, 0.56, 0.9], m: M.pierre }));
    g.push(piece(B(), '#6b4a30', { p: [3.4, 1.2, 0], s: [0.14, 2.4, 0.14], m: M.bois }), piece(B(), '#c9a26a', { p: [3.4, 2.2, 0.05], s: [1.6, 0.55, 0.07], m: M.bois }));
    monter(fusion(g), mat, p.x, p.z, { rot: Math.PI / 2 }); lieux['cite-place'] = { x: p.x - 1.2, z: p.z }; }
  { const p = pos('cite-marche'), g = [];
    for (let k = 0; k < 5; k++) { const a = k * 1.256, dx = Math.cos(a) * 7, dz = Math.sin(a) * 7, c = ['#b5654a', '#c9a26a', '#46587a', '#a85a40', '#e8dcc4'][k];
      g.push(piece(CYL(0.08, 0.1, 2.2, 5), '#6b4a30', { p: [dx - 1.1, 1.1, dz - 0.8] }), piece(CYL(0.08, 0.1, 2.2, 5), '#6b4a30', { p: [dx + 1.1, 1.1, dz - 0.8] }), piece(B(), c, { p: [dx, 2.3, dz], s: [2.8, 0.08, 2.2], r: [0.15, a, 0], m: M.tissu }), piece(B(), '#8a6440', { p: [dx, 0.6, dz - 0.4], s: [2.2, 0.9, 0.9], m: M.bois }),
        piece(CYL(0.22, 0.3, 0.5, 8), '#b0643c', { p: [dx - 0.6, 1.3, dz - 0.4], m: M.terre }), piece(B(), '#c9a26a', { p: [dx + 0.5, 1.15, dz - 0.4], s: [0.6, 0.3, 0.5], m: M.laine })); bloquer(p.x + dx, p.z + dz, 1.6); }
    monter(fusion(g), matVent, p.x, p.z); lieux['cite-marche'] = { x: p.x, z: p.z }; }
  { const p = pos('cite-fin'), g = [];
    for (let k = 0; k < 14; k++) { const a = k * 2.4, r = 1.6 - k * 0.08; g.push(piece(DOD(0.7 + (k % 3) * 0.2), k % 2 ? '#a8906e' : '#9a8062', { p: [Math.cos(a) * r, 0.45 + k * 0.16, Math.sin(a) * r], s: [1, 0.8, 1], r: [k, k * 0.7, 0] })); }
    g.push(piece(B(), '#8a6440', { p: [0, 2.4, 0], s: [0.14, 3.2, 0.14], m: M.bois }), piece(B(), '#c9a26a', { p: [0, 3.1, 0.1], s: [1.6, 0.6, 0.07], m: M.bois }));
    monter(fusion(g), mat, p.x, p.z); bloquer(p.x, p.z, 2.4); lieux['cite-fin'] = { x: p.x, z: p.z - 3.6 }; }

  // ---- les lanternes des histoires : une petite lanterne sur un poteau à côté du lieu ; elle s'allume quand l'enfant approche ----
  const lanternes = {};
  for (const l of LIEUX_ROUTE.filter(o => o.recit || (LIEUX_SACRES[o.id] && LIEUX_SACRES[o.id].recits.length))) {
    const p = lieux[l.id]; if (!p) continue;
    const x = p.x + 3.2, z = p.z + 1.2, g = [piece(CYL(0.07, 0.09, 2.2, 6), '#6b4a30', { p: [0, 1.1, 0], m: M.bois }), piece(B(), '#8a6440', { p: [0.35, 2.1, 0], s: [0.7, 0.06, 0.06], m: M.bois }), piece(CYL(0.19, 0.19, 0.34, 6), '#c9a26a', { p: [0.7, 1.85, 0] })];
    monter(fusion(g), mat, x, z); bloquer(x, z, 0.3);
    const matL = new THREE.MeshBasicMaterial({ color: '#8a7a52' }), lampe = new THREE.Mesh(SPH(0.2, 8, 6), matL); lampe.position.set(x + 0.7, hauteur(x, z) + 1.85, z); groupe.add(lampe);
    lanternes[l.id] = { x, z, allumer(k) { matL.color.set(k ? '#ffd36b' : '#8a7a52'); lampe.scale.setScalar(k ? 1.25 : 1); } };
  }
  return {
    groupe, lieux, voyageuse, dromadaire, pos, camp, lanternes,
    retirerGemme(id) { const g = gemmes[id]; if (g) { groupe.remove(g); delete gemmes[id]; } },
    gemmeVisible(id, v) { if (gemmes[id]) gemmes[id].visible = v; },
    // un objet ramassé disparaît du sol, et sa pierre dorée aussi
    retirerObjet(id) { if (meshes[id]) meshes[id].visible = false; this.retirerGemme(id); },
    animer(dt, t, joueur) {
      for (const k in gemmes) { const g = gemmes[k]; g.rotation.y = t * 1.6; g.position.y = g.userData.y0 + Math.sin(t * 2 + g.position.x) * 0.12; }
      if (Math.hypot(joueur.x - camp.x, joueur.z - camp.z) < 90) { voyageuse.animer(dt, 0, t); dromadaire.animer(dt, 0, t); }
      if (eauNormales) eauNormales.offset.set(t * 0.012, t * 0.007);
    }
  };
}
