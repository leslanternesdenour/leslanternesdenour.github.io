// Registre des HABITANTS et lieux du village : Loumi, Nour (facultatif), et ceux qui viendront.
// Chaque habitant se déclare avec sa position, son rayon et ce qu'il fait quand l'enfant le sollicite. Un seul code gère :
//  - la proximité : le bouton d'action (« Parler »…) n'existe que près d'un habitant ;
//  - la fermeture automatique : en s'éloignant, la conversation se ferme ;
//  - rien d'autre : un habitant ne parle JAMAIS de lui-même, ne suit jamais l'enfant et ne partage aucune mémoire avec un autre.
// Sans Three.js : testable seul (outils/tests/habitants.test.mjs).

export function creerHabitants({ marge = 1.5 } = {}) {
  const liste = new Map();
  let ouvert = null;                        // id de l'habitant dont la conversation est ouverte
  const dist = (h, J) => Math.hypot(h.x - J.x, h.z - J.z);
  return {
    // h : { id, x, z, rayon = 3.2, label = 'Parler', icone = '💬', actif = () => true, ouvrir(), fermer?() }
    ajouter(h) {
      if (!h || !h.id || typeof h.ouvrir !== 'function' || !Number.isFinite(h.x) || !Number.isFinite(h.z)) throw new Error('habitant invalide');
      liste.set(h.id, { rayon: 3.2, label: 'Parler', icone: '💬', actif: () => true, ...h });
    },
    retirer(id) { if (ouvert === id) ouvert = null; liste.delete(id); },
    a: id => liste.has(id),
    ids: () => [...liste.keys()],
    // l'action proposée à l'enfant : l'habitant actif le plus proche dans son rayon (même forme que les autres interactions du jeu)
    interaction(J) {
      let best = null;
      for (const h of liste.values()) {
        if (!h.actif()) continue;
        const d = dist(h, J); if (d > h.rayon || (best && best.d <= d)) continue;
        best = { id: h.id, label: h.label, icone: h.icone, d, faire: () => { ouvert = h.id; h.ouvrir(); } };
      }
      return best;
    },
    // à appeler à chaque image : si l'enfant s'éloigne de l'habitant dont la conversation est ouverte, elle se ferme
    maj(J, fermerFenetre) {
      if (!ouvert) return;
      const h = liste.get(ouvert);
      if (!h || dist(h, J) > h.rayon + marge) { const id = ouvert; ouvert = null; if (h && h.fermer) h.fermer(); if (fermerFenetre) fermerFenetre(id); }
    },
    // une conversation qui enchaîne plusieurs fenêtres (réponses) reste suivie : elle se fermera à l'éloignement
    marquer(id) { if (liste.has(id)) ouvert = id; },
    ferme() { ouvert = null; },              // la fenêtre a été fermée (par l'enfant, ou autrement)
    ouvert: () => ouvert
  };
}
