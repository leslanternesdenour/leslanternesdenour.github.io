// Les montures : dromadaires, chameau de Bactriane, chevaux arabes, et deux montures imaginaires.
// Chaque monture a son modèle, sa façon de marcher, son cri, sa rareté et sa fiche.
// « hist » : 'attesté' (animal connu dans l'Arabie ancienne), 'plausible' (rare mais possible), 'imaginaire' (création du jeu).
import * as THREE from 'three';
import { piece, fusion, materiau, M } from './formes.js?v=4';
import { Chameau, Enfant } from './personnages.js?v=4';
import { ECURIE, PLACES, PLACE_GRANDE, LIEUX, affecter } from './enclos-plan.js?v=1';
import { geoFoin, geoLitiere, geoAbreuvoir, creerEauBassin, geoTapis, EAU_BASSIN } from './enclos.js?v=1';

const mat = materiau();
const B = () => new THREE.BoxGeometry(1, 1, 1);
const SPH = (r, w = 14, h = 10) => new THREE.SphereGeometry(r, w, h);
const CYL = (a, b, h, s = 10) => new THREE.CylinderGeometry(a, b, h, s);
const maille = (geo, ombre) => { const m = new THREE.Mesh(geo, mat); m.castShadow = ombre; return m; };

export const MONTURES = [
  { id: 'sablo', nom: 'Sablo', espece: 'dromadaire', race: 'Dromadaire', icone: '🐪', rarete: 'commun', prix: 0, hist: 'attesté', robe: ['#d6a868', '#c48f52', '#7a5636'],
    desc: 'Ton fidèle compagnon depuis le début du voyage.', vitesse: [5.5, 11] },
  { id: 'cannelle', fem: true, nom: 'Cannelle', espece: 'dromadaire', race: 'Dromadaire brun', icone: '🐪', rarete: 'commun', prix: 1000, hist: 'attesté', robe: ['#9a6a42', '#7e5434', '#5a3a22'],
    desc: 'Une dromadaire calme au pelage brun foncé. Elle ne se presse jamais, mais elle ne s\'arrête jamais non plus.', vitesse: [5.5, 11] },
  { id: 'perle', fem: true, nom: 'Perle', espece: 'dromadaire', race: 'Dromadaire blanc', icone: '🐪', rarete: 'peu', prix: 1500, hist: 'attesté', robe: ['#efe4cf', '#ddd0b6', '#8a7a62'],
    desc: 'Les dromadaires au pelage presque blanc étaient très admirés en Arabie.', vitesse: [5.8, 11.5] },
  { id: 'eclair', nom: 'Éclair', espece: 'cheval', race: 'Cheval arabe bai', icone: '🐎', rarete: 'rare', prix: 3000, hist: 'attesté', robe: ['#8a4e2a', '#2a1c14', '#1e1610'],
    desc: 'Un cheval brun à la crinière noire. Les chevaux d\'Arabie étaient réputés pour leur rapidité et leur endurance.', vitesse: [6.5, 14] },
  { id: 'zephyr', nom: 'Zéphyr', espece: 'cheval', race: 'Cheval arabe gris', icone: '🐎', rarete: 'rare', prix: 4500, hist: 'attesté', robe: ['#c9c6c0', '#efece6', '#4a4440'], pommele: true,
    desc: 'Un cheval gris pommelé, vif et curieux, qui aime galoper face au vent.', vitesse: [6.5, 14.5] },
  { id: 'bactra', nom: 'Bactra', espece: 'bactriane', race: 'Chameau de Bactriane', icone: '🐫', rarete: 'epique', prix: 6500, hist: 'plausible', robe: ['#8a6440', '#6b4a30', '#4a3420'],
    desc: 'Un chameau à deux bosses, venu de très loin avec les caravanes. Il vit d\'habitude dans les déserts froids d\'Asie centrale : en Arabie, il était rare.', vitesse: [5, 10] },
  { id: 'lune', fem: true, nom: 'Lune', espece: 'cheval', race: 'Jument arabe blanche', icone: '🐎', rarete: 'epique', prix: 8500, hist: 'attesté', robe: ['#f3efe6', '#e6e0d4', '#8a827a'],
    desc: 'Une jument blanche, douce et rapide. On dit que les cavaliers d\'Arabie prenaient soin de leurs juments comme de leur famille.', vitesse: [7, 15] },
  { id: 'etoile', fem: true, nom: 'Étoile', espece: 'dromadaire', race: 'Dromadaire des étoiles', icone: '✨', rarete: 'legendaire', prix: 12000, hist: 'imaginaire', robe: ['#e9d6ae', '#d9c08e', '#7a6a52'], etoiles: true,
    desc: 'Une monture imaginaire : de petites étoiles brillent sur son pelage. Elle n\'existe que dans le pays de Nour.', vitesse: [6, 12] },
  { id: 'baobab', nom: 'Baobab', espece: 'elephant', race: 'Éléphant des terres lointaines', icone: '🐘', rarete: 'legendaire', prix: 16000, hist: 'imaginaire',
    robe: ['#9a948c', '#86807a', '#c9c2b6'],
    desc: 'Une monture imaginaire du jeu. Les vrais éléphants vivent en Afrique et en Asie, pas dans les déserts d\'Arabie. Baobab est très grand, très lent et très doux.', vitesse: [4, 7.5] }
];
export const monture = id => MONTURES.find(m => m.id === id) || MONTURES[0];
export const FICHES_ESPECES = {
  dromadaire: 'Le dromadaire a une seule bosse, pleine de graisse (pas d\'eau !). Il peut marcher plusieurs jours sans boire. Dans l\'Arabie ancienne, c\'était l\'animal des caravanes.',
  bactriane: 'Le chameau de Bactriane a deux bosses et un pelage épais pour l\'hiver. Il vit dans les déserts froids d\'Asie centrale.',
  cheval: 'Le cheval arabe est petit, léger et très endurant. Il porte souvent la queue haute quand il trotte.',
  elephant: 'L\'éléphant est le plus grand animal terrestre. Il vit en Afrique et en Asie, en famille, et se sert de sa trompe comme d\'une main.'
};

