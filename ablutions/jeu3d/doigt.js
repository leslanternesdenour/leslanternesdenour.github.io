// L'index levé du tachahhoud (main droite).
export function majIndex(ix, e, c, k) {
  if (!ix) return;
  e.index = (e.index || 0) + ((c.index ? 1 : 0) - (e.index || 0)) * k;
  ix.visible = e.index > 0.05;
  ix.scale.setScalar(Math.max(0.01, e.index));
  ix.rotation.x = c.indexX || 0;
}
