// Étape 3 : interface contextuelle (voyage/js/hud.js) — une information apparaît, puis s'efface seule ; rien de permanent hors des accès essentiels.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const { creerHud } = await import('../../voyage/js/hud.js');
const faux = (cache = true) => ({ classes: new Set(cache ? ['cache'] : []), classList: { add(c) { this.p.classes.add(c); }, remove(c) { this.p.classes.delete(c); }, contains(c) { return this.p.classes.has(c); }, toggle(c, f) { f ? this.p.classes.add(c) : this.p.classes.delete(c); }, p: null } });
const el = (cache) => { const e = faux(cache); e.classList.p = e; return e; };
const horloge = () => { let t = 0, id = 0; const a = new Map(); return { minuteur: (f, ms) => { a.set(++id, { f, a: t + ms }); return id; }, annuler: i => a.delete(i), avancer(ms) { t += ms; for (const [i, x] of [...a]) if (x.a <= t) { a.delete(i); x.f(); } } }; };

test('temporaire : apparaît, puis s\'efface seul', () => {
  const h = horloge(), hud = creerHud(h), e = el(); hud.temporaire(e, 3000); assert.equal(e.classList.contains('cache'), false);
  h.avancer(2999); assert.equal(e.classList.contains('cache'), false); h.avancer(2); assert.equal(e.classList.contains('cache'), true);
});
test('temporaire : un nouvel événement prolonge l\'affichage (pas de clignotement)', () => {
  const h = horloge(), hud = creerHud(h), e = el(); hud.temporaire(e, 3000); h.avancer(2000); hud.temporaire(e, 3000); h.avancer(2000);
  assert.equal(e.classList.contains('cache'), false); h.avancer(1100); assert.equal(e.classList.contains('cache'), true);
});
test('cacher : immédiat, et le minuteur oublié ne réaffiche rien', () => {
  const h = horloge(), hud = creerHud(h), e = el(); hud.temporaire(e, 3000); hud.cacher(e); assert.equal(e.classList.contains('cache'), true); h.avancer(5000); assert.equal(e.classList.contains('cache'), true);
});
test('quand : visible tant que la condition est vraie', () => {
  const hud = creerHud(horloge()), e = el(); hud.quand(e, true); assert.equal(e.classList.contains('cache'), false); hud.quand(e, false); assert.equal(e.classList.contains('cache'), true);
});
test('l\'écran du Grand Voyage : plus de colonne d\'icônes, de panneau de missions ni de son en permanence (garde sur le code)', () => {
  const html = fs.readFileSync(new URL('../../voyage/index.html', import.meta.url), 'utf8');
  assert.ok(!/id="btn-son"/.test(html), 'le bouton son n\'est plus dans la barre du haut (il est dans les Paramètres)'); assert.ok(/id="ouvrir-sons"/.test(html));
  assert.ok(/<div id="lieu" class="cache"/.test(html) && /id="bourse" class="cache"/.test(html), 'lieu et pièces : cachés par défaut');
  assert.ok(/id="suivi" class="cache"/.test(html), 'mission en cours : cachée par défaut');
  const css = fs.readFileSync(new URL('../../voyage/voyage.css', import.meta.url), 'utf8');
  assert.ok(!/#soins\{[^}]*top:50%/.test(css), 'les besoins ne sont plus une colonne fixe à gauche');
  assert.ok(/\.panneau\{[^}]*max-height[^}]*overflow-y:auto/.test(css), 'les panneaux défilent verticalement');
});
