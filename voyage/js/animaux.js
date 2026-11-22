// Les animaux du pays de Nour. Chacun a son modèle, sa façon de bouger et sa fiche (informations vérifiables,
// sans rien d'inventé). Les gazelles s'éloignent si l'on court vers elles : on apprend à approcher doucement.
import * as THREE from 'three';
import { piece, fusion, materiau } from './formes.js?v=4';

const mat = materiau({ finesse: 2.2 });
const B = () => new THREE.BoxGeometry(1, 1, 1);
const SPH = (r, w = 10, h = 8) => new THREE.SphereGeometry(r, w, h);
const CYL = (a, b, h, s = 7) => new THREE.CylinderGeometry(a, b, h, s);
const yeux = (x, y, z, r = 0.03) => [piece(SPH(r, 6, 5), '#1e1a2e', { v: 1, p: [-x, y, z] }), piece(SPH(r, 6, 5), '#1e1a2e', { v: 1, p: [x, y, z] }),
  piece(SPH(r * 0.4, 4, 3), '#ffffff', { v: 1, p: [-x - r * 0.3, y + r * 0.4, z + r * 0.7] }), piece(SPH(r * 0.4, 4, 3), '#ffffff', { v: 1, p: [x + r * 0.3, y + r * 0.4, z + r * 0.7] })];

export const FICHES = {
  dromadaire: { nom: 'Le dromadaire', icone: '🐪', habitat: 'Les déserts chauds d\'Afrique et d\'Arabie.',
    vie: 'Sa bosse contient de la graisse, pas de l\'eau : c\'est sa réserve d\'énergie. Quand il a très soif, il peut boire énormément d\'eau en quelques minutes.' },
  gazelle: { nom: 'La gazelle des sables', icone: '🦌', habitat: 'Les dunes et les plaines de sable.',
    vie: 'Elle mange des herbes et des feuilles, et trouve une grande partie de son eau dans les plantes. Elle court très vite : pour l\'observer, il faut s\'approcher doucement.' },
  fennec: { nom: 'Le fennec', icone: '🦊', habitat: 'Le désert de sable, dans des terriers.',
    vie: 'C\'est le plus petit des renards. Ses très grandes oreilles l\'aident à se rafraîchir et à entendre les petites bêtes cachées sous le sable. Il sort surtout la nuit.' },
  huppe: { nom: 'La huppe', icone: '🐦', habitat: 'Les oasis, les jardins et les champs.',
    vie: 'Elle a une jolie crête de plumes sur la tête et un long bec courbé pour chercher des insectes dans la terre. La huppe est citée dans le Coran, dans la sourate An-Naml (Les Fourmis).' },
  chevre: { nom: 'La chèvre', icone: '🐐', habitat: 'Les villages et les montagnes.',
    vie: 'Elle grimpe très bien, même sur les rochers. Elle mange beaucoup de sortes de plantes et donne du lait, avec lequel on fait du fromage.' },
  colombe: { nom: 'La colombe', icone: '🕊️', habitat: 'Les villages et les villes.',
    vie: 'Les pigeons et les colombes reconnaissent leur maison et savent la retrouver, même de très loin.' },
  lezard: { nom: 'Le fouette-queue', icone: '🦎', habitat: 'Les rochers du désert.',
    vie: 'Ce lézard mange surtout des plantes. Le matin, il se chauffe au soleil sur les pierres ; quand il fait trop chaud, il se cache dans son terrier sous les rochers.' }
};