export function creerMonture(id, ombres) {
  const d = monture(id);
  if (d.espece === 'cheval') return new Cheval(ombres, d);
  if (d.espece === 'elephant') return new Elephant(ombres, d);
  return new Chameau(ombres, { robe: d.robe, bosses: d.espece === 'bactriane' ? 2 : 1, etoiles: !!d.etoiles, echelle: d.espece === 'bactriane' ? 0.9 : 0.86 });
}

// harnais commun : tapis, motif, selle, sacoches, couverture, lanterne (positions selon la monture)
function harnais(p, { tapis = ['#c94f3c', '#2bb3c0'], motif = null, selle = '#f5b942', selleBois = false, sacoches = false, couverture = null }, g) {
  const [t1, t2] = tapis, { y, l, w, h } = g;  // hauteur du dos, longueur, demi-largeur, hauteur des pans
  p.push(piece(B(), t1, { p: [0, y, 0], s: [w * 2, 0.06, l], m: M.laine }));
  for (const s of [-1, 1]) {
    p.push(piece(B(), t2, { p: [s * w, y - h / 2, 0], s: [0.04, h, l * 0.8], m: M.laine }), piece(B(), t1, { p: [s * (w + 0.01), y - h + 0.04, 0], s: [0.04, 0.07, l * 0.84] }));
    const x = s * (w + 0.025);
    if (motif === 'rayures') for (const k of [0.3, 0.55, 0.8]) p.push(piece(B(), t1, { p: [x, y - h * k, 0], s: [0.012, 0.045, l * 0.78] }));
    if (motif === 'losanges') for (let i = 0; i < 3; i++) p.push(piece(B(), t1, { p: [x, y - h * 0.5, -l * 0.25 + i * l * 0.25], r: [Math.PI / 4, 0, 0], s: [0.012, h * 0.3, h * 0.3] }));
    if (motif === 'etoiles') for (let i = 0; i < 3; i++) for (const r of [0, Math.PI / 4]) p.push(piece(B(), t1, { p: [x, y - h * 0.5, -l * 0.25 + i * l * 0.25], r: [r, 0, 0], s: [0.012, h * 0.22, h * 0.22] }));
    if (motif === 'nuit') { p.push(piece(new THREE.TorusGeometry(h * 0.2, h * 0.05, 5, 14, Math.PI * 1.3), t2 === t1 ? '#fff' : '#ffe3a3', { p: [x, y - h * 0.5, -l * 0.12], r: [0, Math.PI / 2, 0.6] })); for (const k of [0.2, 0.7]) p.push(piece(SPH(0.025, 6, 5), '#ffe3a3', { p: [x, y - h * k, l * 0.2] })); }
  }
  p.push(piece(B(), selle, { p: [0, y + 0.07, 0], s: [w * 0.9, 0.09, l * 0.5], m: selleBois ? M.bois : M.cuir }),
    piece(B(), '#6b4428', { p: [0, y + 0.17, l * 0.24], s: [w * 0.75, 0.2, 0.07], m: selleBois ? M.bois : M.cuir }),
    piece(B(), '#6b4428', { p: [0, y + 0.14, -l * 0.24], s: [w * 0.75, 0.15, 0.07], m: selleBois ? M.bois : M.cuir }));
  if (selleBois) p.push(piece(SPH(0.05, 8, 6), '#6b4428', { p: [0, y + 0.3, l * 0.24], m: M.bois }));
  if (sacoches) for (const s of [-1, 1]) p.push(piece(B(), '#a7744a', { p: [s * (w + 0.1), y - 0.18, -l * 0.42], s: [0.16, 0.32, 0.3], m: M.cuir }), piece(B(), '#2bb3c0', { p: [s * (w + 0.18), y - 0.18, -l * 0.42], s: [0.02, 0.14, 0.16] }));
  if (couverture) { p.push(piece(CYL(0.1, 0.1, w * 1.7, 12), couverture[0], { p: [0, y + 0.12, -l * 0.42], r: [0, 0, Math.PI / 2], m: M.laine }));
    for (const x of [-w * 0.5, 0, w * 0.5]) p.push(piece(CYL(0.105, 0.105, 0.05, 12), couverture[1], { p: [x, y + 0.12, -l * 0.42], r: [0, 0, Math.PI / 2] })); }
}

