/* Miniatures des histoires : jamais de vide. Si l'image haute qualité manque (ou ne charge pas), on essaie la suivante, puis on affiche l'image de secours aux couleurs de Nour. */
(function () {
  var FILE = ['maxresdefault', 'sddefault', 'hqdefault'];
  function suite(img) {
    var m = /\/vi\/([^/]+)\/([a-z]+)\.jpg/.exec(img.currentSrc || img.src); if (!m) return secours(img);
    var i = FILE.indexOf(m[2]);
    if (i === -1 || i >= FILE.length - 1) return secours(img);
    img.src = 'https://i.ytimg.com/vi/' + m[1] + '/' + FILE[i + 1] + '.jpg';
  }
  function secours(img) { var v = img.closest('.vignette'); if (v) v.classList.add('sans-image'); img.removeAttribute('alt'); img.setAttribute('aria-hidden', 'true'); }
  function verifier(img) {
    // une image YouTube absente renvoie parfois un petit gabarit gris (120 px) au lieu d'une erreur
    if (img.complete && (img.naturalWidth === 0 || img.naturalWidth <= 120)) suite(img);
  }
  Array.prototype.forEach.call(document.querySelectorAll('.vignette img'), function (img) {
    img.addEventListener('error', function () { suite(img); });
    img.addEventListener('load', function () { if (img.naturalWidth <= 120) suite(img); });
    if (img.complete) verifier(img);
  });
})();
