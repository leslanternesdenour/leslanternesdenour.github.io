// Parcours complets dans un vrai navigateur, contre la préproduction locale AVEC ÉMULATEUR (simulation des services extérieurs).
// Démarrer : node outils/construire.mjs && LDN_EMULATEUR=1 LDN_EMUL_MDP_CREATEUR=createur-local-123 node outils/serveur-preprod.mjs 8790
// Puis : node outils/tests/parcours.mjs http://localhost:8790
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT || 'playwright');
const BASE = process.argv[2] || 'http://localhost:8790', MDP_CREATEUR = process.env.LDN_EMUL_MDP_CREATEUR || 'createur-local-123';
const EXTERNE = /fonts\.(googleapis|gstatic)|ytimg|youtube|jsdelivr|gstatic|islamic\.network|alquran|googleusercontent/;
let ok = 0, ko = 0; const res = [];
const t = (nom, c, d = '') => { c ? ok++ : ko++; res.push(`${c ? '✓' : '✗'} ${nom}${d && !c ? ' — ' + d : ''}`); };
const nav = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const erreurs = []; let transitions = 0;
// Chrome signale parfois une transition de page native interrompue (@view-transition de univers.css) quand on change
// de page très vite : sans effet pour l'utilisateur. Comptée à part, pas mélangée aux vraies erreurs.
const BRUIT = /Transition was aborted because of invalid state/;
async function contexte(mobile = true) {
  const ctx = await nav.newContext(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'fr-FR' } : { locale: 'fr-FR' });
  await ctx.route(EXTERNE, r => r.abort());              // aucun service extérieur pendant les tests
  await ctx.addInitScript(() => { try { localStorage.setItem('lanternes_intro', JSON.stringify({ off: 1 })); localStorage.setItem('ldn_ouverture_vue', '1'); } catch (e) {} });
  const page = await ctx.newPage();
  page.on('dialog', d => d.accept());
  page.on('pageerror', x => BRUIT.test(x.message) ? transitions++ : erreurs.push(page.url().replace(BASE, '') + ' : ' + x.message));
  page.on('console', m => { if (/Content Security Policy|Refused to/i.test(m.text())) erreurs.push('CSP ' + m.text().slice(0, 140)); });
  return { ctx, page };
}
const etat = p => p.locator('#etat').textContent();
const visible = (p, s) => p.locator(s).isVisible();
const attendreEtat = async (p, re, ms = 4000) => { try { await p.waitForFunction(r => new RegExp(r).test(document.getElementById('etat').textContent), re.source, { timeout: ms }); return true; } catch (e) { return false; } };
const apiDepuis = (p, chemin, o = {}) => p.evaluate(async ([c, o]) => { const r = await fetch(c, { method: o.m || 'GET', headers: o.m ? { 'X-LDN': '1', 'Content-Type': 'application/json' } : {}, body: o.b ? JSON.stringify(o.b) : undefined });
  return { s: r.status, cc: r.headers.get('cache-control'), j: await r.json().catch(() => null) }; }, [chemin, o]);
const PREMIUM = '/api/premium/voyage/camp/zone.json';
async function inscrire(page, email, mdp = 'motdepasse-1') {
  await page.goto(BASE + '/compte/'); await page.click('#o-inscription'); await page.waitForSelector('#f-inscription:not(.cache)');
  await page.fill('#i-email', email); await page.fill('#i-mdp', mdp); await page.fill('#i-mdp2', mdp);
  await page.check('#i-parent'); await page.check('#i-cgu'); await page.check('#i-conf');
  await page.click('#f-inscription button[type=submit]'); await page.waitForSelector('#v-espace:not(.cache)', { timeout: 5000 });
}
async function connecter(page, email, mdp) {
  await page.goto(BASE + '/compte/'); await page.waitForSelector('#f-connexion:not(.cache)');
  await page.fill('#c-email', email); await page.fill('#c-mdp', mdp); await page.click('#f-connexion button[type=submit]');
  await page.waitForSelector('#v-espace:not(.cache), #f-consent:not(.cache)', { timeout: 5000 });
  if (await visible(page, '#f-consent')) {          // première connexion d'un compte sans consentements enregistrés
    await page.check('#i-parent'); await page.check('#i-cgu'); await page.check('#i-conf'); await page.click('#f-consent button[type=submit]');
    await page.waitForSelector('#v-espace:not(.cache)', { timeout: 5000 }); consentDemande = true;
  }
}
async function verifierEmail(page) { await page.click('#verif-simuler'); await attendreEtat(page, /SIMULATION/); await page.click('#verif-fait'); await page.waitForSelector('#e-verif.cache', { state: 'attached', timeout: 4000 }); }
async function ajouterEnfant(page, surnom, avatar = 'fille') {
  if (!(await visible(page, '#f-enfant'))) await page.click('#enf-ajouter');
  await page.fill('#enf-surnom', surnom); await page.selectOption('#enf-avatar', avatar); await page.click('#f-enfant button[type=submit]');
  await page.waitForFunction(s => [...document.querySelectorAll('#enf-liste .nom')].some(n => n.firstChild.textContent === s), surnom, { timeout: 4000 });
}
const statut = p => p.locator('#e-statut').textContent();
const choisir = async (page, surnom) => { await page.locator('#enf-liste .enfant', { hasText: surnom }).locator('button').first().click(); await attendreEtat(page, new RegExp(surnom + ' joue')); };
let consentDemande = false;
const ls = (p, k) => p.evaluate(k => localStorage.getItem(k), k);

