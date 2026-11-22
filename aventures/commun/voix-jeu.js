// Voix et sous-titres des jeux « 2D » (sans scène 3D) : même système que les autres jeux — manifeste audio généré à l'avance, une seule voix à la fois (socle monde/socle/voix.js),
// jamais de synthèse vocale du navigateur. Une phrase sans fichier reste SOUS-TITRÉE. Mode silencieux (muet) : aucun son, tout est sous-titré. Les interruptions (onglet masqué) coupent la voix.
import { chargerVoix, ajouterVoix, existe, dire as direVoix, arreterVoix } from '../../monde/socle/voix.js?v=2';
import { reveiller, reglerVolume } from '../../monde/socle/audio.js?v=2';
export { reglerVolume };
export function creerVoix({ dossierAudio, racine = '../../', etat, elSousTitres }) {
  const dispo = new Set(); let st = 0;
  document.addEventListener('visibilitychange', () => { if (document.hidden) arreterVoix(); });
  const V = {
    dispo,
    async charger() { try { await chargerVoix('voix/'); const r = await fetch(racine + dossierAudio + '/manifeste.json', { cache: 'no-cache' }); if (!r.ok) return; const m = await r.json(), e = {};
      for (const p of m.phrases || []) if (p.fichier && p.duree > 0) { e[p.id] = ['/' + dossierAudio + '/' + p.fichier + '?v=2-' + p.duree, 0, p.duree]; dispo.add(p.id); } ajouterVoix(e); } catch (er) {} },
    a: id => dispo.has(id) && !etat().muet,
    arreter() { arreterVoix(); },
    sousTitre(texte, qui, ms = 4200) { clearTimeout(st); const el = elSousTitres(); if (!el) return; if (!texte) { el.classList.add('cache'); return; } el.innerHTML = (qui ? `<b>${qui}</b> ` : '') + texte; el.classList.remove('cache'); st = setTimeout(() => el.classList.add('cache'), ms); },
    // dit une phrase ; renvoie une promesse qui se résout à la fin de la voix (ou après un délai sûr : jamais bloquée). visible : sous-titre affiché ?
    parler(id, texte, qui, { sousTitre = true } = {}) {
      return new Promise(fin => { let fait = false; const ok = () => { if (!fait) { fait = true; fin(); } }; const voix = V.a(id); reveiller();
        if (voix) direVoix(id, ok); if ((etat().sousTitres || !voix) && sousTitre && texte) V.sousTitre(texte, qui, voix ? 4500 : Math.max(3200, texte.length * 55));
        setTimeout(ok, voix ? Math.max(4000, (texte || '').length * 110 + 1200) : Math.max(1200, Math.min(3000, (texte || '').length * 45))); });
    }
  };
  return V;
}
