// L'ÉCOLE DES LETTRES ARABES — coque du jeu : âge, évaluation initiale, accueil illustré (les 6 espaces), parcours en 8 chapitres, réglages.
// Les activités sont des modules indépendants (activites/*.js) qui partagent un seul moteur pédagogique (moteur/competences.js) : suivi réel de la maîtrise, adaptation dynamique, révision ciblée.
// Réutilise : profils enfants (âge/tranche), sauvegarde synchronisée par l'Espace famille (clé « ecole_lettres »), voix du socle, mascottes de l'univers Nour (2D). Aucun chronomètre, aucune punition.
import { creerVoix, reglerVolume } from '../../aventures/commun/voix-jeu.js?v=2';
import { mascotte } from '../../monde/mascottes.js?v=1';
import { contexte, sortie } from '../../monde/socle/audio.js?v=1';
import { montrerDecor } from '../commun/decor.js?v=2';
import { chargerGlyphes, svgLettre } from './rendu.js?v=2';
import { LETTRES, PAR_ID, CHAPITRES, ESPACES, ACTIVITES, GROUPES, groupeDepuisAge } from './donnees/lettres.js?v=2';
import { PHRASES } from './donnees/audio.js?v=2';
import * as C from './moteur/competences.js?v=2';
const $ = id => document.getElementById(id), lsGet = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }, lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
let s = C.lire(lsGet(C.CLE)); const sauver = () => lsSet(C.CLE, s);
const voix = creerVoix({ dossierAudio: 'audio/jeux/ecole-lettres', racine: '../../', etat: () => s, elSousTitres: () => $('sous-titres') });
const rng = Math.random, pause = ms => new Promise(r => setTimeout(r, ms));
const MODULES = { decouvrir: () => import('./activites/decouvrir.js?v=2'), chasse: () => import('./activites/chasse.js?v=2'), formes: () => import('./activites/formes.js?v=2'), trace: () => import('./activites/trace.js?v=2'), puzzle: () => import('./activites/puzzle.js?v=2'),
  son: () => import('./activites/son.js?v=2'), 'parcours-sons': () => import('./activites/parcours-sons.js?v=2'), jumelles: () => import('./activites/jumelles.js?v=2'), intrus: () => import('./activites/intrus.js?v=2'), defi: () => import('./activites/defi.js?v=2'), collection: () => import('./activites/collection.js?v=2') };

// ---------- décor 2D, mascottes, sons ----------
// ----- décor (6 salles, partagé avec toute l'école) et Maktoub, la mascotte -----
const SALLE_DE = { decouvrir: 'lettres', chasse: 'lettres', formes: 'formes', trace: 'formes', puzzle: 'formes', son: 'sons', 'parcours-sons': 'sons', jumelles: 'defis', intrus: 'defis', defi: 'defis', collection: 'biblio' };
const SALLE_ESPACE = { jardin: 'lettres', atelier: 'formes', galerie: 'sons', defis: 'defis', palais: 'biblio', parcours: 'cour' };
const salle = nom => montrerDecor($('fond'), nom);
const IMG_MK = new URL('../commun/maktoub/', import.meta.url).href;
let poseCour = 'accueil', retourT = 0, loumiT = 0, joieJusqua = 0, dortT = 0;
function guide() { $('guide').innerHTML = `<div class="maktoub grand" id="mk"><div class="cadre"><img src="${IMG_MK}accueil.webp" alt="Maktoub, le livre compagnon"></div><span class="nom">Maktoub</span></div><div class="loumi cache">${mascotte('loumi') || ''}</div>`; ['pointerdown', 'keydown'].forEach(e => addEventListener(e, reveil, { passive: true })); reveil(); }
function pose(nom, ms = 0, force = false) { const img = $('guide').querySelector('img'); if (!img) return; if (!force && Date.now() < joieJusqua && nom !== 'celebration') return; clearTimeout(retourT);
  if (nom !== poseCour) { poseCour = nom; img.classList.add('entrant'); setTimeout(() => { img.src = IMG_MK + nom + '.webp'; img.classList.remove('entrant'); }, 170); } if (ms) retourT = setTimeout(() => pose('accueil', 0, true), ms); }
