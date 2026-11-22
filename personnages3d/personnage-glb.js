// Adaptateur : habille le moteur de gestes (ablutions/jeu3d/gestes.js) avec un modèle glTF N1 (fille_N1.glb / garcon_N1.glb).
// Il expose la MÊME interface que la classe Voyageur (voyage/js/voyageur.js, jamais modifiée) : racine, corps, bassin, buste, tete, yeux, jupe, jambes[2], bras[2], clign.
// Le squelette des GLB reproduit celui de Voyageur (mêmes noms, mêmes positions) : le moteur écrit donc directement dans les os.
// Spécification : docs/personnages-3d/SPECIFICATION-TESTS-PRIERE.md (partie B) ; contrat : CONTRAT-INTERFACE.md.
import * as THREE from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { formeTissu, influenceClignement, lisserInfluence, facteurTeint } from './logique.js';

const FORMES = ['assis', 'penche', 'prosterne'];
const lisse = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const OS_REQUIS = ['racine', 'corps', 'bassin', 'buste', 'tete', 'epaule_d', 'coude_d', 'main_d', 'index_d', 'epaule_g', 'coude_g', 'main_g', 'index_g',
  'hanche_d', 'genou_d', 'cheville_d', 'hanche_g', 'genou_g', 'cheville_g'];

