// Une consultation d'un agent externe : clé, budget réservé, appel, coût réel. Ne lève jamais : l'échec est un résultat.
import { lireCle } from './cles.mjs';
import { requeteJson } from './reseau.mjs';
import { FOURNISSEURS } from './agents.mjs';
import { coutUSD, creerRegistre } from './budget.mjs';
import { Refus } from './garde.mjs';

// Estimation volontairement haute : 2 caractères par jeton (l'arabe en consomme beaucoup), 3000 jetons par image.
export const jetonsEstimes = mission => Math.ceil((mission.consigne.length + mission.texte.length) / 2) + 3000 * mission.images.length + 2000;

export function coutMaximal(config, reglage, mission) {
  const tarif = config.tarifs[reglage.modele];
  if (!tarif) throw new Refus(`aucun tarif pour « ${reglage.modele} » dans conseil.config.json : sans tarif, le budget ne peut pas être tenu`);
  return coutUSD(tarif, jetonsEstimes(mission), reglage.jetonsSortieMax);
}

export async function consulter(agent, reglage, mission, { config, env, dossier, dechiffrer, fetch, attendre, maintenant }) {
  const base = { agent, modele: reglage.modele, coutUSD: 0, texte: '', rapport: null };
  let cle, id, coutMax, registre;
  try {
    cle = lireCle(agent, { env, dossier, dechiffrer })?.valeur;
    if (!cle) return { ...base, statut: 'sans-clé', detail: 'aucune clé : lancer « node outils/conseil-ia/conseil.mjs configurer » dans votre terminal' };
    coutMax = coutMaximal(config, reglage, mission);
    registre = creerRegistre(dossier, config.limites, maintenant);
    id = registre.reserver({ agent, modele: reglage.modele, coutMax });
  } catch (e) { return { ...base, statut: 'refusé', detail: e.message }; }
  try {
    const { url, init } = FOURNISSEURS[agent].requete(reglage, cle, mission);
    const options = { fetch, attendre, secrets: [cle], delaiMs: config.limites.delaiSecondes * 1000, tentatives: config.limites.tentatives };
    const lu = FOURNISSEURS[agent].lire(await requeteJson(url, init, options), mission.schema);
    const { entree, sortie } = lu.jetons, tarif = config.tarifs[reglage.modele];
    const cout = coutUSD(tarif, entree ?? jetonsEstimes(mission), sortie ?? reglage.jetonsSortieMax);
    registre.solder(id, { coutUSD: cout, statut: lu.statut, jetons: lu.jetons });
    return { ...base, ...lu, coutUSD: cout };
  } catch (e) {
    const du = e.facturationPossible === false ? 0 : coutMax;
    registre.solder(id, { coutUSD: du, statut: du ? 'incertain' : 'erreur' });
    return { ...base, coutUSD: du, statut: 'erreur', detail: e.message };
  }
}
