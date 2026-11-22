// LES QUIZ ET DÉFIS DE NOUR — moteur : un personnage (guide du thème) pose une question dans un décor 3D, des réponses illustrées apparaissent,
// le personnage réagit tout de suite (joie ou réflexion), explique doucement, et l'enfant peut toujours réessayer. Aucun chronomètre, aucune sanction.
import { creerBase, creerReaction, $, lsGet, lsSet, THREE, existe, arreterVoix, reglerVolume } from '../commun/base.js?v=2';
import { decor, creerObjet } from '../mysteres-desert/decors.js?v=1';
import { CATEGORIES, ORDRE_CATEGORIES, GUIDES, PHRASES, BRAVOS, ERREURS } from './contenu.js?v=1';
import * as G from './logique.js?v=1';

let etat = G.lire(lsGet(G.CLE)); const sauver = () => lsSet(G.CLE, etat);
if (!etat.age) { const p = lsGet('ldn_profil_actif'); if (p && (p.tranche === '3-5' ? 'petits' : p.tranche === '6-10' ? 'moyens' : null)) { etat.age = (p.tranche === '3-5' ? 'petits' : p.tranche === '6-10' ? 'moyens' : null); sauver(); } }
const niveau = () => etat.niveau || G.niveauParDefaut(etat.age);
const B = creerBase({ canvas: $('scene'), dossierAudio: 'audio/jeux/quiz-nour', sousTitresActifs: () => etat.sousTitres, hauteur: 5.2, rayonCamera: [10, 11] });
const parler = (id, texte, qui, fini) => B.parler(id, texte, qui, fini);
function dire(etapes, fin) {            // enchaîne des phrases ; filet de sécurité si une voix est interrompue
  const [id, texte, qui] = etapes[0], reste = etapes.slice(1); let fait = false; const suivant = () => { if (fait) return; fait = true; if (reste.length) dire(reste, fin); else if (fin) fin(); };
  const v = parler(id, texte, qui, suivant); setTimeout(suivant, v ? Math.max(5000, texte.length * 110 + 1500) : Math.max(2200, texte.length * 55));
}

let guide = null; const reaction = creerReaction(() => guide); let partie = null, confettis = [], inactif = 0;
async function creerGuide(def) {
  try { const { Enfant } = await import('../../voyage/js/personnages.js?v=4'); const e = new Enfant(false, { tunique: def.tunique, pantalon: def.pantalon, cheche: def.cheche, peau: def.peau, sac: false, barbe: def.barbe || null, voile: def.voile || null });
    e.racine.scale.setScalar(1.9); e.racine.position.set(0, 0, 1.2); B.monde.add(e.racine); return e; } catch (er) { return null; }
}
function lancer(cat, niv) {
  arreterVoix(); B.vider(); guide = null; confettis = []; fermer(); const D = CATEGORIES[cat]; B.ambiance(D.ciel, D.sol, D.brume); B.monde.add(decor(D.decor));
  creerGuide(GUIDES[D.guide]).then(g => { guide = g; });
  partie = { cat, niv, qs: G.construirePartie(cat, niv), i: 0, premier: [], essais: 0, aide: false, repondue: false };
  $('titre-partie').textContent = `${D.icone} ${D.nom} · ${G.NOMS_NIVEAUX[niv]}`; $('accueil').classList.add('cache'); $('hud').classList.remove('cache'); etat.dernier = { categorie: cat, niveau: niv }; sauver();
  const suite = () => { if (partie && partie.cat === cat) poser(); };
  dire([[`intro.${cat}`, D.intro, GUIDES[D.guide].nom]], suite);
}
const Q = () => partie.qs[partie.i];
function poser() {
  const q = Q(); partie.essais = 0; partie.aide = false; partie.repondue = false; inactif = 0;
  $('progression').textContent = `Question ${partie.i + 1} sur ${partie.qs.length}`; $('question-texte').textContent = q.q; $('explication').classList.add('cache');
  $('reponses').innerHTML = q.choix.map((c, k) => `<button class="rep" data-k="${k}" aria-label="${c.texte}"><span class="em" aria-hidden="true">${c.emoji}</span>${/[؀-ۿ]/.test(c.texte) ? `<span class="ar" lang="ar" dir="rtl">${c.texte}</span>` : `<span>${c.texte}</span>`}</button>`).join('');
  $('reponses').querySelectorAll('.rep').forEach(b => { b.onclick = () => repondre(Number(b.dataset.k), b); }); $('question').classList.remove('cache');
  parler(`q.${q.id}`, q.q, GUIDES[CATEGORIES[partie.cat].guide].nom);
}
function repondre(k, b) {
  if (!partie || partie.repondue || b.disabled) return; const q = Q(); inactif = 0; const D = CATEGORIES[partie.cat];
  if (k === q.bonne) {
    partie.repondue = true; if (partie.essais === 0 && !partie.aide) partie.premier.push(q.id); b.classList.add('juste'); $('reponses').querySelectorAll('.rep').forEach(x => { x.disabled = true; }); reaction.jouer('joie'); lanternes();
    const br = BRAVOS[partie.i % BRAVOS.length]; montrerExplication(q, 'Bonne réponse !');
    dire([[br, PHRASES[br].texte, GUIDES[D.guide].nom], [`exp.${q.id}`, q.exp, 'Loumi']]);
  } else {
    partie.essais++; b.classList.add('faux'); b.disabled = true; reaction.jouer('hum'); const er = ERREURS[(partie.essais - 1) % ERREURS.length]; montrerExplication(q, 'Pas tout à fait… Réessaie !', true);
    dire([[er, PHRASES[er].texte, 'Loumi'], [`exp.${q.id}`, q.exp, 'Loumi']]);
  }
}
function montrerExplication(q, titre, essai) { $('exp-texte').textContent = `${titre} ${q.exp}`; $('explication').classList.remove('cache'); $('suivant').classList.toggle('cache', !!essai); if (!essai) $('suivant').textContent = partie.i + 1 >= partie.qs.length ? 'Terminer ›' : 'Question suivante ›'; }
$('suivant').onclick = () => { if (!partie || !partie.repondue) return; arreterVoix(); if (++partie.i >= partie.qs.length) finir(); else poser(); };
function aide(compte = true) { if (!partie || partie.repondue) return; const q = Q(); const mauvais = [...$('reponses').querySelectorAll('.rep:not(.faux)')].filter(x => Number(x.dataset.k) !== q.bonne); if (!mauvais.length) return;
  if (compte) partie.aide = true; mauvais[0].classList.add('faux'); mauvais[0].disabled = true; parler('aide', PHRASES.aide.texte, 'Loumi'); inactif = 0; }
