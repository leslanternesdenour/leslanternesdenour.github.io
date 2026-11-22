// BASCULE DU DOMAINE PUBLIC VERS CLOUDFLARE PAGES, par l'API Cloudflare (jeton limité : Pages « Edit » + DNS « Edit » de la zone du domaine).
//   node outils/migration/basculer-cloudflare.mjs --compte <ACCOUNT_ID> --zone <ZONE_ID>                 DIAGNOSTIC seul : contrôles, SAUVEGARDE DNS, plan ; aucune modification distante
//   node outils/migration/basculer-cloudflare.mjs --compte … --zone … --appliquer --dnssec-desactive    exécute la bascule (domaines Pages, DNS, attente HTTPS)
//        --dnssec-desactive = CONFIRMATION du client que DNSSEC est désactivé chez le registrar ET que le DS a disparu des résolveurs publics (sinon le domaine devient injoignable) ; --appliquer la EXIGE.
//   node outils/migration/basculer-cloudflare.mjs --compte … --zone … --restaurer                        retour en arrière : rétablit les enregistrements sauvegardés
// Options : --projet lanternes-de-nour  --domaine leslanternesdenour.fr  --api https://api.cloudflare.com/client/v4  --sauvegarde docs/migration/dns-avant-bascule.json
// Le JETON n'est JAMAIS lu ni écrit ici : le proxy de la session l'ajoute aux requêtes vers api.cloudflare.com (réglages de l'environnement, « Network secrets »).
// Règles de sécurité : aucune suppression sans sauvegarde écrite ET relue ; seuls les enregistrements GitHub Pages de l'apex et de « www » sont supprimés
// (MX, TXT, etc. ne sont jamais touchés) ; tout enregistrement inconnu sur l'apex ou « www » interrompt la bascule sans rien modifier ;
// en cas d'échec après suppression, les enregistrements supprimés sont recréés automatiquement. Les variables et secrets du projet ne sont que LUS (noms seulement).
import { spawnSync } from 'node:child_process'; import fs from 'node:fs'; import path from 'node:path';
const A = process.argv.slice(2), opt = (n, d) => A.includes('--' + n) ? A[A.indexOf('--' + n) + 1] : d, flag = n => A.includes('--' + n);
const COMPTE = opt('compte'), ZONE = opt('zone'), PROJET = opt('projet', 'lanternes-de-nour'), DOMAINE = opt('domaine', 'leslanternesdenour.fr');
const API = opt('api', 'https://api.cloudflare.com/client/v4'), SAUVEGARDE = opt('sauvegarde', 'docs/migration/dns-avant-bascule.json');
const APPLIQUER = flag('appliquer'), RESTAURER = flag('restaurer'), ATTENTE_MAX_S = Number(opt('attente', 600));
const CIBLE = `${PROJET}.pages.dev`, WWW = `www.${DOMAINE}`;
if (!COMPTE || !ZONE) { console.error('Il faut --compte <ACCOUNT_ID> et --zone <ZONE_ID> (identifiants non secrets visibles dans le tableau de bord).'); process.exit(2); }
let ok = 0, ko = 0; const t = (nom, c, d = '') => { c ? ok++ : ko++; console.log(`${c ? '✓' : '✗'} ${nom}${d && !c ? ' — ' + d : ''}`); return c; };
const arret = m => { console.error('\nARRÊT : ' + m); process.exit(1); };
// VERROU DNSSEC : modifier le DNS (ou changer de serveurs de noms) alors que DNSSEC est actif chez le registrar rend le domaine injoignable pour beaucoup de visiteurs.
// Aucune écriture sans confirmation explicite du client ; vérifié AVANT tout appel à l'API.
if (A.includes('--appliquer') && !A.includes('--dnssec-desactive')) arret('--appliquer exige --dnssec-desactive : le client doit avoir confirmé que DNSSEC est désactivé chez le registrar (statut « désactivé », DS absent des résolveurs publics). Aucun appel n\'a été fait.');