export class PersonnageGLB {
  // gltf : résultat du chargement (partagé entre les personnages du même genre) ; chaque personnage a son propre squelette et ses propres matériaux.
  constructor(gltf, { genre = 'fille', peau = 1, ombres = false } = {}) {
    this.genre = genre; this.type = 'nouveau';
    this.racine = new THREE.Group(); this.racine.name = 'personnage-' + genre;      // enveloppe, positionnée par le jeu
    this.modele = clone(gltf.scene); this.racine.add(this.modele);
    const os = {}; this.modele.traverse(o => { if (o.isBone) os[o.name] = o; });
    const manque = OS_REQUIS.filter(n => !os[n]); if (manque.length) throw new Error('modèle incomplet, os absents : ' + manque.join(', '));
    this.os = os;
    this.corps = os.corps; this.bassin = os.bassin; this.buste = os.buste; this.tete = os.tete;
    // jambes[0] / bras[0] = côté droit (x négatif) ; s = signe du côté, comme dans Voyageur
    this.jambes = [['d', -1], ['g', 1]].map(([c, s]) => ({ haut: os['hanche_' + c], bas: os['genou_' + c], cheville: os['cheville_' + c], s }));
    this.bras = [['d', -1], ['g', 1]].map(([c, s]) => ({ haut: os['epaule_' + c], bas: os['coude_' + c], main: os['main_' + c], index: os['index_' + c], s }));
    // Ni os ni maillage : le moteur écrit yeux.scale.y (clignement) et masque la jupe ; on traduit le premier en formes, on ignore le second (la jupe reste visible).
    this.yeux = new THREE.Object3D(); this.jupe = new THREE.Object3D(); this.clign = 3;
    this.influence = { assis: 0, penche: 0, prosterne: 0 }; this.tissuActif = true;
    // état du cycle de marche et des petits gestes (recopié de Voyageur, pour les Ablutions)
    this.phase = 0; this.pose = 'debout'; this.vitesse = 0; this.repos = 0; this.regard = 0; this.regardCible = 0; this.prochainRegard = 2; this.geste = null; this.balJupe = 0; this.angPrec = null;
    this.moteur = null; this.postures = null; this.nomDe = new Map();
    this.maillages = [];
    this.modele.traverse(o => {
      if (!(o.isMesh || o.isSkinnedMesh)) return;
      o.material = o.material.clone();                                             // matériaux propres à ce personnage (teint, jamais partagé)
      o.castShadow = !!ombres; o.receiveShadow = false;
      if (o.isSkinnedMesh) o.frustumCulled = false;                                // la boîte englobante du pose de repos ne suit pas le squelette animé
      this.maillages.push(o);
    });
    this.teinte(peau);
    this.sv = false;
    if (globalThis.LDN_SV) globalThis.LDN_SV.abonnerObjet(this, 'sansVisage');      // mode sans visage (réglage de la famille)
  }
  // MODE SANS VISAGE : les yeux (maillage séparé) sont masqués, les formes faciales sont forcées à zéro et les traits peints sur la peau
  // (sourcils, bouche, joues : couleurs de sommets) reprennent la couleur de la peau. LIMITE CONNUE : le RELIEF du nez et de la bouche fait partie
  // de la géométrie de la peau et ne peut pas être retiré sans retoucher le modèle dans Blender : il reste visible en relief, sans couleur.
  sansVisage(actif) {
    this.sv = !!actif;
    for (const m of this.maillages) {
      if (m.name === 'yeux') m.visible = !this.sv;
      if (m.name === 'peau') this.#couleursVisage(m, this.sv);
    }
  }
  #couleursVisage(m, masque) {
    const g = m.geometry, col = g && g.attributes.color, pos = g && g.attributes.position; if (!col || !pos) return;
    if (!g.userData.visage) {                                                   // calculé une fois par géométrie (partagée entre personnages du même genre)
      const n = col.count, cle = i => [col.getX(i), col.getY(i), col.getZ(i)].map(x => Math.round(x * 100)).join(','), compte = new Map();
      for (let i = 0; i < n; i++) { const k = cle(i); compte.set(k, (compte.get(k) || 0) + 1); }
      const dom = [...compte.entries()].sort((a, b) => b[1] - a[1])[0][0].split(',').map(x => Number(x) / 100);
      const idx = [], origine = [];
      for (let i = 0; i < n; i++) {
        if (pos.getY(i) < 1.1 || pos.getZ(i) < 0.02) continue;                  // visage seulement (devant de la tête)
        const c = [col.getX(i), col.getY(i), col.getZ(i)];
        if (Math.hypot(c[0] - dom[0], c[1] - dom[1], c[2] - dom[2]) > 0.03) { idx.push(i); origine.push(c); }
      }
      g.userData.visage = { dom, idx, origine };
    }
    const { dom, idx, origine } = g.userData.visage;
    for (let k = 0; k < idx.length; k++) { const c = masque ? dom : origine[k]; col.setXYZ(idx[k], c[0], c[1], c[2]); }
    col.needsUpdate = true;
  }
  // Teint : multiplie la couleur du matériau de la peau (couleurs peintes sur les sommets). Les vêtements gardent leurs couleurs validées.
  teinte(indexPeau) {
    const f = facteurTeint(indexPeau);
    for (const m of this.maillages) if (m.name === 'peau') { const c = m.material.color; if (!m.userData.couleurOrigine) m.userData.couleurOrigine = c.clone(); c.copy(m.userData.couleurOrigine); c.r *= f[0]; c.g *= f[1]; c.b *= f[2]; }
  }
  // Lie le moteur de gestes et sa table de postures : suivre() lit moteur.cible (identité d'objet dans la table) pour en déduire la forme du tissu.
  // options.sansTissu : ne pas appliquer les formes de tissu de la Prière (Ablutions : assise sur tabouret, formes correctives pas encore faites).
  lier(moteur, postures, options = {}) { this.tissuActif = !options.sansTissu; this.moteur = moteur; this.postures = postures; this.nomDe = new Map(Object.entries(postures || {}).map(([n, p]) => [p, n])); return this; }
  nomPosture() { return this.moteur ? (this.nomDe.get(this.moteur.cible) || null) : null; }
  // À appeler à chaque image, après moteur.maj() : formes de tissu (assis, penché, prosterné) et clignement des yeux.
  suivre(dt) {
    const cible = this.tissuActif ? formeTissu(this.nomPosture()) : null;
    for (const f of FORMES) this.influence[f] = lisserInfluence(this.influence[f], f === cible ? 1 : 0, dt);
    const cl = influenceClignement(this.yeux.scale.y);
    for (const m of this.maillages) {
      const d = m.morphTargetDictionary, inf = m.morphTargetInfluences; if (!d || !inf) continue;
      for (const f of FORMES) if (d[f] !== undefined) inf[d[f]] = this.influence[f];
      if (d.clignement !== undefined) inf[d.clignement] = cl.clignement;
      if (d.clignement_mi !== undefined) inf[d.clignement_mi] = cl.clignement_mi;
      if (this.sv) for (const f of ['sourire', 'sourire_large', 'bouche_ouverte', 'sourcils_etonne', 'sourcils_concentre']) if (d[f] !== undefined) inf[d[f]] = 0;   // aucune expression faciale en mode sans visage
    }
  }

  // Un petit geste : 'prendre' (se pencher pour ramasser), 'caresser', 'salut', 'joie'
  faire(type) { this.geste = { type, t: 0, d: { prendre: 0.95, caresser: 1.6, salut: 1.3, joie: 1.1 }[type] || 1 }; }

  // Cycle de marche, respiration, regard et petits gestes : recopiés de Voyageur.animer (même squelette, mêmes valeurs). La jupe est fictive ici : ses écritures sont sans effet.
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
        // s'accroupir pour ramasser : les genoux plient vraiment, le bassin descend d'autant (les pieds restent au sol),
        // le dos reste assez droit, la tête suit le regard vers le sol, la main droite descend devant les pieds
        const cuisse = -1.05 * k, genou = 1.7 * k;
        for (const j of this.jambes) { j.haut.rotation.x = cuisse; j.bas.rotation.x = genou; }
        // hauteur perdue par la jambe pliée (cuisse 0,3 m, jambe 0,285 m) : on descend le corps d'autant
        corpsY -= 0.585 - (0.3 * Math.cos(cuisse) + 0.285 * Math.cos(cuisse + genou));
        this.buste.rotation.x = this.buste.rotation.x * (1 - k) + 0.38 * k;
        this.tete.rotation.x = this.tete.rotation.x * (1 - k) + 0.35 * k;
        this.jupe.scale.y = 1 - 0.45 * k; this.jupe.rotation.x = -0.5 * k;      // la robe se replie au lieu de traverser le sol
        bd.haut.rotation.set(-0.75 * k + bd.haut.rotation.x * (1 - k), 0, bd.s * 0.15 * k); bd.bas.rotation.x = -0.25 * k;
        bg.haut.rotation.set(-0.35 * k + bg.haut.rotation.x * (1 - k), 0, bg.s * 0.2 * k); bg.bas.rotation.x = -0.5 * k;
      } else if (g.type === 'caresser') {
        bd.haut.rotation.set(-1.35 * k, 0, -0.1); bd.bas.rotation.set(-0.35 * k + Math.sin(g.t * 9) * 0.25 * k, 0, 0);
        this.tete.rotation.x += 0.15 * k;
      } else if (g.type === 'salut') {
        bd.haut.rotation.set(-0.3 * k, 0, -2.4 * k); bd.bas.rotation.set(0, 0, -0.3 * k + Math.sin(g.t * 12) * 0.35 * k);
      } else if (g.type === 'joie') {
        corpsY += Math.abs(Math.sin(g.t * Math.PI * 2 / g.d * 2)) * 0.12 * k;
        for (const b of this.bras) b.haut.rotation.set(-0.3 * k, 0, b.s * 2.3 * k);
      }
      if (g.t >= g.d) { this.geste = null; this.jupe.scale.y = 1; }
    }
    this.corps.position.y = corpsY;
  }

  // Libère ce qui appartient à ce personnage : matériaux et textures d'os de CHAQUE squelette cloné (sans cela, chaque changement de genre laisserait des textures sur la carte graphique).
  // Les géométries sont partagées avec les autres personnages du même genre : on n'y touche pas.
  liberer() { for (const m of this.maillages) { if (m.skeleton) m.skeleton.dispose(); m.material.dispose(); } }
}