function reveil() { clearTimeout(dortT); if (poseCour === 'repos') pose('accueil', 0, true); dortT = setTimeout(() => pose('repos', 0, true), 90000); }
function reagir(type) { const mk = $('mk'); if (!mk) return; if (type === 'joie') { joieJusqua = Date.now() + 1900; pose('celebration', 2000, true); mk.classList.remove('saute'); void mk.offsetWidth; mk.classList.add('saute'); } else if (type === 'hum') pose('reflexion', 2000); }
function montrerLoumi() { const l = $('guide').querySelector('.loumi'); if (!l) return; l.classList.remove('cache'); pose('encouragement', 2600); clearTimeout(loumiT); loumiT = setTimeout(() => l.classList.add('cache'), 3500); }
function bip(freqs, ms = 130) { if (s.muet) return; try { const c = contexte(); const sortieE = sortie('effets'); if (!c || !sortieE) return; let t = c.currentTime; for (const f of freqs) { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000); o.connect(g); g.connect(sortieE); o.start(t); o.stop(t + ms / 1000 + 0.02); t += ms / 1000 * 0.85; } } catch (e) {} }
const son = quoi => (quoi === 'juste' ? bip([659, 880]) : quoi === 'faux' ? bip([262], 160) : bip([523, 659, 784, 1047], 140));

// ---------- navigation et contexte des activités ----------
let arrets = [], cur = null, chapTok = null, retourFn = null;
// stopAct : arrête l'activité en cours (jamais le chapitre) ; nav : on quitte le parcours en cours
function stopAct() { if (cur) cur.mort = true; voix.arreter(); const a = arrets; arrets = []; a.forEach(f => { try { f(); } catch (e) {} }); }
function nav() { chapTok = null; stopAct(); }
function nouveauContexte(zone) {
  const c = cur = { mort: false }; arrets = [];
  return { zone, s, get rng() { return rng; }, groupe: () => C.groupe(s), nbChoix: () => C.nbChoix(s), get aideAutoMs() { return C.aideAutoMs(s); }, vivant: () => !c.mort, surArret: f => arrets.push(f), sauver,
    parler: (id, texte, qui, opts) => { if (qui === 'Loumi') montrerLoumi(); else if (!/^bravo|^encore/.test(id)) pose('explication', 3200); return voix.parler(id, texte, qui, opts); }, a: id => voix.a(id), enregistrer: ev => { C.enregistrer(s, ev); sauver(); }, reagir, son };
}
function titre(t) { $('titre').textContent = t; }
function boutonRetour(fn) { retourFn = fn; $('btn-retour').classList.toggle('cache', !fn); }
$('btn-retour').onclick = () => { if (retourFn) { nav(); retourFn(); } };
function ecran(html) { stopAct(); $('ecran').innerHTML = html; $('ecran').scrollTop = 0; scrollTo(0, 0); }

