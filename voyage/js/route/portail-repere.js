// LE REPÈRE D'UN PORTAIL DE PIERRE : fichier PUR (aucune 3D), commun au portail de départ (village) et au portail de retour (Route).
// Les deux portails ont la même architecture : mêmes blocs (marches 20 / 40 / 60 cm), mêmes piliers, mêmes positions pour Nour et pour Sablo.
// Repère local : lx = de gauche à droite (vu de devant), lz = le sens de la traversée (le devant, d'où l'on arrive, est en lz négatif), (0, 0) = le centre du portail.

// LES MARCHES : trois blocs de pierre posés sur un sol plan. Les hauteurs sont mesurées au-dessus de ce sol.
// Le 3D (portail-3d.js) dessine exactement ces blocs, le jeu pose les pieds exactement dessus : une seule source de vérité.
// raide : de combien la pierre « descend » autour du bloc (m par m). 1 = on monte comme une marche (la pente permise est de 1,05) ; 2,5 = un mur, on ne le grimpe pas.
export const BLOCS = [
  { id: 'marche-basse', x0: -3.8, x1: 3.8, z0: -4.5, z1: -3.0, haut: 0.2, raide: 1 },
  { id: 'marche-haute', x0: -3.1, x1: 3.1, z0: -3.0, z1: -1.5, haut: 0.4, raide: 1 },
  { id: 'socle', x0: -4.3, x1: 4.3, z0: -1.5, z1: 1.5, haut: 0.6, raide: 2.5 }
];
const norme = a => Math.atan2(Math.sin(a), Math.cos(a));

// site : { x, z, cap } (cap : le sens dans lequel on traverse le portail, atan2(dx, dz))
export function creerRepere(site) {
  const s = Math.sin(site.cap), c = Math.cos(site.cap);
  const versMonde = (lx, lz) => ({ x: site.x + lz * s + lx * c, z: site.z + lz * c - lx * s });
  const versLocal = (x, z) => { const dx = x - site.x, dz = z - site.z; return { lx: dx * c - dz * s, lz: dx * s + dz * c }; };
  // La hauteur de la pierre (au-dessus du sol plan) à un endroit : 0 hors des blocs ; sur une marche, le dessus exact de la marche.
  function hauteur(x, z) {
    if (Math.abs(x - site.x) > 10 || Math.abs(z - site.z) > 10) return 0;      // loin du portail (appelée pour tout ce qui marche) : rien
    const { lx, lz } = versLocal(x, z); let h = 0;
    for (const b of BLOCS) {
      const d = Math.hypot(Math.max(b.x0 - lx, 0, lx - b.x1), Math.max(b.z0 - lz, 0, lz - b.z1));
      h = Math.max(h, b.haut - b.raide * d);
    }
    return h;
  }
  // Là où l'on se tient pour le franchir : AU MILIEU de la marche haute, les pieds sur son dessus
  const devant = () => versMonde(0, -2.25);
  // Sablo : de profil sur la marche basse (le dromadaire fait 2,6 m : il ne tiendrait pas dans le sens de la marche), à côté de l'enfant ;
  // monté, il est au milieu de la marche basse (même hauteur sous les quatre pattes) et le cavalier le suit.
  const deProfil = norme(Math.atan2(c, -s));
  return {
    site, versMonde, versLocal, hauteur, devant,
    cap: norme(site.cap),                                              // face au portail
    sablo: () => ({ ...versMonde(-1.9, -3.75), a: deProfil }),
    monte: () => ({ ...versMonde(0, -3.75), a: deProfil }),
    // les obstacles : deux piliers de pierre, et le voile fermé (on ne passe pas « à travers » : on utilise le bouton)
    obstacles: () => [[2.5, 1.0], [-2.5, 1.0], [0.9, 0.8], [-0.9, 0.8]].map(([lx, r]) => ({ ...versMonde(lx, 0), r }))
  };
}