function gazelle(ombre) {
  const g = new THREE.Group(), robe = '#c98d55', ventre = '#f3e6d0';
  const corps = new THREE.Mesh(fusion([
    piece(SPH(1, 12, 8), robe, { s: [0.22, 0.24, 0.5], p: [0, 0.78, 0] }),
    piece(SPH(1, 10, 6), ventre, { s: [0.19, 0.14, 0.42], p: [0, 0.7, 0] }),
    piece(B(), '#5a3a22', { p: [0, 0.78, 0], s: [0.45, 0.04, 0.85] }),           // bande foncée du flanc
    piece(CYL(0.05, 0.03, 0.18), '#5a3a22', { p: [0, 0.82, -0.52], r: [0.6, 0, 0] })
  ]), mat); corps.castShadow = ombre; g.add(corps);
  const tete = new THREE.Group(); tete.position.set(0, 0.95, 0.42); g.add(tete);
  tete.add(new THREE.Mesh(fusion([
    piece(CYL(0.07, 0.09, 0.42), robe, { p: [0, 0.15, 0.05], r: [0.5, 0, 0] }),
    piece(SPH(1, 10, 8), robe, { s: [0.09, 0.1, 0.17], p: [0, 0.35, 0.18] }),
    piece(SPH(1, 8, 6), ventre, { s: [0.06, 0.05, 0.08], p: [0, 0.31, 0.3] }),
    piece(CYL(0.012, 0.02, 0.35), '#3a2a1a', { p: [-0.05, 0.55, 0.12], r: [-0.4, 0, 0.1] }),
    piece(CYL(0.012, 0.02, 0.35), '#3a2a1a', { p: [0.05, 0.55, 0.12], r: [-0.4, 0, -0.1] }),
    piece(new THREE.ConeGeometry(0.035, 0.12, 5), robe, { p: [-0.08, 0.47, 0.13], r: [0, 0, 0.8] }),
    piece(new THREE.ConeGeometry(0.035, 0.12, 5), robe, { p: [0.08, 0.47, 0.13], r: [0, 0, -0.8] }),
    ...yeux(0.07, 0.38, 0.24, 0.022)
  ]), mat));
  const pattes = [[-0.12, 0.3], [0.12, 0.3], [-0.12, -0.3], [0.12, -0.3]].map(([x, z]) => {
    const p = new THREE.Group(); p.position.set(x, 0.66, z); g.add(p);
    p.add(new THREE.Mesh(fusion([piece(CYL(0.03, 0.02, 0.66), robe, { p: [0, -0.33, 0] }), piece(B(), '#2a2018', { p: [0, -0.66, 0.01], s: [0.04, 0.04, 0.05] })]), mat));
    return p;
  });
  return { g, tete, pattes };
}

function fennec(ombre) {
  const g = new THREE.Group(), poil = '#ecc894', creme = '#fbf0dc';
  const m = new THREE.Mesh(fusion([
    piece(SPH(1, 10, 8), poil, { s: [0.12, 0.11, 0.2], p: [0, 0.18, 0] }),
    piece(SPH(1, 10, 8), poil, { s: [0.1, 0.09, 0.1], p: [0, 0.3, 0.2] }),
    piece(new THREE.ConeGeometry(0.04, 0.12, 6), creme, { p: [0, 0.27, 0.32], r: [Math.PI / 2, 0, 0] }),
    piece(SPH(0.018, 5, 4), '#1e1a2e', { v: 1, p: [0, 0.27, 0.38] }),   // nez
    piece(new THREE.ConeGeometry(0.07, 0.24, 6), poil, { p: [-0.08, 0.45, 0.17], r: [0, 0, 0.45], s: [1, 1, 0.5] }),
    piece(new THREE.ConeGeometry(0.07, 0.24, 6), poil, { p: [0.08, 0.45, 0.17], r: [0, 0, -0.45], s: [1, 1, 0.5] }),
    piece(new THREE.ConeGeometry(0.045, 0.17, 6), '#f6b9a8', { p: [-0.08, 0.44, 0.185], r: [0, 0, 0.45], s: [1, 1, 0.3] }),
    piece(new THREE.ConeGeometry(0.045, 0.17, 6), '#f6b9a8', { p: [0.08, 0.44, 0.185], r: [0, 0, -0.45], s: [1, 1, 0.3] }),
    piece(SPH(1, 8, 6), poil, { s: [0.05, 0.05, 0.16], p: [0, 0.16, -0.27], r: [0.4, 0, 0] }),
    piece(SPH(0.04, 6, 4), '#3a2a1a', { p: [0, 0.11, -0.4] }),
    ...[[-0.06, 0.1], [0.06, 0.1], [-0.06, -0.1], [0.06, -0.1]].map(([x, z]) => piece(CYL(0.02, 0.018, 0.12), poil, { p: [x, 0.06, z] })),
    ...yeux(0.045, 0.33, 0.28, 0.02)
  ]), mat); m.castShadow = ombre; g.add(m);
  return { g, tete: m };
}

