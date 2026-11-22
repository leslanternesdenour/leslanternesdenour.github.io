// Compare l'ANCIENNE zone DNS (OVH, au format texte) avec la zone importée dans CLOUDFLARE (export BIND), pour détecter tout enregistrement manquant
// AVANT de changer les serveurs de noms (une ligne de messagerie oubliée = e-mails perdus). Données publiques (DNS) : aucun secret.
//   node outils/migration/comparer-zones.mjs ovh.txt cloudflare.txt [--domaine leslanternesdenour.fr]
// OVH : Manager → Noms de domaine → le domaine → onglet « Zone DNS » → « Modifier en mode textuel » → copier tout le texte.
// Cloudflare : le domaine → DNS → Enregistrements → « Exporter » (fichier .txt, format BIND).
// Sortie : enregistrements de l'ancienne zone ABSENTS de Cloudflare (à ajouter), enregistrements en plus (information), et avertissements messagerie. Code 1 s'il en manque.
// Ignorés volontairement : SOA et NS de l'apex (les serveurs de noms changent par définition).
import fs from 'node:fs';
const args = process.argv.slice(2), fichiers = args.filter(a => !a.startsWith('--') && fs.existsSync(a));
const DOMAINE = (args.includes('--domaine') ? args[args.indexOf('--domaine') + 1] : 'leslanternesdenour.fr').toLowerCase().replace(/\.$/, '');