// ----- client API (curl : respecte le proxy de la session ; aucun jeton ici) -----
function api(methode, chemin, corps) {
  const a = ['-s', '--max-time', '60', '-X', methode, API + chemin, '-H', 'Content-Type: application/json', '-w', '\n%{http_code}'];
  if (corps !== undefined) a.push('-d', JSON.stringify(corps));
  const r = spawnSync('curl', a, { encoding: 'utf8' }); const sortie = r.stdout || '', i = sortie.lastIndexOf('\n'), http = Number(sortie.slice(i + 1)); let j = null;
  try { j = JSON.parse(sortie.slice(0, i)); } catch (e) {}
  return { http, ok: !!(j && j.success), j, resultat: j && j.result, erreurs: (j && j.errors || []).map(e => e.message).join(' | ') || (http ? 'HTTP ' + http : 'pas de réponse') };
}
const dns = () => { const out = []; for (let p = 1; p < 50; p++) { const r = api('GET', `/zones/${ZONE}/dns_records?per_page=100&page=${p}`); if (!r.ok) return null; out.push(...r.resultat); if (r.resultat.length < 100) break; } return out; };
const GH_A = new Set(['185.199.108.153', '185.199.109.153', '185.199.110.153', '185.199.111.153']);
const GH_AAAA = new Set(['2606:50c0:8000::153', '2606:50c0:8001::153', '2606:50c0:8002::153', '2606:50c0:8003::153']);
const estGithub = r => (r.type === 'A' && GH_A.has(r.content)) || (r.type === 'AAAA' && GH_AAAA.has(String(r.content).toLowerCase())) || (r.type === 'CNAME' && /\.github\.io\.?$/i.test(r.content));
const estNotre = r => r.type === 'CNAME' && String(r.content).replace(/\.$/, '') === CIBLE && [DOMAINE, WWW].includes(r.name);
const champs = r => ({ type: r.type, name: r.name, content: r.content, proxied: !!r.proxied, ttl: r.ttl || 1, ...(r.priority != null ? { priority: r.priority } : {}), ...(r.comment ? { comment: r.comment } : {}) });

// ===== RETOUR EN ARRIÈRE =====
if (RESTAURER) {
  if (!fs.existsSync(SAUVEGARDE)) arret('sauvegarde introuvable : ' + SAUVEGARDE);
  const sauv = JSON.parse(fs.readFileSync(SAUVEGARDE, 'utf8')), actuels = dns(); if (!actuels) arret('lecture du DNS impossible (jeton ou zone ?)');
  for (const r of actuels.filter(estNotre)) { const d = api('DELETE', `/zones/${ZONE}/dns_records/${r.id}`); t(`Suppression de notre enregistrement ${r.name} → ${r.content}`, d.ok, d.erreurs); }
  const apres = dns() || [];
  for (const r of sauv.enregistrements.filter(estGithub)) {
    if (apres.some(x => x.type === r.type && x.name === r.name && x.content === r.content)) continue;
    const c = api('POST', `/zones/${ZONE}/dns_records`, champs(r)); t(`Rétablissement ${r.type} ${r.name} → ${r.content}`, c.ok, c.erreurs);
  }
  console.log(`\nRetour en arrière : ${ok} opérations réussies, ${ko} en échec. (Les domaines restent déclarés dans le projet Pages ; sans effet tant que le DNS pointe ailleurs.)`); process.exit(ko ? 1 : 0);
}

// ===== 1. CONTRÔLES du projet Pages (lecture seule) =====
console.log(`== 1. Projet Pages « ${PROJET} » (lecture seule) ==`);
const p = api('GET', `/accounts/${COMPTE}/pages/projects/${PROJET}`);
if (!t('Accès au projet Pages (jeton et identifiant de compte valides)', p.ok, p.erreurs)) arret('impossible de lire le projet : vérifier le jeton (Pages « Edit »), l\'Account ID et le nom du projet.');
const proj = p.resultat, prodCfg = (proj.deployment_configs && proj.deployment_configs.production) || {}, vars = Object.keys(prodCfg.env_vars || {});
t('Branche de production = « production »', proj.production_branch === 'production', String(proj.production_branch));
const dep = proj.latest_deployment || proj.canonical_deployment;
t('Dernier déploiement de production réussi', !!dep && dep.latest_stage && dep.latest_stage.status === 'success' && (dep.deployment_trigger && dep.deployment_trigger.metadata && dep.deployment_trigger.metadata.branch) === 'production',
  dep ? `${dep.latest_stage && dep.latest_stage.status} sur ${dep.deployment_trigger && dep.deployment_trigger.metadata && dep.deployment_trigger.metadata.branch}` : 'aucun');