// ================= Le cheval arabe =================
export class Cheval {
  constructor(ombres, d) {
    this.ombres = ombres; this.espece = 'cheval';
    this.racine = new THREE.Group(); this.echelle = 0.92; this.racine.scale.setScalar(this.echelle);
    const [robe, crin, bas] = d.robe;
    this.hauteurDebout = 1.26;
    this.corps = new THREE.Group(); this.corps.position.y = this.hauteurDebout; this.racine.add(this.corps);
    const pc = [
      piece(SPH(1, 18, 12), robe, { s: [0.36, 0.42, 0.88] }),
      piece(SPH(0.4, 14, 10), robe, { p: [0, -0.02, 0.5], s: [0.95, 1, 0.9] }),
      piece(SPH(0.42, 14, 10), robe, { p: [0, 0.04, -0.5], s: [0.95, 1, 0.95] })
    ];
    if (d.pommele) for (let i = 0; i < 30; i++) { const a = i * 2.39, z = -0.7 + (i % 10) * 0.15; pc.push(piece(SPH(0.07, 6, 5), crin, { p: [Math.cos(a) * 0.33, Math.sin(a) * 0.36, z], s: [1, 1, 0.5] })); }
    this.corps.add(maille(fusion(pc), ombres));
    // la queue, portée haute
    this.queue = new THREE.Group(); this.queue.position.set(0, 0.18, -0.85); this.corps.add(this.queue);
    this.queue.add(maille(fusion([piece(CYL(0.06, 0.05, 0.25, 6), crin, { p: [0, 0.05, -0.1], r: [-0.9, 0, 0] }),
      ...[-0.05, 0, 0.05].map((x, i) => piece(CYL(0.05, 0.02, 0.85, 6), crin, { p: [x, -0.32, -0.22 - i * 0.02], r: [0.25, 0, x], m: M.laine }))]), ombres));
    this.harnais = new THREE.Group(); this.corps.add(this.harnais);
    this.selle = new THREE.Object3D(); this.selle.position.set(0, 0.5, -0.05); this.corps.add(this.selle);
    // encolure, crinière et tête
    // l'encolure part vers l'avant, la tête longue descend vers le bas
    this.cou = new THREE.Group(); this.cou.position.set(0, 0.12, 0.66); this.corps.add(this.cou);
    const ax = [0, Math.cos(0.8), Math.sin(0.8)], dos = [0, Math.sin(0.8), -Math.cos(0.8)], crins = [];
    for (let i = 0; i < 10; i++) { const t = -0.32 + i * 0.075; crins.push(piece(B(), crin, { p: [0, 0.28 + ax[1] * t + dos[1] * 0.15, 0.24 + ax[2] * t + dos[2] * 0.15], r: [0.8, 0, (i % 2 ? 1 : -1) * 0.15], s: [0.05, 0.1, 0.16], m: M.laine })); }
    this.cou.add(maille(fusion([piece(CYL(0.13, 0.25, 0.8, 12), robe, { p: [0, 0.28, 0.24], r: [0.8, 0, 0] }), ...crins]), ombres));
    this.tete = new THREE.Group(); this.tete.position.set(0, 0.56, 0.54); this.cou.add(this.tete);
    const dir = [0, Math.cos(2.2), Math.sin(2.2)];
    this.tete.add(maille(fusion([
      piece(SPH(1, 14, 10), robe, { p: [0, dir[1] * 0.17, dir[2] * 0.17], r: [2.2, 0, 0], s: [0.13, 0.32, 0.15] }),
      piece(SPH(0.1, 10, 8), robe, { p: [0, dir[1] * 0.42, dir[2] * 0.42], s: [1, 1, 1.05] }),
      piece(SPH(0.018, 6, 4), '#2a1c14', { v: 1, p: [-0.045, dir[1] * 0.45 + 0.02, dir[2] * 0.45 + 0.07] }), piece(SPH(0.018, 6, 4), '#2a1c14', { v: 1, p: [0.045, dir[1] * 0.45 + 0.02, dir[2] * 0.45 + 0.07] }),
      piece(new THREE.ConeGeometry(0.04, 0.15, 6), robe, { p: [-0.06, 0.13, -0.03], r: [-0.25, 0, 0.18] }), piece(new THREE.ConeGeometry(0.04, 0.15, 6), robe, { p: [0.06, 0.13, -0.03], r: [-0.25, 0, -0.18] }),
      piece(B(), crin, { p: [0, 0.1, 0.07], r: [0.6, 0, 0], s: [0.05, 0.08, 0.12] }),
      piece(new THREE.TorusGeometry(0.115, 0.016, 5, 14), '#7a3e2e', { p: [0, dir[1] * 0.33, dir[2] * 0.33], r: [2.2 - Math.PI / 2, 0, 0], m: M.cuir })      // le licol
    ]), ombres));
    this.yeux = new THREE.Group(); this.yeux.position.set(0, -0.02, 0.08); this.tete.add(this.yeux);
    this.yeux.add(maille(fusion([piece(SPH(0.032, 8, 6), '#1e1610', { v: 1, p: [-0.11, 0, 0] }), piece(SPH(0.032, 8, 6), '#1e1610', { v: 1, p: [0.11, 0, 0] }),
      piece(SPH(0.011, 5, 4), '#fff', { v: 1, p: [-0.125, 0.013, 0.022] }), piece(SPH(0.011, 5, 4), '#fff', { v: 1, p: [0.125, 0.013, 0.022] })]), false));
    // les jambes fines
    this.pattes = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => {
      const haut = new THREE.Group(); haut.position.set(sx * 0.2, -0.22, sz * 0.6); this.corps.add(haut);
      haut.add(maille(fusion([piece(CYL(0.13, 0.075, 0.55, 8), robe, { p: [0, -0.25, 0] })]), ombres));
      const b = new THREE.Group(); b.position.y = -0.5; haut.add(b);
      b.add(maille(fusion([piece(SPH(0.075, 8, 6), robe), piece(CYL(0.055, 0.05, 0.42, 8), bas, { p: [0, -0.22, 0] }),
        piece(CYL(0.07, 0.08, 0.1, 8), '#2a2420', { p: [0, -0.48, 0.01] })]), ombres));
      return { haut, bas: b, sx, sz };
    });
    this.phase = 0; this.agenouille = 0; this.caresse = 0; this.regard = null; this.clignement = 3; this.finClin = 0; this.vu = 0;
    this.habiller({});
  }
  habiller(o) {
    for (const g of [this.harnais, this.collier]) if (g) { g.parent.remove(g); g.traverse(x => x.geometry && x.geometry.dispose()); }
    this.harnais = new THREE.Group(); this.corps.add(this.harnais);
    const p = []; harnais(p, o, { y: 0.4, l: 0.8, w: 0.36, h: 0.36 });
    for (const s of [-1, 1]) p.push(piece(new THREE.TorusGeometry(0.06, 0.012, 4, 10), '#8a8070', { p: [s * 0.4, -0.25, 0.05], r: [0, Math.PI / 2, 0] }), piece(B(), '#5a3a22', { p: [s * 0.39, 0.08, 0.05], s: [0.015, 0.6, 0.03] }));
    this.harnais.add(maille(fusion(p), this.ombres));
    this.lanterne = null;
    if (o.lanterne) { const l = new THREE.Group(); l.position.set(0.3, 0.62, -0.35); this.harnais.add(l);
      l.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.14, 6), new THREE.MeshBasicMaterial({ color: '#ffd36b' })).translateY(-0.12)); this.lanterne = l; }
    this.collier = null;
    if (o.pompons) { this.collier = new THREE.Group(); this.cou.add(this.collier); const c = ['#c94f3c', '#f5b942', '#2bb3c0', '#7b4fa0', '#ff9fb2'];
      this.collier.add(maille(fusion([piece(new THREE.TorusGeometry(0.22, 0.03, 6, 18), '#c94f3c', { p: [0, 0.12, 0.08], r: [Math.PI / 2 + 0.5, 0, 0] }),
        ...Array.from({ length: 7 }, (_, i) => { const a = -0.4 + i * 0.35; return piece(SPH(0.045, 6, 5), c[i % 5], { p: [Math.sin(a) * 0.23, 0.0, 0.08 + Math.cos(a) * 0.2] }); })]), false)); }
  }
  positionSelle(v) { return this.selle.getWorldPosition(v); }
  animer(dt, v, t) {
    const k = this.agenouille;
    this.clignement -= dt; if (this.clignement < 0) { this.clignement = 2 + Math.random() * 4; this.finClin = 0.12; }
    if (this.finClin > 0) { this.finClin -= dt; this.yeux.scale.y = 0.15; } else this.yeux.scale.y = 1;
    this.queue.rotation.x = v > 0.3 ? -0.25 - Math.min(0.4, v * 0.03) : Math.sin(t * 0.9) * 0.05;
    this.queue.rotation.z = Math.sin(t * (v > 0.3 ? 7 : 1.4)) * (v > 0.3 ? 0.12 : 0.2);
    if (this.caresse > 0) this.caresse = Math.max(0, this.caresse - dt);
    if (this.lanterne) this.lanterne.rotation.x = Math.sin(t * (v > 0.2 ? 7 : 1.5)) * (v > 0.2 ? 0.3 : 0.06);
    if (k > 0.01 || v <= 0.2) {
      // à l'arrêt (ou quand on monte) : il baisse un peu la tête et plie une jambe avant, comme pour saluer
      for (const p of this.pattes) { p.haut.rotation.x *= 0.85; p.bas.rotation.x *= 0.85; }
      this.pattes[0].haut.rotation.x = -0.35 * k; this.pattes[0].bas.rotation.x = 1.0 * k;
      this.corps.position.y = this.hauteurDebout - 0.08 * k + Math.sin(t * 1.8) * 0.006;
      this.corps.rotation.set(0.06 * k, 0, 0);
      const r = this.regard != null ? Math.max(-0.8, Math.min(0.8, this.regard)) : Math.sin(t * 0.35) * 0.3;
      this.cou.rotation.set(0.35 * k + (this.caresse > 0 ? 0.35 : 0) + Math.sin(t * 0.6) * 0.03, this.cou.rotation.y + (r * 0.6 - this.cou.rotation.y) * Math.min(1, dt * 2), 0);
      this.tete.rotation.z = this.caresse > 0 ? Math.sin(t * 5) * 0.1 : 0;
      return;
    }
    const galop = v > 8.5;
    this.phase += dt * (galop ? 4.6 + v * 0.25 : 3 + v * 0.6);
    const amp = galop ? 0.75 : Math.min(0.55, 0.3 + v * 0.05);
    // pas : les quatre pieds l'un après l'autre ; galop : l'arrière pousse, l'avant suit
    const dec = galop ? [0.55, 0.45, 0.1, 0] : [0.25, 0.75, 0, 0.5];
    this.pattes.forEach((p, i) => {
      const ph = this.phase + dec[i] * Math.PI * 2;
      p.haut.rotation.x = Math.sin(ph) * amp * (p.sz > 0 ? 1 : 0.9);
      p.bas.rotation.x = Math.max(0, -Math.cos(ph)) * amp * (p.sz > 0 ? 1.6 : -1.1) * -(p.sz > 0 ? -1 : 1);
    });
    this.corps.position.y = this.hauteurDebout + (galop ? Math.sin(this.phase) * 0.08 : Math.abs(Math.sin(this.phase * 2)) * 0.025);
    this.corps.rotation.set(galop ? Math.sin(this.phase + 0.6) * 0.07 : 0, 0, galop ? 0 : Math.sin(this.phase) * 0.02);
    this.cou.rotation.set(galop ? -0.1 + Math.sin(this.phase + 1.2) * 0.12 : Math.sin(this.phase * 2) * 0.05, this.cou.rotation.y * 0.9, 0);
    this.tete.rotation.z = 0;
  }
}

