/* Mode mesure des performances (pour les tests sur smartphone) : actif seulement avec ?mesure=1 dans l'adresse.
   Affiche en direct : images par seconde (moyenne et minimum sur 5 s), temps de chargement, mémoire (si le navigateur la donne).
   Ne charge rien, n'envoie rien. Sans ?mesure=1, ce fichier ne fait rien. */
(function () {
  if (!/[?&]mesure=1\b/.test(location.search)) return;
  var t0 = performance.now(), boite = document.createElement('div'), images = [], dernier = 0, pire = 999;
  boite.setAttribute('aria-hidden', 'true');
  boite.style.cssText = 'position:fixed;right:6px;bottom:6px;z-index:99999;background:rgba(10,6,30,.85);color:#ffe3a3;font:600 12px/1.4 ui-monospace,monospace;padding:6px 9px;border-radius:8px;pointer-events:none;white-space:pre';
  function ajouter() { if (document.body) document.body.appendChild(boite); else setTimeout(ajouter, 50); } ajouter();
  function chargement() {
    var n = performance.getEntriesByType('navigation')[0];
    return n ? (n.loadEventEnd > 0 ? (n.loadEventEnd / 1000).toFixed(1) + ' s' : '…') : '?';
  }
  function boucle(t) {
    if (dernier) { var dt = t - dernier; images.push([t, dt]); }
    dernier = t;
    while (images.length && t - images[0][0] > 5000) images.shift();
    requestAnimationFrame(boucle);
  }
  requestAnimationFrame(boucle);
  setInterval(function () {
    if (images.length < 2) return;
    var total = images.reduce(function (s, x) { return s + x[1]; }, 0), moy = 1000 / (total / images.length);
    var max = Math.max.apply(null, images.map(function (x) { return x[1]; })), min = 1000 / max;
    if (performance.now() - t0 > 8000) pire = Math.min(pire, min);
    var m = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) + ' Mo' : 'n/d';
    var ecran = Math.round(innerWidth) + '×' + Math.round(innerHeight) + ' @' + (window.devicePixelRatio || 1);
    boite.textContent = 'FPS moy ' + moy.toFixed(0) + ' · min ' + min.toFixed(0) + (pire < 999 ? ' · pire ' + pire.toFixed(0) : '') +
      '\nchargement ' + chargement() + ' · mémoire JS ' + m + '\nécran ' + ecran + ' · cœurs ' + (navigator.hardwareConcurrency || '?') + ' · RAM ' + (navigator.deviceMemory || '?') + ' Go';
    window.__mesure = { fps: moy, fpsMin: min, pire: pire, memoireMo: performance.memory ? performance.memory.usedJSHeapSize / 1048576 : null };
  }, 1000);
})();
