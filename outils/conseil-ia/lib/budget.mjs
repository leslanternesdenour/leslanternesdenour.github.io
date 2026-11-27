// Budget : estimation, plafonds et registre des dépenses (fichier local, hors du dépôt).
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
import { Refus } from './garde.mjs';

export const coutUSD = (tarif, jetonsEntree, jetonsSortie) => (tarif.entree * jetonsEntree + tarif.sortie * jetonsSortie) / 1e6;

const arrondi = n => Math.round(n * 1e6) / 1e6;

const patienter = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

// Un seul processus écrit à la fois : sans cela, deux missions lancées ensemble pourraient dépasser un plafond.
function sousVerrou(dossier, { attenteMs, abandonMs }, action) {
  const verrou = path.join(dossier, 'registre.verrou'), fin = Date.now() + attenteMs;
  fs.mkdirSync(dossier, { recursive: true });
  for (;;) {
    try { fs.closeSync(fs.openSync(verrou, 'wx')); break; }
    catch (e) { if (e.code !== 'EEXIST') throw e; }
    const age = Date.now() - (fs.statSync(verrou, { throwIfNoEntry: false })?.mtimeMs ?? Date.now());
    if (age > abandonMs) fs.rmSync(verrou, { force: true });
    else if (Date.now() > fin) throw new Refus(`registre occupé par un autre processus (${verrou})`);
    else patienter(20);
  }
  try { return action(); } finally { fs.rmSync(verrou, { force: true }); }
}

export function creerRegistre(dossier, limites, maintenant = () => new Date(), delais = { attenteMs: 5000, abandonMs: 30_000 }) {
  const fichier = path.join(dossier, 'registre.json');
  const lire = () => {
    if (!fs.existsSync(fichier)) return [];
    try { const entrees = JSON.parse(fs.readFileSync(fichier, 'utf8')); if (Array.isArray(entrees)) return entrees; } catch { /* traité ci-dessous */ }
    throw new Refus(`registre illisible : ${fichier} (à réparer ou renommer à la main)`);
  };
  const ecrire = entrees => { fs.mkdirSync(dossier, { recursive: true }); fs.writeFileSync(fichier, JSON.stringify(entrees, null, 1)); };
  const resumer = entrees => {
    const date = maintenant().toISOString(), jour = { coutUSD: 0, appels: {} }, mois = { coutUSD: 0 };
    for (const e of entrees) {
      if (e.date.slice(0, 7) === date.slice(0, 7)) mois.coutUSD = arrondi(mois.coutUSD + e.coutUSD);
      if (e.date.slice(0, 10) !== date.slice(0, 10)) continue;
      jour.coutUSD = arrondi(jour.coutUSD + e.coutUSD); jour.appels[e.agent] = (jour.appels[e.agent] || 0) + 1;
    }
    return { jour, mois };
  };
  return {
    resume: () => resumer(lire()),
    reserver: ({ agent, modele, coutMax }) => sousVerrou(dossier, delais, () => {
      const entrees = lire(), id = crypto.randomUUID();
      if (coutMax > limites.parAppelUSD) throw new Refus(`plafond par appel dépassé (${coutMax.toFixed(2)} $ estimés, maximum ${limites.parAppelUSD} $)`);
      const { jour, mois } = resumer(entrees);
      if (arrondi(jour.coutUSD + coutMax) > limites.parJourUSD) throw new Refus(`plafond du jour atteint (${jour.coutUSD} $ engagés sur ${limites.parJourUSD} $)`);
      if (arrondi(mois.coutUSD + coutMax) > limites.parMoisUSD) throw new Refus(`plafond du mois atteint (${mois.coutUSD} $ engagés sur ${limites.parMoisUSD} $)`);
      if ((jour.appels[agent] || 0) >= limites.appelsParJourParAgent) throw new Refus(`${agent} : limite de ${limites.appelsParJourParAgent} appels par jour atteinte`);
      ecrire([...entrees, { id, date: maintenant().toISOString(), agent, modele, coutUSD: coutMax, statut: 'réservé' }]);
      return id;
    }),
    solder: (id, resultat) => sousVerrou(dossier, delais, () => ecrire(lire().map(e => e.id === id ? { ...e, ...resultat } : e))),
  };
}
