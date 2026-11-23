// Interface contextuelle du Grand Voyage : une information n'apparaît qu'au moment et à l'endroit où l'enfant en a besoin.
// Permanent à l'écran : les trois accès essentiels (village, carnet, réglages), la carte, le joystick et l'action utile du moment.
// Tout le reste (lieu, pièces, mission en cours, besoins de la monture, faucon…) apparaît puis s'efface seul.
// Sans Three.js ni DOM réel : testable seul (outils/tests/hud.test.mjs) avec de faux éléments.

export function creerHud({ minuteur = setTimeout, annuler = clearTimeout } = {}) {
  const attente = new Map();
  return {
    // montre un élément ms millisecondes (un nouvel appel prolonge)
    temporaire(el, ms = 4500) {
      if (!el) return;
      el.classList.remove('cache');
      if (attente.has(el)) annuler(attente.get(el));
      attente.set(el, minuteur(() => { el.classList.add('cache'); attente.delete(el); }, ms));
    },
    // cache tout de suite (et oublie le minuteur)
    cacher(el) { if (!el) return; if (attente.has(el)) { annuler(attente.get(el)); attente.delete(el); } el.classList.add('cache'); },
    // un élément qui doit être visible tant qu'une condition est vraie
    quand(el, condition) { if (!el) return; if (attente.has(el) && condition) return; el.classList.toggle('cache', !condition); },
    enAttente: el => attente.has(el)
  };
}
