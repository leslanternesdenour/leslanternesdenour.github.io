// Le personnage du joueur : une petite voyageuse ou un petit voyageur.
// Deux modèles distincts (proportions, visage, coupe des vêtements, façon de bouger), articulés :
// hanches, buste, tête, épaules, coudes, hanches, genoux. Les vêtements achetés au souk s'affichent vraiment.
// Les tenues sont des reconstitutions artistiques inspirées de l'Arabie ancienne, pas des copies historiques.
// La petite fille porte toujours une robe longue et ample et un voile qui couvre les cheveux et le cou.
import * as THREE from 'three';
import { piece, fusion, materiau, M } from './formes.js?v=3';
import { article } from './catalogue.js?v=3';

const mat = materiau({ finesse: 2.2 });
const B = () => new THREE.BoxGeometry(1, 1, 1);
const SPH = (r, w = 16, h = 12, ...a) => new THREE.SphereGeometry(r, w, h, ...a);
const CYL = (a, b, h, s = 18, ...x) => new THREE.CylinderGeometry(a, b, h, s, 1, ...x);
const TOR = (r, t, arc = Math.PI * 2, s = 24) => new THREE.TorusGeometry(r, t, 6, s, arc);
const CAP = (r, l, s = 12) => { const g = new THREE.CapsuleGeometry(r, l, 4, s); g.translate(0, -l / 2 - r, 0); return g; };
const lisse = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// Les tenues de départ (offertes) : couleurs naturelles
export const TENUES = {
  ecru:   { nom: 'Beige et écru',  robe: '#e6d6b4', voile: '#f2e9d6', bord: '#b89a6a', ceinture: '#b89a6a' },
  blanc:  { nom: 'Blanc cassé',    robe: '#f1ece0', voile: '#faf6ec', bord: '#c9b48a', ceinture: '#c9b48a' },
  brun:   { nom: 'Brun',           robe: '#8a6448', voile: '#d9c7a6', bord: '#5e4230', ceinture: '#e2cfa8' },
  terre:  { nom: 'Terre cuite',    robe: '#b8694a', voile: '#efdcc2', bord: '#7e3f2a', ceinture: '#efdcc2' },
  vert:   { nom: 'Vert naturel',   robe: '#7f9a6a', voile: '#eae4cc', bord: '#566e46', ceinture: '#d8c79e' },
  bleu:   { nom: 'Bleu discret',   robe: '#6f86a8', voile: '#e6e8ee', bord: '#4a5d7e', ceinture: '#d9cfb8' }
};
export const PEAUX = ['#f0c9a4', '#d9a27a', '#b97f58', '#8d5a3b'];

// Ce que chaque personnage peut porter (la fille : robes et voiles uniquement, toujours couvrants)
export function convient(a, genre) {
  if (!a || !a.emplacement) return true;
  if (a.pour && a.pour !== genre) return false;
  if (genre === 'fille' && a.emplacement === 'coiffe' && a.forme !== 'voile') return false;
  if (genre === 'fille' && a.emplacement === 'corps' && a.forme !== 'robe') return false;
  if (genre === 'garcon' && a.forme === 'voile') return false;
  if (genre === 'garcon' && a.forme === 'robe') return false;
  return true;
}

