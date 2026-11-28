#!/usr/bin/env node
// Renseigne les emplacements « EN ATTENTE » de conditions/index.html (mentions legales) a partir d'un fichier JSON.
// Aucune information n'est inventee : un champ absent du JSON reste en attente.
// Utilisation :
//   node outils/legal/renseigner.mjs --etat                 -> liste les champs encore en attente
//   node outils/legal/renseigner.mjs infos.json [--ecrire]  -> apercu (sans --ecrire) ou ecriture de la page
// Exemple de infos.json : { "nom": "…", "statut": "Micro-entrepreneur (entrepreneur individuel)", "siren": "…", "adresse": "…", "tva": "…" }
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const CHAMPS = ['nom', 'statut', 'adresse', 'siren', 'tva', 'contact', 'directeur', 'hebergeur-adresse', 'tva-prix', 'prix-confirmes', 'remboursement', 'relecture-retractation', 'mediateur'];
const RE = /<mark class="attente" data-champ="([a-z-]+)">[^<]*<\/mark>/g;
const echapper = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function champsEnAttente(html) { return [...html.matchAll(RE)].map(m => m[1]); }

// Remplace les champs fournis (valeur non vide) ; renvoie { html, remplis, restants }.
export function renseigner(html, infos) {
  const remplis = [];
  const out = html.replace(RE, (tout, champ) => {
    const v = infos && typeof infos[champ] === 'string' ? infos[champ].trim() : '';
    if (!v) return tout;
    remplis.push(champ);
    return echapper(v);
  });
  return { html: out, remplis, restants: champsEnAttente(out) };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const page = join(dirname(fileURLToPath(import.meta.url)), '../../conditions/index.html');
  const html = readFileSync(page, 'utf8');
  const args = process.argv.slice(2);
  if (args.includes('--etat') || !args.find(a => !a.startsWith('--'))) {
    const r = champsEnAttente(html);
    console.log(r.length ? 'Champs en attente (' + r.length + ') : ' + [...new Set(r)].join(', ') : 'Aucun champ en attente.');
    process.exit(0);
  }
  const infos = JSON.parse(readFileSync(args.find(a => !a.startsWith('--')), 'utf8'));
  const r = renseigner(html, infos);
  console.log('Remplis : ' + (r.remplis.join(', ') || 'aucun') + '\nRestent en attente : ' + ([...new Set(r.restants)].join(', ') || 'aucun'));
  if (args.includes('--ecrire')) { writeFileSync(page, r.html); console.log('Page ecrite. Relire, puis valider.'); } else console.log('Apercu seulement (ajouter --ecrire pour ecrire).');
}