// Le panneau d'une histoire (آثار الأنبياء) : image symbolique → récit (chaque phrase porte son origine) → activité douce → questions → carnet.
// On peut TOUJOURS fermer et reprendre plus tard (la progression est gardée). Aucun chronomètre, aucune voix générée : le bouton Écouter attend la validation humaine.
import { recit, ORIGINES, STATUT } from './recits-a-valider.js';
import { illustrationSvg } from './recits-illustrations.js';
import { questionsPour, etatRecit, ouvrirRecit, avancer, repondre, ajouterAuCarnet } from './recits-route.js';

const CSS = `#recit-panneau{position:fixed;inset:0;z-index:80;background:rgba(40,28,16,.72);display:flex;align-items:center;justify-content:center;padding:10px;font-family:inherit}
#recit-panneau .carte{background:#fff8e6;color:#3a2a1a;border-radius:18px;max-width:600px;width:100%;max-height:96vh;overflow:auto;padding:14px 16px;position:relative;box-shadow:0 10px 40px rgba(0,0,0,.4)}
#recit-panneau h2{margin:0 36px 4px 0;font-size:clamp(18px,4.5vw,24px)} #recit-panneau .valider{display:inline-block;background:#f5b942;color:#4a2f00;border-radius:999px;padding:2px 10px;font-size:12px;font-weight:700}
#recit-panneau .fermer{position:absolute;top:8px;right:8px;min-width:44px;min-height:44px;border:0;border-radius:12px;background:#e9dcc0;font-size:20px;cursor:pointer}
#recit-panneau svg{width:100%;height:auto;border-radius:12px;display:block;margin:8px 0}
#recit-panneau .enonce{margin:8px 0;padding:8px 10px;background:#fff;border-radius:12px;border-left:5px solid #c9a14a;font-size:clamp(15px,3.6vw,18px);line-height:1.4}
#recit-panneau .tag{display:inline-block;font-size:12px;font-weight:700;background:#f1e4c4;border-radius:999px;padding:1px 8px;margin-bottom:3px}
#recit-panneau .certitude{display:block;font-size:12px;color:#7a6a52;margin-top:3px}
#recit-panneau .bas{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;align-items:center}
#recit-panneau button.gros{min-height:48px;padding:8px 16px;border:0;border-radius:14px;background:#3fbf7f;color:#fff;font-weight:700;font-size:16px;cursor:pointer}
#recit-panneau button.petit{min-height:44px;padding:6px 12px;border:2px solid #d8c8a0;border-radius:12px;background:#fff;color:#3a2a1a;font-size:15px;cursor:pointer}
#recit-panneau button.choix{display:block;width:100%;text-align:left;margin:6px 0} #recit-panneau button.juste{background:#d9f3e3;border-color:#3fbf7f} #recit-panneau button.doux{background:#fdf0d5;border-color:#f5b942}
#recit-panneau .eau{animation:rr-onde 3s ease-in-out infinite;transform-origin:center} #recit-panneau .jet{animation:rr-jet 2.6s ease-in-out infinite;transform-origin:bottom center}
@keyframes rr-jet{0%,100%{transform:scaleY(.55);opacity:.7}50%{transform:scaleY(1);opacity:1}} @keyframes rr-onde{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
@media (prefers-reduced-motion:reduce){#recit-panneau .eau,#recit-panneau .jet{animation:none}}`;