// ===== 1. Visiteur =====
{
  const { ctx, page } = await contexte();
  await page.goto(BASE + '/compte/'); await page.waitForSelector('#v-acces:not(.cache)');
  t('Visiteur : l\'Espace famille propose connexion et inscription', true);
  t('Visiteur : le bandeau SIMULATION est affiché', await visible(page, '#bandeau-sim'));
  t('Visiteur : un contenu Premium est refusé (401)', (await apiDepuis(page, PREMIUM)).s === 401);
  await page.goto(BASE + '/compte/'); await page.click('#o-inscription'); await page.waitForSelector('#f-inscription:not(.cache)');
  await page.fill('#i-email', 'x@local.test'); await page.fill('#i-mdp', 'motdepasse-1'); await page.fill('#i-mdp2', 'motdepasse-1');
  await page.click('#f-inscription button[type=submit]');
  t('Inscription : impossible sans les trois consentements', /cocher/.test(await etat(page)) && !(await visible(page, '#v-espace')));
  await page.goto(BASE + '/admin/'); await page.waitForTimeout(600);
  t('Visiteur : /admin/ affiche « Réservé au compte Créateur »', await visible(page, '#v-refus') && !(await visible(page, '#v-admin')));
  t('Visiteur : l\'API d\'administration refuse (401)', (await apiDepuis(page, '/api/admin/resume')).s === 401);
  const h = await page.goto(BASE + '/admin/'); t('/admin/ : en-têtes no-store et noindex', h.headers()['cache-control'] === 'no-store' && /noindex/.test(h.headers()['x-robots-tag'] || ''));
  await ctx.close();
}

