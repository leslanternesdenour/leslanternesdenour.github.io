// Les illustrations symboliques des récits : des paysages, de l'eau, des pierres, un tissu, des tentes. JAMAIS de personnage.
// Chaque image est un petit SVG décrit pour les lecteurs d'écran. Les animations (CSS) sont posées par le panneau (recit-ui.js).
const FOND = (c1, c2) => `<defs><linearGradient id="ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="400" height="240" fill="url(#ciel)"/>`;
const COLLINE = (x, y, w, h, c) => `<path d="M${x - w} ${y} Q${x} ${y - h} ${x + w} ${y} Z" fill="${c}"/>`;
const SOL = c => `<rect y="180" width="400" height="60" fill="${c}"/>`;
const EAU = (x, y, r) => `<g class="eau"><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.32}" fill="#4a9bb0"/><ellipse cx="${x}" cy="${y - 2}" rx="${r * 0.7}" ry="${r * 0.2}" fill="#8fd0de" opacity=".7"/></g>`;
const FONTAINE = (x, y) => `<g class="jet"><path d="M${x} ${y} Q${x - 16} ${y - 46} ${x - 26} ${y - 20} M${x} ${y} Q${x} ${y - 66} ${x} ${y - 44} M${x} ${y} Q${x + 16} ${y - 46} ${x + 26} ${y - 20}" stroke="#bfe6f0" stroke-width="5" fill="none" stroke-linecap="round"/></g>`;
const PIERRE = (x, y, w, h, c = '#a8906e') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${c}" stroke="#6b5a42" stroke-width="1.5"/>`;
const TENTE = (x, y, c) => `<path d="M${x - 28} ${y} L${x} ${y - 36} L${x + 28} ${y} Z" fill="${c}" stroke="#5a3d22" stroke-width="1.5"/>`;
const PALMIER = (x, y) => `<rect x="${x - 3}" y="${y - 40}" width="6" height="40" fill="#7a5a3a"/><path d="M${x} ${y - 40} q-24 -6 -30 10 M${x} ${y - 40} q24 -6 30 10 M${x} ${y - 40} q-8 -22 -22 -18 M${x} ${y - 40} q8 -22 22 -18" stroke="#4f8a3a" stroke-width="5" fill="none" stroke-linecap="round"/>`;
const DEFAUT = 'Illustration symbolique du récit : un paysage, de l\'eau, des pierres ou des tentes';
const cadre = (titre, contenu) => `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${titre}">${contenu}</svg>`;

