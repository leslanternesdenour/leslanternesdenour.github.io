// Les commandes du Grand Voyage.
// Téléphone et tablette (par défaut) : joystick à gauche, boutons à droite, glisser ailleurs pour tourner
// la caméra, pincer à deux doigts pour zoomer. Plusieurs doigts en même temps (multitouch).
// Ordinateur : touches modifiables (par défaut ZQSD/WASD + flèches, Maj, E, C), souris pour la caméra.
// Tous les réglages sont mémorisés (clé « monde_voyage_commandes »).
// e.code = position physique de la touche : Z/Q/S/D sur AZERTY = W/A/S/D sur QWERTY.

const CLE = 'monde_voyage_commandes';
export const ACTIONS = [
  { id: 'avancer', nom: 'Avancer', defaut: 'KeyW' },
  { id: 'reculer', nom: 'Reculer', defaut: 'KeyS' },
  { id: 'gauche', nom: 'Aller à gauche', defaut: 'KeyA' },
  { id: 'droite', nom: 'Aller à droite', defaut: 'KeyD' },
  { id: 'courir', nom: 'Courir', defaut: 'ShiftLeft' },
  { id: 'interagir', nom: 'Interagir (lire, parler, ramasser…)', defaut: 'KeyE' },
  { id: 'chameau', nom: 'Monter ou descendre du chameau', defaut: 'KeyC' }
];
const DEFAUTS = { touches: {}, etiquettes: {}, taille: 1, opacite: 0.92, disposition: 'classique', sensibilite: 1, positions: {}, tactileForce: false };

export function chargerReglages() {
  let r;
  try { r = Object.assign({}, DEFAUTS, JSON.parse(localStorage.getItem(CLE) || '{}')); } catch (e) { r = { ...DEFAUTS }; }
  r.touches = Object.assign(Object.fromEntries(ACTIONS.map(a => [a.id, a.defaut])), r.touches);
  r.etiquettes = Object.assign({}, r.etiquettes);
  r.positions = Object.assign({}, r.positions);
  return r;
}
export function enregistrerReglages(r) { try { localStorage.setItem(CLE, JSON.stringify(r)); } catch (e) {} }

// Nom lisible d'une touche (selon le clavier de l'appareil quand le navigateur le permet)
let carte = null;
try { navigator.keyboard && navigator.keyboard.getLayoutMap && navigator.keyboard.getLayoutMap().then(m => { carte = m; }); } catch (e) {}
const NOMS = { ShiftLeft: 'Maj', ShiftRight: 'Maj droite', Space: 'Espace', Enter: 'Entrée', ControlLeft: 'Ctrl', AltLeft: 'Alt', Tab: 'Tab',
  ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Backspace: 'Retour' };
const AZERTY = { KeyW: 'Z', KeyA: 'Q', KeyQ: 'A', KeyZ: 'W', Semicolon: 'M' };
export function nomTouche(code, reglages) {
  if (reglages && reglages.etiquettes[code]) return reglages.etiquettes[code];
  if (NOMS[code]) return NOMS[code];
  if (carte && carte.get(code)) return carte.get(code).toUpperCase();
  const fr = (navigator.language || '').startsWith('fr');
  if (fr && AZERTY[code]) return AZERTY[code];
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  return code;
}

export class Controles {
  constructor(canvas, { surAction, surChameau, surToucher }) {
    this.r = chargerReglages();
    this.touches = new Set();
    this.joy = { x: 0, y: 0, actif: false };
    this.camDelta = { x: 0, y: 0 };
    this.zoom = 0;
    this.derniereCamera = -10;
    this.tactile = this.r.tactileForce || matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window && navigator.maxTouchPoints > 0);
    this.bloque = false;
    this.courseTactile = false;
    this.capture = null;            // modification d'une touche en cours
    this.edition = false;           // déplacement des boutons en cours
    const T = () => this.r.touches;

    addEventListener('keydown', e => {
      if (this.capture) { e.preventDefault(); const f = this.capture; this.capture = null; f(e); return; }
      if (e.target.closest && e.target.closest('input,textarea,select')) return;
      surToucher();
      this.touches.add(e.code);
      if (e.repeat || this.bloque || this.edition) return;
      if (e.code === T().interagir || e.code === 'Enter' || (e.code === 'Space' && T().interagir !== 'Space')) { e.preventDefault(); surAction(); }
      else if (e.code === T().chameau) surChameau();
    });
    addEventListener('keyup', e => this.touches.delete(e.code));
    addEventListener('blur', () => { this.touches.clear(); this.lacherJoy(); });