function huppe(ombre) {
  const g = new THREE.Group(), plume = '#d99a5e';
  const m = new THREE.Mesh(fusion([
    piece(SPH(1, 10, 8), plume, { s: [0.08, 0.08, 0.13], p: [0, 0.14, 0] }),
    ...[0, 1, 2].map(i => piece(B(), i % 2 ? '#1e1a1a' : '#f6f0e6', { p: [0, 0.16, -0.06 - i * 0.04], s: [0.17, 0.03, 0.035] })),
    piece(SPH(0.055, 8, 6), plume, { p: [0, 0.24, 0.1] }),
    piece(new THREE.ConeGeometry(0.012, 0.13, 5), '#2a2018', { p: [0, 0.22, 0.2], r: [Math.PI / 2 + 0.25, 0, 0] }),
    ...[0, 1, 2, 3, 4].map(i => piece(new THREE.ConeGeometry(0.018, 0.11, 4), i % 2 ? plume : '#1e1a1a', { p: [0, 0.29 + Math.sin(i * 0.6) * 0.02, 0.08 - i * 0.03], r: [-0.6 + i * 0.12, 0, 0] })),
    piece(B(), '#1e1a1a', { p: [0, 0.12, -0.17], r: [0.4, 0, 0], s: [0.06, 0.02, 0.1] }),
    piece(CYL(0.008, 0.008, 0.08), '#5a4030', { p: [-0.03, 0.04, 0] }), piece(CYL(0.008, 0.008, 0.08), '#5a4030', { p: [0.03, 0.04, 0] }),
    ...yeux(0.04, 0.25, 0.13, 0.012)
  ]), mat); m.castShadow = ombre; g.add(m); g.scale.setScalar(1.6);
  return { g, tete: m };
}

function chevre(ombre, couleur) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(fusion([
    piece(SPH(1, 10, 8), couleur, { s: [0.2, 0.22, 0.38], p: [0, 0.55, 0] }),
    ...[[-0.1, 0.22], [0.1, 0.22], [-0.1, -0.22], [0.1, -0.22]].map(([x, z]) => piece(CYL(0.035, 0.03, 0.42), couleur, { p: [x, 0.22, z] })),
    piece(CYL(0.06, 0.08, 0.25), couleur, { p: [0, 0.75, 0.3], r: [0.5, 0, 0] }),
    piece(SPH(1, 8, 6), couleur, { s: [0.08, 0.09, 0.15], p: [0, 0.85, 0.42] }),
    piece(new THREE.ConeGeometry(0.02, 0.15, 5), '#4a3a2a', { p: [0, 0.73, 0.5] }),                         // barbiche
    piece(CYL(0.012, 0.02, 0.18), '#6a5a4a', { p: [-0.04, 0.98, 0.36], r: [-0.8, 0, 0.2] }),
    piece(CYL(0.012, 0.02, 0.18), '#6a5a4a', { p: [0.04, 0.98, 0.36], r: [-0.8, 0, -0.2] }),
    piece(B(), couleur, { p: [-0.1, 0.88, 0.38], r: [0, 0, 0.5], s: [0.1, 0.03, 0.05] }), piece(B(), couleur, { p: [0.1, 0.88, 0.38], r: [0, 0, -0.5], s: [0.1, 0.03, 0.05] }),
    piece(CYL(0.02, 0.01, 0.1), couleur, { p: [0, 0.65, -0.38], r: [-0.8, 0, 0] }),
    ...yeux(0.06, 0.88, 0.48, 0.016)
  ]), mat); m.castShadow = ombre; g.add(m);
  return { g, tete: m };
}

