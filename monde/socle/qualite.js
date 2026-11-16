// Socle commun — mode graphismes léger / beau.
// Automatique au premier lancement, réglable ensuite par les parents.

export function qualiteAuto() {
  const mem = navigator.deviceMemory || 4;
  const coeurs = navigator.hardwareConcurrency || 4;
  const petit = Math.min(screen.width, screen.height) < 500;
  const vieux = /Android [4-8]\b|iPhone OS (9|10|11|12)_/.test(navigator.userAgent);
  if (mem <= 3 || coeurs <= 4 && petit || vieux) return 'leger';
  return 'beau';
}

export function reglages(qualite) {
  const leger = qualite === 'leger';
  return {
    leger,
    antialias: !leger,
    pixelRatio: leger ? Math.min(window.devicePixelRatio || 1, 1) : Math.min(window.devicePixelRatio || 1, 2),
    ombres: !leger,
    densiteDeco: leger ? 0.5 : 1,
    gouttes: leger ? 60 : 180,
    etoiles: leger ? 250 : 700
  };
}

// Surveille la fluidité : si le mode automatique rame, on propose le mode léger.
export function surveillerFluidite(surLent) {
  let images = 0, debut = performance.now(), lentes = 0, fini = false;
  return function image() {
    if (fini) return;
    images++;
    const t = performance.now();
    if (t - debut >= 2000) {
      const ips = images * 1000 / (t - debut);
      // moins de 5 images/s = onglet en arrière-plan ou ralenti par le système : on ne compte pas
      lentes = ips >= 5 && ips < 24 && document.visibilityState === 'visible' ? lentes + 1 : 0;
      images = 0; debut = t;
      if (lentes >= 3) { fini = true; surLent(ips); }
    }
  };
}