    // ----- caméra : souris ou doigt hors des commandes ; deux doigts = zoom -----
    const doigts = new Map();
    let pince = 0;
    canvas.addEventListener('pointerdown', e => {
      surToucher();
      if (this.edition) return;
      if (e.pointerType === 'touch' && this.r.disposition === 'flottant' && this.dansZoneJoy(e.clientX)) { this.poserJoyFlottant(e); return; }
      doigts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try { canvas.setPointerCapture(e.pointerId); } catch (er) {}
      if (doigts.size === 2) { const [a, b] = [...doigts.values()]; pince = Math.hypot(a.x - b.x, a.y - b.y); }
    });
    canvas.addEventListener('pointermove', e => {
      if (this.joyFlottant && e.pointerId === this.joyFlottant) { this.majJoy(e); return; }
      const d = doigts.get(e.pointerId); if (!d) return;
      if (doigts.size === 2) {
        d.x = e.clientX; d.y = e.clientY;
        const [a, b] = [...doigts.values()], l = Math.hypot(a.x - b.x, a.y - b.y);
        this.zoom -= (l - pince) * 0.03; pince = l; return;
      }
      const k = (e.pointerType === 'touch' ? 0.0068 : 0.005) * this.r.sensibilite;
      this.camDelta.x += (e.clientX - d.x) * k; this.camDelta.y += (e.clientY - d.y) * k;
      d.x = e.clientX; d.y = e.clientY;
      this.derniereCamera = performance.now() / 1000;
    });
    const fin = e => {
      if (this.joyFlottant && e.pointerId === this.joyFlottant) { this.lacherJoy(); return; }
      doigts.delete(e.pointerId);
    };
    canvas.addEventListener('pointerup', fin); canvas.addEventListener('pointercancel', fin);
    canvas.addEventListener('wheel', e => { e.preventDefault(); this.zoom += Math.sign(e.deltaY) * 0.8; }, { passive: false });
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    // ----- joystick -----
    this.base = document.getElementById('joystick'); this.bouton = document.getElementById('joystick-bouton');
    this.jid = null;
    this.base.addEventListener('pointerdown', e => {
      if (this.edition) return;
      surToucher(); e.preventDefault();
      this.jid = e.pointerId; try { this.base.setPointerCapture(this.jid); } catch (er) {}
      this.joy.actif = true; this.base.classList.add('actif'); this.majJoy(e);
    });
    this.base.addEventListener('pointermove', e => { if (e.pointerId === this.jid) this.majJoy(e); });
    const lacher = e => { if (e.pointerId === this.jid) this.lacherJoy(); };
    this.base.addEventListener('pointerup', lacher); this.base.addEventListener('pointercancel', lacher);

    // ----- bouton Courir (maintenir) -----
    const courir = document.getElementById('btn-courir');
    const on = e => { e.preventDefault(); surToucher(); this.courseTactile = true; courir.classList.add('appuye'); };
    const off = () => { this.courseTactile = false; courir.classList.remove('appuye'); };
    courir.addEventListener('pointerdown', on); courir.addEventListener('pointerup', off);
    courir.addEventListener('pointercancel', off); courir.addEventListener('pointerleave', off);

