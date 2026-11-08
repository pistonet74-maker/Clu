/* =====================================================================
 * core.js — math, deterministic randomness, easing, canvases, camera and
 * the post-processing pipeline (glow, impact frames, grain, letterbox...).
 *
 * Everything in this project is a pure function of time `t`: any frame can
 * be rendered on its own, in any order, by any worker. No hidden state.
 * ===================================================================== */
'use strict';

const W = 1920, H = 1080, FPS = 60;
const TAU = Math.PI * 2, DEG = Math.PI / 180;
const BPM = 150, BEAT = 60 / BPM, BAR = BEAT * 4;

/* ---------- math ---------- */
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const sat = (a, b, x) => clamp((x - a) / (b - a));          // 0..1 ramp between a and b
const smooth = (t) => t * t * (3 - 2 * t);
const ramp = (a, b, x) => smooth(sat(a, b, x));
const pulse = (t, t0, attack, decay) =>                       // quick attack, exponential decay
  t < t0 ? 0 : t < t0 + attack ? (t - t0) / attack : Math.exp(-(t - t0 - attack) / decay);
const window01 = (t, a, b, fi = 0.1, fo = 0.1) => Math.min(sat(a, a + fi, t), 1 - sat(b - fo, b, t));
const v2 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1]],
  mul: (a, s) => [a[0] * s, a[1] * s],
  len: (a) => Math.hypot(a[0], a[1]),
  norm: (a) => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; },
  lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
  perp: (a) => [-a[1], a[0]],
  rot: (a, ang) => { const c = Math.cos(ang), s = Math.sin(ang); return [a[0] * c - a[1] * s, a[0] * s + a[1] * c]; },
};

/* ---------- easing ---------- */
const E = {
  linear: (t) => t,
  in: (t) => t * t * t,
  out: (t) => 1 - Math.pow(1 - t, 3),
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  in2: (t) => t * t,
  out2: (t) => 1 - (1 - t) * (1 - t),
  inOut2: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inExpo: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  snap: (t) => 1 - Math.pow(1 - t, 6),
  outBack: (t) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outElastic: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (TAU / 3)) + 1),
  hold: (t) => (t < 1 ? 0 : 1),
  sine: (t) => 0.5 - 0.5 * Math.cos(Math.PI * t),
};
const ease = (name) => (typeof name === 'function' ? name : E[name] || E.inOut);

/* ---------- deterministic randomness ---------- */
function hash(n) {
  n = (n | 0) ^ 0x5bd1e995;
  n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d);
  n = Math.imul(n ^ (n >>> 12), 0x297a2d39);
  n ^= n >>> 15;
  return (n >>> 0) / 4294967296;
}
const hash2 = (a, b) => hash(Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663));
function RNG(seed) {
  let a = (seed * 2654435761) >>> 0;
  const f = () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    f,
    r: (lo, hi) => lo + (hi - lo) * f(),
    s: () => f() * 2 - 1,
    i: (n) => Math.floor(f() * n),
    pick: (arr) => arr[Math.floor(f() * arr.length)],
    chance: (p) => f() < p,
  };
}
/** smooth 1-D value noise in [-1, 1] */
function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(hash2(i, seed), hash2(i + 1, seed), u) * 2 - 1;
}
const fbm1 = (x, seed = 0) => noise1(x, seed) * 0.6 + noise1(x * 2.1, seed + 7) * 0.28 + noise1(x * 4.3, seed + 13) * 0.12;

/* ---------- canvases ---------- */
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const OUT = document.getElementById('out');
const OX = OUT.getContext('2d');
const SCENE = mk(W, H), S = SCENE.getContext('2d');           // crisp world + backgrounds
const GSCALE = 0.25;
const GLOWC = mk(W * GSCALE, H * GSCALE), GL = GLOWC.getContext('2d');   // emissive buffer (quarter res)
const GB1 = mk(W * GSCALE, H * GSCALE), GB1X = GB1.getContext('2d');
const GB2 = mk(W * GSCALE, H * GSCALE), GB2X = GB2.getContext('2d');
const TMP = mk(W, H), TX = TMP.getContext('2d');
const TMP2 = mk(W, H), TX2 = TMP2.getContext('2d');
const SMALL = mk(W / 4, H / 4), SMX = SMALL.getContext('2d');