function colombe(ombre) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(fusion([
    piece(SPH(1, 10, 8), '#eef0f4', { s: [0.07, 0.07, 0.12], p: [0, 0.1, 0] }),
    piece(SPH(0.05, 8, 6), '#eef0f4', { p: [0, 0.18, 0.08] }),
    piece(new THREE.ConeGeometry(0.012, 0.04, 4), '#e8a87c', { p: [0, 0.18, 0.14], r: [Math.PI / 2, 0, 0] }),
    piece(B(), '#c9ccd6', { p: [0, 0.11, -0.12], r: [0.3, 0, 0], s: [0.07, 0.015, 0.09] }),
    piece(CYL(0.006, 0.006, 0.05), '#e07a6a', { p: [-0.02, 0.025, 0] }), piece(CYL(0.006, 0.006, 0.05), '#e07a6a', { p: [0.02, 0.025, 0] }),
    ...yeux(0.03, 0.19, 0.1, 0.009)
  ]), mat); m.castShadow = ombre; g.add(m); g.scale.setScalar(1.8);
  return { g, tete: m };
}

function lezard(ombre) {
  const g = new THREE.Group(), peau = '#b88a4e';
  const m = new THREE.Mesh(fusion([
    piece(SPH(1, 10, 6), peau, { s: [0.09, 0.05, 0.18], p: [0, 0.06, 0] }),
    piece(SPH(1, 8, 6), peau, { s: [0.06, 0.045, 0.08], p: [0, 0.07, 0.2] }),
    piece(new THREE.ConeGeometry(0.06, 0.32, 6), '#9a7240', { p: [0, 0.05, -0.32], r: [-Math.PI / 2, 0, 0] }),
    ...[0, 1, 2, 3, 4].map(i => piece(B(), '#7a5a30', { p: [0, 0.055, -0.22 - i * 0.05], s: [0.1 - i * 0.015, 0.02, 0.015] })),
    ...[[-0.08, 0.08], [0.08, 0.08], [-0.08, -0.1], [0.08, -0.1]].map(([x, z]) => piece(B(), peau, { p: [x, 0.03, z], r: [0, 0, x > 0 ? -0.5 : 0.5], s: [0.08, 0.025, 0.03] })),
    ...yeux(0.04, 0.09, 0.24, 0.011)
  ]), mat); m.castShadow = ombre; g.add(m); g.scale.setScalar(1.7);
  return { g, tete: m };
}