$('aide').onclick = () => aide(true);
$('reecouter').onclick = () => { if (partie && !$('question').classList.contains('cache')) parler(`q.${Q().id}`, Q().q, GUIDES[CATEGORIES[partie.cat].guide].nom); };
function lanternes() { for (let i = 0; i < 9; i++) { const o = creerObjet('lanterne'); o.scale.setScalar(1.2); o.position.set((Math.random() - 0.5) * 7, 0.5, 1 + (Math.random() - 0.5) * 3); B.monde.add(o); confettis.push({ o, v: 2 + Math.random() * 2.5, t: 0 }); } }

function finir() {
  const total = partie.qs.length, p = partie; const r = G.terminerPartie(etat, { categorie: p.cat, niveau: p.niv, premierCoup: p.premier, total }); sauver(); $('question').classList.add('cache'); $('hud').classList.add('cache'); reaction.jouer('joie'); lanternes();
  const e = r.e, D = CATEGORIES[p.cat]; $('fin-titre').textContent = e === 3 ? 'Quel champion !' : e === 2 ? 'Très bien !' : 'Bravo, tu as terminé !'; $('fin-etoiles').textContent = '⭐'.repeat(e) + '☆'.repeat(3 - e); $('fin-score').textContent = `${p.premier.length} réponse${p.premier.length > 1 ? 's' : ''} trouvée${p.premier.length > 1 ? 's' : ''} du premier coup sur ${total}. Tu as appris plein de choses !`;
  $('fin-recompenses').innerHTML = [r.lanterne ? '🏮 Une lanterne gagnée' : '', ...r.diplomes.map(d => d === 'maitre' ? '🏆 Maître du quiz' : '🎓 Savant des Lanternes')].filter(Boolean).map(x => `<span>${x}</span>`).join('');
  const ni = G.NIVEAUX[G.NIVEAUX.indexOf(p.niv) + 1], b = $('fin-suite'); b.classList.toggle('cache', !ni); if (ni) { b.textContent = `Niveau ${G.NOMS_NIVEAUX[ni]} ›`; b.onclick = () => lancer(p.cat, ni); }
  $('fin-rejouer').onclick = () => lancer(p.cat, p.niv); $('fin').classList.remove('cache');
  const dip = r.diplomes.includes('maitre') ? 'fin_maitre' : r.diplomes.includes('savant') ? 'fin_savant' : `fin${e}`; dire([[dip, PHRASES[dip].texte, 'Guide']]);
}