/* ---------- colour ---------- */
function rgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)].map(Math.round);

/* soft round sprite cache (radial falloff), used for glows, dust, fire, smoke */
const _sprites = new Map();
function sprite(color, hard = 0) {
  const c3 = typeof color === 'string' ? rgb(color) : color;
  const key = c3.join(',') + '|' + hard;
  let c = _sprites.get(key);
  if (c) return c;
  c = mk(128, 128);
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, rgba(c3, 1));
  if (hard > 0) g.addColorStop(clamp(hard, 0, 0.95), rgba(c3, 0.6));
  g.addColorStop(0.55, rgba(c3, hard > 0 ? 0.25 : 0.35));
  g.addColorStop(1, rgba(c3, 0));
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  _sprites.set(key, c);
  return c;
}
function blob(ctx, color, x, y, r, alpha = 1, hard = 0) {
  if (r <= 0.3 || alpha <= 0.003) return;
  ctx.globalAlpha = clamp(alpha);
  ctx.drawImage(sprite(color, hard), x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = 1;
}

/* ---------- camera ---------- */
/** world -> screen transform for a camera {x,y,zoom,rot}; `s` scales the result (glow buffer) */
function camApply(ctx, cam, s = 1) {
  const z = cam.zoom, c = Math.cos(cam.rot || 0), n = Math.sin(cam.rot || 0);
  ctx.setTransform(s * z * c, s * z * n, -s * z * n, s * z * c,
    s * (W / 2 - z * (c * cam.x - n * cam.y)), s * (H / 2 - z * (n * cam.x + c * cam.y)));
}
function camToScreen(cam, p) {
  const z = cam.zoom, c = Math.cos(cam.rot || 0), n = Math.sin(cam.rot || 0);
  const dx = p[0] - cam.x, dy = p[1] - cam.y;
  return [W / 2 + z * (c * dx - n * dy), H / 2 + z * (n * dx + c * dy)];
}
/** both crisp and glow layers share the same camera */
function setCam(cam) { camApply(S, cam, 1); camApply(GL, cam, GSCALE); }
function screenSpace() { S.setTransform(1, 0, 0, 1, 0, 0); GL.setTransform(GSCALE, 0, 0, GSCALE, 0, 0); }

/* ---------- per-frame state ---------- */
const FS = {
  t: 0,
  post: null,
  reset(t) {
    this.t = t;
    this.post = {
      glow: 1, bloom: 0.35, flash: 0, flashColor: '#ffffff', impact: 0, invert: false,
      chroma: 0, vignette: 0.55, grain: 0.035, letterbox: 0, fade: 0, fadeColor: '#000',
      tint: null, tintAlpha: 0, saturate: 1, contrast: 1, radialBlur: 0, rbx: W / 2, rby: H / 2,
    };
  },
};

/* ---------- static overlays ---------- */
const VIGNETTE = (() => {
  const c = mk(W, H), x = c.getContext('2d');
  const g = x.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,1)');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  return c;
})();
const GRAIN = (() => {
  const tiles = [];
  for (let k = 0; k < 6; k++) {
    const c = mk(512, 512), x = c.getContext('2d');
    const img = x.createImageData(512, 512);
    const r = RNG(900 + k);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 128 + (r.f() + r.f() + r.f() - 1.5) * 120;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    tiles.push(c);
  }
  return tiles;
})();