export class Voyageur {
  // perso = { genre: 'fille'|'garcon', tenue: 'ecru'…, peau: index }, porte = { corps: id, coiffe: id, … }
  constructor(ombres, perso = {}, porte = {}) {
    this.ombres = ombres;
    this.genre = perso.genre === 'garcon' ? 'garcon' : 'fille';
    const T = TENUES[perso.tenue] || TENUES.ecru;
    const peau = PEAUX[perso.peau ?? 1] || PEAUX[1];
    const f = this.genre === 'fille';
    const art = s => { const a = article(porte[s]); return a && convient(a, this.genre) ? a : null; };
    const corpsA = art('corps'), coiffeA = art('coiffe'), manteauA = art('manteau'), ceintA = art('ceinture'), piedsA = art('pieds');
    const sacA = art('sac'), mainA = art('main'), hancheA = art('hanche'), poigA = art('poignets');
    const habit = corpsA ? corpsA.couleurs[0] : T.robe, habit2 = corpsA ? corpsA.couleurs[1] : T.bord;
    const sous = f ? habit : '#e9dfc8';                         // le garçon porte un sirwal clair sous la tunique
    const cuir = piedsA ? piedsA.couleurs[0] : '#7a5232', cuir2 = piedsA ? piedsA.couleurs[1] : '#5e3c22';
    const L = []; // les mailles à fusionner par groupe
    const ajoute = (groupe, pieces) => { const m = new THREE.Mesh(fusion(pieces), mat); m.castShadow = ombres; groupe.add(m); return m; };

    this.racine = new THREE.Group();
    this.corps = new THREE.Group(); this.racine.add(this.corps);
    // hanches (pivot du bassin)
    this.bassin = new THREE.Group(); this.bassin.position.y = 0.62; this.corps.add(this.bassin);
    // ---------- jambes : cuisse + jambe articulées au genou ----------
    const rJ = f ? 0.075 : 0.064;
    this.jambes = [-1, 1].map(s => {
      const haut = new THREE.Group(); haut.position.set(s * 0.085, 0, 0); this.bassin.add(haut);
      ajoute(haut, [piece(CAP(rJ, 0.17), sous, { m: M.tissu })]);
      const bas = new THREE.Group(); bas.position.y = -0.3; haut.add(bas);
      const pied = [
        piece(CAP(rJ * 0.92, 0.15), sous, { m: M.tissu }),
        piece(SPH(0.058, 10, 8), peau, { p: [0, -0.285, 0.035], s: [0.95, 0.6, 1.45] }),
        piece(B(), cuir, { p: [0, -0.318, 0.04], s: [0.12, 0.028, 0.23], m: M.cuir }),             // semelle
        piece(B(), cuir2, { p: [0, -0.28, 0.07], s: [0.125, 0.02, 0.03], m: M.cuir }),              // lanière
        piece(B(), cuir2, { p: [0, -0.27, -0.03], r: [0.5, 0, 0], s: [0.122, 0.02, 0.03], m: M.cuir })];
      if (piedsA && piedsA.id === 'sandales-tressees') pied.push(...[0, 1, 2].map(i => piece(B(), cuir2, { p: [0, -0.255 + i * 0.03, -0.01 - i * 0.012], s: [0.115, 0.014, 0.1], m: M.cuir })));
      ajoute(bas, pied);
      return { haut, bas, s };
    });
    // ---------- le bas du vêtement (robe ou tunique) : il flotte un peu en marchant ----------
    this.jupe = new THREE.Group(); this.bassin.add(this.jupe);
    {
      const long = f ? 0.56 : 0.42, bas = f ? 0.3 : 0.235;
      const p = [piece(CYL(0.165, bas, long, 22), habit, { p: [0, -long / 2 + 0.04, 0], m: M.tissu }),
        piece(TOR(bas - 0.004, 0.018, Math.PI * 2, 28), habit2, { p: [0, -long + 0.06, 0], r: [Math.PI / 2, 0, 0], m: M.tissu })];
      if (corpsA && (corpsA.rarete !== 'commun')) { // bordure brodée : petits losanges
        for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; p.push(piece(B(), habit2, { p: [Math.sin(a) * (bas - 0.012), -long + 0.13, Math.cos(a) * (bas - 0.012)], r: [0, a, Math.PI / 4], s: [0.035, 0.035, 0.01] })); }
      }
      if (f) p.push(piece(CYL(0.155, 0.27, 0.3, 22, true, -0.35, 0.7), habit2, { p: [0, -0.32, 0.005], m: M.tissu }));    // pan brodé devant
      else p.push(piece(B(), habit2, { p: [0, -0.1, 0.19], r: [-0.19, 0, 0], s: [0.04, 0.3, 0.012] }));               // fente brodée
      if (manteauA && manteauA.forme === 'manteau') {
        const c1 = manteauA.couleurs[0], c2 = manteauA.couleurs[1], lg = long + 0.02;
        p.push(piece(CYL(0.178, bas + 0.03, lg, 22, true, 0.45, Math.PI * 2 - 0.9), c1, { p: [0, -lg / 2 + 0.04, 0], m: M.laine }));
        for (let i = 0; i < 3; i++) p.push(piece(TOR(0.2 + (bas - 0.17) * (0.3 + i * 0.3), 0.012, Math.PI * 2 - 0.9), c2, { p: [0, -lg * (0.3 + i * 0.3) + 0.04, 0], r: [Math.PI / 2, 0, Math.PI / 2 + 0.45] }));
      }
      ajoute(this.jupe, p);
    }
    // ---------- le buste ----------
    this.buste = new THREE.Group(); this.bassin.add(this.buste);
    const epaule = f ? 0.175 : 0.19;
    {
      const p = [
        piece(CYL(0.15, 0.168, 0.46, 20), habit, { p: [0, 0.23, 0], m: M.tissu }),
        piece(SPH(0.16, 16, 10), habit, { p: [0, 0.42, 0], s: [epaule / 0.16, 0.5, 0.82], m: M.tissu }),
        piece(CYL(0.052, 0.058, 0.1, 10), peau, { p: [0, 0.53, 0] })
      ];
      if (!f) p.push(piece(TOR(0.07, 0.014), habit2, { p: [0, 0.495, 0.03], r: [Math.PI / 2 - 0.25, 0, 0] }), piece(B(), habit2, { p: [0, 0.42, 0.135], r: [-0.15, 0, 0], s: [0.03, 0.12, 0.01] }));
      // ceinture (toujours une, en tissu ; celle du souk la remplace)
      const cc = ceintA ? ceintA.couleurs : [T.ceinture, habit2];
      p.push(piece(TOR(0.172, 0.03, Math.PI * 2, 26), cc[0], { p: [0, 0.05, 0], r: [Math.PI / 2, 0, 0], s: [1, 0.86, 1], m: ceintA && ceintA.id === 'ceinture-cuir' ? M.cuir : M.tissu }));
      if (ceintA && ceintA.id === 'ceinture-cuir') p.push(piece(B(), cc[1], { p: [0, 0.05, 0.16], s: [0.06, 0.05, 0.02] }));
      else p.push(piece(B(), cc[0], { p: [0.07, -0.06, 0.15], r: [0.1, 0, 0.12], s: [0.04, 0.2, 0.015], m: M.tissu }), piece(B(), cc[1], { p: [0.075, -0.155, 0.152], r: [0.1, 0, 0.12], s: [0.045, 0.025, 0.017] }));
      if (ceintA && ceintA.id === 'ceinture-tissee') for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; p.push(piece(B(), cc[1], { p: [Math.sin(a) * 0.17, 0.05, Math.cos(a) * 0.146], r: [0, a, Math.PI / 4], s: [0.03, 0.03, 0.01] })); }
      // le voile descend sur les épaules et la poitrine (fille)
      if (f) {
        const vc = coiffeA ? coiffeA.couleurs : [T.voile, T.bord];
        p.push(piece(CYL(0.1, 0.27, 0.27, 24), vc[0], { p: [0, 0.4, 0.005], s: [1, 1, 0.84], m: M.tissu }),
          piece(TOR(0.268, 0.012, Math.PI * 2, 28), vc[1], { p: [0, 0.268, 0.005], r: [Math.PI / 2, 0, 0], s: [1, 0.84, 1] }));
      }
      // manteau / cape
      if (manteauA) {
        const [c1, c2] = manteauA.couleurs;
        if (manteauA.forme === 'cape') {
          p.push(piece(CYL(0.2, 0.34, 0.86, 22, true, Math.PI / 2 + 0.25, Math.PI - 0.5), c1, { p: [0, 0.03, -0.012], m: M.laine }),
            piece(SPH(0.03, 8, 6), c2, { p: [-0.15, 0.44, 0.1] }), piece(SPH(0.03, 8, 6), c2, { p: [0.15, 0.44, 0.1] }),
            piece(TOR(0.338, 0.014, Math.PI - 0.5), c2, { p: [0, -0.4, -0.012], r: [Math.PI / 2, 0, Math.PI / 2 + 0.25 - Math.PI / 2] }));
        } else {
          p.push(piece(CYL(0.163, 0.181, 0.47, 20, true, 0.4, Math.PI * 2 - 0.8), c1, { p: [0, 0.235, 0], m: M.laine }),
            piece(SPH(0.172, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), c1, { p: [0, 0.42, 0], s: [epaule / 0.16, 0.5, 0.84], m: M.laine }),
            piece(B(), c2, { p: [-0.07, 0.24, 0.165], s: [0.025, 0.46, 0.01] }), piece(B(), c2, { p: [0.07, 0.24, 0.165], s: [0.025, 0.46, 0.01] }));
        }
      }
      // sacs et accessoires portés sur le corps
      if (sacA && sacA.forme === 'sacdos') p.push(
        piece(B(), sacA.couleurs[0], { p: [0, 0.27, -0.22], s: [0.28, 0.32, 0.13], m: M.cuir }), piece(B(), sacA.couleurs[1], { p: [0, 0.4, -0.215], s: [0.3, 0.07, 0.15], m: M.cuir }),
        piece(B(), sacA.couleurs[1], { p: [-0.1, 0.32, -0.12], r: [0.2, 0, 0], s: [0.035, 0.3, 0.02] }), piece(B(), sacA.couleurs[1], { p: [0.1, 0.32, -0.12], r: [0.2, 0, 0], s: [0.035, 0.3, 0.02] }),
        piece(SPH(0.07, 10, 8), '#a8582c', { p: [0.1, 0.16, -0.3], s: [1, 0.5, 1.3], m: M.terre }));
      else if (sacA) { // besace en bandoulière
        p.push(piece(B(), sacA.couleurs[1], { p: [0, 0.27, 0.16], r: [0, 0, 0.82], s: [0.035, 0.62, 0.015], m: M.cuir }),
          piece(B(), sacA.couleurs[1], { p: [0, 0.27, -0.16], r: [0, 0, 0.82], s: [0.035, 0.62, 0.015], m: M.cuir }),
          piece(B(), sacA.couleurs[0], { p: [0.22, 0.02, 0.02], s: [0.08, 0.2, 0.22], m: M.tissu }), piece(B(), sacA.couleurs[1], { p: [0.225, 0.09, 0.02], s: [0.09, 0.07, 0.23], m: M.cuir }));
      } else if (!f) { // la petite sacoche artisanale du garçon
        p.push(piece(B(), '#6b4428', { p: [0, 0.27, 0.16], r: [0, 0, 0.82], s: [0.03, 0.62, 0.012], m: M.cuir }),
          piece(B(), '#8a5a35', { p: [0.2, 0.0, 0.07], r: [0, 0.3, 0], s: [0.06, 0.13, 0.15], m: M.cuir }), piece(SPH(0.016, 6, 5), '#c9a14a', { p: [0.235, 0.02, 0.1] }));
      }
      if (hancheA) p.push(piece(SPH(0.09, 12, 10), hancheA.couleurs[0], { p: [-0.21, 0.0, 0.0], s: [0.75, 1.15, 0.9], m: M.cuir }), piece(CYL(0.02, 0.025, 0.06, 8), hancheA.couleurs[1], { p: [-0.21, 0.12, 0] }),
        piece(B(), hancheA.couleurs[1], { p: [-0.06, 0.27, 0.15], r: [0, 0, -0.75], s: [0.025, 0.55, 0.012], m: M.cuir }));
      ajoute(this.buste, p);
    }
    // ---------- bras : épaule + coude ----------
    const manche = manteauA && manteauA.forme === 'manteau' ? manteauA.couleurs[0] : habit;
    this.bras = [-1, 1].map(s => {
      const haut = new THREE.Group(); haut.position.set(s * (epaule - 0.01), 0.43, 0); this.buste.add(haut);
      ajoute(haut, [piece(CAP(f ? 0.062 : 0.058, 0.14), manche, { m: M.tissu })]);
      const bas = new THREE.Group(); bas.position.y = -0.24; haut.add(bas);
      const p = [piece(CAP(f ? 0.058 : 0.052, 0.11), manche, { m: M.tissu }),
        piece(CYL(0.064, f ? 0.074 : 0.062, 0.05, 12), f ? habit2 : manche, { p: [0, -0.2, 0], m: M.tissu }),       // poignet de la manche
        piece(SPH(0.05, 10, 8), peau, { p: [0, -0.25, 0.005], s: [0.85, 1.1, 0.75] })];
      if (poigA) p.push(piece(TOR(0.052, 0.011), poigA.couleurs[0], { p: [0, -0.215, 0], r: [Math.PI / 2, 0, 0] }), piece(TOR(0.05, 0.009), poigA.couleurs[1], { p: [0, -0.19, 0], r: [Math.PI / 2, 0, 0] }));
      if (s < 0 && mainA) { // le panier tenu à la main gauche
        p.push(piece(CYL(0.11, 0.08, 0.13, 14, true), mainA.couleurs[0], { p: [0, -0.37, 0.04], m: M.bois }), piece(CYL(0.08, 0.08, 0.01, 14), mainA.couleurs[1], { p: [0, -0.43, 0.04] }),
          piece(TOR(0.09, 0.012, Math.PI), mainA.couleurs[1], { p: [0, -0.3, 0.04], r: [0, Math.PI / 2, 0] }));
      }
      ajoute(bas, p);
      return { haut, bas, s };
    });
    // ---------- la tête ----------
    this.tete = new THREE.Group(); this.tete.position.set(0, 0.64, 0.005); this.buste.add(this.tete);
    {
      const R = f ? 0.188 : 0.192;
      const p = [
        piece(SPH(R, 24, 18), peau, { s: f ? [1, 1.03, 0.98] : [1.02, 1, 0.98] }),
        piece(SPH(R * 0.86, 16, 10), peau, { p: [0, -0.06, 0.03], s: [0.92, 0.75, 0.92] }),                          // joues et menton
        piece(SPH(0.018, 8, 6), peau, { p: [0, -0.025, R * 0.98], s: [1.1, 0.9, 1] }),                                  // petit nez
        piece(SPH(0.032, 8, 6), '#f0948a', { p: [-0.105, -0.055, 0.145], s: [1.2, 0.8, 0.5] }), piece(SPH(0.032, 8, 6), '#f0948a', { p: [0.105, -0.055, 0.145], s: [1.2, 0.8, 0.5] }),
        piece(TOR(0.03, 0.007, Math.PI, 10), '#9a4a3e', { p: [0, -0.075, 0.172], r: [0.2, 0, Math.PI] }),               // sourire
        piece(B(), '#4a3020', { p: [-0.065, 0.065, 0.172], r: [0.1, 0.25, f ? 0.12 : 0.05], s: [0.05, 0.012, 0.01] }), piece(B(), '#4a3020', { p: [0.065, 0.065, 0.172], r: [0.1, -0.25, f ? -0.12 : -0.05], s: [0.05, 0.012, 0.01] })
      ];
      if (f) {
        // le voile : il encadre le visage, couvre les cheveux, les oreilles et le cou
        const vc = coiffeA ? coiffeA.couleurs : [T.voile, T.bord];
        p.push(piece(SPH(R + 0.024, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.36), vc[0], { p: [0, 0.006, -0.004], m: M.tissu }),
          piece(SPH(R + 0.026, 24, 14, Math.PI / 2 + 0.78, Math.PI * 2 - 1.56, Math.PI * 0.2, Math.PI * 0.62), vc[0], { p: [0, 0.0, -0.006], m: M.tissu }),
          piece(CYL(R * 0.74, R * 0.92, 0.2, 22), vc[0], { p: [0, -0.2, -0.02], m: M.tissu }),                           // sous le menton et le cou
          piece(TOR(R * 0.9, 0.018, Math.PI * 1.2, 24), vc[1], { p: [0, -0.005, 0.07], r: [0, 0, -0.1 * Math.PI], s: [0.97, 1.07, 1] }));       // le bord qui encadre le visage
        if (coiffeA && coiffeA.rarete !== 'commun') for (let i = 0; i < 7; i++) { const a = -0.55 + i * 0.18; p.push(piece(SPH(0.012, 6, 5), vc[1], { p: [Math.sin(a) * (R + 0.02), 0.13 + Math.cos(a * 2) * 0.01, Math.cos(a) * (R + 0.01) - 0.03] })); }
      } else {
        p.push(piece(SPH(R + 0.008, 22, 12, Math.PI / 2 + 0.75, Math.PI * 2 - 1.5, 0, Math.PI * 0.56), '#3a281c', { p: [0, 0.005, -0.012] }),  // cheveux courts (côtés et nuque)
          piece(SPH(0.04, 8, 6), peau, { p: [-R, -0.01, -0.01], s: [0.5, 1, 0.8] }), piece(SPH(0.04, 8, 6), peau, { p: [R, -0.01, -0.01], s: [0.5, 1, 0.8] }));
        const forme = coiffeA ? coiffeA.forme : 'calotte', [c1, c2] = coiffeA ? coiffeA.couleurs : ['#f6f0e2', '#e8dcc4'];
        if (forme === 'calotte') p.push(piece(SPH(R + 0.014, 22, 10, 0, Math.PI * 2, 0, Math.PI * 0.3), c1, { p: [0, 0.012, -0.012], m: M.tissu }), piece(TOR((R + 0.01) * Math.sin(Math.PI * 0.3), 0.008), c2, { p: [0, 0.012 + (R + 0.01) * Math.cos(Math.PI * 0.3), -0.012], r: [Math.PI / 2, 0, 0] }));
        if (forme === 'cheche') p.push(piece(SPH(R + 0.02, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), c1, { p: [0, 0.015, -0.01], m: M.tissu }),
          piece(TOR(R + 0.005, 0.03, Math.PI * 2, 24), c2, { p: [0, 0.06, -0.01], r: [Math.PI / 2 - 0.22, 0, 0], m: M.tissu }), piece(B(), c1, { p: [0, -0.07, -0.2], r: [0.3, 0, 0], s: [0.17, 0.28, 0.035], m: M.tissu }));
        if (forme === 'turban') { p.push(piece(SPH(R + 0.02, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.45), c1, { p: [0, 0.02, -0.01], m: M.tissu }));
          for (let i = 0; i < 3; i++) p.push(piece(TOR(R - 0.005 - i * 0.03, 0.034, Math.PI * 2, 24), i % 2 ? c2 : c1, { p: [0, 0.06 + i * 0.045, -0.01], r: [Math.PI / 2 - 0.15 + i * 0.12, 0, i * 0.1], m: M.tissu })); }
      }
      ajoute(this.tete, p);
      // les yeux (à part pour cligner)
      this.yeux = new THREE.Group(); this.yeux.position.set(0, 0.012, 0.155); this.tete.add(this.yeux);
      const o = [];
      for (const s of [-1, 1]) {
        o.push(piece(SPH(f ? 0.03 : 0.028, 10, 8), '#2a1c18', { p: [s * 0.066, 0, 0], s: [0.9, 1.15, 0.6] }), piece(SPH(0.009, 6, 5), '#ffffff', { p: [s * 0.066 + 0.01, 0.013, 0.015] }));
        if (f) for (let i = 0; i < 3; i++) o.push(piece(B(), '#1e1410', { p: [s * (0.066 + 0.024 + i * 0.006), 0.022 - i * 0.006, 0.006], r: [0, 0, s * (-0.6 - i * 0.3)], s: [0.022, 0.006, 0.004] }));
      }
      const yeux = new THREE.Mesh(fusion(o), mat); this.yeux.add(yeux);
    }
    this.phase = 0; this.pose = 'debout'; this.vitesse = 0;
    this.repos = 0; this.regard = 0; this.regardCible = 0; this.prochainRegard = 2; this.clign = 3;
    this.geste = null; this.balJupe = 0; this.angPrec = null;
  }

  // Un petit geste : 'prendre' (se pencher pour ramasser), 'caresser', 'salut', 'joie'
  faire(type) { this.geste = { type, t: 0, d: { prendre: 0.95, caresser: 1.6, salut: 1.3, joie: 1.1 }[type] || 1 }; }

  animer(dt, vitesse, t) {
    const [jg, jd] = this.jambes, [bg, bd] = this.bras, f = this.genre === 'fille';
    // clignement des yeux
    this.clign -= dt; if (this.clign < 0) this.clign = 2.5 + Math.random() * 3;
    this.yeux.scale.y = this.clign < 0.12 ? 0.15 : 1;
    // inertie de la robe quand on tourne
    const ang = this.racine.rotation.y; let dAng = this.angPrec == null ? 0 : ang - this.angPrec; this.angPrec = ang;
    if (dAng > Math.PI) dAng -= Math.PI * 2; if (dAng < -Math.PI) dAng += Math.PI * 2;
    this.balJupe += (Math.max(-0.25, Math.min(0.25, -dAng * 3)) - this.balJupe) * Math.min(1, dt * 5);

    if (this.pose === 'monte') {
      this.jupe.visible = false;
      this.bassin.position.y = 0.62; this.corps.position.set(0, 0, 0); this.corps.rotation.set(0, 0, 0);
      for (const j of this.jambes) { j.haut.rotation.set(-1.45, 0, j.s * 0.42); j.bas.rotation.set(1.35, 0, 0); }
      const r = Math.sin(t * 3.2) * 0.04;
      this.buste.rotation.set(0.08 + r * 0.5, 0, 0);
      for (const b of this.bras) { b.haut.rotation.set(-0.55 + r, 0, b.s * 0.18); b.bas.rotation.set(-0.95, 0, -b.s * 0.25); }
      this.tete.rotation.y = Math.sin(t * 0.6) * 0.2;
      this.geste = null; return;
    }
    this.jupe.visible = true;
    const v = Math.min(vitesse, 7.5), course = lisse(2.6, 5.5, v);
    let corpsY = 0, penche = 0;
    if (v > 0.15) {
      this.repos = 0;
      this.phase += dt * (4.2 + v * (f ? 1.45 : 1.55));
      const p = this.phase, amp = Math.min(0.85, 0.32 + v * 0.1) * (f ? 0.92 : 1);
      const ampJ = f ? amp * 0.5 : amp;     // sous la robe longue, les pas restent petits
      for (const j of this.jambes) {
        const ph = j.s < 0 ? p : p + Math.PI;
        j.haut.rotation.set(-Math.sin(ph) * ampJ, 0, j.s * 0.03);
        j.bas.rotation.set(Math.max(0, Math.cos(ph)) * ampJ * (1.1 + course * 0.9) + 0.05, 0, 0);
      }
      for (const b of this.bras) {
        const ph = b.s < 0 ? p + Math.PI : p;
        b.haut.rotation.set(-Math.sin(ph) * amp * (0.75 + course * 0.3), 0, b.s * (0.1 + course * 0.05));
        b.bas.rotation.set(-(0.18 + course * 1.0) - Math.max(0, -Math.sin(ph)) * 0.25, 0, 0);
      }
      corpsY = Math.abs(Math.sin(p)) * (0.025 + course * 0.05);
      penche = 0.04 + course * 0.2;
      this.bassin.rotation.y = Math.sin(p) * 0.12 * (1 - course * 0.5);
      this.buste.rotation.set(penche, -Math.sin(p) * 0.16, 0);
      this.jupe.rotation.set(-penche * 0.6 + Math.sin(p * 2) * 0.03 * (1 + course), 0, Math.sin(p) * (f ? 0.06 : 0.035) + this.balJupe);
      this.tete.rotation.set(-penche * 0.6, Math.sin(p) * 0.08, 0);
    } else {
      // au repos : on respire, on change d'appui, on regarde autour
      this.repos += dt;
      const resp = Math.sin(t * 2.1);
      for (const j of this.jambes) { j.haut.rotation.x *= 0.82; j.bas.rotation.x = j.bas.rotation.x * 0.82 + 0.03 * 0.18; j.haut.rotation.z = j.s * 0.03; }
      const appui = Math.sin(t * 0.45) * 0.5 + 0.5;
      jg.haut.rotation.z = -0.03 - appui * 0.04; jd.haut.rotation.z = 0.03 + (1 - appui) * 0.04;
      this.corps.position.x = (appui - 0.5) * 0.03;
      for (const b of this.bras) { b.haut.rotation.set(b.haut.rotation.x * 0.85 + resp * 0.01, 0, b.s * (0.11 + resp * 0.01)); b.bas.rotation.set(b.bas.rotation.x * 0.85 - 0.15 * 0.15, 0, 0); }
      this.bassin.rotation.y *= 0.9;
      this.buste.rotation.set(this.buste.rotation.x * 0.88 + resp * 0.006, this.buste.rotation.y * 0.9, (appui - 0.5) * 0.04);
      this.buste.scale.y = 1 + resp * 0.008;
      this.jupe.rotation.set(this.jupe.rotation.x * 0.9, 0, this.jupe.rotation.z * 0.9 + this.balJupe * 0.1);
      this.prochainRegard -= dt;
      if (this.prochainRegard < 0) { this.prochainRegard = 2.5 + Math.random() * 3.5; this.regardCible = (Math.random() - 0.5) * 1.1; }
      this.regard += (this.regardCible - this.regard) * Math.min(1, dt * 2.5);
      this.tete.rotation.set(Math.sin(t * 0.7) * 0.04 + (this.repos > 7 ? Math.sin(t * 0.4) * 0.1 - 0.05 : 0), this.regard, Math.sin(t * 0.5) * 0.04);
      // longue attente : les mains derrière le dos, on se balance doucement
      const att = lisse(9, 10.5, this.repos);
      if (att > 0) for (const b of this.bras) { b.haut.rotation.x += (0.45 - b.haut.rotation.x) * att * 0.3; b.bas.rotation.x += (-0.9 - b.bas.rotation.x) * att * 0.3; b.haut.rotation.z += (b.s * 0.25 - b.haut.rotation.z) * att * 0.3; }
      if (att > 0) this.corps.rotation.x = Math.sin(t * 1.2) * 0.02 * att;
    }
    // les gestes par-dessus le reste
    const g = this.geste;
    if (g) {
      g.t += dt; const k = Math.sin(Math.min(1, g.t / g.d) * Math.PI);
      if (g.type === 'prendre') {
        this.buste.rotation.x += 0.55 * k; corpsY -= 0.1 * k;
        for (const j of this.jambes) { j.haut.rotation.x -= 0.6 * k; j.bas.rotation.x += 1.0 * k; }
        bd.haut.rotation.x = -1.0 * k + bd.haut.rotation.x * (1 - k); bd.bas.rotation.x = -0.3 * k;
      } else if (g.type === 'caresser') {
        bd.haut.rotation.set(-1.35 * k, 0, -0.1); bd.bas.rotation.set(-0.35 * k + Math.sin(g.t * 9) * 0.25 * k, 0, 0);
        this.tete.rotation.x += 0.15 * k;
      } else if (g.type === 'salut') {
        bd.haut.rotation.set(-0.3 * k, 0, -2.4 * k); bd.bas.rotation.set(0, 0, -0.3 * k + Math.sin(g.t * 12) * 0.35 * k);
      } else if (g.type === 'joie') {
        corpsY += Math.abs(Math.sin(g.t * Math.PI * 2 / g.d * 2)) * 0.12 * k;
        for (const b of this.bras) b.haut.rotation.set(-0.3 * k, 0, b.s * 2.3 * k);
      }
      if (g.t >= g.d) this.geste = null;
    }
    this.corps.position.y = corpsY;
  }
}