// ----- lecture d'une zone BIND (OVH ou Cloudflare) -----
export function lireZone(texte, domaine = DOMAINE) {
  const lignes = []; let tampon = '', ouvert = 0;
  for (let l of texte.split(/\r?\n/)) {                   // joint les enregistrements écrits sur plusieurs lignes entre parenthèses (SOA)
    l = l.replace(/(^|\s);.*$/, '').replace(/\r/g, ''); if (!l.trim() && !tampon) continue;
    const dansTexte = (l.match(/"/g) || []).length % 2; tampon += (tampon ? ' ' : '') + l;
    ouvert += (l.match(/\(/g) || []).length - (l.match(/\)/g) || []).length; if (ouvert <= 0 && !dansTexte) { lignes.push(tampon); tampon = ''; ouvert = 0; }
  }
  let ttlDefaut = 3600, proprietaire = domaine; const out = [];
  const nom = n => { n = n.trim(); if (n === '@') return domaine; if (n.endsWith('.')) return n.slice(0, -1).toLowerCase(); const m = n.toLowerCase(); return m === domaine || m.endsWith('.' + domaine) ? m : m + '.' + domaine; };
  for (const brute of lignes) {
    const l = brute.replace(/[()]/g, ' ');
    if (/^\$TTL/i.test(l.trim())) { ttlDefaut = Number(l.trim().split(/\s+/)[1]) || ttlDefaut; continue; }
    if (/^\$/.test(l.trim())) continue;
    const commenceParBlanc = /^\s/.test(l), jetons = l.trim().match(/"(?:[^"\\]|\\.)*"|\S+/g) || []; if (!jetons.length) continue;
    let i = 0; if (!commenceParBlanc) proprietaire = nom(jetons[i++]);
    while (i < jetons.length && (/^\d+$/.test(jetons[i]) || /^(IN|CH|HS)$/i.test(jetons[i]))) i++;     // TTL et classe, dans n'importe quel ordre
    const type = (jetons[i++] || '').toUpperCase(); const rdata = jetons.slice(i);
    if (!type || !rdata.length) continue;
    let contenu, priorite = null;
    if (type === 'MX') { priorite = Number(rdata[0]); contenu = nom(rdata[1] || ''); }
    else if (type === 'TXT' || type === 'SPF') contenu = rdata.map(x => x.replace(/^"|"$/g, '').replace(/\\"/g, '"')).join('');
    else if (['CNAME', 'NS', 'PTR', 'DNAME'].includes(type)) contenu = nom(rdata[0]);
    else if (type === 'SRV') { priorite = Number(rdata[0]); contenu = `${rdata[1]} ${rdata[2]} ${nom(rdata[3] || '')}`; }
    else if (type === 'CAA') contenu = `${rdata[0]} ${rdata[1]} ${rdata.slice(2).join(' ').replace(/^"|"$/g, '')}`;
    else contenu = rdata.join(' ').toLowerCase();
    out.push({ nom: proprietaire, type, contenu, priorite });
  }
  return out;
}
const cle = r => `${r.type}|${r.nom}|${r.contenu}|${r.priorite ?? ''}`;
const ignore = (r, domaine) => r.type === 'SOA' || (r.type === 'NS' && r.nom === domaine);
export function comparer(ancienne, cloudflare, domaine = DOMAINE) {
  const a = ancienne.filter(r => !ignore(r, domaine)), c = cloudflare.filter(r => !ignore(r, domaine)), cc = new Set(c.map(cle)), aa = new Set(a.map(cle));
  const manquants = a.filter(r => !cc.has(cle(r))), enPlus = c.filter(r => !aa.has(cle(r))), communs = a.filter(r => cc.has(cle(r)));
  const messagerie = r => r.type === 'MX' || (r.type === 'TXT' && /v=spf1|v=DKIM1|v=DMARC1|_domainkey|_dmarc/i.test(r.contenu + r.nom)) || /(^|\.)_(domainkey|dmarc|autodiscover|imaps?|submission|pop3s?)\b/.test(r.nom) || /^(mail|smtp|imap|pop3?|webmail|autoconfig|autodiscover|mx\d*)\./.test(r.nom);
  return { manquants, enPlus, communs, manquantsMessagerie: manquants.filter(messagerie), nbMessagerieAncienne: a.filter(messagerie).length };
}
const ligne = r => `${r.type.padEnd(6)} ${r.nom}${r.priorite != null ? '  prio ' + r.priorite : ''}  →  ${r.contenu.length > 110 ? r.contenu.slice(0, 107) + '…' : r.contenu}`;

if (import.meta.url === `file://${process.argv[1]}`) {
  if (fichiers.length < 2) { console.error('Usage : node outils/migration/comparer-zones.mjs ovh.txt cloudflare.txt [--domaine leslanternesdenour.fr]'); process.exit(2); }
  const anc = lireZone(fs.readFileSync(fichiers[0], 'utf8')), cf = lireZone(fs.readFileSync(fichiers[1], 'utf8')), r = comparer(anc, cf);
  console.log(`Ancienne zone : ${anc.length} enregistrements | Cloudflare : ${cf.length} | identiques : ${r.communs.length}\n`);
  if (r.manquants.length) { console.log(`✗ ${r.manquants.length} enregistrement(s) de l'ancienne zone ABSENT(S) de Cloudflare (à ajouter AVANT de changer les serveurs de noms) :`); r.manquants.forEach(x => console.log('   - ' + ligne(x))); }
  else console.log('✓ Aucun enregistrement de l\'ancienne zone ne manque dans Cloudflare.');
  if (r.manquantsMessagerie.length) console.log(`\n⚠⚠ DONT ${r.manquantsMessagerie.length} de MESSAGERIE (MX / SPF / DKIM / DMARC / autoconfig) : sans eux, les e-mails seront perdus ou rejetés.`);
  if (r.enPlus.length) { console.log(`\nℹ ${r.enPlus.length} enregistrement(s) présent(s) dans Cloudflare mais pas dans l'ancienne zone (information) :`); r.enPlus.forEach(x => console.log('   + ' + ligne(x))); }
  console.log(`\nMessagerie dans l'ancienne zone : ${r.nbMessagerieAncienne} enregistrement(s). Dans Cloudflare, les hôtes de messagerie (mail, smtp, imap, autoconfig…) doivent être en « DNS seul » (nuage GRIS).`);
  process.exit(r.manquants.length ? 1 : 0);
}
