// Un dossier par mission, hors du dépôt. Les mesures sont recalculées à partir des dossiers : une seule source de vérité.
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
import { Refus } from './garde.mjs';

const repertoire = dossier => path.join(dossier, 'dossiers');
export const nouvelIdentifiant = date => `${date.slice(0, 19).replace(/[-:]/g, '').replace('T', '-')}-${crypto.randomBytes(3).toString('hex')}`;

export function enregistrer(dossier, d) {
  fs.mkdirSync(repertoire(dossier), { recursive: true });
  fs.writeFileSync(path.join(repertoire(dossier), `${d.id}.json`), JSON.stringify(d, null, 1));
}

export function ouvrir(dossier, id) {
  const fichier = path.join(repertoire(dossier), `${id}.json`);
  if (!/^[0-9a-f-]+$/.test(id || '') || !fs.existsSync(fichier)) throw new Refus(`dossier inconnu : ${id} (option --dossier)`);
  return JSON.parse(fs.readFileSync(fichier, 'utf8'));
}

export const tous = dossier => fs.existsSync(repertoire(dossier)) ? fs.readdirSync(repertoire(dossier)).filter(f => f.endsWith('.json')).map(f => ouvrir(dossier, f.slice(0, -5))) : [];

export function mesures(dossier, domaine) {
  const m = {}, de = agent => (m[agent] ||= { missions: 0, confirmes: 0, rejetes: 0, coutUSD: 0 });
  for (const d of tous(dossier).filter(x => x.classement.domaine === domaine)) {
    for (const agent of d.plan.analystes) de(agent).missions++;
    for (const r of Object.values(d.analyses)) de(r.agent).coutUSD += r.coutUSD;
    for (const j of Object.values(d.jugements || {})) de(j.agent)[j.verdict === 'confirme' ? 'confirmes' : 'rejetes']++;
  }
  return m;
}
