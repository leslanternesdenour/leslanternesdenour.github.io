/* Les Lanternes de Nour — décor et transitions des univers.
   À inclure à la fin de la page : <script src="../univers/univers.js" defer></script>
   L'univers est lu sur <html data-univers="...">. */
(function () {
  const H = document.documentElement;
  const U = H.dataset.univers;
  const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const petit = Math.min(innerWidth, innerHeight) < 520;

  // ----- petits dessins (SVG très légers) -----
  const goutte = c => `<svg viewBox="0 0 20 26"><path d="M10 1C8 6 2 12 2 17a8 8 0 0 0 16 0C18 12 12 6 10 1z" fill="${c}" opacity=".55"/><path d="M6 15c1-3 2-5 3-6" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7" fill="none"/></svg>`;
  const bulle = () => `<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/><circle cx="7" cy="7" r="2" fill="#fff" opacity=".8"/></svg>`;
  const etoile = c => `<svg viewBox="0 0 20 20"><path d="M10 0l2.6 7.4L20 10l-7.4 2.6L10 20l-2.6-7.4L0 10l7.4-2.6z" fill="${c}"/></svg>`;
  const etoile5 = c => `<svg viewBox="0 0 24 24"><path d="M12 1.5l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 17.6l-6.4 3.5L7 14l-5.3-5 7.2-.9z" fill="${c}" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
  const croissant = c => `<svg viewBox="0 0 24 24"><path d="M15 2a10 10 0 1 0 7 17A8 8 0 0 1 15 2z" fill="${c}"/></svg>`;
  const arche = c => `<svg viewBox="0 0 24 30"><path d="M3 29V13C3 8 9 5 12 1c3 4 9 7 9 12v16" fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round"/></svg>`;
  const livre = c => `<svg viewBox="0 0 32 22"><path d="M16 4C12 1 6 1 2 2v17c4-1 10-1 14 2 4-3 10-3 14-2V2c-4-1-10-1-14 2z" fill="#fffdf5" stroke="${c}" stroke-width="1.6" stroke-linejoin="round"/><path d="M16 4v17" stroke="${c}" stroke-width="1.4"/></svg>`;
  const lanterne = c => `<svg viewBox="20 6 60 104"><path d="M30 32 38 16h24l8 16z" fill="#f5b942"/><rect x="26" y="32" width="48" height="8" rx="2" fill="#d9952a"/><rect x="28" y="40" width="44" height="60" rx="3" fill="${c}" stroke="#d9952a" stroke-width="4"/><circle cx="50" cy="70" r="13" fill="#fff6c9" opacity=".9"/><rect x="24" y="100" width="52" height="8" rx="2" fill="#d9952a"/></svg>`;
  const confetti = (c, rond) => `<svg viewBox="0 0 12 12">${rond ? `<circle cx="6" cy="6" r="5" fill="${c}"/>` : `<rect x="1" y="3" width="10" height="6" rx="2" fill="${c}"/>`}</svg>`;

  // ----- décor de chaque univers : [dessin, taille px, animation, durée s] -----
  const D = {
    ablutions: i => i % 3 === 2 ? [bulle(), 14 + i % 3 * 4, 'u-monte', 14 + i % 4 * 3, 'bas']
                                : [goutte(['#5fc8e8', '#8fd8ef', '#2bb3c0'][i % 3]), 16 + i % 4 * 5, 'u-flotte', 6 + i % 3 * 2],
    priere: i => [[etoile('#e0a93a'), 12 + i % 3 * 5, 'u-scintille', 3 + i % 3],
                  [croissant('#f5b942'), 18, 'u-flotte', 8],
                  [arche('#e0a93a'), 22, 'u-flotte', 9]][i % 5 === 1 ? 1 : i % 5 === 3 ? 2 : 0],
    sourates: i => i % 4 === 1 ? [livre('#8fb79a'), 30, 'u-flotte', 9] : [etoile(['#8fb79a', '#c9a95c'][i % 2]), 10 + i % 3 * 4, 'u-scintille', 3.5 + i % 3],
    quiz: i => i % 3 === 0 ? [etoile5(['#a99cf0', '#7fbdf0', '#ffd04f'][i % 3]), 18 + i % 3 * 4, 'u-saute', 2.6 + i % 3 * .6]
                           : [etoile(['#b9aef5', '#9fd0f5'][i % 2]), 12 + i % 2 * 5, 'u-scintille', 2.4 + i % 3],
    histoires: i => i % 3 === 0 ? [lanterne(['#fff2c4', '#ffd3e0', '#c9f1f7'][i % 3]), 26, 'u-lueur', 4 + i % 3]
                                : [etoile('#f5b942'), 8 + i % 3 * 4, 'u-scintille', 3 + i % 3],
    jeux: i => [confetti(['#f6a46a', '#ffd04f', '#8fdcc1', '#f5a3c0', '#9fd0f5'][i % 5], i % 2), 10 + i % 3 * 3, 'u-tourne', 7 + i % 4 * 2]
  };

  // Positions réparties sur les bords pour ne jamais gêner la lecture au centre
  const PLACES = [[4, 14], [92, 10], [8, 38], [94, 34], [3, 62], [90, 58], [12, 86], [86, 84], [48, 4], [70, 94], [26, 96], [97, 74]];

  function decorer(cible, u = U, locale = false) {
    const fab = D[u];
    if (!fab || calme && u === 'jeux') return;
    const n = locale ? 7 : petit ? 8 : 12;
    const boite = document.createElement('div');
    boite.className = 'u-deco' + (locale ? ' locale' : '');
    boite.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < n; i++) {
      const [svg, taille, anim, duree, depart] = fab(i);
      const [x, y] = PLACES[i];
      const e = document.createElement('span');
      e.innerHTML = svg;
      e.style.cssText = `left:${x}%;top:${depart === 'bas' ? 100 : y}%;width:${taille}px;height:${taille * (svg.includes('0 0 20 26') ? 1.3 : 1)}px;` +
        `animation:${anim} ${duree}s ease-in-out ${-(i * 0.9)}s infinite${anim === 'u-monte' ? ';animation-timing-function:linear' : ''}`;
      boite.appendChild(e);
    }
    if (locale) cible.prepend(boite);
    else if (cible) { cible.innerHTML = ''; cible.appendChild(boite); }
    else document.body.prepend(boite);
  }
  window.decorerUnivers = (el, u) => decorer(el, u, true);
  if (!U) return;

  // Les pages qui ont déjà une zone de décor (#deco) la reçoivent ; ailleurs, seulement si data-deco="oui"
  const zone = document.getElementById('deco');
  if (zone) decorer(zone);
  else if (H.dataset.deco === 'oui') decorer(null);

  // ----- transition douce entre univers (si le navigateur n'a pas les transitions natives) -----
  const natif = 'onpagereveal' in window || CSS.supports('view-transition-name: none') && document.startViewTransition;
  if (!natif && !calme) {
    H.classList.add('u-arrive');
    setTimeout(() => H.classList.remove('u-arrive'), 450);
    document.addEventListener('click', e => {
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target && a.target !== '_self') return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      e.preventDefault();
      H.classList.add('u-part');
      setTimeout(() => { location.href = url.href; }, 200);
    });
    addEventListener('pageshow', ev => { if (ev.persisted) H.classList.remove('u-part'); });
  }
})();
