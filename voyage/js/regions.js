// Les régions à débloquer : le wadi et les rochers gravés.
// Une région s'ouvre quand on a découvert le lieu voisin ET réussi UNE activité au choix parmi plusieurs
// (jamais une seule activité difficile obligatoire). Une région ouverte le reste pour toujours.
import { LIEUX } from './terrain.js?v=3';

export const REGIONS = {
  wadi: {
    nom: 'Le wadi', icone: '🌼', requis: { txt: 'découvrir le camp des caravanes', ok: c => c.zones.includes('camp') },
    auChoix: [
      { txt: 'apprendre 4 mots arabes', ok: c => (c.AV.quetes.mots || []).length >= 4 },
      { txt: 'observer 2 plantes du désert', ok: c => (c.AV.quetes.plantes || []).length >= 2 },
      { txt: 'réussir une grande mission', ok: c => Object.values(c.AV.missions || {}).some(m => m.etat === 'finie') },
      { txt: 'résoudre 3 énigmes du souk', ok: c => (c.AV.quetes.enigmes || []).length >= 3 }
    ]
  },
  rochers: {
    nom: 'Les rochers gravés', icone: '🪨', requis: { txt: 'découvrir l\'oasis', ok: c => c.zones.includes('oasis') },
    auChoix: [
      { txt: 'observer 3 animaux', ok: c => (c.AV.animaux || []).length >= 3 },
      { txt: 'avoir le faucon du voyageur ou la carte des secrets', ok: c => !!(c.AV.equipement.jumelles || c.AV.equipement.carte) },
      { txt: 'apprendre 6 mots arabes', ok: c => (c.AV.quetes.mots || []).length >= 6 },
      { txt: 'trouver 6 lanternes cachées', ok: c => (c.AV.ramasses || []).filter(k => k.startsWith('lanterne')).length >= 6 }
    ]
  }
};

export function creerRegions({ etat, AV, enregistrer, barrieres, ui }) {
  etat.regions = etat.regions || {};
  const ouverte = id => !!etat.regions[id];
  for (const id of Object.keys(REGIONS)) if (ouverte(id) && barrieres[id]) barrieres[id].ouvrir();
  const contexte = () => ({ AV, zones: etat.zones });
  function conditions(id) {
    const R = REGIONS[id], c = contexte();
    return { requis: { txt: R.requis.txt, ok: R.requis.ok(c) }, auChoix: R.auChoix.map(a => ({ txt: a.txt, ok: a.ok(c) })) };
  }
  // explication courte, pour l'éboulis, la carte et le carnet
  function explication(id) {
    const k = conditions(id), R = REGIONS[id];
    return `${R.nom} est encore fermé par un éboulis. Pour l'ouvrir : ${k.requis.ok ? '✓ ' : ''}${k.requis.txt}, puis au choix : ${k.auChoix.map(a => (a.ok ? '✓ ' : '') + a.txt).join(' ; ou ')}.`;
  }
  return {
    ouverte, conditions, explication,
    fermees: () => Object.keys(REGIONS).filter(id => !ouverte(id)).map(id => ({ id, x: LIEUX[id].x, z: LIEUX[id].z, r: LIEUX[id].r + 4 })),
    verifier() {
      for (const id of Object.keys(REGIONS)) {
        if (ouverte(id)) continue;
        const k = conditions(id);
        if (k.requis.ok && k.auChoix.some(a => a.ok)) {
          etat.regions[id] = Date.now(); enregistrer();
          if (barrieres[id]) barrieres[id].ouvrir();
          ui.debloquee(id, REGIONS[id]);
        }
      }
    }
  };
}
