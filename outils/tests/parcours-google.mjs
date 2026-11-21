// Connexion Google dans un vrai navigateur, contre la préproduction locale avec émulateur (compte Google SIMULÉ : aucune connexion à Google).
// Lancé après parcours.mjs par parcours.sh. La vraie fenêtre Google ne peut être testée que sur le site déployé, avec un vrai compte (voir GUIDE_FIREBASE.md).
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT || 'playwright');
const BASE = process.argv[2] || 'http://localhost:8790';
const EXTERNE = /fonts\.(googleapis|gstatic)|ytimg|youtube|jsdelivr|gstatic|islamic\.network|alquran|googleusercontent/;
let ok = 0, ko = 0; const res = [], erreurs = [];
const t = (nom, c, d = '') => { c ? ok++ : ko++; res.push(`${c ? '✓' : '✗'} ${nom}${d && !c ? ' — ' + d : ''}`); };
const nav = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
async function contexte(mobile = false) {
  const ctx = await nav.newContext(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'fr-FR' } : { locale: 'fr-FR' });
  await ctx.route(EXTERNE, r => r.abort());
  await ctx.addInitScript(() => { try { localStorage.setItem('lanternes_intro', JSON.stringify({ off: 1 })); localStorage.setItem('ldn_ouverture_vue', '1'); } catch (e) {} });
  const page = await ctx.newPage(); const g = { prochain: 'parent.google@local.test', fenetres: 0 };
  page.on('dialog', d => { g.fenetres++; d.accept(g.prochain); });            // « fenêtre Google » simulée : on y saisit l'adresse du compte Google fictif
  page.on('pageerror', x => /Transition was aborted/.test(x.message) || erreurs.push(page.url().replace(BASE, '') + ' : ' + x.message));
  page.on('console', m => { if (/Content Security Policy|Refused to/i.test(m.text())) erreurs.push('CSP ' + m.text().slice(0, 140)); });
  return { ctx, page, g };
}
const api = (p, chemin, o = {}) => p.evaluate(async ([c, o]) => { const r = await fetch(c, { method: o.m || 'GET', headers: o.m ? { 'X-LDN': '1', 'Content-Type': 'application/json' } : {}, body: o.b ? JSON.stringify(o.b) : undefined }); return { s: r.status, j: await r.json().catch(() => null) }; }, [chemin, o]);
const visible = (p, s) => p.locator(s).isVisible();
const etat = p => p.locator('#etat').textContent();
async function ouvrirCompte(page) { await page.goto(BASE + '/compte/'); await page.waitForSelector('#v-acces:not(.cache), #v-espace:not(.cache)', { timeout: 5000 }); }
async function googleConnexion(page, g, email) { g.prochain = email; await page.click('#o-connexion'); await page.click('#g-conn'); await page.waitForSelector('#v-espace:not(.cache), #f-consent:not(.cache)', { timeout: 5000 }); }
async function cocher(page) { await page.check('#i-parent'); await page.check('#i-cgu'); await page.check('#i-conf'); }
async function deconnecter(page) { await page.click('#deconnexion'); await page.waitForSelector('#v-acces:not(.cache)', { timeout: 5000 }); }

