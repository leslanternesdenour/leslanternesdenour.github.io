// La Route : les contenus historiques et religieux sont SÉPARÉS des autres données, avec le statut « À VALIDER ».
import test from 'node:test'; import assert from 'node:assert/strict';

test('contenu à valider : chaque fiche porte le statut « À VALIDER » tant que le créateur n\'a pas confirmé', async () => {
  const { CONTENU, STATUT_A_VALIDER, etiquette } = await import('../../voyage/js/route/contenu-a-valider.js');
  assert.equal(STATUT_A_VALIDER, 'À VALIDER');
  const ids = Object.keys(CONTENU);
  assert.ok(ids.includes('intro-grande-route'));
  for (const id of ids) { const f = CONTENU[id]; assert.equal(f.statut, 'À VALIDER', `${id} ne doit pas être validée sans accord du créateur`); assert.ok(f.sujet, `${id} sans sujet`); assert.equal(f.validePar, undefined); }
  assert.match(etiquette(CONTENU['intro-grande-route']), /À VALIDER/);
});

test('séparation : aucun terme religieux ou historique hors du fichier de contenus à valider (ni dans les données, ni dans le code de la Route)', async () => {
  const fs = await import('node:fs'), path = await import('node:path');
  const dossier = new URL('../../voyage/js/route/', import.meta.url);
  const interdits = /\b(kaaba|qibla|zamzam|hajj|omra|safa|marwa|hira|thawr|jabal|proph[eè]te|allah|cor[ao]n|ismaïl|hajar|pèlerin)/i;
  const fichiers = fs.readdirSync(dossier).filter(f => f.endsWith('.js') && f !== 'contenu-a-valider.js');
  assert.ok(fichiers.length >= 5);
  for (const f of fichiers) {
    const code = fs.readFileSync(new URL(f, dossier), 'utf8').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');
    assert.ok(!interdits.test(code), `${f} contient un terme religieux : à déplacer dans contenu-a-valider.js`);
  }
});

test('aucune statue, idole ni figure sculptée : ni dans les icônes, ni dans les textes, ni dans les modèles 3D de la Route', async () => {
  const fs = await import('node:fs');
  const dossier = new URL('../../voyage/js/route/', import.meta.url);
  const interdit = /(🗿|🗽|🎎|🪆|🧿|🛕|\b(statue|idole|idoles|sculpture|visage sculpté)\b)/i;
  for (const f of fs.readdirSync(dossier).filter(n => n.endsWith('.js'))) {
    const code = fs.readFileSync(new URL(f, dossier), 'utf8').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');
    assert.ok(!interdit.test(code), `${f} contient une icône ou un mot de statue : on ne représente ni statue ni idole`);
  }
});
