// Parcours « compte visible » dans un vrai navigateur, contre la préproduction locale AVEC ÉMULATEUR (jamais de vrai compte) :
//  1. nouveau visiteur : « Se connecter » / « Créer un compte » visibles sur l'accueil, le village, le Grand Voyage, les ablutions, la prière, le calendrier, Découvrir, Tarifs ;
//  2. inscription par e-mail depuis le village → validation de l'adresse → création du profil enfant → retour AUTOMATIQUE vers le village ;
//  3. session conservée après actualisation ; espace famille ; 4. déconnexion ; 5. reconnexion (compte existant) avec retour vers le Grand Voyage ;
//  6. connexion Google (simulée) ; 7. protections : un visiteur n'obtient ni enfants, ni administration, ni contenu Premium ; 8. retour malveillant refusé.
// Démarrer : bash outils/tests/parcours-compte-visible.sh
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT || 'playwright');
const BASE = process.argv[2] || 'http://localhost:8797';
let x, ok = 0, ko = 0; const t = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); c ? ok++ : ko++; };
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
await ctx.addInitScript(() => { try { localStorage.setItem('lanternes_intro', JSON.stringify({ vu: true, masquer: true })); } catch (e) {} });
const p = await ctx.newPage(); p.on('dialog', d => d.accept('parent.google@local.test'));
const barre = () => p.evaluate(() => [...document.querySelectorAll('#ldn-compte a,#ldn-compte button')].map(e => e.textContent.trim()));
const statut = (u, o) => p.evaluate(async ([u, o]) => (await fetch(u, o)).status, [u, o]);
const moi = () => p.evaluate(() => fetch('/api/moi', { cache: 'no-store' }).then(r => r.json()));
const fin = () => p.evaluate(() => fetch('/api/session/fin', { method: 'POST', headers: { 'X-LDN': '1', 'Content-Type': 'application/json' } }));