// ---------- ordinateur ----------
{ const { ctx, page, g } = await contexte();
  await ouvrirCompte(page);
  t('Connexion : bouton « Continuer avec Google » visible et nommé', await visible(page, '#g-conn') && /Continuer avec Google/.test(await page.locator('#g-conn').innerText()));
  await page.click('#o-inscription');
  t('Création : bouton « Créer mon compte avec Google » visible', await visible(page, '#g-insc') && /Créer mon compte avec Google/.test(await page.locator('#g-insc').innerText()));
  // 1. création sans consentements : refusée, la fenêtre Google ne s'ouvre pas
  await page.click('#g-insc'); await page.waitForTimeout(400);
  t('Création Google sans consentements : refusée, aucune fenêtre Google ouverte', g.fenetres === 0 && /Cochez d'abord/.test(await etat(page)));
  // 2. création avec consentements
  g.prochain = 'parent.g1@local.test'; await cocher(page); await page.click('#g-insc'); await page.waitForSelector('#v-espace:not(.cache)', { timeout: 5000 });
  t('Création Google : compte ouvert, e-mail affiché, indiqué « compte Google »', /parent\.g1@local\.test \(compte Google\)/.test(await page.locator('#e-email').innerText()));
  let moi = (await api(page, '/api/moi')).j;
  t('Création Google : statut Gratuit, fournisseur google.com, adresse vérifiée, pas Créateur', moi.statut === 'gratuit' && moi.fournisseur === 'google.com' && moi.emailVerifie === true && !moi.admin);
  t('Création Google : aucun encadré de vérification d\'e-mail (Google l\'a déjà vérifiée)', !(await visible(page, '#e-verif')));
  const e1 = await api(page, '/api/enfants', { m: 'POST', b: { surnom: 'Inaya', tranche: '3-5', avatar: 'fille' } });
  t('Profil enfant créé avec un compte Google', e1.s === 201);
  t('Droits Gratuit identiques : second profil refusé', (await api(page, '/api/enfants', { m: 'POST', b: { surnom: 'Rayan', tranche: '6-10', avatar: 'garcon' } })).j.erreur === 'limite-profils');
  t('Administration fermée à un compte Google ordinaire', (await api(page, '/api/admin/resume')).s === 403);
  // 3. retour : même compte via Google, sans nouveau consentement
  await deconnecter(page);
  await googleConnexion(page, g, 'parent.g1@local.test');
  t('Retour avec Google : directement dans l\'espace, sans redemander les consentements', await visible(page, '#v-espace') && !(await visible(page, '#f-consent')));
  t('Retour avec Google : le profil enfant est retrouvé', JSON.stringify((await api(page, '/api/enfants')).j).includes('Inaya'));
  // 4. suppression d'un compte Google : pas de mot de passe, confirmation par Google
  await page.click('#supprimer');
  t('Suppression (compte Google) : champ mot de passe masqué, explication Google affichée', !(await visible(page, '#s-mdp-label')) && await visible(page, '#s-google-info'));
  await page.fill('#s-mot', 'SUPPRIMER');
  g.prochain = 'autre.compte@local.test'; await page.click('#f-supprimer button[type=submit]'); await page.waitForTimeout(700);
  t('Suppression : un AUTRE compte Google à la reconfirmation est refusé, rien n\'est supprimé', (await api(page, '/api/moi')).j.connecte === true && /pas le compte Google/.test(await etat(page)));
  g.prochain = 'parent.g1@local.test'; const avant = g.fenetres; await page.click('#f-supprimer button[type=submit]');
  await page.waitForFunction(() => /supprimés/.test(document.getElementById('etat').textContent), null, { timeout: 6000 }).catch(() => {});
  t('Suppression (compte Google) : reconfirmation par Google demandée puis compte supprimé', g.fenetres === avant + 1 && /supprimés/.test(await etat(page)));
  t('Suppression (compte Google) : plus de session', (await api(page, '/api/moi')).j.connecte === false);
  // 5. nouveau compte Google depuis l'onglet connexion : écran des consentements, puis annulation propre
  await ouvrirCompte(page); await googleConnexion(page, g, 'parent.g2@local.test');
  t('Nouveau compte Google depuis « Se connecter » : écran des consentements affiché', await visible(page, '#f-consent'));
  await page.click('#consent-annuler'); await page.waitForFunction(() => /annulée/.test(document.getElementById('etat').textContent), null, { timeout: 5000 }).catch(() => {});   // (le conteneur est déjà visible : on attend le message lui-même)
  t('Annulation : message clair et aucune session ouverte', /annulée/.test(await etat(page)) && (await api(page, '/api/moi')).j.connecte === false);
  await googleConnexion(page, g, 'parent.g2@local.test');
  t('Après annulation, le compte Google n\'existait plus : les consentements sont redemandés', await visible(page, '#f-consent'));
  await cocher(page); await page.click('#f-consent button[type=submit]'); await page.waitForSelector('#v-espace:not(.cache)', { timeout: 5000 });
  t('Consentements donnés : compte ouvert', (await api(page, '/api/moi')).j.connecte === true);
  await ctx.close(); }

// ---------- un parent : e-mail + mot de passe PUIS Google (comptes liés, même famille) ----------
{ const { ctx, page, g } = await contexte();
  await page.goto(BASE + '/compte/'); await page.click('#o-inscription'); await page.fill('#i-email', 'lie@local.test'); await page.fill('#i-mdp', 'motdepasse-1'); await page.fill('#i-mdp2', 'motdepasse-1'); await cocher(page);
  await page.click('#f-inscription button[type=submit]'); await page.waitForSelector('#v-espace:not(.cache)', { timeout: 5000 });
  await api(page, '/api/enfants', { m: 'POST', b: { surnom: 'Maryam', tranche: '3-5', avatar: 'fille' } });
  t('Compte e-mail : fournisseur « password » (pas de mention Google)', (await api(page, '/api/moi')).j.fournisseur === 'password' && !/compte Google/.test(await page.locator('#e-email').innerText()));
  await deconnecter(page);
  await googleConnexion(page, g, 'lie@local.test');
  t('Même adresse avec Google : même famille retrouvée sans nouveau consentement', await visible(page, '#v-espace') && JSON.stringify((await api(page, '/api/enfants')).j).includes('Maryam'));
  await ctx.close(); }

// ---------- Créateur connecté avec Google : reconfirmation par Google après 15 minutes ----------
{ const { ctx, page, g } = await contexte();
  await ouvrirCompte(page); await googleConnexion(page, g, 'createur@local.test');
  const moi = (await api(page, '/api/moi')).j;
  t('Créateur via Google (même compte que le Créateur e-mail, rôle conservé)', moi.statut === 'creator' && moi.fournisseur === 'google.com');
  await page.goto(BASE + '/admin/'); await page.waitForSelector('#v-admin:not(.cache)', { timeout: 5000 });
  await api(page, '/api/_emulateur/horloge', { m: 'POST', b: { jours: 20 / 1440 } });            // +20 minutes (horloge simulée)
  await page.click('button[data-o=contenus]'); await page.waitForSelector('#bandeau', { state: 'visible' });
  await page.fill('#bandeau', 'Test Google'); await page.click('#f-bandeau button[type=submit]');
  await page.waitForSelector('#v-reauth:not(.cache)', { timeout: 4000 }).catch(() => {});
  t('Administration (Créateur Google) : après 15 min, reconfirmation demandée sans champ mot de passe', await visible(page, '#v-reauth') && !(await visible(page, '#r-mdp-label')) && await visible(page, '#r-google-info'));
  const avant = g.fenetres; await page.click('#v-reauth button[type=submit]');
  await page.waitForFunction(() => /Identité confirmée/.test(document.getElementById('etat').textContent), null, { timeout: 5000 }).catch(() => {});
  t('Administration : confirmation par Google, puis la modification est rejouée', g.fenetres === avant + 1 && (await api(page, '/api/catalogue')).j.bandeau === 'Test Google');
  await api(page, '/api/admin/bandeau', { m: 'POST', b: { texte: null } });
  await ctx.close(); }

// ---------- navigateur intégré à une application ----------
{ const ctx = await nav.newContext({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 300.0', locale: 'fr-FR' }); await ctx.route(EXTERNE, r => r.abort());
  const page = await ctx.newPage(); await page.goto(BASE + '/compte/'); await page.waitForSelector('#v-acces:not(.cache)', { timeout: 5000 });
  t('Navigateur intégré (Instagram) : explication affichée, e-mail + mot de passe toujours disponibles', await visible(page, '#g-webview') && await visible(page, '#f-connexion') && /Safari ou Chrome/.test(await page.locator('#g-webview').innerText()));
  await ctx.close();
  const { ctx: c2, page: p2 } = await contexte(); await ouvrirCompte(p2);
  t('Navigateur normal : aucune explication parasite', !(await visible(p2, '#g-webview'))); await c2.close(); }

// ---------- téléphone ----------
{ const { ctx, page, g } = await contexte(true);
  await ouvrirCompte(page);
  const d = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  const box = await page.locator('#g-conn').boundingBox();
  t('Téléphone 390 px : page de connexion sans défilement horizontal', d <= 1, d + ' px');
  t('Téléphone : bouton Google de taille tactile suffisante (≥ 44 px) et dans l\'écran', box && box.height >= 44 && box.x >= 0 && box.x + box.width <= 390, JSON.stringify(box));
  await googleConnexion(page, g, 'mobile.g@local.test'); await page.waitForSelector('#f-consent:not(.cache)', { timeout: 4000 }).catch(() => {});
  await cocher(page); await page.click('#f-consent button[type=submit]'); await page.waitForSelector('#v-espace:not(.cache)', { timeout: 5000 });
  t('Téléphone : création d\'un compte Google de bout en bout', (await api(page, '/api/moi')).j.fournisseur === 'google.com');
  await ctx.close(); }

{ const fs = await import('fs'); for (const f of ['admin', 'apercu']) { const h = fs.readFileSync(new URL(`../../${f}/index.html`, import.meta.url), 'utf8');
  t(`/${f}/ : reconfirmation Google prévue (bouton sans mot de passe, SDK préchargé)`, /reauthentifierGoogle\(\)/.test(h) && /r-mdp-label/.test(h) && /prechargerAuth\(\)/.test(h)); } }
t('Aucune erreur JavaScript ni violation CSP pendant les parcours Google', erreurs.length === 0, erreurs.slice(0, 3).join(' / '));
await nav.close();
console.log(res.join('\n')); console.log(`\n${ok} réussis, ${ko} échoués`); process.exit(ko ? 1 : 0);
