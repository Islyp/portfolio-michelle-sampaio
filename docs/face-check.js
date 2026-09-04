/* Verifica se algum asset flutuante do hero cobre o rosto da Michelle.
   A caixa do rosto foi validada recortando michelle-hero.png nestas frações:
   o recorte devolve exatamente o rosto, da testa ao queixo. */
window.checarRosto = function (doc) {
  const d = doc || document;
  const FACE = { l: 0.363, r: 0.651, t: 0.106, b: 0.481 };
  const FOLGA = 8; // px de respiro exigido em volta do rosto

  const photo = d.querySelector('.hero__photo');
  if (!photo) return { erro: 'hero não encontrado' };

  const p = photo.getBoundingClientRect();
  const face = {
    left:   p.left + FACE.l * p.width  - FOLGA,
    right:  p.left + FACE.r * p.width  + FOLGA,
    top:    p.top  + FACE.t * p.height - FOLGA,
    bottom: p.top  + FACE.b * p.height + FOLGA,
  };

  const alvos = ['.float-card--views', '.float-card--reach', '.post-card'];
  const colisoes = [];

  for (const sel of alvos) {
    const el = d.querySelector(sel);
    if (!el) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.position === 'static') continue; // não flutua

    const b = el.getBoundingClientRect();
    const dx = Math.min(b.right, face.right) - Math.max(b.left, face.left);
    const dy = Math.min(b.bottom, face.bottom) - Math.max(b.top, face.top);

    if (dx > 0 && dy > 0) {
      colisoes.push({
        card: sel,
        invade: Math.round(dx) + 'x' + Math.round(dy) + 'px',
        area: Math.round(dx * dy),
      });
    }
  }

  return {
    largura: d.defaultView.innerWidth,
    rosto: [face.left, face.top, face.right, face.bottom].map(Math.round).join(','),
    limpo: colisoes.length === 0,
    colisoes,
  };
};
