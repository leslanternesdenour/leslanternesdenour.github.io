// JEU 3 — « LES CHIFFRES ET LES NOMBRES ARABES » : coque du jeu (âge, accueil illustré avec la grande porte, parcours en 8 étapes, ateliers libres, carnet des nombres, réglages).
// Réutilise : décor et mascotte Maktoub (commun/), voix et sous-titres (aventures/commun/voix-jeu.js), moteur d'activités à choix du Jeu 1, sauvegarde par enfant (clé « ecole_lecture »), référence linguistique unique.
import { creerVoix, reglerVolume } from '../../aventures/commun/voix-jeu.js?v=3';
import { mascotte } from '../../monde/mascottes.js?v=1';
import { contexte, sortie } from '../../monde/socle/audio.js?v=1';
import { montrerDecor } from '../commun/decor.js?v=3';
import { svgPorte, lanternes } from '../lettres/accueil-ui.js?v=3';
import { ETAPES, ecrire, FR } from './donnees/chiffres.js?v=3';
import { PHRASES, BRAVOS, ENCORES } from './donnees/audio.js?v=3';
import * as C from './moteur.js?v=3';
const $ = id => document.getElementById(id), lsGet = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }, lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
let s = C.lire(lsGet(C.CLE)); const sauver = () => lsSet(C.CLE, s);
const voix = creerVoix({ dossierAudio: 'audio/jeux/ecole-chiffres', racine: '../../', etat: () => s, elSousTitres: () => $('sous-titres') });
const rng = Math.random, pause = ms => new Promise(r => setTimeout(r, ms));
const ACT = () => import('./activites/chiffres-act.js?v=3');
const SALLE_DE = { presenter: 'lettres', compter: 'formes', lireChiffre: 'lettres', ecouter: 'sons', suite: 'defis', grands: 'biblio', calculer: 'defis', carnet: 'biblio' };
const NOMS = { presenter: 'Je découvre', compter: 'Je compte', lireChiffre: 'Je lis le chiffre', ecouter: "J'écoute le nombre", suite: 'Quel nombre vient après ?', grands: 'Les grands nombres', calculer: 'Les petits calculs', carnet: 'Mon carnet' };
const salle = nom => montrerDecor($('fond'), nom);
const IMG_MK = new URL('../commun/maktoub/', import.meta.url).href;
let poseCour = 'accueil', retourT = 0, joieJusqua = 0, dortT = 0, loumiT = 0;
function guide() { $('guide').innerHTML = `<div class="maktoub grand" id="mk"><div class="cadre"><img src="${IMG_MK}accueil.webp" alt="Maktoub, le livre compagnon"></div><span class="nom">Maktoub</span></div><div class="loumi cache">${mascotte('loumi') || ''}</div>`; ['pointerdown', 'keydown'].forEach(e => addEventListener(e, reveil, { passive: true })); reveil(); }
function pose(nom, ms = 0, force = false) { const img = $('guide').querySelector('img'); if (!img) return; if (!force && Date.now() < joieJusqua && nom !== 'celebration') return; clearTimeout(retourT); if (nom !== poseCour) { poseCour = nom; img.classList.add('entrant'); setTimeout(() => { img.src = IMG_MK + nom + '.webp'; img.classList.remove('entrant'); }, 170); } if (ms) retourT = setTimeout(() => pose('accueil', 0, true), ms); }
function reveil() { clearTimeout(dortT); if (poseCour === 'repos') pose('accueil', 0, true); dortT = setTimeout(() => pose('repos', 0, true), 90000); }
function reagir(type) { const mk = $('mk'); if (!mk) return; if (type === 'joie') { joieJusqua = Date.now() + 1900; pose('celebration', 2000, true); mk.classList.remove('saute'); void mk.offsetWidth; mk.classList.add('saute'); } else if (type === 'hum') pose('reflexion', 2000); }
function montrerLoumi() { const l = $('guide').querySelector('.loumi'); if (!l) return; l.classList.remove('cache'); pose('encouragement', 2600); clearTimeout(loumiT); loumiT = setTimeout(() => l.classList.add('cache'), 3500); }
function bip(freqs, ms = 130) { if (s.muet) return; try { const c = contexte(), out = sortie('effets'); if (!c || !out) return; let t = c.currentTime; for (const f of freqs) { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000); o.connect(g); g.connect(out); o.start(t); o.stop(t + ms / 1000 + 0.02); t += ms / 1000 * 0.85; } } catch (e) {} }
const son = quoi => (quoi === 'juste' ? bip([659, 880]) : quoi === 'faux' ? bip([262], 160) : bip([523, 659, 784, 1047], 140));
// ----- navigation -----
let arrets = [], cur = null, etapeTok = null, retourFn = null;
function stopAct() { if (cur) cur.mort = true; voix.arreter(); const a = arrets; arrets = []; a.forEach(f => { try { f(); } catch (e) {} }); }
function nav() { etapeTok = null; stopAct(); }
function nouveauContexte(zone) { const c = cur = { mort: false }; arrets = [];
  return { zone, s, phrases: PHRASES, bravos: BRAVOS, encores: ENCORES, get rng() { return rng; }, groupe: () => C.groupe(s), nbChoix: () => C.nbChoix(s), get aideAutoMs() { return C.aideAutoMs(s); }, vivant: () => !c.mort, surArret: f => arrets.push(f), sauver,
    parler: (id, texte, qui, opts) => { if (qui === 'Loumi') montrerLoumi(); else if (!/^bravo|^encore/.test(id)) pose('explication', 3200); return voix.parler(id, texte, qui, opts); }, a: id => voix.a(id), enregistrer: ev => { C.enregistrer(s, ev); sauver(); }, reagir, son }; }