// ================= L'éléphant (monture imaginaire du jeu) =================
export class Elephant {
  constructor(ombres, d) {
    this.ombres = ombres; this.espece = 'elephant';
    this.racine = new THREE.Group(); this.echelle = 1;
    const [peau, peau2, ivoire] = d.robe;
    this.hauteurDebout = 1.95;
    this.corps = new THREE.Group(); this.corps.position.y = this.hauteurDebout; this.racine.add(this.corps);
    this.corps.add(maille(fusion([piece(SPH(1, 20, 14), peau, { s: [1.05, 1.0, 1.45], m: M.cuir }), piece(SPH(0.6, 12, 10), peau2, { p: [0, -0.2, -1.1], m: M.cuir })]), ombres));
    this.queue = new THREE.Group(); this.queue.position.set(0, 0.1, -1.42); this.corps.add(this.queue);
    this.queue.add(maille(fusion([piece(CYL(0.04, 0.025, 0.8, 6), peau2, { p: [0, -0.4, -0.05] }), piece(SPH(0.06, 6, 5), '#3a3430', { p: [0, -0.82, -0.06] })]), ombres));
    this.harnais = new THREE.Group(); this.corps.add(this.harnais);
    this.selle = new THREE.Object3D(); this.selle.position.set(0, 1.12, -0.1); this.corps.add(this.selle);
    this.cou = new THREE.Group(); this.cou.position.set(0, 0.25, 1.2); this.corps.add(this.cou);
    this.cou.add(maille(fusion([piece(SPH(0.72, 16, 12), peau, { p: [0, 0.15, 0.25], s: [1, 1, 0.95], m: M.cuir }),
      ...[-1, 1].map(s => piece(new THREE.ConeGeometry(0.06, 0.45, 8), ivoire, { p: [s * 0.25, -0.45, 0.78], r: [1.1, 0, -s * 0.2] }))]), ombres));
    this.tete = new THREE.Group(); this.tete.position.set(0, 0.15, 0.25); this.cou.add(this.tete);
    this.oreilles = [-1, 1].map(s => { const o = new THREE.Group(); o.position.set(s * 0.6, 0.25, 0.05); this.tete.add(o);
      o.add(maille(fusion([piece(SPH(1, 14, 10), peau2, { p: [s * 0.32, -0.15, -0.1], s: [0.42, 0.62, 0.07], r: [0, s * 0.35, 0], m: M.cuir })]), ombres)); o.s = s; return o; });
    this.yeux = new THREE.Group(); this.yeux.position.set(0, 0.22, 0.6); this.tete.add(this.yeux);
    this.yeux.add(maille(fusion([piece(SPH(0.055, 8, 6), '#2a2420', { v: 1, p: [-0.36, 0, 0] }), piece(SPH(0.055, 8, 6), '#2a2420', { v: 1, p: [0.36, 0, 0] }),
      piece(SPH(0.018, 5, 4), '#fff', { v: 1, p: [-0.38, 0.02, 0.04] }), piece(SPH(0.018, 5, 4), '#fff', { v: 1, p: [0.38, 0.02, 0.04] })]), false));
    // la trompe, en segments qui ondulent
    this.trompe = [];
    let parent = this.tete, y0 = -0.15, z0 = 0.82;
    for (let i = 0; i < 5; i++) { const g = new THREE.Group(); g.position.set(0, y0, z0); parent.add(g);
      g.add(maille(fusion([piece(CYL(0.2 - i * 0.03, 0.18 - i * 0.03, 0.34, 10), peau, { p: [0, -0.15, 0], m: M.cuir })]), ombres));
      this.trompe.push(g); parent = g; y0 = -0.3; z0 = 0; }
    this.pattes = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => {
      const haut = new THREE.Group(); haut.position.set(sx * 0.55, -0.45, sz * 0.8); this.corps.add(haut);
      haut.add(maille(fusion([piece(CYL(0.33, 0.28, 0.8, 12), peau, { p: [0, -0.35, 0], m: M.cuir })]), ombres));
      const b = new THREE.Group(); b.position.y = -0.75; haut.add(b);
      b.add(maille(fusion([piece(CYL(0.28, 0.3, 0.72, 12), peau, { p: [0, -0.36, 0], m: M.cuir }), piece(CYL(0.31, 0.31, 0.06, 12), ivoire, { p: [0, -0.72, 0.02] })]), ombres));
      return { haut, bas: b, sx, sz };
    });
    this.phase = 0; this.agenouille = 0; this.caresse = 0; this.regard = null; this.clignement = 4; this.finClin = 0;
    this.habiller({});
  }
  habiller(o) {
    for (const g of [this.harnais, this.collier]) if (g) { g.parent.remove(g); g.traverse(x => x.geometry && x.geometry.dispose()); }
    this.harnais = new THREE.Group(); this.corps.add(this.harnais);
    const p = []; harnais(p, o, { y: 1.02, l: 1.3, w: 0.78, h: 0.9 });
    // une couverture brodée sur la tête (motif du jeu)
    p.push(piece(B(), (o.tapis || ['#c94f3c'])[0], { p: [0, 0.75, 1.55], r: [-0.5, 0, 0], s: [0.5, 0.05, 0.5], m: M.laine }));
    this.harnais.add(maille(fusion(p), this.ombres));
    this.lanterne = null;
    if (o.lanterne) { const l = new THREE.Group(); l.position.set(0.55, 1.32, -0.5); this.harnais.add(l);
      l.add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.16, 6), new THREE.MeshBasicMaterial({ color: '#ffd36b' })).translateY(-0.14)); this.lanterne = l; }
    this.collier = null;
    if (o.pompons) { this.collier = new THREE.Group(); this.cou.add(this.collier); const c = ['#c94f3c', '#f5b942', '#2bb3c0', '#7b4fa0', '#ff9fb2'];
      this.collier.add(maille(fusion(Array.from({ length: 9 }, (_, i) => { const a = -1.2 + i * 0.3; return piece(SPH(0.07, 6, 5), c[i % 5], { p: [Math.sin(a) * 0.72, -0.45 + Math.abs(Math.sin(a)) * 0.2, 0.25 + Math.cos(a) * 0.5] }); })), false)); }
  }
  positionSelle(v) { return this.selle.getWorldPosition(v); }
  animer(dt, v, t) {
    const k = this.agenouille;
    this.clignement -= dt; if (this.clignement < 0) { this.clignement = 3 + Math.random() * 4; this.finClin = 0.16; }
    if (this.finClin > 0) { this.finClin -= dt; this.yeux.scale.y = 0.15; } else this.yeux.scale.y = 1;
    for (const o of this.oreilles) o.rotation.y = o.s * (0.15 + Math.sin(t * 1.3 + o.s) * 0.18);
    this.trompe.forEach((g, i) => { g.rotation.x = (this.caresse > 0 ? -0.35 : 0.08) + Math.sin(t * 1.1 - i * 0.6) * 0.1 * (1 + i * 0.3); g.rotation.z = Math.sin(t * 0.7 - i * 0.5) * 0.06 * i; });
    this.queue.rotation.z = Math.sin(t * 1.4) * 0.25;
    if (this.caresse > 0) this.caresse = Math.max(0, this.caresse - dt);
    if (this.lanterne) this.lanterne.rotation.x = Math.sin(t * 2) * 0.1;
    const avant = Math.min(1, k * 1.6), arriere = Math.max(0, k * 1.6 - 0.6);
    this.corps.position.y = this.hauteurDebout - (avant + arriere) * 0.5 * 1.15;
    this.corps.rotation.x = (avant - arriere) * 0.22;
    if (k > 0.01) { for (const p of this.pattes) { const f = p.sz > 0 ? avant : arriere; p.haut.rotation.x = -1.3 * f; p.bas.rotation.x = 2.3 * f; } return; }
    if (v > 0.2) {
      this.phase += dt * (1.6 + v * 0.45);
      const amp = Math.min(0.42, 0.22 + v * 0.03), dec = [0.25, 0.75, 0, 0.5];
      this.pattes.forEach((p, i) => { const ph = this.phase + dec[i] * Math.PI * 2; p.haut.rotation.x = Math.sin(ph) * amp; p.bas.rotation.x = Math.max(0, -Math.cos(ph)) * amp * 1.1; });
      this.corps.position.y = this.hauteurDebout + Math.abs(Math.sin(this.phase * 2)) * 0.035;
      this.corps.rotation.z = Math.sin(this.phase) * 0.03;
    } else for (const p of this.pattes) { p.haut.rotation.x *= 0.85; p.bas.rotation.x *= 0.85; }
    const r = this.regard != null ? Math.max(-0.6, Math.min(0.6, this.regard)) : Math.sin(t * 0.3) * 0.2;
    this.cou.rotation.y += (r * 0.6 - this.cou.rotation.y) * Math.min(1, dt * 1.5);
  }
}

