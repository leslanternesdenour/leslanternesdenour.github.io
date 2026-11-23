// LOUMI, la petite lanterne vivante du village — vraie mascotte 3D (pas une image), habitante FIXE du village.
// Elle est installée à son emplacement (sur un petit support de bois près de l'entrée du souk) et n'en bouge JAMAIS : elle ne suit pas l'enfant,
// ne monte pas sur la monture. Elle flotte doucement, oscille, pulse de lumière, cligne des yeux, tourne lentement la tête vers l'enfant s'il est près
// d'elle, et réagit quand on lui parle. Elle ne parle que sur demande (voir loumi-dialogues.js et habitants.js).
import * as THREE from 'three';

const OR = '#e8b53a', OR_FONCE = '#b9822a', TURQUOISE = '#38d3c4';

function texteLueur() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), d = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  d.addColorStop(0, 'rgba(255,236,170,0.95)'); d.addColorStop(0.35, 'rgba(255,200,90,0.45)'); d.addColorStop(1, 'rgba(255,190,70,0)');
  g.fillStyle = d; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function texteEtoile() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'); g.translate(32, 32); g.fillStyle = '#fff3b0'; g.beginPath();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? 7 : 26; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  g.closePath(); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function creerLoumi({ scene, terrain, ombres = false, x = 0, z = 0, regard: regardBase = Math.PI / 2 }) {
  const sol = terrain ? terrain.hauteur(x, z) : 0;
  const lieu = new THREE.Group(); lieu.position.set(x, sol, z); scene.add(lieu);       // l'emplacement fixe
  const racine = new THREE.Group(); lieu.add(racine);       // la lanterne : flotte au-dessus de son support
  const corps = new THREE.Group(); racine.add(corps);       // oscillation, saut, échelle
  const mOr = new THREE.MeshStandardMaterial({ color: OR, metalness: 0.55, roughness: 0.38, emissive: '#6a4510', emissiveIntensity: 0.35 });
  const mOrFonce = new THREE.MeshStandardMaterial({ color: OR_FONCE, metalness: 0.55, roughness: 0.45, emissive: '#3a2408', emissiveIntensity: 0.3 });
  const mVitre = new THREE.MeshStandardMaterial({ color: TURQUOISE, emissive: '#1fb8aa', emissiveIntensity: 0.9, roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.88 });
  const mCoeur = new THREE.MeshBasicMaterial({ color: '#ffe08a' });

  // la verrerie turquoise (corps arrondi, un peu en poire) et son armature dorée
  const profil = [[0.001, 0.0], [0.2, 0.02], [0.3, 0.14], [0.35, 0.3], [0.34, 0.46], [0.29, 0.62], [0.22, 0.76], [0.001, 0.8]].map(([r, y]) => new THREE.Vector2(r, y));
  const vitre = new THREE.Mesh(new THREE.LatheGeometry(profil, 24), mVitre); corps.add(vitre);
  const rayonA = y => { for (let i = 1; i < profil.length; i++) if (y <= profil[i].y) { const a = profil[i - 1], b = profil[i]; return a.x + (b.x - a.x) * (y - a.y) / (b.y - a.y || 1); } return 0.2; };
  // montants dorés (8) + anneaux
  const NB = 8;
  for (let i = 0; i < NB; i++) {
    const a = i / NB * Math.PI * 2 + Math.PI / NB; const pts = [];
    for (let k = 0; k <= 14; k++) { const y = 0.03 + k / 14 * 0.74; pts.push(new THREE.Vector3(Math.cos(a) * (rayonA(y) + 0.008), y, Math.sin(a) * (rayonA(y) + 0.008))); }
    corps.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 14, 0.016, 6), mOr));
  }
  for (const y of [0.06, 0.3, 0.7]) { const r = rayonA(y); const t = new THREE.Mesh(new THREE.TorusGeometry(r + 0.008, 0.02, 8, 32), mOr); t.rotation.x = Math.PI / 2; t.position.y = y; corps.add(t); }
  // motifs orientaux gravés : petites perles et losanges sur l'anneau du bas et le bandeau du haut
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2;
    const perle = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), mOr); perle.position.set(Math.cos(a) * (rayonA(0.06) + 0.03), 0.06, Math.sin(a) * (rayonA(0.06) + 0.03)); corps.add(perle);
    const lo = new THREE.Mesh(new THREE.OctahedronGeometry(0.026), mOrFonce); lo.scale.set(1, 1.5, 0.6);
    lo.position.set(Math.cos(a) * (rayonA(0.7) + 0.03), 0.7, Math.sin(a) * (rayonA(0.7) + 0.03)); lo.rotation.y = -a; corps.add(lo);
  }
  // le dôme, le bouton et la petite anse traditionnelle
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.235, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), mOr); dome.position.y = 0.78; dome.scale.y = 0.9; corps.add(dome);
  const pointe = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 10), mOr); pointe.position.y = 1.0; corps.add(pointe);
  const anse = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.024, 8, 24, Math.PI), mOr); anse.position.y = 1.04; corps.add(anse);
  const pied = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.12, 12), mOr); pied.rotation.x = Math.PI; pied.position.y = -0.05; corps.add(pied);
  const bouton = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mOrFonce); bouton.position.y = -0.13; corps.add(bouton);

  // la lumière intérieure dorée : un cœur lumineux + un halo qui pulse
  const coeur = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), mCoeur); coeur.position.y = 0.4; corps.add(coeur);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: texteLueur(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 }));
  halo.scale.set(2.1, 2.1, 1); halo.position.set(0, 0.42, -0.05); corps.add(halo);

  // le visage : grands yeux expressifs, petit sourire chaleureux, joues roses (en avant du verre)
  const visage = new THREE.Group(); visage.position.set(0, 0.4, 0); corps.add(visage);
  const blanc = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3, emissive: '#ffffff', emissiveIntensity: 0.25 });
  const noir = new THREE.MeshStandardMaterial({ color: '#2a1810', roughness: 0.2 });
  const yeux = new THREE.Group(); visage.add(yeux);
  const pupilles = [];
  for (const sx of [-1, 1]) {
    const oeil = new THREE.Group(); oeil.position.set(sx * 0.115, 0.04, 0.3); yeux.add(oeil);
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.088, 16, 12), blanc); b.scale.set(1, 1.22, 0.5); oeil.add(b);
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 10), noir); p.position.set(0, -0.005, 0.03); p.scale.set(1, 1.2, 0.5); oeil.add(p); pupilles.push(p);
    const r1 = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), blanc); r1.position.set(0.02, 0.03, 0.058); oeil.add(r1);
    const r2 = new THREE.Mesh(new THREE.SphereGeometry(0.009, 6, 4), blanc); r2.position.set(-0.018, -0.022, 0.056); oeil.add(r2);
  }
  const sourire = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.012, 8, 16, Math.PI), noir); sourire.rotation.z = Math.PI; sourire.position.set(0, -0.085, 0.322); visage.add(sourire);
  const bouche = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), noir); bouche.scale.set(1, 1.2, 0.35); bouche.position.set(0, -0.1, 0.322); bouche.visible = false; visage.add(bouche);
  const joueMat = new THREE.MeshBasicMaterial({ color: '#ff9fb2', transparent: true, opacity: 0.75 });
  for (const sx of [-1, 1]) { const j = new THREE.Mesh(new THREE.CircleGeometry(0.036, 12), joueMat); j.position.set(sx * 0.2, -0.03, 0.29); j.rotation.y = sx * 0.55; visage.add(j); }

  // étincelles (réactions)
  const etoileTex = texteEtoile();
  const etincelles = Array.from({ length: 8 }, (_, i) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: etoileTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    s.scale.setScalar(0.22); corps.add(s); return { s, a: i / 8 * Math.PI * 2 };
  });

  // son support : une base de pierre et un poteau de palmier, sur lesquels la lanterne flotte (un habitant bien installé, pas un objet qui traîne)
  { const bois = new THREE.MeshStandardMaterial({ color: '#7a5a3a', roughness: 0.9 }), pierre = new THREE.MeshStandardMaterial({ color: '#c9b48e', roughness: 0.95 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.72, 0.28, 16), pierre); base.position.y = 0.14; lieu.add(base);
    const poteau = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 1.15, 8), bois); poteau.position.y = 0.85; lieu.add(poteau);
    const plateau = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.1, 12), bois); plateau.position.y = 1.45; lieu.add(plateau);
    if (ombres) for (const m of [base, poteau, plateau]) { m.castShadow = true; m.receiveShadow = true; } }
  racine.position.y = 1.62;                                  // juste au-dessus du plateau
  racine.scale.setScalar(1.15);

  // ---------- comportement ----------
  const reaction = { type: null, t: 0, dur: 0 };
  let clin = 2.5, finClin = 0, cap = 0, parle = 0;
  const base = regardBase;                                   // son orientation de repos (vers l'allée de l'enclos)
  const aire = x => { while (x > Math.PI) x -= Math.PI * 2; while (x < -Math.PI) x += Math.PI * 2; return x; };

  function reagir(type) {   // 'joie' | 'surprise' | 'bravo' | 'parle'
    if (type === 'parle') { parle = 2.2; return; }
    reaction.type = type; reaction.t = 0; reaction.dur = type === 'surprise' ? 1.4 : type === 'bravo' ? 2.6 : 1.9;
  }

  // appelée à chaque image : elle reste sur place ; seule la tête (la lanterne) se tourne doucement vers l'enfant s'il est à moins de 9 m
  // `vers` (facultatif) : la monture qui a un besoin — elle la regarde quand l'enfant n'est pas tout près. Sans enfant ni besoin : elle revient EXACTEMENT à son orientation de repos.
  function maj(dt, t, J, vers = null) {
    const dx = J.x - x, dz = J.z - z, d = Math.hypot(dx, dz);
    const but = d < 3.6 ? Math.atan2(dx, dz) : vers ? Math.atan2(vers.x - x, vers.z - z) : d < 9 ? Math.atan2(dx, dz) : base;
    cap += aire(but - cap) * Math.min(1, dt * 2.2);
    let sy = 0, saut = 0, ech = 1, surpris = 0, joie = 0;
    if (reaction.type) {
      reaction.t += dt; const k = Math.min(1, reaction.t / reaction.dur);
      if (reaction.type === 'surprise') { surpris = Math.sin(Math.min(1, k * 1.4) * Math.PI); saut = surpris * 0.1; ech = 1 + surpris * 0.1; }
      else { joie = Math.sin(k * Math.PI); saut = Math.abs(Math.sin(k * Math.PI * (reaction.type === 'bravo' ? 3 : 2))) * 0.18; sy = k * Math.PI * 2; ech = 1 + joie * 0.08; }
      if (k >= 1) reaction.type = null;
    }
    if (parle > 0) parle = Math.max(0, parle - dt);
    racine.rotation.y = cap + sy;
    corps.position.y = -0.5 + Math.sin(t * 1.6) * 0.06 + saut + (parle > 0 ? Math.abs(Math.sin(t * 9)) * 0.015 : 0);
    corps.rotation.z = Math.sin(t * 1.15) * 0.06; corps.rotation.x = Math.sin(t * 0.9 + 1) * 0.04;
    corps.scale.setScalar(ech);
    // la lumière pulse doucement (plus fort quand elle est contente)
    const p = 0.5 + 0.5 * Math.sin(t * 2.2);
    mCoeur.color.setScalar(0.9 + p * 0.1).multiply(new THREE.Color('#ffe08a'));
    mVitre.emissiveIntensity = 0.75 + p * 0.45 + joie * 0.6;
    halo.material.opacity = 0.55 + p * 0.3 + joie * 0.25; halo.scale.setScalar(2.0 + p * 0.25 + joie * 0.5);
    coeur.scale.setScalar(0.92 + p * 0.1);
    // clignement ; surprise = yeux grands ouverts et bouche en « O » ; joie = yeux plissés et grand sourire
    clin -= dt; if (clin < 0) { clin = 2 + Math.random() * 3.5; finClin = 0.13; }
    let oy = 1; if (finClin > 0) { finClin -= dt; oy = 0.12; }
    yeux.scale.set(1 + surpris * 0.18, (joie > 0.4 ? 0.55 : oy) * (1 + surpris * 0.22), 1);
    bouche.visible = surpris > 0.25; sourire.visible = !bouche.visible;
    sourire.scale.set(1 + joie * 0.35, 1 + joie * 0.5, 1);
    visage.visible = !(typeof window !== 'undefined' && window.LDN_SV && window.LDN_SV.actif && window.LDN_SV.actif());    // mode sans visage (réglage des parents)
    const act = reaction.type ? Math.sin(Math.min(1, reaction.t / reaction.dur) * Math.PI) : 0;
    etincelles.forEach((e, i) => { const r = 0.5 + act * 0.45 + 0.05 * Math.sin(t * 3 + i); e.s.position.set(Math.cos(e.a + t * 1.5) * r, 0.45 + Math.sin(e.a * 2 + t * 2) * 0.28, Math.sin(e.a + t * 1.5) * r * 0.4 + 0.2); e.s.material.opacity = act * 0.95; e.s.scale.setScalar(0.12 + act * 0.14); });
  }

  return { racine, lieu, position: { x, z }, maj, reagir, etat: () => ({ reaction: reaction.type, position: { x: lieu.position.x, z: lieu.position.z } }) };
}