// ===== 2. Parent A : Gratuit → Famille (paiement simulé) → résiliation → fin de période =====
const A = 'parent.a@local.test', MDP_A = 'motdepasse-A1';
{
  const { ctx, page } = await contexte();
  await page.evaluate(() => {}).catch(() => {});
  await page.goto(BASE + '/compte/'); await page.evaluate(() => localStorage.setItem('ablutions', JSON.stringify({ g1: 3, learned: 1 })));   // progrès faits avant le compte
  await inscrire(page, A, MDP_A);
  t('Parent A : compte créé, statut Gratuit', /Gratuit/.test(await statut(page)), await statut(page));
  t('Parent A : demande de validation de l\'adresse affichée', await visible(page, '#e-verif'));
  await ajouterEnfant(page, 'Lina');
  const p1 = JSON.parse(await ls(page, 'ldn_profil_actif') || 'null');
  t('Gratuit : le premier profil devient le profil actif (un seul sur l\'appareil)', p1 && p1.surnom === 'Lina' && p1.synchro === false, JSON.stringify(p1));
  t('Gratuit : les progrès faits avant le compte restent sur l\'appareil', JSON.parse(await ls(page, 'ablutions') || '{}').g1 === 3);
  t('Gratuit : 1 profil maximum (bouton d\'ajout masqué)', !(await visible(page, '#enf-ajouter')) && /1 profil sur 1/.test(await page.locator('#enf-info').textContent()));
  t('Gratuit : l\'API refuse un 2e profil (403)', (await apiDepuis(page, '/api/enfants', { m: 'POST', b: { surnom: 'Yanis', tranche: '6-10', avatar: 'garcon' } })).s === 403);
  t('Parent : l\'API d\'administration refuse un compte ordinaire (403)', (await apiDepuis(page, '/api/admin/resume')).s === 403);
  await page.goto(BASE + '/admin/'); await page.waitForTimeout(500);
  t('Parent : /admin/ affiche « Réservé au compte Créateur »', await visible(page, '#v-refus'));
  await page.goto(BASE + '/compte/'); await page.waitForSelector('#v-enfants:not(.cache)');
  t('Gratuit : contenu Premium refusé (403)', (await apiDepuis(page, PREMIUM)).s === 403);
  t('Gratuit : la synchronisation est refusée par le serveur (403)', (await apiDepuis(page, '/api/enfants/' + p1.id + '/progression', { m: 'PUT', b: { progression: {} } })).s === 403);
  // tarifs : e-mail non vérifié → refus ; puis vérification, consentements, paiement simulé
  await verifierEmail(page);
  t('Validation de l\'adresse (lien simulé) reconnue', !(await visible(page, '#e-verif')));
  await page.goto(BASE + '/tarifs/'); t('Tarifs : bandeau MODE TEST visible', await visible(page, '#bandeau-test'));
  await page.click('button[data-formule=famille_annuel]'); await page.waitForSelector('#p-form:not(.cache)');
  t('Tarifs : plus de question à résoudre, les consentements s\'affichent directement', !(await page.locator('#p-porte').count()) && await visible(page, '#p-form'));
  await page.click('#p-form button[type=submit]');
  t('Paiement : impossible sans CGV et renonciation à la rétractation', /cocher/.test(await etat(page)));
  await page.check('#p-cgv'); await page.check('#p-exec'); await page.click('#p-form button[type=submit]');
  await page.waitForURL(/_emulateur\/paiement/, { timeout: 5000 }); t('Paiement : redirection vers la page de paiement (SIMULATION)', true);
  await page.click('#payer'); await page.waitForURL(/compte\/\?paiement=ok/, { timeout: 5000 }); await page.waitForSelector('#v-espace:not(.cache)');
  t('Après paiement simulé : statut Abonné · Famille (webhook signé traité)', /Abonné · Famille/.test(await statut(page)), await statut(page));
  t('Famille : contenu Premium servi avec Cache-Control private, no-store', await apiDepuis(page, PREMIUM).then(r => r.s === 200 && r.cc === 'private, no-store'));
  await page.goto(BASE + '/tarifs/'); await page.click('button[data-formule=premium_annuel]'); await page.waitForTimeout(400);
  t('Double facturation : un abonné ne peut pas reprendre un abonnement', await visible(page, '#p-bloque') && !(await visible(page, '#p-form')));
  t('Double facturation : l\'API refuse aussi (409)', (await apiDepuis(page, '/api/paiement/session', { m: 'POST', b: { formule: 'premium_annuel', consentements: { cgv: true, executionImmediate: true } } })).s === 409);
  // profils et synchronisation événementielle
  await page.goto(BASE + '/compte/'); await page.waitForSelector('#v-enfants:not(.cache)');
  await choisir(page, 'Lina');   // re-choisir avec la formule Famille active la synchronisation
  t('Famille : le profil actif est synchronisé', JSON.parse(await ls(page, 'ldn_profil_actif')).synchro === true);
  await ajouterEnfant(page, 'Yanis', 'garcon'); await ajouterEnfant(page, 'Sara');
  t('Famille : 3 profils sur 5', /3 profils sur 5/.test(await page.locator('#enf-info').textContent()));
  // sur le village : aucun envoi sans événement, un envoi au retour d'une activité, un envoi quand la page est masquée
  const envois = [];
  page.on('request', r => { if (r.method() === 'PUT' && /progression/.test(r.url())) envois.push(r.url()); });
  await page.goto(BASE + '/monde/'); await page.waitForTimeout(2500);
  t('Village : l\'enfant qui joue est affiché (« Qui joue ? »)', /Lina/.test(await page.locator('#qui-joue').textContent().catch(() => '')));
  const avant = envois.length;
  await page.evaluate(() => localStorage.setItem('ablutions', JSON.stringify({ g1: 3, g2: 3, learned: 1 })));
  await page.waitForTimeout(3000);
  t('Synchronisation : rien n\'est envoyé sans événement (pas de minuteur)', envois.length === avant, envois.length - avant + ' envoi(s)');
  await page.evaluate(() => dispatchEvent(new Event('ldn:fin-activite'))); await page.waitForTimeout(800);
  t('Synchronisation : envoi au retour au village', envois.length === avant + 1, String(envois.length - avant));
  await page.evaluate(() => dispatchEvent(new Event('ldn:fin-activite'))); await page.waitForTimeout(800);
  t('Synchronisation : pas de nouvel envoi si rien n\'a changé', envois.length === avant + 1);
  await page.evaluate(() => { localStorage.setItem('priere', JSON.stringify({ etape: 2 })); Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(800);
  t('Synchronisation : envoi quand la page est masquée', envois.length === avant + 2);
  // changement d'enfant : les progrès ne se mélangent pas, et chacun retrouve les siens
  await page.goto(BASE + '/compte/'); await page.waitForSelector('#v-enfants:not(.cache)');
  await choisir(page, 'Yanis');
  t('Changement d\'enfant : Yanis repart de zéro (pas les progrès de Lina)', (await ls(page, 'ablutions')) === null && (await ls(page, 'priere')) === null);
  await page.evaluate(() => localStorage.setItem('ablutions', JSON.stringify({ g1: 1 })));
  await choisir(page, 'Lina');
  t('Changement d\'enfant : Lina retrouve ses progrès depuis le compte', JSON.parse(await ls(page, 'ablutions') || '{}').g2 === 3 && JSON.parse(await ls(page, 'priere') || '{}').etape === 2);
  await choisir(page, 'Yanis');
  t('Changement d\'enfant : les progrès de Yanis ont été enregistrés avant de changer', JSON.parse(await ls(page, 'ablutions') || '{}').g1 === 1);
  await choisir(page, 'Lina');
  // résiliation en 3 gestes puis fin de période
  await page.click('#off-resilier'); await page.click('#off-oui');
  t('Résiliation en 3 gestes : accès conservé jusqu\'à la fin de période', await attendreEtat(page, /Accès conservé jusqu/));
  await page.goto(BASE + '/_emulateur/portail/'); await page.click('#fin'); await page.waitForTimeout(500);
  await page.goto(BASE + '/compte/'); await page.waitForSelector('#v-enfants:not(.cache)');
  t('Fin de période : retour en Gratuit', /Gratuit/.test(await statut(page)), await statut(page));
  const geles = await page.locator('#enf-liste .badge.froid').count();
  t('Fin de période : 2 profils en pause ❄️, aucun supprimé (3 profils gardés)', geles === 2 && (await page.locator('#enf-liste .enfant').count()) === 3, geles + ' gelé(s)');
  t('Fin de période : le profil actif (Lina) reste utilisable', (await page.locator('#enf-liste .enfant.actif .badge.froid').count()) === 0);
  t('Fin de période : contenu Premium à nouveau refusé (403)', (await apiDepuis(page, PREMIUM)).s === 403);
  await ctx.close();
}

// ===== 3. Créateur : invitation pour un proche =====
let lien = null;
{
  const { ctx, page } = await contexte();
  await connecter(page, 'createur@local.test', MDP_CREATEUR);
  t('Première connexion du Créateur : les consentements sont demandés une fois', consentDemande);
  t('Créateur : statut Créateur, lien d\'administration', /Créateur/.test(await statut(page)) && await visible(page, '#off-admin'));
  await page.goto(BASE + '/admin/'); await page.waitForSelector('#v-admin:not(.cache)');
  await page.waitForFunction(() => document.querySelectorAll('#chiffres div').length > 0);
  t('Admin : vue d\'ensemble (familles, payants, offerts, gratuits)', /Familles/.test(await page.locator('#chiffres').textContent()));
  await page.click('[data-o=invitations]'); await page.fill('#inv-email', 'Proche.B@local.test'); await page.selectOption('#inv-niveau', 'premium'); await page.selectOption('#inv-duree', '30');
  await page.click('#f-inv button[type=submit]'); await page.waitForSelector('#inv-resultat:not(.cache)');
  lien = await page.locator('#inv-lien').textContent();
  t('Admin : lien d\'invitation à usage unique créé', /\/compte\/\?invite=LDN_/.test(lien), lien);
  t('Admin : bouton WhatsApp prérempli', /wa\.me\/\?text=/.test(await page.locator('#inv-whatsapp').getAttribute('href')));
  t('Admin : l\'invitation apparaît « En attente »', /En attente/.test(await page.locator('#t-inv').textContent()));
  await page.click('[data-o=comptes]'); await page.waitForFunction(() => document.querySelectorAll('#t-comptes tr').length > 0);
  t('Admin : la liste des comptes contient le parent A', (await page.locator('#t-comptes').textContent()).includes(A));
  // profils illimités pour le Créateur, affichés par pages de 20
  for (let i = 0; i < 25; i++) await apiDepuis(page, '/api/enfants', { m: 'POST', b: { surnom: 'Enfant ' + String.fromCharCode(65 + (i % 26)) + String.fromCharCode(97 + Math.floor(i / 26)), tranche: '6-10', avatar: 'garcon' } });
  await page.goto(BASE + '/compte/'); await page.waitForSelector('#v-enfants:not(.cache)'); await page.waitForTimeout(400);
  const n1 = await page.locator('#enf-liste .enfant').count();
  await page.click('#enf-plus'); await page.waitForTimeout(500);
  const n2 = await page.locator('#enf-liste .enfant').count();
  t('Créateur : 25 profils créés, affichés 20 puis 25 (pagination d\'affichage seulement)', n1 === 20 && n2 === 25, n1 + ' puis ' + n2);
  t('Créateur : mention « illimité »', /illimité/.test(await page.locator('#enf-info').textContent()));
  t('Créateur : le bouton d\'ajout reste disponible', await visible(page, '#enf-ajouter'));
  await ctx.close();
}

// ===== 4. Proche B : activation de l'invitation =====
{
  const { ctx, page } = await contexte();
  await page.goto(lien); await page.waitForSelector('#v-acces:not(.cache)');
  t('Lien d\'invitation : le code disparaît de la barre d\'adresse', !/invite=/.test(page.url()));
  t('Lien d\'invitation : la carte « accès offert » est affichée', await visible(page, '#v-invitation'));
  await page.fill('#i-email', 'proche.b@local.test'); await page.fill('#i-mdp', 'motdepasse-B1'); await page.fill('#i-mdp2', 'motdepasse-B1');
  await page.check('#i-parent'); await page.check('#i-cgu'); await page.check('#i-conf'); await page.click('#f-inscription button[type=submit]');
  await page.waitForSelector('#v-espace:not(.cache)');
  await page.click('#inv-activer'); await page.waitForTimeout(500);
  t('Invitation : refusée tant que l\'adresse n\'est pas validée', /Validez/.test(await etat(page)), await etat(page));
  await verifierEmail(page);
  await page.click('#inv-activer'); await attendreEtat(page, /activé/);
  t('Invitation : activée → Accès offert · Premium', /Accès offert · Premium/.test(await statut(page)), await statut(page));
  t('Invité : contenu Premium accessible', (await apiDepuis(page, PREMIUM)).s === 200);
  await page.goto(BASE + '/tarifs/'); await page.click('button[data-formule=premium_annuel]'); await page.waitForTimeout(400);
  t('Double facturation : un invité Premium n\'est pas invité à payer', /accès offert/.test(await page.locator('#p-bloque').textContent()));
  t('Double facturation : l\'API refuse aussi (409)', (await apiDepuis(page, '/api/paiement/session', { m: 'POST', b: { formule: 'premium_annuel', consentements: { cgv: true, executionImmediate: true } } })).s === 409);
  const code = new URL(lien).searchParams.get('invite');
  t('Invitation : un second usage est refusé', (await apiDepuis(page, '/api/invitations/activer', { m: 'POST', b: { code } })).j?.erreur === 'deja-utilisee');
  await ctx.close();
}

// ===== 5. Créateur : révocation (avec reconnexion demandée après 15 min) =====
{
  const { ctx, page } = await contexte();
  await connecter(page, 'createur@local.test', MDP_CREATEUR);
  await apiDepuis(page, '/api/_emulateur/horloge', { m: 'POST', b: { jours: 20 / 1440 } });   // +20 minutes (horloge simulée)
  await page.goto(BASE + '/admin/'); await page.waitForSelector('#v-admin:not(.cache)'); await page.click('[data-o=acces]');
  await page.waitForFunction(() => /proche\.b/.test(document.getElementById('t-acces').textContent));
  await page.locator('#t-acces tr', { hasText: 'proche.b' }).locator('button.danger').click();
  await page.waitForSelector('#v-reauth:not(.cache)', { timeout: 4000 });
  t('Admin : après 15 min, une modification redemande le mot de passe', true);
  await page.fill('#r-mdp', MDP_CREATEUR); await page.click('#v-reauth button[type=submit]');
  t('Admin : après confirmation, la révocation est rejouée', await attendreEtat(page, /Accès révoqué/));
  t('Admin : l\'accès apparaît « Révoqué »', /Révoqué/.test(await page.locator('#t-acces').textContent()));
  await page.click('[data-o=journal]'); await page.waitForFunction(() => document.querySelectorAll('#t-journal tr').length > 0);
  t('Admin : le journal trace la révocation', /acces-revoque/.test(await page.locator('#t-journal').textContent()));
  await ctx.close();
  const b = await contexte(); await connecter(b.page, 'proche.b@local.test', 'motdepasse-B1');
  t('Après révocation : le proche repasse en Gratuit', /Gratuit/.test(await statut(b.page)), await statut(b.page));
  t('Après révocation : contenu Premium refusé (403)', (await apiDepuis(b.page, PREMIUM)).s === 403);
  await b.ctx.close();
}

// ===== 6. Parent A : déconnexion puis suppression complète (RGPD) =====
{
  const { ctx, page } = await contexte();
  await connecter(page, A, MDP_A);
  await page.click('#deconnexion'); await page.waitForSelector('#v-acces:not(.cache)');
  t('Déconnexion : profil actif retiré de l\'appareil', (await ls(page, 'ldn_profil_actif')) === null);
  t('Déconnexion : la session est fermée', (await apiDepuis(page, '/api/moi')).j.connecte === false);
  await connecter(page, A, MDP_A);
  await page.click('#supprimer'); await page.fill('#s-mdp', MDP_A); await page.fill('#s-mot', 'supprimer');
  await page.click('#f-supprimer button[type=submit]');
  t('Suppression : confirmation affichée', await attendreEtat(page, /supprimés/));
  t('Suppression : progrès effacés de l\'appareil', (await ls(page, 'ablutions')) === null && (await ls(page, 'ldn_profil_actif')) === null);
  await page.goto(BASE + '/compte/'); await page.fill('#c-email', A); await page.fill('#c-mdp', MDP_A); await page.click('#f-connexion button[type=submit]');
  t('Suppression : le compte n\'existe plus (connexion impossible)', await attendreEtat(page, /incorrect/));
  await ctx.close();
  const c = await contexte(); await connecter(c.page, 'createur@local.test', MDP_CREATEUR);
  const liste = await apiDepuis(c.page, '/api/admin/comptes');
  t('Suppression : le compte a disparu de l\'administration', !JSON.stringify(liste.j).includes(A));
  const j = await apiDepuis(c.page, '/api/admin/journal');
  t('Suppression : plus aucune trace de l\'adresse dans le journal', !JSON.stringify(j.j).includes(A));
  // mise en page mobile des pages de compte
  for (const p of ['/compte/', '/tarifs/', '/admin/', '/conditions/']) {
    await c.page.goto(BASE + p); await c.page.waitForTimeout(700);
    const d = await c.page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    t(`Mobile 390 px : ${p} sans défilement horizontal`, d <= 1, d + ' px');
  }
  await c.ctx.close();
}
{ const fs = await import('fs'); const src = ['compte/client.js', 'compte/synchro.js'].map(f => fs.readFileSync(new URL('../../' + f, import.meta.url), 'utf8')).join('\n');
  t('Synchronisation : aucun minuteur (setInterval/setTimeout) dans le code de synchronisation', !/set(Interval|Timeout)\s*\(/.test(src)); }
t('Aucune erreur JavaScript ni violation CSP pendant tous les parcours', erreurs.length === 0, erreurs.slice(0, 3).join(' / '));
await nav.close();
if (transitions) res.push(`   ℹ ${transitions} transition(s) de page interrompue(s) signalée(s) par Chrome (sans effet visible)`);
console.log(res.join('\n')); console.log(`\n${ok} réussis, ${ko} échoués`); process.exit(ko ? 1 : 0);