// ---------- accueil : les 6 espaces ----------
const lettresPourReviser = () => { const i = Math.max(0, CHAPITRES.findIndex(c => !C.chapitreFait(s, c.id))); let d = C.disponibles(s, i < 0 ? 0 : i); if (d.length < 2) d = CHAPITRES[0].lettres; return d; };
function accueil() {
  nav(); salle('cour'); pose('accueil', 0, true); titre("L'École des lettres arabes"); boutonRetour(null); const r = C.recompenses(s), prochain = C.prochainChapitre(s);
  ecran(`<section class="accueil"><div class="tete-accueil"><img class="panneau-mk" src="${IMG_MK}panneau.webp" alt="Maktoub, le livre compagnon de ton école arabe"><p class="bilan" aria-live="polite">⭐ ${r.etoiles} &nbsp;·&nbsp; 🏮 ${r.lanternes}/8 &nbsp;·&nbsp; ${C.progressionGlobale(s)} % du chemin</p>
    <button id="continuer" class="continuer">${prochain ? (C.decouvertes(s).length ? '▶ Continuer : ' : '▶ Commencer : ') + prochain.icone + ' ' + prochain.nom : '🏆 Rejouer un chapitre'}</button></div>
    <div class="espaces">${Object.entries(ESPACES).map(([id, e]) => `<button class="espace e-${id}" data-e="${id}"><span class="ic" aria-hidden="true">${e.icone}</span><b>${e.nom}</b><small>${e.texte}</small></button>`).join('')}</div></section>`);
  $('continuer').onclick = () => parcours(prochain ? prochain.id : null); document.querySelectorAll('.espace').forEach(b => { b.onclick = () => espace(b.dataset.e); });
  if (!accueil.dit) { accueil.dit = true; voix.parler('bienvenue', PHRASES.bienvenue.texte, 'Maktoub'); }
}
function espace(id) {
  const e = ESPACES[id]; if (id === 'parcours') return parcours(null, true); if (id === 'palais') return lancer('collection', {}, { retour: accueil, titre: e.nom });
  nav(); salle(SALLE_ESPACE[id]); titre(e.nom); boutonRetour(accueil); const pool = lettresPourReviser();
  ecran(`<section class="espace-page e-${id}"><p class="espace-texte">${e.texte}</p><div class="activites">${e.activites.map(a => `<button class="activite" data-a="${a}"><span class="ic">${ACTIVITES[a].icone}</span><b>${ACTIVITES[a].nom}</b></button>`).join('')}</div>
    ${id === 'jardin' ? `<p class="note-pool">Lettres du jeu : ${pool.map(i => PAR_ID[i].ar).join(' ')}</p>` : ''}</section>`);
  document.querySelectorAll('.activite').forEach(b => { b.onclick = () => lancer(b.dataset.a, optsPour(b.dataset.a, pool), { retour: () => espace(id), titre: e.nom }); });
}
function optsPour(a, pool) {
  if (a === 'decouvrir') { const c = CHAPITRES.find(c => !C.chapitreFait(s, c.id)) || CHAPITRES[0]; return { lettres: c.lettres, tout: false }; }
  if (a === 'trace') return { lettres: pool.slice(-Math.min(3, pool.length)), tours: Math.min(3, pool.length) };
  return { lettres: pool };
}
// lance une activité puis affiche un petit bilan ; opts.retour : où revenir
async function lancer(nom, opts, { retour, titre: t, sansBilan = false } = {}) {
  titre(t || ACTIVITES[nom].nom); boutonRetour(retour || accueil); const zone = $('ecran'); stopAct(); salle(SALLE_DE[nom] || 'lettres'); zone.innerHTML = '<div class="chargement">✨</div>'; const ctx = nouveauContexte(zone);
  let mod; try { mod = await MODULES[nom](); } catch (e) { zone.innerHTML = '<p class="act-msg">Cette activité est momentanément indisponible.</p>'; return null; }
  if (!ctx.vivant()) return null; const res = await mod.default(ctx, opts); sauver(); if (!ctx.vivant() || sansBilan || nom === 'collection') return res; return bilan(nom, opts, res, retour || accueil);
}
function bilan(nom, opts, res, retour) {
  if (!res || !res.tours) { return (retour || accueil)(); }
  const e = res.ok >= res.tours * 0.8 ? 3 : res.ok >= res.tours * 0.5 ? 2 : 1; son('fin'); reagir('joie');
  ecran(`<section class="bilan-act"><h2>${e === 3 ? 'Magnifique !' : e === 2 ? 'Très bien !' : 'Bravo, tu as continué !'}</h2><p class="etoiles" aria-hidden="true">${'⭐'.repeat(e)}${'☆'.repeat(3 - e)}</p><p>${res.ok} bonne${res.ok > 1 ? 's' : ''} réponse${res.ok > 1 ? 's' : ''} du premier coup sur ${res.tours}. Chaque essai t'aide à apprendre !</p>
    <div class="actions"><button id="b-encore" class="principal">Encore ›</button><button id="b-retour" class="secondaire">Retour</button></div></section>`);
  $('b-encore').onclick = () => lancer(nom, opts, { retour }); $('b-retour').onclick = () => retour();
  voix.parler('bravo', e === 3 ? 'Magnifique !' : 'Très bien !', 'Maktoub');
}