    this.appliquer();
  }

  dansZoneJoy(x) { return this.r.disposition === 'gaucher' ? x > innerWidth * 0.55 : x < innerWidth * 0.45; }
  poserJoyFlottant(e) {
    const t = this.base.offsetWidth;
    this.base.style.left = (e.clientX - t / 2) + 'px'; this.base.style.top = (e.clientY - t / 2) + 'px';
    this.base.style.right = 'auto'; this.base.style.bottom = 'auto';
    this.base.classList.add('visible', 'actif');
    this.joyFlottant = e.pointerId; this.joy.actif = true;
    this.majJoy(e);
  }
  majJoy(e) {
    const r = this.base.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, rayon = r.width / 2;
    let dx = (e.clientX - cx) / rayon, dy = (e.clientY - cy) / rayon;
    const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
    this.joy.x = dx; this.joy.y = -dy;
    this.bouton.style.transform = `translate(${dx * rayon * 0.6}px, ${dy * rayon * 0.6}px)`;
  }
  // L'écran a tourné ou changé de taille : on lâche tout ce qui était tenu et on replace les commandes
  rotation() {
    if (this.joy.actif || this.jid !== null) this.lacherJoy();
    this.courseTactile = false; document.getElementById('btn-courir').classList.remove('appuye');
    this.appliquer();
  }
  lacherJoy() {
    this.jid = null; this.joyFlottant = null;
    this.joy = { x: 0, y: 0, actif: false }; this.bouton.style.transform = '';
    this.base.classList.remove('actif');
    if (this.r.disposition === 'flottant') this.base.classList.remove('visible');
  }

  // Applique taille, transparence, disposition et positions à l'écran
  appliquer() {
    const r = this.r, racine = document.documentElement.style;
    document.body.classList.toggle('tactile', this.tactile);
    racine.setProperty('--taille-cmd', r.taille);
    racine.setProperty('--opacite-cmd', r.opacite);
    document.body.dataset.disposition = r.disposition;
    for (const [id, el] of [['joy', this.base], ['boutons', document.querySelector('.boutons-action')]]) {
      const p = r.positions[id];
      el.style.left = el.style.top = el.style.right = el.style.bottom = '';
      if (p && r.disposition !== 'flottant' || (p && id === 'boutons')) {
        // toujours entièrement dans l'écran, même après une rotation du téléphone
        const x = Math.max(0, Math.min(innerWidth - el.offsetWidth, p.x * innerWidth)), y = Math.max(60, Math.min(innerHeight - el.offsetHeight, p.y * innerHeight));
        el.style.left = x + 'px'; el.style.top = y + 'px';
        el.style.right = 'auto'; el.style.bottom = 'auto';
      }
    }
    this.base.classList.toggle('visible', r.disposition !== 'flottant');
  }
  sauver() { enregistrerReglages(this.r); this.appliquer(); }
  reinitialiser() { this.r = { ...DEFAUTS, touches: Object.fromEntries(ACTIONS.map(a => [a.id, a.defaut])), etiquettes: {}, positions: {} }; this.sauver(); }

  // Attend la prochaine touche pour une action
  ecouterTouche(action, fini) {
    this.capture = e => {
      if (e.code === 'Escape') return fini(false);
      for (const a of ACTIONS) if (this.r.touches[a.id] === e.code && a.id !== action) this.r.touches[a.id] = this.r.touches[action]; // échange
      this.r.touches[action] = e.code;
      if (e.key && e.key.length === 1) this.r.etiquettes[e.code] = e.key.toUpperCase();
      this.sauver(); fini(true);
    };
  }

  // Déplacement des boutons à l'écran (mode édition)
  editer(actif) {
    this.edition = actif;
    document.body.classList.toggle('edition-cmd', actif);
    if (actif) this.base.classList.add('visible');
    const cibles = [['joy', this.base], ['boutons', document.querySelector('.boutons-action')]];
    for (const [id, el] of cibles) {
      if (el._glisse) continue;
      el._glisse = true;
      let dep = null;
      el.addEventListener('pointerdown', e => {
        if (!this.edition) return;
        e.preventDefault(); e.stopPropagation();
        const r = el.getBoundingClientRect();
        dep = { id: e.pointerId, dx: e.clientX - r.left, dy: e.clientY - r.top };
        try { el.setPointerCapture(e.pointerId); } catch (er) {}
      }, true);
      el.addEventListener('pointermove', e => {
        if (!this.edition || !dep || e.pointerId !== dep.id) return;
        const x = Math.max(0, Math.min(innerWidth - el.offsetWidth, e.clientX - dep.dx)), y = Math.max(60, Math.min(innerHeight - el.offsetHeight, e.clientY - dep.dy));
        el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.right = 'auto'; el.style.bottom = 'auto';
        this.r.positions[id] = { x: x / innerWidth, y: y / innerHeight };
      }, true);
      el.addEventListener('pointerup', () => { if (dep) { dep = null; enregistrerReglages(this.r); } }, true);
    }
    if (!actif) this.appliquer();
  }

  // Direction voulue (x = droite, y = avant), course, force (0 à 1)
  direction() {
    if (this.bloque || this.edition) return { x: 0, y: 0, course: false, analogique: 0 };
    const t = this.touches, T = this.r.touches;
    let x = (t.has(T.droite) || t.has('ArrowRight') ? 1 : 0) - (t.has(T.gauche) || t.has('ArrowLeft') ? 1 : 0);
    let y = (t.has(T.avancer) || t.has('ArrowUp') ? 1 : 0) - (t.has(T.reculer) || t.has('ArrowDown') ? 1 : 0);
    let course = t.has(T.courir) || (T.courir === 'ShiftLeft' && t.has('ShiftRight')) || this.courseTactile;
    if (this.joy.actif) {
      x = this.joy.x; y = this.joy.y;
      const l = Math.hypot(x, y);
      if (l < 0.15) return { x: 0, y: 0, course, analogique: 0 };
      // petite zone morte puis réponse progressive : précis pour les petits gestes
      const f = Math.min(1, (l - 0.15) / 0.8);
      return { x: x / l * f, y: y / l * f, course: course || l > 0.94, analogique: f };
    }
    const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
    return { x, y, course, analogique: l > 0 ? 1 : 0 };
  }

  prendreCamera() { const d = { ...this.camDelta, zoom: this.zoom }; this.camDelta.x = this.camDelta.y = 0; this.zoom = 0; return d; }
}