const titre = t => { $('titre').textContent = t; };
const boutonRetour = fn => { retourFn = fn; $('btn-retour').classList.toggle('cache', !fn); };
$('btn-retour').onclick = () => { if (retourFn) { nav(); retourFn(); } };
function ecran(html) { stopAct(); $('ecran').innerHTML = html; $('ecran').scrollTop = 0; scrollTo(0, 0); }
// ----- accueil illustré : la grande porte -----
function accueil() {
  nav(); salle('cour'); pose('accueil', 0, true); titre('Les chiffres et les nombres'); boutonRetour(null);
  const r = C.recompenses(s), prochaine = C.prochaineEtape(s), commence = ETAPES.some(e => C.etapeFaite(s, e.id)) || Object.keys(s.items).length > 0, fait = ETAPES.map(e => C.etapeFaite(s, e.id));
  ecran(`<section class="accueil2"><div class="scene-porte"><button id="porte" class="porte-btn" aria-label="Commencer à compter">${svgPorte()}<span class="doigt" aria-hidden="true">👆</span></button>
    <button id="continuer" class="gros-commencer">${commence ? 'CONTINUER À COMPTER' : 'COMMENCER À COMPTER'}</button>
    <button id="progression" class="progres" aria-label="Mon carnet : ${r.lanternes} lanternes sur ${ETAPES.length}">${lanternes(fait)}<span class="pg-et">⭐ ${r.etoiles}</span><span class="pg-pc">${C.progressionGlobale(s)} %</span></button></div>
    <h2 class="titre-salles">Mes ateliers de nombres</h2><div class="salles ateliers-lecture">
      <button class="salle-carte e-parcours" data-go="chemin"><span class="badge" aria-hidden="true">🗺️</span><b>Le chemin</b></button><button class="salle-carte lect-syl" data-go="chiffres"><span class="badge" aria-hidden="true">🔢</span><span class="grand-ar ar-texte num" lang="ar" dir="ltr">٣ ٤ ٥</span><b>Les chiffres</b></button>
      <button class="salle-carte lect-mots" data-go="nombres"><span class="badge" aria-hidden="true">💯</span><span class="grand-ar ar-texte num" lang="ar" dir="ltr">١٢ ٢٣</span><b>Les nombres</b></button><button class="salle-carte lect-phr" data-go="calculs"><span class="badge" aria-hidden="true">➕</span><span class="grand-ar ar-texte num" lang="ar" dir="ltr">٢ + ٣</span><b>Les calculs</b></button>
      <button class="salle-carte lect-carnet" data-go="carnet"><span class="badge" aria-hidden="true">📚</span><b>Mon carnet</b></button></div></section>`);
  const aller = () => (prochaine ? etape(prochaine.id) : chemin()); $('porte').onclick = aller; $('continuer').onclick = aller; $('progression').onclick = () => lancer('carnet', {}, { retour: accueil, titre: 'Mon carnet' });
  document.querySelectorAll('[data-go]').forEach(b => { b.onclick = () => ({ chemin, chiffres: () => atelierLibre('chiffres'), nombres: () => atelierLibre('nombres'), calculs: () => atelierLibre('calculs'), carnet: () => lancer('carnet', {}, { retour: accueil, titre: 'Mon carnet' }) })[b.dataset.go](); });
  if (!accueil.dit) { accueil.dit = true; voix.parler('bienvenue', PHRASES.bienvenue.texte, 'Maktoub').then(() => { if (cur && !cur.mort && $('porte')) voix.parler('accueil_porte', PHRASES.accueil_porte.texte, 'Maktoub'); }); }
}
function atelierLibre(quoi) {
  nav(); salle('biblio'); const t = { chiffres: 'Les chiffres', nombres: 'Les nombres', calculs: 'Les calculs' }[quoi]; titre(t); boutonRetour(accueil);
  const lst = { chiffres: [['presenter', '🔢', 'Je découvre'], ['compter', '🧮', 'Je compte'], ['lireChiffre', '👀', 'Je lis le chiffre'], ['ecouter', '👂', "J'écoute"], ['suite', '➡️', 'Quel nombre après ?']], nombres: [['grands', '💯', 'Les grands nombres'], ['ecouter', '👂', 'De onze à vingt']], calculs: [['calculer', '➕', 'Les petits calculs']] }[quoi];
  ecran(`<section class="espace-page"><h2 class="titre-salle">${t}</h2><div class="activites">${lst.map(([a, ic, n]) => `<button class="activite" data-a="${a}" data-q="${quoi}"><span class="ic" aria-hidden="true">${ic}</span><b>${n}</b><span class="go" aria-hidden="true">▶</span></button>`).join('')}</div></section>`);
  voix.parler('salle_ateliers', PHRASES.salle_ateliers.texte, 'Maktoub'); document.querySelectorAll('.activite').forEach(b => { b.onclick = () => lancer(b.dataset.a, optsLibres(b.dataset.a, b.dataset.q, b.textContent), { retour: () => atelierLibre(quoi), titre: t }); });
}
const jusqua = n => Array.from({ length: n + 1 }, (_, i) => i);
function optsLibres(a, q, txt) { const g = C.groupe(s), max = g === 'g34' ? 5 : g === 'g56' ? 10 : 20; if (a === 'presenter') return { nombres: jusqua(max) }; if (a === 'ecouter' && q === 'nombres') return { nombres: Array.from({ length: 10 }, (_, i) => 11 + i), tours: 4 }; if (a === 'calculer') return { max: g === 'g34' ? 5 : g === 'g56' ? 10 : 20, tours: 4 }; if (a === 'suite') return { max, tours: 4 }; if (a === 'grands') return { tours: 4 }; return { nombres: jusqua(max), tours: 4 }; }
async function lancer(nom, opts, { retour, titre: t, sansBilan = false } = {}) {
  titre(t || NOMS[nom]); boutonRetour(retour || accueil); const zone = $('ecran'); stopAct(); salle(SALLE_DE[nom] || 'lettres'); zone.innerHTML = '<div class="chargement">✨</div>'; const ctx = nouveauContexte(zone);
  let res; try { if (nom === 'carnet') { await carnet(ctx); return null; } const mod = await ACT(); if (!ctx.vivant()) return null; res = await mod[nom](ctx, opts); } catch (e) { zone.innerHTML = '<p class="act-msg">Cette activité est momentanément indisponible.</p>'; return null; }
  sauver(); if (!ctx.vivant() || sansBilan) return res; return bilan(nom, opts, res, retour || accueil);
}
function bilan(nom, opts, res, retour) {
  if (!res || !res.tours) return (retour || accueil)(); const e = res.ok >= res.tours * 0.8 ? 3 : res.ok >= res.tours * 0.5 ? 2 : 1; son('fin'); reagir('joie'); const petit = C.groupe(s) !== 'g710';
  ecran(`<section class="bilan-act"><h2>${e === 3 ? 'Magnifique !' : e === 2 ? 'Très bien !' : 'Bravo !'}</h2><p class="etoiles grand-et" aria-hidden="true">${'⭐'.repeat(e)}${'☆'.repeat(3 - e)}</p>${petit ? '' : `<p>${res.ok} bonne${res.ok > 1 ? 's' : ''} réponse${res.ok > 1 ? 's' : ''} du premier coup sur ${res.tours}.</p>`}
    <div class="actions"><button id="b-encore" class="principal gros-b"><span aria-hidden="true">▶</span> Encore</button><button id="b-retour" class="secondaire gros-b"><span aria-hidden="true">↩</span> Retour</button></div></section>`);
  $('b-encore').onclick = () => lancer(nom, opts, { retour }); $('b-retour').onclick = () => retour(); voix.parler('bravo', e === 3 ? 'Magnifique !' : 'Très bien !', 'Maktoub');
}
// ----- carnet : tout ce qui est découvert / maîtrisé -----
async function carnet(ctx) {
  const { ar } = await ACT(); const etoiles = id => '★'.repeat(Math.min(3, C.stade(s, id))) + '☆'.repeat(3 - Math.min(3, C.stade(s, id))), r = C.recompenses(s), liste = [...Array(21).keys(), 30, 40, 50, 60, 70, 80, 90, 100];
  $('ecran').innerHTML = `<section class="carnet"><h2 class="titre-salle">📚 Mon carnet des nombres</h2><div class="palais-tete"><div class="jauge grand" aria-label="Progression"><i style="width:${C.progressionGlobale(s)}%"></i></div><p><b>${C.progressionGlobale(s)} %</b> du chemin · ⭐ ${r.etoiles} · 🏮 ${r.lanternes}/${ETAPES.length}</p></div>
    <div class="carnet-grille">${liste.map(n => `<span class="carte-carnet st${C.stade(s, 'nb.' + n)}"><span class="ar-texte num ar-gros" lang="ar" dir="ltr">${ecrire(n)}</span><em>${FR[n]}</em><i>${etoiles('nb.' + n)}</i></span>`).join('')}</div></section>`;
  void ar; await new Promise(fin => ctx.surArret(fin));
}
// ----- le chemin : 7 étapes -----
function chemin() {
  nav(); salle('cour'); titre('Le chemin'); boutonRetour(accueil); voix.parler('salle_etapes', PHRASES.salle_etapes.texte, 'Maktoub');
  ecran(`<section class="parcours"><h2 class="titre-salle"><span aria-hidden="true">🗺️</span> Le chemin des nombres</h2><div class="chemin">${ETAPES.map((e, i) => { const fait = C.etapeFaite(s, e.id), cur = !fait && (i === 0 || C.etapeFaite(s, ETAPES[i - 1].id));
    return `<button class="etape${fait ? ' fait' : ''}${cur ? ' courant' : ''}" data-e="${e.id}"><span class="num">${fait ? '🏮' : i + 1}</span><span class="nom">${e.icone} ${e.nom}</span><span class="et">${fait ? '⭐'.repeat((s.etapes[e.id] || {}).etoiles || 1) : ''}</span></button>`; }).join('')}</div></section>`);
  document.querySelectorAll('.etape').forEach(b => { b.onclick = () => etape(b.dataset.e); });
}
// scénarios : chaque étape apporte une nouveauté (présentation → atelier → lire → écouter…)
const T = n => (C.groupe(s) === 'g34' ? Math.max(2, n - 2) : n);
const SCENARIOS = {
  n1: () => [['presenter', { nombres: [0, 1, 2, 3] }], ['compter', { nombres: [1, 2, 3], tours: T(4) }], ['lireChiffre', { nombres: [1, 2, 3], tours: T(4) }], ['ecouter', { nombres: [0, 1, 2, 3], tours: T(4) }]],
  n2: () => [['presenter', { nombres: [4, 5] }], ['compter', { nombres: [1, 2, 3, 4, 5], tours: T(5) }], ['lireChiffre', { nombres: [1, 2, 3, 4, 5], tours: T(4) }], ['ecouter', { nombres: [1, 2, 3, 4, 5], tours: T(4) }]],
  n3: () => [['presenter', { nombres: [6, 7, 8, 9] }], ['compter', { nombres: [4, 5, 6, 7, 8, 9], tours: T(5) }], ['lireChiffre', { nombres: [5, 6, 7, 8, 9], tours: T(4) }], ['ecouter', { nombres: [5, 6, 7, 8, 9], tours: T(4) }]],
  n4: () => [['presenter', { nombres: [10] }], ['compter', { nombres: [6, 7, 8, 9, 10], tours: T(4) }], ['suite', { max: 10, tours: T(5) }], ['ecouter', { nombres: [7, 8, 9, 10], tours: T(4) }]],
  n5: () => [['presenter', { nombres: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20] }], ['ecouter', { nombres: [11, 12, 13, 14, 15], tours: T(4) }], ['suite', { max: 20, tours: T(4) }], ['ecouter', { nombres: [16, 17, 18, 19, 20], tours: T(4) }]],
  n6: () => [['presenter', { nombres: [30, 40, 50, 60, 70, 80, 90, 100] }], ['ecouter', { nombres: [30, 40, 50, 60], tours: T(4) }], ['ecouter', { nombres: [70, 80, 90, 100], tours: T(4) }]],
  n7: () => [['grands', { tours: T(5) }], ['grands', { tours: T(4) }]],
  n8: () => [['calculer', { max: 5, tours: T(4) }], ['calculer', { max: C.groupe(s) === 'g34' ? 5 : 10, tours: T(4) }], ['calculer', { max: C.groupe(s) === 'g710' ? 20 : 10, tours: T(3) }]]
};
async function etape(id) {
  const e = ETAPES.find(x => x.id === id), retour = chemin; nav(); const tok = etapeTok = {}, enCours = () => etapeTok === tok; salle(e.salle); titre(`${e.icone} ${e.nom}`); boutonRetour(retour); let aides = 0, erreurs = 0;
  ecran(`<section class="chap-intro"><div class="chap-ic">${e.icone}</div><h2 class="ar-nom-etape">${e.nom}</h2></section>`); await voix.parler(e.intro, PHRASES[e.intro].texte, 'Maktoub'); await pause(400); if (!enCours()) return;
  for (const [nom, o] of SCENARIOS[id]()) { if (!enCours()) return; const r = await lancer(nom, o, { retour, titre: `${e.icone} ${e.nom}`, sansBilan: true }); if (!enCours()) return; if (r) { aides += r.aides || 0; erreurs += r.ko || 0; } }
  if (!enCours()) return; const res = C.terminerEtape(s, id, { aides, erreurs }); sauver(); const suite = C.prochaineEtape(s), r = C.recompenses(s); son('fin'); reagir('joie'); salle('cour');
  ecran(`<section class="bilan-act chap-fin"><h2>🏮 Étape terminée !</h2><p class="etoiles grand-et" aria-hidden="true">${'⭐'.repeat(res.etoiles)}${'☆'.repeat(3 - res.etoiles)}</p>${res.premiere ? '<p class="gain">🏮 Une nouvelle lanterne s\'allume !</p>' : ''}${r.diplome ? '<p class="gain">🎓 Diplôme de petit lecteur !</p>' : ''}
    <div class="actions">${suite ? `<button id="suite" class="principal gros-b">${suite.icone} ${suite.nom} ▶</button>` : ''}<button id="acc" class="secondaire gros-b">🏠 Accueil</button></div></section>`);
  if (suite) $('suite').onclick = () => etape(suite.id); $('acc').onclick = accueil; voix.parler('fin_etape', PHRASES.fin_etape.texte, 'Maktoub');
}
// ----- âge -----
function ecranAge(retour = null) {
  nav(); salle('cour'); titre('Quel âge as-tu ?'); boutonRetour(retour); const p = lsGet('ldn_profil_actif'), suggere = p && p.tranche === '3-5' ? [3, 4, 5] : p && p.tranche === '6-10' ? [6, 7, 8, 9, 10] : [];
  ecran(`<section class="age"><h2>Quel âge as-tu ?</h2><div class="grille-age">${[3, 4, 5, 6, 7, 8, 9, 10].map(n => `<button class="btn-age${suggere.includes(n) ? ' sugg' : ''}" data-n="${n}"><b>${n}</b><span>ans</span></button>`).join('')}</div></section>`);
  voix.parler('age', PHRASES.age.texte, 'Maktoub'); document.querySelectorAll('.btn-age').forEach(b => { b.onclick = () => { C.reglerAge(s, b.dataset.n); sauver(); accueil(); }; });
}
// ----- réglages -----
$('btn-reglages').onclick = () => { $('st-case').checked = s.sousTitres; $('muet-case').checked = s.muet; $('reglages').classList.toggle('cache'); }; $('reglages-fermer').onclick = () => $('reglages').classList.add('cache');
$('st-case').onchange = e => { s.sousTitres = e.target.checked; sauver(); }; $('muet-case').onchange = e => { s.muet = e.target.checked; sauver(); if (s.muet) voix.arreter(); majSon(); };
function majSon() { $('btn-son').textContent = s.muet ? '🔇' : '🔊'; $('btn-son').setAttribute('aria-label', s.muet ? 'Son : coupé' : 'Son : activé'); }
$('btn-son').onclick = () => { s.muet = !s.muet; sauver(); if (s.muet) voix.arreter(); $('muet-case').checked = s.muet; majSon(); };
$('volume').oninput = e => { const v = Number(e.target.value); try { reglerVolume('voix', v); const m = lsGet('monde') || {}; m.sons = Object.assign({ musique: 0.5, musiqueActive: true, voix: 1, effets: 0.7 }, m.sons, { voix: v }); lsSet('monde', m); } catch (er) {} };
{ const m = lsGet('monde'); if (m && m.sons && typeof m.sons.voix === 'number') { $('volume').value = m.sons.voix; try { reglerVolume('voix', m.sons.voix); } catch (e) {} } }
$('changer-age').onclick = () => { $('reglages').classList.add('cache'); ecranAge(accueil); };
(async () => { salle('cour'); guide(); majSon(); await voix.charger(); if (!s.groupe) ecranAge(); else accueil(); })();
window.__chiffres = { etat: () => s, C, lancer, etape, accueil, chemin, ecranAge, atelierLibre, arreter: nav, voix: () => [...voix.dispo] };