// ================= L'écurie, près de l'enclos de Sablo =================
export { ECURIE };       // le plan complet de l'enclos est dans enclos-plan.js
export function creerEcurie({ scene, terrain, colliders, ombres }) {
  const H = (x, z) => terrain.hauteur(x, z), { x: ex, z: ez } = ECURIE;
  const g = new THREE.Group(); g.position.set(ex, H(ex, ez) - 0.05, ez); scene.add(g);
  const p = [];
  // l'abri : poteaux de palmier et toit plat de palmes
  for (let i = 0; i < 5; i++) for (const z of [-4.2, -0.6]) p.push(piece(CYL(0.16, 0.2, 3.2, 8), '#7a5a3a', { p: [-8 + i * 4, 1.6, z], m: M.bois }));
  p.push(piece(B(), '#a88a5e', { p: [0, 3.25, -2.4], s: [17.5, 0.2, 4.6], m: M.bois }));
  for (let i = 0; i < 22; i++) p.push(piece(B(), i % 2 ? '#8f7650' : '#b39468', { p: [-8.6 + i * 0.82, 3.38, -2.4], s: [0.3, 0.06, 4.5] }));
  p.push(piece(B(), '#d9bf94', { p: [0, 1.1, -4.6], s: [17.5, 2.2, 0.4], m: M.terre }));
  // la clôture
  const pieux = [];
  for (let i = 0; i <= 12; i++) { const x = -9 + i * 1.5; if (Math.abs(x) < 1.6) continue; pieux.push([x, 5.4]); }
  for (let j = 0; j <= 6; j++) for (const x of [-9.2, 9.2]) pieux.push([x, -4.4 + j * 1.6]);
  for (const [x, z] of pieux) p.push(piece(CYL(0.08, 0.1, 1.3, 6), '#8a6440', { p: [x, 0.65, z], m: M.bois }));
  p.push(piece(B(), '#a77a4e', { p: [-5.3, 1.0, 5.4], s: [7.4, 0.09, 0.09] }), piece(B(), '#a77a4e', { p: [5.3, 1.0, 5.4], s: [7.4, 0.09, 0.09] }),
    piece(B(), '#a77a4e', { p: [-5.3, 0.55, 5.4], s: [7.4, 0.09, 0.09] }), piece(B(), '#a77a4e', { p: [5.3, 0.55, 5.4], s: [7.4, 0.09, 0.09] }));
  for (const x of [-9.2, 9.2]) p.push(piece(B(), '#a77a4e', { p: [x, 1.0, 0.5], s: [0.09, 0.09, 9.8] }), piece(B(), '#a77a4e', { p: [x, 0.55, 0.5], s: [0.09, 0.09, 9.8] }));
  const m = new THREE.Mesh(fusion(p), mat); m.castShadow = ombres; m.receiveShadow = ombres; g.add(m);
  // colliders : le mur du fond, la clôture (avec l'entrée devant), l'abreuvoir
  for (let i = 0; i < 9; i++) colliders.push({ x: ex - 8 + i * 2, z: ez - 4.6, r: 1.0 });
  for (const [x, z] of pieux) colliders.push({ x: ex + x, z: ez + z, r: 0.5 });
  // le décor vivant de l'enclos : tapis de paille (places libres ou non), vrai abreuvoir avec de l'eau, mangeoire à foin, litière de paille
  { const mat2 = materiau(), ajouterGeo = (geo, x, z, rot = 0, dy = 0) => { const mm = new THREE.Mesh(geo, mat2); mm.position.set(x, H(x, z) + dy, z); mm.rotation.y = rot; mm.castShadow = ombres; mm.receiveShadow = ombres; scene.add(mm); return mm; };
    for (const pl of PLACES) ajouterGeo(geoTapis(false), pl.x, pl.z, pl.a + Math.PI / 2, 0.0);
    ajouterGeo(geoTapis(true), PLACE_GRANDE.x, PLACE_GRANDE.z, 0, 0.0);
    const E = LIEUX.eau.objet, F = LIEUX.foin.objet, Li = LIEUX.litiere.objet;
    ajouterGeo(geoAbreuvoir(), E.x, E.z, 0, -0.02);
    const eau = creerEauBassin(); eau.position.set(E.x, H(E.x, E.z) + EAU_BASSIN.y, E.z); scene.add(eau);
    ajouterGeo(geoFoin(), F.x, F.z, 0, -0.02);
    ajouterGeo(geoLitiere(), Li.x, Li.z, 0, -0.04);
    colliders.push({ x: E.x - 0.7, z: E.z, r: 0.7 }, { x: E.x + 0.7, z: E.z, r: 0.7 }, { x: F.x, z: F.z, r: 1.0 }, { x: F.x + 1.5, z: F.z, r: 0.6 }); }
  // le gardien (personnage imaginaire)
  const gardien = new Enfant(ombres, { tunique: '#6b5a3a', pantalon: '#4a3a2a', cheche: '#e8dcc4', peau: '#a8724c', sac: false });
  gardien.racine.scale.setScalar(1.25); gardien.racine.position.set(ex + 2.6, H(ex + 2.6, ez + 6.6), ez + 6.6); gardien.racine.rotation.y = 0.3; scene.add(gardien.racine);
  colliders.push({ x: ex + 2.6, z: ez + 6.6, r: 0.5 });
  // les montures au repos : chacune a SA place (enclos-plan.js, selon l'ordre de la liste possédée). La monture qui voyage n'est pas dessinée ici : elle est
  // représentée par le personnage principal (jamais deux exemplaires d'une même monture). Les montures au repos sont des obstacles pour l'enfant à pied.
  let repos = [], bloqueurs = [];
  const especeDe = id => monture(id).espece;
  return {
    centre: { x: ex, z: ez }, point: { x: ex + 2.6, z: ez + 8.4 }, sortie: { x: ex, z: ez + 8.5 }, gardien,
    // la place d'une monture possédée (ou null s'il n'y a plus de place)
    placeDe: (id, possedes) => affecter(possedes, especeDe)[id] || null,
    // les montures qui se reposent (toutes sauf celle qui voyage) avec leur place : pour « Examiner »
    placesRepos(possedes, actif) { const pl = affecter(possedes, especeDe); return possedes.filter(id => id !== actif && pl[id]).map(id => ({ id, x: pl[id].x, z: pl[id].z, grande: especeDe(id) === 'elephant' })); },
    // affiche les montures qui attendent à l'écurie : toutes celles de la liste sauf celle qui est en voyage (actif)
    maj(possedes, actif) {
      for (const r of repos) { scene.remove(r.m.racine); r.m.racine.traverse(o => o.geometry && o.geometry.dispose()); }
      for (const c of bloqueurs) { const i = colliders.indexOf(c); if (i >= 0) colliders.splice(i, 1); }
      bloqueurs = [];
      const places = affecter(possedes, especeDe);
      repos = possedes.filter(id => id !== actif && places[id]).map((id, i) => {
        const mo = creerMonture(id, false), pl = places[id], d = monture(id).espece;
        mo.racine.position.set(pl.x, H(pl.x, pl.z), pl.z); mo.racine.rotation.y = pl.a + (i % 2 ? 0.1 : -0.08); scene.add(mo.racine);
        const c = { x: pl.x, z: pl.z, r: d === 'elephant' ? 1.7 : 0.9, repos: true }; colliders.push(c); bloqueurs.push(c);
        return { m: mo, decal: i * 1.7 };
      });
    },
    animer(dt, t, J) {
      const loin = Math.hypot(J.x - ex, J.z - ez) > 70;
      gardien.animer(dt, 0, t);
      if (loin) return;
      for (const r of repos) r.m.animer(dt, 0, t + r.decal);
    }
  };
}