console.log('--- 1. nouveau visiteur');
for (const u of ['/', '/decouvrir/', '/monde/', '/voyage/', '/ablutions/', '/priere/', '/calendrier/', '/tarifs/']) {
  await p.goto(BASE + u, { waitUntil: 'domcontentloaded' });
  if (u === '/monde/' || u === '/voyage/') {      // pages de jeu : plus de gros bouton ; tout est dans Paramètres → Compte
    await p.waitForSelector('[data-compte-reglages] .ldn-cs-section', { state: 'attached', timeout: 8000 });
    const sv = await p.evaluate(() => ({ barre: !!document.getElementById('ldn-compte'), txt: document.querySelector('[data-compte-reglages] .ldn-cs-section').innerText }));
    t(!sv.barre && /Se connecter/.test(sv.txt) && /Créer un compte/.test(sv.txt), `${u} : aucun gros bouton ; Paramètres → Compte propose Se connecter et Créer un compte`); continue;
  }
  await p.waitForSelector('#ldn-compte', { timeout: 8000 }).catch(() => {});
  const x = await barre(); t(x.includes('🔑 Se connecter') && x.includes('Créer un compte'), `${u} : boutons de compte visibles (${x.join(' | ')})`);
}
console.log('--- 2. inscription depuis le village');
await p.goto(BASE + '/monde/', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('[data-compte-reglages] .ldn-cs-section', { state: 'attached' }); await p.evaluate(() => [...document.querySelectorAll('[data-compte-reglages] a')].find(a => /Créer un compte/.test(a.textContent)).click());
await p.waitForSelector('#f-inscription:not(.cache)'); t(p.url().includes('/compte/'), 'page compte ouverte sur l\'inscription');
await p.fill('#i-email', 'parent1@test.local'); await p.fill('#i-mdp', 'motdepasse123'); await p.fill('#i-mdp2', 'motdepasse123');
for (const i of ['#i-parent', '#i-cgu', '#i-conf']) await p.check(i);
await p.click('#f-inscription button[type=submit]'); await p.waitForSelector('#verif-simuler:not(.cache)', { timeout: 8000 }); t(true, 'compte créé, adresse e-mail à valider');
await p.click('#verif-simuler'); await p.click('#verif-fait'); await p.waitForSelector('#retour-bloc:not(.cache)', { timeout: 8000 });
t(/village/.test(await p.textContent('#retour-lien')), 'bouton « Continuer vers le village » proposé');
await p.waitForSelector('#f-enfant:not(.cache)'); await p.fill('#enf-surnom', 'Yasmine'); await p.selectOption('#enf-avatar', 'fille'); await p.click('#f-enfant button[type=submit]');
await p.waitForURL('**/monde/**', { timeout: 8000 }).catch(() => {}); t(p.url().includes('/monde/'), 'profil créé → retour automatique vers le village');
console.log('--- 3. session conservée, espace famille, boutons dans les Paramètres');
await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForSelector('[data-compte-reglages] .ldn-cs-section', { state: 'attached', timeout: 8000 });
t(await p.evaluate(() => !document.getElementById('ldn-compte')), 'village : plus aucun bouton de compte affiché en permanence');
const sec = await p.evaluate(() => document.querySelector('[data-compte-reglages] .ldn-cs-section').innerText);
t(/Yasmine/.test(sec) && /Espace famille/.test(sec) && /Se déconnecter/.test(sec), 'Paramètres du village : section « Compte » (' + sec.replace(/\n+/g, ' | ') + ')');
t((await moi()).connecte === true, '/api/moi : connecté (session conservée)');
await p.goto(BASE + '/voyage/', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('[data-compte-reglages] .ldn-cs-section', { state: 'attached', timeout: 8000 });
t(await p.evaluate(() => !document.getElementById('ldn-compte')), 'Grand Voyage : aucun bouton permanent ; la section est dans Paramètres');
t(await p.evaluate(() => { const r = document.querySelector('#panneau-reglages'); const sc = r.querySelector('.ldn-cs-section'); return !!sc && r.lastElementChild === sc.parentElement; }), 'Grand Voyage : section placée tout en bas des Paramètres');
await p.goto(BASE + '/ablutions/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1500);
t(await p.evaluate(() => !document.getElementById('ldn-compte')), 'ablutions : aucun bouton de compte permanent');
await p.goto(BASE + '/compte/', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('#v-enfants:not(.cache)'); t((await p.textContent('#enf-liste')).includes('Yasmine'), 'espace famille : profil Yasmine');
console.log('--- 4. déconnexion depuis les Paramètres');
await p.goto(BASE + '/voyage/', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('.ldn-cs-quitter', { state: 'attached' });
await Promise.all([p.waitForEvent('load'), p.evaluate(() => document.querySelector('.ldn-cs-quitter').click())]); await p.waitForSelector('.ldn-cs-p1', { state: 'attached' });
t(await p.evaluate(() => !document.getElementById('ldn-compte')), 'déconnecté : toujours aucun gros bouton à l\'écran'); t(await p.evaluate(() => /Se connecter/.test(document.querySelector('[data-compte-reglages]').innerText)), 'déconnecté : « Se connecter » revient dans Paramètres → Compte'); t((await moi()).connecte === false, '/api/moi : visiteur');
t(await p.evaluate(() => localStorage.getItem('ldn_profil_actif')) === null, 'profil actif retiré de l\'appareil');
console.log('--- 5. reconnexion, retour vers le Grand Voyage');
await p.goto(BASE + '/voyage/', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('.ldn-cs-p1', { state: 'attached' }); await p.evaluate(() => document.querySelector('.ldn-cs-p1').click());
await p.waitForSelector('#f-connexion:not(.cache)'); await p.fill('#c-email', 'parent1@test.local'); await p.fill('#c-mdp', 'motdepasse123'); await p.click('#f-connexion button[type=submit]');
await p.waitForSelector('#retour-bloc:not(.cache)', { timeout: 8000 }); t(/Grand Voyage/.test(await p.textContent('#retour-lien')), 'bouton « Continuer vers le Grand Voyage »');
await p.click('#enf-liste button:has-text("Choisir"), #enf-liste button:has-text("Joue ici")'); await p.waitForURL('**/voyage/**', { timeout: 8000 }).catch(() => {});
t(p.url().includes('/voyage/'), 'enfant choisi → retrouve le Grand Voyage');
console.log('--- 6. Google (simulé)');
await fin(); await p.goto(BASE + '/compte/#connexion', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('#g-conn'); await p.click('#g-conn');
await p.waitForSelector('#v-espace:not(.cache), #f-consent:not(.cache)', { timeout: 8000 });
if (await p.isVisible('#f-consent')) { for (const i of ['#i-parent', '#i-cgu', '#i-conf']) await p.check(i).catch(() => {}); await p.click('#f-consent button[type=submit]'); await p.waitForSelector('#v-espace:not(.cache)', { timeout: 8000 }); }
t(/Google/.test(await p.textContent('#e-email')), 'connexion Google (simulation)');
console.log('--- 7. protections (visiteur)');
await fin(); t(await statut('/api/enfants') === 401, '/api/enfants refusé'); t(await statut('/api/admin/resume') === 401, '/api/admin/resume refusé');
t([401, 403, 404].includes(await statut('/api/premium/voyage/camp/contenu.json')), 'contenu Premium refusé');
await p.goto(BASE + '/admin/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1500); t(await p.isVisible('#v-refus') || !(await p.isVisible('#v-resume')), '/admin/ n\'affiche aucune donnée');
console.log('--- 8. adresses de retour refusées');
for (const r of ['https://exemple.com/', '//exemple.com/x', '/compte/', 'javascript:alert(1)', '/\\exemple.com']) {
  await p.goto(BASE + '/compte/?retour=' + encodeURIComponent(r), { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400);
  t(await p.evaluate(() => sessionStorage.getItem('ldn_retour')) === null, 'retour refusé : ' + r);
}
console.log(`\n${ok} réussis, ${ko} échoués.`); await b.close(); process.exit(ko ? 1 : 0);
