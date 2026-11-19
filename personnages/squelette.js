// Le squelette commun du garçon et de la fille : mêmes noms d'os, mêmes décalages que l'ancien personnage (voyage/js/voyageur.js),
// pour que le moteur de gestes (ablutions/jeu3d/gestes.js) et la marche du Grand Voyage le pilotent sans changement.
import * as THREE from 'three';

const os = (nom, parent, x = 0, y = 0, z = 0) => { const o = new THREE.Bone(); o.name = nom; o.position.set(x, y, z); parent.add(o); return o; };

// Repère : le personnage regarde +z ; sa main droite est du côté x négatif (côté « d »), sa main gauche du côté x positif (côté « g »).
// À rotation nulle, chaque segment pend le long de -y : c'est la pose de repos que le moteur de gestes attend.
export function creerSquelette(genre) {
  const epaule = genre === 'garcon' ? 0.19 : 0.175;
  const racine = new THREE.Group(); racine.name = 'racine';
  const corps = new THREE.Group(); corps.name = 'corps'; racine.add(corps);
  const bassin = os('bassin', corps, 0, 0.62, 0);
  const jambes = [-1, 1].map(s => {
    const c = s < 0 ? 'd' : 'g';
    const haut = os('hanche_' + c, bassin, s * 0.085, 0, 0), bas = os('genou_' + c, haut, 0, -0.3, 0), cheville = os('cheville_' + c, bas, 0, -0.285, 0);
    return { haut, bas, cheville, s };
  });
  const jupe = new THREE.Group(); jupe.name = 'jupe'; bassin.add(jupe);
  const buste = os('buste', bassin);
  const bras = [-1, 1].map(s => {
    const c = s < 0 ? 'd' : 'g';
    const haut = os('epaule_' + c, buste, s * (epaule - 0.01), 0.43, 0), bas = os('coude_' + c, haut, 0, -0.24, 0);
    const main = os('main_' + c, bas, 0, -0.25, 0), index = os('index_' + c, bas, 0, -0.27, 0.01);
    return { haut, bas, main, index, s };
  });
  const tete = os('tete', buste, 0, 0.64, 0.005);
  const yeux = new THREE.Group(); yeux.name = 'yeux'; yeux.position.set(0, 0.012, 0.155); tete.add(yeux);
  return { genre, racine, corps, bassin, buste, tete, yeux, jupe, bras, jambes };
}