// ---------- parcours en 8 chapitres ----------
const SCENARIOS = {
  c1: [['decouvrir', { tout: true }], ['chasse', { tours: 2 }], ['trace', {}], ['son', { tours: 2 }]], c2: [['decouvrir', { tout: true }], ['chasse', { tours: 2 }], ['jumelles', { tours: 2 }], ['trace', {}]],
  c3: [['decouvrir', { tout: true }], ['jumelles', { tours: 3 }], ['formes', { tours: 2 }], ['trace', {}]], c4: [['decouvrir', { tout: true }], ['formes', { tours: 2 }], ['puzzle', { tours: 1 }], ['chasse', { tours: 2 }]],
  c5: [['decouvrir', { tout: true }], ['son', { tours: 3 }], ['jumelles', { tours: 2 }], ['puzzle', { tours: 1 }]], c6: [['decouvrir', { tout: true }], ['intrus', { tours: 3 }], ['trace', {}], ['son', { tours: 2 }]],
  c7: [['decouvrir', { tout: true }], ['parcours-sons', { tours: 2 }], ['formes', { tours: 2 }], ['jumelles', { tours: 2 }]], c8: [['decouvrir', { tout: true }], ['defi', {}], ['trace', {}]]
};
function parcours(chapId, choisir = false) {
  if (!choisir && chapId) return chapitre(chapId);
  nav(); salle('cour'); titre('Le Parcours des découvertes'); boutonRetour(accueil);
  ecran(`<section class="parcours"><p class="espace-texte">Huit chapitres pour apprendre les 28 lettres, à ton rythme. Tu peux choisir celui que tu veux.</p><div class="chemin">${CHAPITRES.map((c, i) => { const fait = C.chapitreFait(s, c.id), cur = !fait && (i === 0 || C.chapitreFait(s, CHAPITRES[i - 1].id));
    return `<button class="etape${fait ? ' fait' : ''}${cur ? ' courant' : ''}" data-c="${c.id}"><span class="num">${fait ? '🏮' : i + 1}</span><span class="nom">${c.icone} ${c.nom}<small>${c.lettres.map(id => PAR_ID[id].ar).join(' ')}</small></span><span class="et">${fait ? '⭐'.repeat((s.chapitres[c.id] || {}).etoiles || 1) : ''}</span></button>`; }).join('')}</div></section>`);
  document.querySelectorAll('.etape').forEach(b => { b.onclick = () => chapitre(b.dataset.c); });
}
async function chapitre(id) {
  const idx = C.chapitreIdx(id), c = CHAPITRES[idx], etapes = SCENARIOS[id], retour = () => parcours(null, true); nav(); salle('lettres'); const tok = chapTok = {}, enCours = () => chapTok === tok; titre(`${c.icone} ${c.nom}`); boutonRetour(retour);
  const pool = (() => { let d = C.disponibles(s, idx); return d.length ? d : c.lettres; })(); let aides = 0, erreurs = 0, ok = 0;
  ecran(`<section class="chap-intro"><div class="chap-ic">${c.icone}</div><h2>${c.nom}</h2><p class="chap-lettres">${c.lettres.map(l => `<span>${svgLettre(l, { classe: 'mini' })}</span>`).join('')}</p><p>${c.intro}</p></section>`);
  const fin = voix.parler(`chap.${id}`, c.intro, 'Maktoub'); await fin; await pause(600); if (!enCours()) return;   for (const [nom, o] of etapes) { if (!enCours()) return; const opts = { ...o }; if (nom === 'decouvrir') opts.lettres = c.lettres; else if (nom === 'trace') { opts.lettres = c.lettres; opts.tours = c.lettres.length; } else opts.lettres = pool;
    const r = await lancer(nom, opts, { retour, titre: `${c.icone} ${c.nom}`, sansBilan: true }); if (!enCours()) return; if (r) { aides += r.aides || 0; erreurs += r.ko || 0; ok += r.ok || 0; } }
  if (!enCours()) return; const res = C.terminerChapitre(s, id, { aides, erreurs }); sauver(); const suite = C.prochainChapitre(s), r = C.recompenses(s); son('fin'); reagir('joie');
  const dip = r.diplomes.includes('maitre') ? 'diplome_maitre' : r.diplomes.includes('explorateur') ? 'diplome_explorateur' : null;
  ecran(`<section class="bilan-act chap-fin"><h2>🏮 Chapitre terminé !</h2><p class="etoiles" aria-hidden="true">${'⭐'.repeat(res.etoiles)}${'☆'.repeat(3 - res.etoiles)}</p><p>${c.nom} : ${c.lettres.map(l => PAR_ID[l].ar).join(' ')}</p>${res.premiere ? '<p class="gain">🏮 Une nouvelle lanterne s\'allume !</p>' : ''}${dip ? `<p class="gain">${dip === 'diplome_maitre' ? '🏆 Maître des lettres' : '🎓 Explorateur des lettres'} !</p>` : ''}
    <div class="actions">${suite ? `<button id="suite" class="principal">${suite.icone} ${suite.nom} ›</button>` : ''}<button id="palais" class="secondaire">📚 Ma bibliothèque</button><button id="acc" class="secondaire">Accueil</button></div></section>`);
  if (suite) $('suite').onclick = () => chapitre(suite.id); $('palais').onclick = () => lancer('collection', {}, { retour: accueil, titre: 'La bibliothèque de Nour' }); $('acc').onclick = accueil;
  voix.parler(dip || 'fin_chapitre', dip ? PHRASES[dip].texte : PHRASES.fin_chapitre.texte, 'Maktoub');
}