function fermer() { for (const id of ['question', 'fin', 'diplomes', 'reglages']) $(id).classList.add('cache'); }
function accueil() {
  arreterVoix(); fermer(); partie = null; B.vider(); guide = null; B.ambiance('#2a1f6b', '#2a1f6b', '#2a1f6b'); $('hud').classList.add('cache'); $('accueil').classList.remove('cache');
  $('age-bloc').classList.toggle('cache', !!etat.age && !$('age-bloc').dataset.ouvert); $('themes-bloc').classList.toggle('cache', !etat.age);
  $('bilan').textContent = `⭐ ${G.etoilesTotal(etat)} / ${G.MAX_ETOILES}   ·   🏮 ${G.lanternes(etat)}   ·   🎓 ${etat.diplomes.length}`;
  $('niveaux').innerHTML = G.NIVEAUX.map(n => `<button class="chip${n === niveau() ? ' actif' : ''}" data-n="${n}">${G.NOMS_NIVEAUX[n]}</button>`).join(''); $('niveaux').querySelectorAll('button').forEach(b => b.onclick = () => { etat.niveau = b.dataset.n; sauver(); accueil(); });
  $('themes').innerHTML = ORDRE_CATEGORIES.map(c => { const d = CATEGORIES[c], a = etat.etoiles[c] || [0, 0, 0]; return `<button class="lieu" data-c="${c}"><span class="ic">${d.icone}</span><b>${d.nom}</b><span class="et">${a.map(x => (x ? '⭐'.repeat(x) : '·')).join(' | ')}</span></button>`; }).join('');
  $('themes').querySelectorAll('button').forEach(b => b.onclick = () => lancer(b.dataset.c, niveau()));
  if (!accueil.dit) { accueil.dit = true; parler(etat.age ? 'bienvenue' : 'age', etat.age ? PHRASES.bienvenue.texte : PHRASES.age.texte, 'Narratrice'); }
}
document.querySelectorAll('[data-age]').forEach(b => b.onclick = () => { etat.age = b.dataset.age; etat.niveau = null; sauver(); $('age-bloc').dataset.ouvert = ''; accueil(); });
$('changer-age').onclick = () => { $('age-bloc').dataset.ouvert = '1'; $('reglages').classList.add('cache'); accueil(); };
$('retour').onclick = accueil; $('fin-themes').onclick = accueil;
$('btn-diplomes').onclick = () => { $('diplomes-liste').innerHTML = etat.diplomes.length ? etat.diplomes.map(d => `<span>${d === 'maitre' ? '🏆 Maître du quiz' : '🎓 Savant des Lanternes'}</span>`).join('') : '<span class="vide">Réussis tous les thèmes pour gagner un diplôme.</span>'; $('diplomes').classList.remove('cache'); };
$('diplomes-fermer').onclick = () => $('diplomes').classList.add('cache');
$('btn-reglages').onclick = () => { $('st-case').checked = etat.sousTitres; $('reglages').classList.toggle('cache'); }; $('reglages-fermer').onclick = () => $('reglages').classList.add('cache');
$('st-case').onchange = e => { etat.sousTitres = e.target.checked; sauver(); };
$('volume').oninput = e => { const v = Number(e.target.value); try { reglerVolume('voix', v); const m = lsGet('monde') || {}; m.sons = Object.assign({ musique: 0.5, musiqueActive: true, voix: 1, effets: 0.7 }, m.sons, { voix: v }); lsSet('monde', m); } catch (er) {} };
{ const m = lsGet('monde'); if (m && m.sons && typeof m.sons.voix === 'number') { $('volume').value = m.sons.voix; try { reglerVolume('voix', m.sons.voix); } catch (e) {} } }

B.onFrame = (dt, t) => {
  B.azCible = Math.sin(t * 0.12) * 0.45;          // la caméra se balance doucement : le décor est vivant
  if (partie && !partie.repondue && G.aideAutoMs(etat.age)) { inactif += dt; if (inactif * 1000 > G.aideAutoMs(etat.age)) { inactif = 0; aide(false); } }
  for (const c of confettis) { c.t += dt; c.o.position.y += c.v * dt; c.o.rotation.y += dt * 3; c.o.scale.setScalar(Math.max(0.001, 1.2 * (1 - c.t / 2.2))); if (c.t > 2.2) { B.monde.remove(c.o); c.mort = true; } } confettis = confettis.filter(c => !c.mort);
  if (guide) { guide.animer(dt, 0, t); reaction.maj(dt); guide.racine.lookAt(B.camera.position.x, 0, B.camera.position.z); }
};
B.chargerAudio(); accueil();
window.__quiz = { etat: () => etat, partie: () => partie, lancer, bonne: () => (partie ? Q().bonne : null), voix: () => [...B.dispo] };