if (dep) console.log(`   commit déployé : ${(dep.deployment_trigger && dep.deployment_trigger.metadata && dep.deployment_trigger.metadata.commit_hash || '').slice(0, 7)}`);
for (const v of ['SESSION_SECRET', 'FIREBASE_COMPTE_SERVICE', 'CREATOR_UID']) t(`Production : secret « ${v} » défini (nom seulement, valeur jamais lue)`, vars.includes(v));
t('Production : AUCUNE variable de paiement (STRIPE_*) : aucun paiement réel possible', !vars.some(v => /^STRIPE_/.test(v)), vars.filter(v => /^STRIPE_/.test(v)).join(','));
t('Production : aucune liaison de stockage Premium (R2) tant que non décidée', !Object.keys(prodCfg.r2_buckets || {}).length);
if (ko) arret('un contrôle du projet a échoué : corriger avant toute modification.');

// ===== 2. SAUVEGARDE DU DNS (avant toute modification) =====
console.log(`\n== 2. Sauvegarde du DNS de la zone ==`);
const avant = dns(); if (!avant) arret('lecture des enregistrements DNS impossible (jeton « DNS Edit » sur la zone ?)');
fs.mkdirSync(path.dirname(SAUVEGARDE), { recursive: true });
fs.writeFileSync(SAUVEGARDE, JSON.stringify({ date: new Date().toISOString(), domaine: DOMAINE, zone: ZONE, enregistrements: avant.map(r => ({ id: r.id, ...champs(r) })) }, null, 1) + '\n');
const relu = JSON.parse(fs.readFileSync(SAUVEGARDE, 'utf8'));
t(`Sauvegarde écrite ET relue : ${relu.enregistrements.length} enregistrements → ${SAUVEGARDE}`, relu.enregistrements.length === avant.length && avant.length > 0);
if (ko) arret('sauvegarde invalide : aucune modification.');

// ----- messagerie : ce que l'outil ne touchera JAMAIS, et ce qui pourrait la casser -----
{
  const mx = avant.filter(r => r.type === 'MX'), txt = avant.filter(r => r.type === 'TXT');
  console.log(`   messagerie (jamais modifiée) : ${mx.length} MX, ${txt.length} TXT${txt.some(r => /v=spf1/i.test(r.content)) ? ' (SPF présent)' : ''}${txt.some(r => /v=DMARC1/i.test(r.content)) ? ', DMARC présent' : ''}${avant.some(r => /_domainkey/.test(r.name)) ? ', DKIM présent' : ''}`);
  if (!mx.length) console.log('   ⚠ AUCUN enregistrement MX dans la zone : si une messagerie existe sur ce domaine, des enregistrements n\'ont pas été importés. Comparer avec l\'ancienne zone (outils/migration/comparer-zones.mjs) AVANT de changer les serveurs de noms.');
  const courrier = avant.filter(r => ['A', 'AAAA', 'CNAME'].includes(r.type) && r.proxied && /^(mail|smtp|imap|pop3?|webmail|autoconfig|autodiscover|mx\d*|ftp|sftp|ssh|vpn)\./i.test(r.name));
  for (const r of courrier) console.log(`   ⚠ ${r.name} (${r.type}) est PROXIFIÉ (nuage orange) : un hôte de messagerie/connexion doit être en « DNS seul » (nuage gris), sinon courrier ou connexion cassés. Non modifié par cet outil.`);
}

// ===== 3. PLAN =====
console.log(`\n== 3. Plan ==`);
const surNom = n => avant.filter(r => r.name === n && ['A', 'AAAA', 'CNAME'].includes(r.type));
const aSupprimer = avant.filter(r => [DOMAINE, WWW].includes(r.name) && estGithub(r)), inconnus = [DOMAINE, WWW].flatMap(surNom).filter(r => !estGithub(r) && !estNotre(r));
for (const r of aSupprimer) console.log(`   - supprimer ${r.type} ${r.name} → ${r.content}  (GitHub Pages)`);
for (const n of [DOMAINE, WWW]) if (!surNom(n).some(estNotre)) console.log(`   + créer CNAME ${n} → ${CIBLE} (proxifié)`);
console.log(`   = conservés intacts : ${avant.filter(r => !aSupprimer.includes(r)).map(r => r.type).filter((x, i, a) => a.indexOf(x) === i).join(', ') || 'aucun'} (${avant.length - aSupprimer.length} enregistrements, dont tout MX/TXT)`);
if (inconnus.length) arret(`enregistrements inattendus sur ${DOMAINE} ou ${WWW} : ${inconnus.map(r => `${r.type} ${r.name} → ${r.content}`).join(' ; ')}. Aucune suppression automatique : à examiner avec le propriétaire.`);
if (!aSupprimer.length && [DOMAINE, WWW].every(n => surNom(n).some(estNotre))) console.log('   (DNS déjà basculé : rien à faire côté DNS)');
if (!APPLIQUER) { console.log(`\nDIAGNOSTIC terminé (${ok} contrôles réussis, ${ko} en échec). Aucune modification distante. Ajouter --appliquer pour exécuter la bascule.`); process.exit(ko ? 1 : 0); }