// ---------- âge et évaluation initiale ----------
function ecranAge(retour = null) {
  nav(); salle('cour'); titre('Quel âge as-tu ?'); boutonRetour(retour); const p = lsGet('ldn_profil_actif'), suggere = p && p.tranche === '3-5' ? [3, 4, 5] : p && p.tranche === '6-10' ? [6, 7, 8, 9, 10] : [];
  ecran(`<section class="age"><h2>Quel âge as-tu ?</h2><p>Touche ton âge. Tu pourras changer quand tu veux, et tu pourras toujours jouer à ton niveau.</p><div class="grille-age">${[3, 4, 5, 6, 7, 8, 9, 10].map(n => `<button class="btn-age${suggere.includes(n) ? ' sugg' : ''}" data-n="${n}"><b>${n}</b><span>ans</span></button>`).join('')}</div></section>`);
  voix.parler('age', PHRASES.age.texte, 'Maktoub'); document.querySelectorAll('.btn-age').forEach(b => { b.onclick = () => { C.reglerAge(s, b.dataset.n); sauver(); if (s.groupe !== 'g34' && !s.placement) placement(); else accueil(); }; });
}
async function placement() {
  nav(); salle('lettres'); titre('Un petit jeu pour commencer'); boutonRetour(null); const reps = []; const qs = C.QUESTIONS_PLACEMENT; let i = 0;
  await voix.parler('placement', PHRASES.placement.texte, 'Maktoub');
  const poser = () => { if (i >= qs.length) { C.resultatPlacement(s, reps); sauver(); voix.parler('placement_fin', PHRASES.placement_fin.texte, 'Maktoub'); return accueil(); } const id = qs[i], autres = LETTRES.filter(l => l.id !== id && l.famille !== PAR_ID[id].famille).sort(() => rng() - 0.5).slice(0, 2).map(l => l.id), ids = [id, ...autres].sort(() => rng() - 0.5);
    ecran(`<section class="placement"><p class="point-placement">Question ${i + 1} sur ${qs.length}</p><div class="grande-lettre">${svgLettre(id, { classe: 'grand' })}</div><h2>Quelle est cette lettre ?</h2><div class="noms">${ids.map(x => `<button class="nom-btn" data-id="${x}">${PAR_ID[x].nomFr}</button>`).join('')}<button class="nom-btn peut-etre" data-id="?">Je ne sais pas encore</button></div><button id="passer" class="secondaire">Passer le petit jeu ›</button></section>`);
    voix.parler('placement_q', PHRASES.placement_q.texte, 'Maktoub'); document.querySelectorAll('.nom-btn').forEach(b => { b.onclick = () => { reps.push({ lettre: id, ok: b.dataset.id === id }); i++; poser(); }; }); $('passer').onclick = () => { for (; i < qs.length; i++) reps.push({ lettre: qs[i], ok: false }); poser(); }; };
  poser();
}

// ---------- réglages ----------
function reglages() {
  $('st-case').checked = s.sousTitres; $('muet-case').checked = s.muet; $('reglages').classList.toggle('cache');
}
$('btn-reglages').onclick = reglages; $('reglages-fermer').onclick = () => $('reglages').classList.add('cache');
$('st-case').onchange = e => { s.sousTitres = e.target.checked; sauver(); };
$('muet-case').onchange = e => { s.muet = e.target.checked; sauver(); if (s.muet) voix.arreter(); majSon(); };
function majSon() { $('btn-son').textContent = s.muet ? '🔇' : '🔊'; $('btn-son').setAttribute('aria-label', s.muet ? 'Son : coupé' : 'Son : activé'); }
$('btn-son').onclick = () => { s.muet = !s.muet; sauver(); if (s.muet) voix.arreter(); $('muet-case').checked = s.muet; majSon(); };
$('volume').oninput = e => { const v = Number(e.target.value); try { reglerVolume('voix', v); const m = lsGet('monde') || {}; m.sons = Object.assign({ musique: 0.5, musiqueActive: true, voix: 1, effets: 0.7 }, m.sons, { voix: v }); lsSet('monde', m); } catch (er) {} };
{ const m = lsGet('monde'); if (m && m.sons && typeof m.sons.voix === 'number') { $('volume').value = m.sons.voix; try { reglerVolume('voix', m.sons.voix); } catch (e) {} } }
$('changer-age').onclick = () => { $('reglages').classList.add('cache'); ecranAge(accueil); }; $('refaire-placement').onclick = () => { $('reglages').classList.add('cache'); s.placement = false; sauver(); placement(); };

// ---------- démarrage ----------
(async () => {
  salle('cour'); guide(); majSon(); await Promise.all([chargerGlyphes(), voix.charger()]);
  if (!s.groupe) { const p = lsGet('ldn_profil_actif'); ecranAge(); } else if (!s.placement && s.groupe !== 'g34' && C.decouvertes(s).length === 0) placement(); else accueil();
})();
window.__ecole = { etat: () => s, C, lancer, chapitre, espace, accueil, ecranAge, placement, voix: () => [...voix.dispo], sauver, arreter: nav, ctx: () => nouveauContexte($('ecran')) };
