// Adaptateur : habille le moteur de gestes (ablutions/jeu3d/gestes.js) avec un modèle glTF N1 (fille_N1.glb / garcon_N1.glb).
// Il expose la MÊME interface que la classe Voyageur (voyage/js/voyageur.js, jamais modifiée) : racine, corps, bassin, buste, tete, yeux, jupe, jambes[2], bras[2], clign.
// Le squelette des GLB reproduit celui de Voyageur (mêmes noms, mêmes positions) : le moteur écrit donc directement dans les os.
// Spécification : docs/personnages-3d/SPECIFICATION-TESTS-PRIERE.md (partie B) ; contrat : CONTRAT-INTERFACE.md.
import * as THREE from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { formeTissu, influenceClignement, lisserInfluence, facteurTeint } from './logique.js';

const FORMES = ['assis', 'penche', 'prosterne'];
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
    this.influence = { assis: 0, penche: 0, prosterne: 0 };
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
  }
  // Teint : multiplie la couleur du matériau de la peau (couleurs peintes sur les sommets). Les vêtements gardent leurs couleurs validées.
  teinte(indexPeau) {
    const f = facteurTeint(indexPeau);
    for (const m of this.maillages) if (m.name === 'peau') { const c = m.material.color; if (!m.userData.couleurOrigine) m.userData.couleurOrigine = c.clone(); c.copy(m.userData.couleurOrigine); c.r *= f[0]; c.g *= f[1]; c.b *= f[2]; }
  }
  // Lie le moteur de gestes et sa table de postures : suivre() lit moteur.cible (identité d'objet dans la table) pour en déduire la forme du tissu.
  lier(moteur, postures) { this.moteur = moteur; this.postures = postures; this.nomDe = new Map(Object.entries(postures || {}).map(([n, p]) => [p, n])); return this; }
  nomPosture() { return this.moteur ? (this.nomDe.get(this.moteur.cible) || null) : null; }
  // À appeler à chaque image, après moteur.maj() : formes de tissu (assis, penché, prosterné) et clignement des yeux.
  suivre(dt) {
    const cible = formeTissu(this.nomPosture());
    for (const f of FORMES) this.influence[f] = lisserInfluence(this.influence[f], f === cible ? 1 : 0, dt);
    const cl = influenceClignement(this.yeux.scale.y);
    for (const m of this.maillages) {
      const d = m.morphTargetDictionary, inf = m.morphTargetInfluences; if (!d || !inf) continue;
      for (const f of FORMES) if (d[f] !== undefined) inf[d[f]] = this.influence[f];
      if (d.clignement !== undefined) inf[d.clignement] = cl.clignement;
      if (d.clignement_mi !== undefined) inf[d.clignement_mi] = cl.clignement_mi;
    }
  }
  // Libère ce qui appartient à ce personnage : matériaux et textures d'os de CHAQUE squelette cloné (sans cela, chaque changement de genre laisserait des textures sur la carte graphique).
  // Les géométries sont partagées avec les autres personnages du même genre : on n'y touche pas.
  liberer() { for (const m of this.maillages) { if (m.skeleton) m.skeleton.dispose(); m.material.dispose(); } }
}