// Place et anime tous les animaux. H = hauteur du sol.
export function creerAnimaux(scene, H, ombres, libre) {
  const liste = [];
  const ajouter = (id, modele, x, z, comportement) => {
    const a = { id, ...modele, x, z, x0: x, z0: z, a: Math.random() * 6, v: 0, t: Math.random() * 10, comportement };
    if (libre) { const p = libre(x, z); a.x = a.x0 = p.x; a.z = a.z0 = p.z; }
    a.g.position.set(a.x, H(a.x, a.z), a.z); scene.add(a.g); liste.push(a); return a;
  };
  for (let i = 0; i < 3; i++) ajouter('gazelle', gazelle(ombres), 46 + i * 7, 252 + (i % 2) * 6, 'gazelle');
  ajouter('fennec', fennec(ombres), -63, 233, 'fennec');
  ajouter('huppe', huppe(ombres), 203, 54, 'oiseau');
  ajouter('chevre', chevre(ombres, '#f1ebe0'), -27, 9, 'brouter');
  ajouter('chevre', chevre(ombres, '#5a4434'), -30, 13, 'brouter');
  ajouter('colombe', colombe(ombres), 4.6, -2.6, 'oiseau');
  ajouter('colombe', colombe(ombres), 5.2, -1.4, 'oiseau');
  ajouter('lezard', lezard(ombres), -152, 84, 'lezard');

  function maj(dt, t, J, rapide) {
    for (const a of liste) {
      a.t += dt;
      const dj = Math.hypot(J.x - a.x, J.z - a.z);
      if (a.comportement === 'gazelle') {
        // fuit si on arrive en courant ; sinon broute et se promène doucement autour de son coin
        if (rapide && dj < 14) { a.peur = 3; a.cap = Math.atan2(a.x - J.x, a.z - J.z); }
        if (a.peur > 0) { a.peur -= dt; a.v += (6.5 - a.v) * Math.min(1, dt * 3); a.a += angle(a.a, a.cap) * Math.min(1, dt * 5); }
        else {
          if (Math.hypot(a.x - a.x0, a.z - a.z0) > 26) { a.cap = Math.atan2(a.x0 - a.x, a.z0 - a.z); a.v = 1.2; }
          else if (Math.sin(a.t * 0.3 + a.x0) > 0.6) { a.v += (0.9 - a.v) * dt; a.cap = (a.cap ?? a.a) + Math.sin(a.t * 0.2) * dt * 0.4; }
          else a.v *= Math.max(0, 1 - dt * 2);
          if (a.cap != null) a.a += angle(a.a, a.cap) * Math.min(1, dt * 2);
        }
        a.x += Math.sin(a.a) * a.v * dt; a.z += Math.cos(a.a) * a.v * dt;
        const ph = a.t * (4 + a.v * 1.8);
        a.pattes.forEach((p, i) => { p.rotation.x = a.v > 0.2 ? Math.sin(ph + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * Math.min(0.9, 0.3 + a.v * 0.1) : 0; });
        a.tete.rotation.x = a.v < 0.3 ? 0.9 + Math.sin(a.t * 2) * 0.1 : -0.1;               // broute la tête baissée
        a.g.position.y = H(a.x, a.z) + (a.v > 4 ? Math.abs(Math.sin(ph)) * 0.15 : 0);
      } else if (a.comportement === 'brouter') {
        a.tete.rotation.x = Math.sin(a.t * 0.8) > 0 ? 0.15 : 0;
        a.g.position.y = H(a.x, a.z);
      } else if (a.comportement === 'oiseau') {
        const saut = Math.max(0, Math.sin(a.t * 3.1)) ** 8;
        if (saut > 0.9 && Math.random() < 0.05) a.a += (Math.random() - 0.5) * 2;
        a.g.position.y = H(a.x, a.z) + (a.id === 'colombe' ? 0.9 : 0) * (Math.hypot(a.x, a.z) < 6 ? 1 : 0) + saut * 0.08;
        a.tete.rotation.x = Math.sin(a.t * 5) > 0.7 ? 0.25 : 0;
      } else if (a.comportement === 'fennec') {
        a.tete.rotation.y = Math.sin(a.t * 0.7) * 0.4;
        a.g.position.y = H(a.x, a.z);
      } else if (a.comportement === 'lezard') {
        a.g.position.y = H(a.x, a.z) + 0.05;
        a.g.rotation.z = Math.sin(a.t * 1.3) > 0.8 ? Math.sin(a.t * 20) * 0.05 : 0;      // petites pompes au soleil
      }
      a.g.position.x = a.x; a.g.position.z = a.z; a.g.rotation.y = a.a;
      // regarde l'enfant quand il est tout près
      if (dj < 4 && a.comportement !== 'gazelle') a.a += angle(a.a, Math.atan2(J.x - a.x, J.z - a.z)) * Math.min(1, dt * 2);
    }
  }
  return { liste, maj };
}
const angle = (a, b) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