const DESSINS = {
  'vallee-eau': d => cadre(d || DEFAUT,
    FOND('#f6deb0', '#f0c987') + COLLINE(70, 190, 130, 90, '#c99a60') + COLLINE(330, 190, 130, 80, '#b88a56') + SOL('#e6c88e') + EAU(200, 205, 38) + FONTAINE(200, 200)),
  'deux-collines': d => cadre(d || DEFAUT,
    FOND('#f6e2b8', '#eed39a') + COLLINE(60, 190, 80, 60, '#c0915a') + COLLINE(340, 190, 80, 60, '#b98a54') + SOL('#e6c88e') + `<path d="M70 200 Q200 170 330 200" stroke="#9a7a52" stroke-width="7" fill="none" stroke-dasharray="14 10" stroke-linecap="round"/>`),
  'evolution': d => cadre(d || DEFAUT,
    FOND('#f6e2b8', '#eed39a') + SOL('#e6c88e') + COLLINE(30, 190, 60, 40, '#c0915a') + EAU(95, 205, 18) + TENTE(150, 200, '#b5654a') + PIERRE(190, 168, 22, 28) + PIERRE(214, 176, 18, 20, '#b09672') + PIERRE(250, 150, 26, 46, '#9a8e7c') + PIERRE(280, 160, 24, 36, '#a8906e') + PIERRE(316, 138, 28, 58, '#9a8e7c') + PIERRE(348, 150, 26, 46, '#b09672') + PIERRE(372, 128, 22, 68, '#847868')),
  'fondations': d => cadre(d || DEFAUT,
    FOND('#f6e2b8', '#eed39a') + SOL('#e6c88e') + PIERRE(40, 196, 50, 6, '#b09672') + PIERRE(120, 188, 50, 14) + PIERRE(120, 176, 50, 12, '#9a8062') + PIERRE(200, 160, 50, 40) + PIERRE(285, 130, 50, 70, '#9a8e7c') + `<rect x="340" y="90" width="48" height="110" fill="#8a7e6e" stroke="#5a4c3a" stroke-width="2"/>`),
  'quraysh': d => cadre(d || DEFAUT,
    FOND('#f6e2b8', '#eed39a') + SOL('#e6c88e') + PIERRE(40, 110, 320, 90, '#9a8e7c') + `<path d="M120 200 L280 200 L300 218 L100 218 Z" fill="#e8dcc4" stroke="#a8996f" stroke-width="2"/>` + PIERRE(180, 180, 40, 22, '#3f3a38')),
  'oasis': d => cadre(d || DEFAUT,
    FOND('#f6e2b8', '#eed39a') + COLLINE(60, 190, 120, 60, '#d6aa68') + SOL('#e6c88e') + EAU(200, 205, 70) + PALMIER(110, 200) + PALMIER(290, 200) + PALMIER(330, 205)),
  'puits-outils': d => cadre(d || DEFAUT,
    FOND('#f6e2b8', '#eed39a') + SOL('#e6c88e') + PIERRE(160, 160, 80, 40, '#a8906e') + `<ellipse cx="200" cy="162" rx="34" ry="9" fill="#2f2a28"/>` + `<path d="M100 200 L140 150 M132 148 L148 158" stroke="#6b4a30" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M270 205 L300 150 L312 156 L282 210 Z" fill="#8a6440" stroke="#5a3d22" stroke-width="2"/><path d="M60 220 L80 190 L120 190 L140 220 Z" fill="#c9a26a" stroke="#6b5a42" stroke-width="2"/><path d="M310 222 L324 196 L356 196 L368 222 Z" fill="#c9a26a" stroke="#6b5a42" stroke-width="2"/>`),
  'montagne-grotte': d => cadre(d || DEFAUT,
    FOND('#2b3a5e', '#6b6a8a') + `<circle cx="320" cy="40" r="14" fill="#f3e9c9"/><circle cx="60" cy="30" r="2" fill="#fff"/><circle cx="120" cy="60" r="2" fill="#fff"/><circle cx="230" cy="24" r="2" fill="#fff"/>` + `<path d="M0 220 L120 120 L190 60 L240 100 L300 80 L400 200 L400 240 L0 240 Z" fill="#4a3a40"/><path d="M190 60 L240 100 L210 150 L170 110 Z" fill="#5a4a4a"/>` + `<path d="M175 170 Q200 120 225 170 L225 190 L175 190 Z" fill="#14110f"/>` + SOL('#3a2e2a')),
  'atelier': d => cadre(d || DEFAUT,
    FOND('#f6e2b8', '#eed39a') + SOL('#e6c88e') + `<ellipse cx="90" cy="190" rx="52" ry="40" fill="#a8906e" stroke="#6b5a42" stroke-width="2"/><rect x="70" y="190" width="40" height="22" fill="#2f2a28"/>` + [0, 1, 2, 3, 4].map(k => `<path d="M${190 + k * 40} 215 Q${180 + k * 40} 190 ${196 + k * 40} 172 L${206 + k * 40} 172 Q${222 + k * 40} 190 ${212 + k * 40} 215 Z" fill="${k % 2 ? '#b0643c' : '#a35a34'}" stroke="#6b3a1e" stroke-width="2"/>`).join('')),
  'marche': d => cadre(d || DEFAUT,
    FOND('#f6e2b8', '#eed39a') + SOL('#e6c88e') + [['#b5654a', 60], ['#c9a26a', 160], ['#46587a', 260], ['#a85a40', 350]].map(([c, x]) => `<path d="M${x - 40} 110 L${x + 40} 110 L${x + 46} 130 L${x - 46} 130 Z" fill="${c}" stroke="#5a3d22" stroke-width="2"/><rect x="${x - 38}" y="130" width="4" height="70" fill="#6b4a30"/><rect x="${x + 34}" y="130" width="4" height="70" fill="#6b4a30"/><rect x="${x - 34}" y="170" width="68" height="22" fill="#8a6440"/><ellipse cx="${x - 14}" cy="166" rx="9" ry="8" fill="#b0643c"/><ellipse cx="${x + 12}" cy="168" rx="10" ry="6" fill="#c9a26a"/>`).join('')),
  'campement': d => cadre(d || DEFAUT,
    FOND('#f6e2b8', '#eed39a') + SOL('#e6c88e') + TENTE(110, 200, '#b5654a') + TENTE(200, 205, '#c9a26a') + TENTE(290, 200, '#8a6440') + `<path d="M0 225 Q200 205 400 225" stroke="#9a7a52" stroke-width="6" fill="none" stroke-dasharray="14 10"/>`)
};
export const SCENES = Object.keys(DESSINS);
export function illustrationSvg(scene, description) { if (!DESSINS[scene]) throw new Error('scène inconnue : ' + scene); return DESSINS[scene](description); }