// ===== 4. BASCULE =====
console.log(`\n== 4. Bascule ==`);
const deja = (api('GET', `/accounts/${COMPTE}/pages/projects/${PROJET}/domains`).resultat || []).map(d => d.name);
for (const n of [DOMAINE, WWW]) { if (deja.includes(n)) { t(`Domaine ${n} déjà déclaré dans le projet Pages`, true); continue; } const r = api('POST', `/accounts/${COMPTE}/pages/projects/${PROJET}/domains`, { name: n }); if (!t(`Domaine personnalisé ${n} ajouté au projet Pages`, r.ok, r.erreurs)) arret('ajout du domaine impossible ; DNS non modifié.'); }
const supprimes = [];
for (const r of aSupprimer) { const d = api('DELETE', `/zones/${ZONE}/dns_records/${r.id}`); if (!t(`Suppression ${r.type} ${r.name} → ${r.content}`, d.ok, d.erreurs)) { restaurerSupprimes('échec d\'une suppression'); } else supprimes.push(r); }
function restaurerSupprimes(raison) {
  console.log(`\n!! ${raison} : rétablissement automatique des ${supprimes.length} enregistrements déjà supprimés`);
  for (const r of supprimes) { const c = api('POST', `/zones/${ZONE}/dns_records`, champs(r)); console.log(`   ${c.ok ? '✓' : '✗'} ${r.type} ${r.name} → ${r.content}`); }
  arret(raison + '. DNS rétabli tel qu\'avant (vérifier avec --restaurer si besoin).');
}
for (const n of [DOMAINE, WWW]) {
  const existe = (dns() || []).some(r => r.name === n && estNotre(r)); if (existe) { t(`CNAME ${n} déjà présent`, true); continue; }
  const c = api('POST', `/zones/${ZONE}/dns_records`, { type: 'CNAME', name: n, content: CIBLE, proxied: true, ttl: 1, comment: 'Lanternes de Nour : Cloudflare Pages (bascule du ' + new Date().toISOString().slice(0, 10) + ')' });
  if (!t(`CNAME ${n} → ${CIBLE} (proxifié)`, c.ok, c.erreurs)) restaurerSupprimes(`création du CNAME ${n} impossible`);
}
console.log(`\n== 5. Attente de l'activation HTTPS (jusqu'à ${ATTENTE_MAX_S} s) ==`);
const fin = Date.now() + ATTENTE_MAX_S * 1000; let actifs = {};
while (Date.now() < fin) {
  for (const n of [DOMAINE, WWW]) { const d = api('GET', `/accounts/${COMPTE}/pages/projects/${PROJET}/domains/${n}`).resultat || {}; actifs[n] = { statut: d.status, certificat: d.validation_data && d.validation_data.status, verification: d.verification_data && d.verification_data.status }; }
  console.log('   ' + [DOMAINE, WWW].map(n => `${n} : ${actifs[n].statut}/${actifs[n].certificat || '?'}`).join(' | '));
  if ([DOMAINE, WWW].every(n => actifs[n].statut === 'active')) break; spawnSync('sleep', [process.env.LDN_ATTENTE_PAS || '10']);
}
for (const n of [DOMAINE, WWW]) t(`${n} : domaine actif et certificat émis`, actifs[n].statut === 'active', JSON.stringify(actifs[n]));
console.log(`\nBascule terminée : ${ok} réussites, ${ko} en échec. Suite : node outils/migration/verifier-production.mjs https://${DOMAINE} --mode production --navigateur`);
console.log(`Retour en arrière possible : node outils/migration/basculer-cloudflare.mjs --compte ${COMPTE} --zone ${ZONE} --restaurer`);
process.exit(ko ? 1 : 0);