/* ---------- post-processing ---------- */
function postProcess(t) {
  const P = FS.post;
  const frame = Math.round(t * FPS);
  OX.setTransform(1, 0, 0, 1, 0, 0);
  OX.globalCompositeOperation = 'source-over';
  OX.globalAlpha = 1;
  OX.filter = 'none';

  // radial (zoom) blur of the scene — cheap version: a few scaled copies
  if (P.radialBlur > 0.001) {
    TX.setTransform(1, 0, 0, 1, 0, 0);
    TX.globalAlpha = 1; TX.globalCompositeOperation = 'source-over';
    TX.drawImage(SCENE, 0, 0);
    const n = 5;
    for (let i = 1; i <= n; i++) {
      const s = 1 + P.radialBlur * i / n;
      TX.globalAlpha = 0.5 / i;
      TX.setTransform(s, 0, 0, s, P.rbx * (1 - s), P.rby * (1 - s));
      TX.drawImage(SCENE, 0, 0);
    }
    TX.setTransform(1, 0, 0, 1, 0, 0); TX.globalAlpha = 1;
    OX.drawImage(TMP, 0, 0);
  } else {
    OX.drawImage(SCENE, 0, 0);
  }

  if (P.impact > 0) { P.glow = Math.min(P.glow, 0.25); P.bloom = 0; }
  // emissive glow: two blur radii on the quarter-res buffer, added on top
  if (P.glow > 0) {
    GB1X.setTransform(1, 0, 0, 1, 0, 0); GB1X.clearRect(0, 0, GB1.width, GB1.height);
    GB1X.filter = 'blur(3px)'; GB1X.drawImage(GLOWC, 0, 0); GB1X.filter = 'none';
    GB2X.setTransform(1, 0, 0, 1, 0, 0); GB2X.clearRect(0, 0, GB2.width, GB2.height);
    GB2X.filter = 'blur(14px)'; GB2X.drawImage(GLOWC, 0, 0); GB2X.filter = 'none';
    OX.globalCompositeOperation = 'lighter';
    OX.imageSmoothingQuality = 'high';
    OX.globalAlpha = clamp(P.glow * 0.85, 0, 1);
    OX.drawImage(GB1, 0, 0, W, H);
    OX.globalAlpha = clamp(P.glow * 0.8, 0, 1);
    OX.drawImage(GB2, 0, 0, W, H);
    if (P.glow > 1) { OX.globalAlpha = clamp(P.glow - 1, 0, 1); OX.drawImage(GB2, 0, 0, W, H); }
    OX.globalAlpha = 1;
  }
  // soft bloom of the whole frame (pseudo threshold through contrast)
  if (P.bloom > 0) {
    SMX.setTransform(1, 0, 0, 1, 0, 0);
    SMX.clearRect(0, 0, SMALL.width, SMALL.height);
    SMX.filter = 'contrast(2.2) brightness(0.55) blur(6px)';
    SMX.drawImage(OUT, 0, 0, SMALL.width, SMALL.height);
    SMX.filter = 'none';
    OX.globalCompositeOperation = 'screen';
    OX.globalAlpha = clamp(P.bloom);
    OX.drawImage(SMALL, 0, 0, W, H);
    OX.globalAlpha = 1;
  }
  OX.globalCompositeOperation = 'source-over';

  // colour grading
  if (P.saturate !== 1 || P.contrast !== 1) {
    TX.setTransform(1, 0, 0, 1, 0, 0); TX.globalAlpha = 1; TX.globalCompositeOperation = 'copy';
    TX.drawImage(OUT, 0, 0); TX.globalCompositeOperation = 'source-over';
    OX.filter = `saturate(${P.saturate}) contrast(${P.contrast})`;
    OX.drawImage(TMP, 0, 0); OX.filter = 'none';
  }
  if (P.tint && P.tintAlpha > 0) {
    OX.globalCompositeOperation = 'overlay'; OX.globalAlpha = P.tintAlpha;
    OX.fillStyle = P.tint; OX.fillRect(0, 0, W, H);
    OX.globalCompositeOperation = 'source-over'; OX.globalAlpha = 1;
  }

  // chromatic aberration (split R and B, offset horizontally)
  if (P.chroma > 0.5) {
    const d = P.chroma;
    TX.setTransform(1, 0, 0, 1, 0, 0); TX.globalAlpha = 1;
    TX.globalCompositeOperation = 'copy'; TX.drawImage(OUT, 0, 0);
    TX.globalCompositeOperation = 'multiply'; TX.fillStyle = '#ff0000'; TX.fillRect(0, 0, W, H);
    TX2.setTransform(1, 0, 0, 1, 0, 0); TX2.globalAlpha = 1;
    TX2.globalCompositeOperation = 'copy'; TX2.drawImage(OUT, 0, 0);
    TX2.globalCompositeOperation = 'multiply'; TX2.fillStyle = '#00ffff'; TX2.fillRect(0, 0, W, H);
    TX.globalCompositeOperation = TX2.globalCompositeOperation = 'source-over';
    OX.fillStyle = '#000'; OX.fillRect(0, 0, W, H);
    OX.globalCompositeOperation = 'lighter';
    OX.drawImage(TMP, -d, 0); OX.drawImage(TMP2, d, 0);
    OX.globalCompositeOperation = 'source-over';
  }

  // anime "impact frame": hard black & white (optionally inverted)
  if (P.impact > 0) {
    TX.setTransform(1, 0, 0, 1, 0, 0); TX.globalAlpha = 1;
    TX.globalCompositeOperation = 'copy'; TX.drawImage(OUT, 0, 0);
    TX.globalCompositeOperation = 'source-over';
    OX.filter = `grayscale(1) contrast(${P.impactContrast || 9}) brightness(${P.impactBright || 1.1})` + (P.invert ? ' invert(1)' : '');
    OX.globalAlpha = clamp(P.impact);
    OX.drawImage(TMP, 0, 0);
    OX.filter = 'none'; OX.globalAlpha = 1;
  }

  if (P.flash > 0 && P.impact <= 0) {
    OX.globalAlpha = clamp(P.flash); OX.fillStyle = P.flashColor;
    OX.fillRect(0, 0, W, H); OX.globalAlpha = 1;
  }
  if (P.vignette > 0) { OX.globalAlpha = clamp(P.vignette); OX.drawImage(VIGNETTE, 0, 0); OX.globalAlpha = 1; }
  if (P.grain > 0) {
    const g = GRAIN[frame % GRAIN.length];
    const ox = hash(frame * 3 + 1) * 512, oy = hash(frame * 7 + 2) * 512;
    OX.globalCompositeOperation = 'overlay'; OX.globalAlpha = P.grain;
    for (let y = -oy; y < H; y += 512) for (let x = -ox; x < W; x += 512) OX.drawImage(g, x, y);
    OX.globalCompositeOperation = 'source-over'; OX.globalAlpha = 1;
  }
  if (P.letterbox > 0) {
    const bh = Math.round(P.letterbox * 135);
    OX.fillStyle = '#000'; OX.fillRect(0, 0, W, bh); OX.fillRect(0, H - bh, W, bh);
  }
  if (P.fade > 0) {
    OX.globalAlpha = clamp(P.fade); OX.fillStyle = P.fadeColor;
    OX.fillRect(0, 0, W, H); OX.globalAlpha = 1;
  }
}