export function creerRecitUI({ route, age, surCarnet, surFermer, surChange }) {
  let el = null, cible = null, etape = 0;
  const A = () => age();   // '3-5' ou '6-10'
  function monter() {
    if (document.getElementById('recit-style') == null) { const s = document.createElement('style'); s.id = 'recit-style'; s.textContent = CSS; document.head.appendChild(s); }
    el = document.createElement('div'); el.id = 'recit-panneau'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); document.body.appendChild(el);
    el.addEventListener('keydown', ev => { if (ev.key === 'Escape') fermer(); });
  }
  const tag = o => `<span class="tag">${ORIGINES[o].icone} ${ORIGINES[o].nom}</span>`;
  function etapes(r) {
    const e = ['image', 'recit'];
    if (r.activite) e.push('activite');
    if (questionsPour(r.id, A()).length) e.push('questions');
    e.push('fin');
    return e;
  }
  function dessiner() {
    const r = recit(cible), liste = etapes(r), nom = liste[Math.min(etape, liste.length - 1)], grand = A() !== '3-5';
    const tete = `<h2>${r.titre}</h2><span class="valider" title="À VALIDER par une personne compétente en sciences islamiques">⚠️ ${STATUT}</span> <small>${r.periode}</small>`;
    let corps = '';
    if (nom === 'image') corps = `${illustrationSvg(r.illustration.scene, r.illustration.description)}<p><button class="petit" disabled title="Disponible après validation">🔊 Écouter — Disponible après validation du texte</button></p>`;
    else if (nom === 'recit') corps = r.enonces.map(x => `<div class="enonce">${tag(x.origine)}<div>${grand ? x.grand : x.petit}</div>${grand ? `<span class="certitude">${ORIGINES[x.origine].certitude}</span>` : ''}</div>`).join('');
    else if (nom === 'activite') corps = `<p><b>${grand ? r.activite.consigne_grand : r.activite.consigne_petit}</b></p><div id="rr-act"></div>`;
    else if (nom === 'questions') corps = `<div id="rr-q"></div>`;
    else corps = `${illustrationSvg(r.illustration.scene, r.illustration.description)}<p>${grand ? 'Sources : ' + r.sources.map(s => s.ref ? `${ORIGINES[s.type].nom} : ${s.ref} (à vérifier)` : (s.indication || 'Référence à vérifier')).join(' · ') : 'Tu peux garder cette histoire dans ton carnet.'}</p>`;
    const suiv = nom === 'fin' ? '' : `<button class="gros" id="rr-suiv">Suivant ▶</button>`, prec = etape > 0 ? `<button class="petit" id="rr-prec">◀ Retour</button>` : '';
    const carnet = nom === 'fin' ? `<button class="gros" id="rr-carnet">📖 ${etatRecit(route, cible) && etatRecit(route, cible).carnet ? 'Dans mon carnet ✓' : 'Ajouter à mon carnet'}</button>` : '';
    el.innerHTML = `<div class="carte"><button class="fermer" aria-label="Fermer">✕</button>${tete}${corps}<div class="bas">${prec}${suiv}${carnet}<button class="petit" id="rr-plus-tard">Fermer, je reprendrai plus tard</button></div></div>`;
    el.querySelector('.fermer').onclick = fermer; el.querySelector('#rr-plus-tard').onclick = fermer;
    const sv = el.querySelector('#rr-suiv'); if (sv) sv.onclick = () => { etape++; avancer(route, cible, etape); surChange && surChange(); dessiner(); };
    const pv = el.querySelector('#rr-prec'); if (pv) pv.onclick = () => { etape--; dessiner(); };
    if (nom === 'activite') activite(r);
    if (nom === 'questions') questions(r);
    const cb = el.querySelector('#rr-carnet'); if (cb) cb.onclick = () => { const neuf = ajouterAuCarnet(route, cible); surChange && surChange(); if (neuf && surCarnet) surCarnet(cible); dessiner(); };
  }
  // activité « remets dans l'ordre » : douce, sans chronomètre ; une erreur n'est jamais une punition
  function activite(r) {
    const zone = el.querySelector('#rr-act'), vrai = r.activite.etapes, melange = vrai.map((t, i) => ({ t, i })).sort((a, b) => ((a.i * 7 + 3) % vrai.length) - ((b.i * 7 + 3) % vrai.length));
    let prochain = 0; const fait = []; const ee = etatRecit(route, cible);
    const rendre = () => { zone.innerHTML = `<p>${fait.map((t, k) => `${k + 1}. ${t}`).join('<br>') || '…'}</p>` + (prochain < vrai.length ? melange.filter(m => m.i >= prochain).map(m => `<button class="petit choix" data-i="${m.i}">${m.t}</button>`).join('') : '<p><b>🌟 Bravo, tout est dans l\'ordre !</b></p>');
      zone.querySelectorAll('button').forEach(b => b.onclick = () => { const i = +b.dataset.i; if (i === prochain) { fait.push(vrai[i]); prochain++; if (prochain === vrai.length) { ouvrirRecit(route, cible).activite = true; surChange && surChange(); } } else { b.classList.add('doux'); b.textContent += ' — essaie encore doucement'; } rendre(); }); };
    if (ee && ee.activite) { fait.push(...vrai); prochain = vrai.length; }
    rendre();
  }
  function questions(r) {
    const zone = el.querySelector('#rr-q'), liste = questionsPour(r.id, A());
    zone.innerHTML = liste.map(q => `<div class="enonce"><b>${q.texte}</b>${q.choix.map((c, i) => `<button class="petit choix" data-q="${q.id}" data-i="${i}">${c}</button>`).join('')}</div>`).join('');
    zone.querySelectorAll('button').forEach(b => b.onclick = () => { const res = repondre(route, cible, b.dataset.q, +b.dataset.i); surChange && surChange();
      if (res.juste) { b.classList.add('juste'); b.textContent += ' ✓'; } else { b.classList.add('doux'); b.textContent += ' — pas tout à fait, essaie encore'; } });
    liste.forEach(q => { const e = etatRecit(route, cible); if (e && e.reponses[q.id] !== undefined) { const b = zone.querySelector(`button[data-q="${q.id}"][data-i="${e.reponses[q.id]}"]`); if (b) { b.classList.add('juste'); } } });
  }
  function ouvrir(id) { cible = id; const e = ouvrirRecit(route, id); etape = Math.min(e.etape, etapes(recit(id)).length - 1); if (!el) monter(); el.style.display = 'flex'; dessiner(); el.querySelector('.fermer').focus(); }
  function fermer() { if (el) el.style.display = 'none'; surFermer && surFermer(cible); cible = null; }
  return { ouvrir, fermer, ouverte: () => !!(el && el.style.display !== 'none' && cible) };
}
