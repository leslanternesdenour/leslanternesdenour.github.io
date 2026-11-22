// Les Aventures des Lanternes — accès à la collection : une carte par jeu, avec sa progression (lue dans la sauvegarde du profil, jamais recopiée).
// Un jeu pas encore disponible est affiché « Bientôt » : aucun faux bouton « Jouer ».
(function () {
  function lire(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  var JEUX = [
    { id: 'mots', lien: 'chasse-aux-mots/', icone: '🔎', fond: '#cfe3ff', c: '#4a90e2', titre: 'La Chasse aux mots', texte: "Explore le marché, le jardin, l'oasis… Retrouve les objets cachés et apprends leurs noms en français et en arabe.", recomp: '⭐ étoiles · 🏮 lanternes · 🎓 diplômes · 📖 mots', cle: 'aventure_mots', total: 90 },
    { id: 'mysteres', icone: '🏜️', fond: '#f6d9a0', c: '#c8664a', titre: 'Les Mystères du désert', texte: 'Observe, cherche des indices et résous des énigmes dans le désert, les ruines et la bibliothèque.' },
    { id: 'quiz', icone: '❓', fond: '#e4daf5', c: '#7a5ac0', titre: 'Les Quiz et défis de Nour', texte: 'Des questions avec des personnages, des réponses illustrées et des explications douces.' },
    { id: 'oasis', icone: '🌴', fond: '#cdeef5', c: '#2f9aa8', titre: "Les Bâtisseurs de l'oasis", texte: 'Plante des palmiers, trouve de l\'eau et fais grandir ton oasis à ton rythme.' },
    { id: 'tresor', icone: '📜', fond: '#f2e4c8', c: '#8a6a3a', titre: 'Le Trésor des sourates et des mots', texte: "Découvre l'alphabet arabe, des mots et des passages adaptés à ton âge." },
    { id: 'cinq', icone: '🌅', fond: '#f9d7d0', c: '#e5677b', titre: 'Le Défi des cinq prières', texte: 'Retrouve les cinq prières de la journée, dans le bon ordre et au bon moment.' }
  ];
  var p = lire('ldn_profil_actif'); if (p && p.surnom) document.getElementById('profil').textContent = (p.avatar === 'fille' ? '👧 ' : '👦 ') + p.surnom;
  var etoiles = 0, lanternes = 0, mots = 0;
  var el = document.getElementById('cartes');
  JEUX.forEach(function (j) {
    var s = j.cle ? lire(j.cle) : null, prog = '';
    if (j.id === 'mots' && s) { var e = s.etoiles || {}, n = 0, l = 0; Object.keys(e).forEach(function (k) { (e[k] || []).forEach(function (v) { n += v || 0; if (v > 0) l++; }); }); etoiles += n; lanternes += l; mots = (s.trouves || []).length; prog = '⭐ ' + n + ' / ' + j.total + ' · 📖 ' + mots + ' mots'; }
    else if (j.lien) prog = 'Pas encore commencé';
    var a = document.createElement('article'); a.className = 'carte' + (j.lien ? '' : ' bientot'); a.style.setProperty('--c', j.c); a.style.setProperty('--fond', j.fond);
    a.innerHTML = '<div class="vignette" aria-hidden="true">' + j.icone + '</div><h2>' + j.titre + '</h2><p>' + j.texte + '</p>' + (j.lien ? '<p class="prog">' + prog + '</p><p class="recomp">' + j.recomp + '</p>' : '') +
      (j.lien ? '<a class="jouer" href="' + j.lien + '">▶ Jouer</a>' : '<span class="jouer" role="note">Bientôt</span>');
    el.appendChild(a);
  });
  document.getElementById('bilan').textContent = '⭐ ' + etoiles + '   ·   🏮 ' + lanternes + '   ·   📖 ' + mots + ' mots appris';
})();