/* ---------- text ---------- */
const FONT = {
  brush: '"Yuji Boku", "IPAGothic", serif',
  heavy: '"Dela Gothic One", "IPAGothic", sans-serif',
  title: '"Anton", "Inter", sans-serif',
  sub: '"Bebas Neue", "Inter", sans-serif',
  ui: '"Inter Display", "Inter", sans-serif',
};
function text(ctx, str, x, y, o = {}) {
  ctx.save();
  ctx.font = `${o.weight || ''} ${o.size || 64}px ${o.font || FONT.title}`;
  ctx.textAlign = o.align || 'center';
  ctx.textBaseline = o.baseline || 'middle';
  ctx.letterSpacing = (o.spacing || 0) + 'px';
  ctx.translate(x, y);
  if (o.rot) ctx.rotate(o.rot);
  if (o.skew) ctx.transform(1, 0, o.skew, 1, 0, 0);
  if (o.scale) ctx.scale(o.scale, o.scale);
  ctx.globalAlpha = o.alpha ?? 1;
  if (o.shadow) { ctx.shadowColor = o.shadow; ctx.shadowBlur = o.shadowBlur || 30; }
  if (o.stroke) {
    ctx.lineJoin = 'round'; ctx.lineWidth = o.strokeWidth || 8; ctx.strokeStyle = o.stroke;
    ctx.strokeText(str, 0, 0);
  }
  ctx.fillStyle = o.color || '#fff';
  ctx.fillText(str, 0, 0);
  ctx.restore();
}
