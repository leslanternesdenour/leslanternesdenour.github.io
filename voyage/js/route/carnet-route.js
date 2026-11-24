// L'onglet « Itinéraire » du carnet de voyage (six sections). Fonction pure : prend la progression et renvoie du HTML.
// Les textes viennent de données internes (jamais saisis par l'enfant). Les connaissances non validées portent la mention « À VALIDER ».
import { LIEUX_ROUTE, REGIONS_ROUTE, MISSIONS_ROUTE, SAC_ROUTE, DISTANCE_TOTALE } from './donnees.js';
import { BADGES_ROUTE } from './badges-route.js';
import { CONTENU, etiquette, texteDe } from './contenu-a-valider.js';
import { DEC } from './relief.js';
import { recit, ORIGINES, STATUT } from './recits-a-valider.js';
import { VALIDATION } from './validation-contenu.js';
import { illustrationSvg } from './recits-illustrations.js';
import { recitsDuCarnet, questionsPour } from './recits-route.js';

const nomLieu = id => (LIEUX_ROUTE.find(l => l.id === id) || {}).nom || id;
const iconeLieu = id => (LIEUX_ROUTE.find(l => l.id === id) || {}).icone || '✨';


// « Mes histoires découvertes » : seulement les histoires que l'enfant a ajoutées à son carnet
function histoires(route, age) {
  const ids = route.recits ? recitsDuCarnet(route) : [];
  if (!ids.length) return '<h3>📜 Mes histoires découvertes</h3><p class="note">Pas encore d\'histoire dans ton carnet. Cherche les lanternes dans les lieux de la route !</p>';
  const grand = age !== '3-5';
  return '<h3>📜 Mes histoires découvertes · ' + ids.length + '</h3>' + ids.map(id => {
    const r = recit(id), e = route.recits[id], qs = questionsPour(id, age);
    return '<div class="carte-mission"><h4>' + r.titre + '<span class="etiquette">' + (VALIDATION.valide ? '✅ Validé' : '⚠️ ' + STATUT) + '</span></h4>' +
      '<p style="margin:0 0 4px;font-size:14px">📍 ' + r.lieuNom + ' · ' + r.periode + '</p>' + illustrationSvg(r.illustration.scene, r.illustration.description) +
      r.enonces.map(x => '<p style="margin:6px 0"><b>' + ORIGINES[x.origine].icone + ' ' + ORIGINES[x.origine].nom + '.</b> ' + (grand ? x.grand : x.petit) + '</p>').join('') +
      (grand ? '<p style="margin:6px 0;font-size:13px">Sources : ' + r.sources.map(s => s.ref ? ORIGINES[s.type].nom + ' : ' + s.ref + ' (à vérifier)' : (s.indication || 'Référence à vérifier')).join(' · ') + '</p>' : '') +
      qs.map(q => '<p style="margin:6px 0">Question : ' + q.texte + ' ' + (e.reponses[q.id] !== undefined ? '<b>✓ ' + q.choix[q.bonne] + '</b>' : '<i>(à retrouver dans l\'histoire)</i>') + '</p>').join('') + '</div>';
  }).join('');
}

export function pageCarnetRoute({ route, badges = {}, age = '6-10' }) {
  const decouv = route.decouvertes || [];
  const s = route.pos ? Math.max(0, Math.round(route.pos.z - DEC)) : 0;
  const pct = Math.min(100, Math.round(s / DISTANCE_TOTALE * 100));
  const regions = REGIONS_ROUTE.filter(r => decouv.includes('region:' + r.id));
  const itineraire = `<h3>🧭 Mon itinéraire</h3>
    <div class="carte-mission"><p style="margin:0 0 6px">${route.pos ? `Tu es à environ <b>${s} m</b> du village sur la grande route (${pct} % du grand voyage).` : 'Ton voyage sur la grande route n\'a pas encore commencé.'}</p>
    <div class="barre"><i style="width:${pct}%"></i></div>
    <p style="margin:6px 0 0;font-size:14px">${regions.length ? regions.map(r => `${r.icone} ${r.nom}`).join(' → ') : 'Aucune région traversée pour l\'instant.'}</p>
    <p style="margin:4px 0 0;font-size:14px">⛰️ Haltes faites : ${(route.repos || []).length} / ${LIEUX_ROUTE.filter(l => l.type === 'repos').length}</p></div>`;
  const lieux = LIEUX_ROUTE.filter(l => l.type !== 'objet' && l.type !== 'personnage' && decouv.includes(l.id));
  const total = LIEUX_ROUTE.filter(l => l.type !== 'objet' && l.type !== 'personnage').length;
  const decouvertes = `<h3>✨ Mes découvertes · ${lieux.length} / ${total}</h3>
    <div class="grille-collection">${lieux.length ? lieux.map(l => `<div class="badge-gagne"><span>${l.icone}</span><b>${l.nom}</b></div>`).join('') : '<p class="note">Rien encore : explore la route !</p>'}</div>`;
  const missions = `<h3>🎯 Mes missions</h3>${Object.entries(MISSIONS_ROUTE).map(([id, M]) => {
    const m = (route.missions || {})[id], n = m ? (m.faits || []).length : 0, fini = m && m.etat === 'finie';
    return `<div class="carte-mission ${fini ? 'finie' : ''}"><h4>${M.icone} ${M.titre}${fini ? '<span class="etiquette">Réussie ✓</span>' : ''}</h4>
      <p style="margin:0 0 6px">${age === '3-5' ? M.simple : M.resume}</p><div class="barre"><i style="width:${n / M.total * 100}%"></i></div><p style="margin:6px 0 0;font-size:14px">${n} / ${M.total}</p></div>`;
  }).join('')}`;
  const sac = SAC_ROUTE.filter(o => (route.sac || {})[o.id]);
  const objets = `<h3>🎒 Mes objets</h3><p class="note" style="margin-top:0">Dans mon sac : ${sac.length ? sac.map(o => `${o.icone} ${o.nom.toLowerCase()}`).join(', ') : 'rien pour l\'instant (tu peux le préparer au village)'}.</p>
    <div class="grille-collection">${(route.objets || []).length ? route.objets.map(id => `<div class="badge-gagne"><span>${iconeLieu(id)}</span><b>${nomLieu(id)}</b></div>`).join('') : '<p class="note">Aucune trouvaille pour l\'instant.</p>'}</div>`;
  const fiches = (route.connaissances || []).map(id => CONTENU[id]).filter(f => f && texteDe(f, age));
  const connaissances = `<h3>📖 Mes connaissances</h3>${fiches.length ? fiches.map(f => `<div class="carte-mission"><h4>${f.sujet}<span class="etiquette">${etiquette(f)}</span></h4><p style="margin:0">${texteDe(f, age)}</p></div>`).join('') : '<p class="note">Les fiches que tu liras apparaîtront ici.</p>'}`;
  const gagnes = BADGES_ROUTE.filter(b => badges[b.id]).length;
  const bad = `<h3>🎖️ Mes badges · ${gagnes} / ${BADGES_ROUTE.length}</h3><div class="grille-collection badges">${BADGES_ROUTE.map(b => `<div class="${badges[b.id] ? 'badge-gagne' : 'manque'}" title="${b.desc}"><span>${b.icone}</span><b>${b.nom}</b><small>${b.desc}</small></div>`).join('')}</div>`;
  return itineraire + decouvertes + missions + objets + histoires(route, age) + connaissances + bad + '<p class="note">Les Pièces de Nour se gagnent en explorant et en aidant, jamais avec de l\'argent.</p>';
}
