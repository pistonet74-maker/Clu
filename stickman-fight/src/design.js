/* =====================================================================
 * design.js — the two fighters and how they are drawn.
 *   紫電 SHIDEN — violet, lean and fast: ponytail, long scarf, wrist wraps
 *   紅蓮 GUREN  — crimson, big and heavy: horns, wild mane, torn cape, sash,
 *                 glowing lava veins
 * Cel-style: black outline per part, curved limbs, tapered torso, feet.
 * ===================================================================== */
'use strict';

const SHIDEN = {
  id: 'shiden', seed: 3, s: 1, lw: 11, chest: 21, waist: 11, headR: 24,
  body: '#8e4cff', far: '#5526a8', hi: '#dccbff', line: '#0e0418', glow: [150, 80, 255],
  eye: '#ffffff', eyeGlow: [205, 150, 255], energy: [175, 115, 255],
  hair: '#24083e', hairHi: '#6f3fc8', scarf: '#6b24dc', scarfDark: '#3a0f86', scarfEdge: '#c9a8ff', wrap: '#efe9ff',
  aura: 'lightning',
  ropes: [
    { n: 14, seg: 12, w0: 21, w1: 9, air: 7, attach: 0.35, bend: 0.62, seed: 1, kind: 'scarf',
      anchor: (J, hf, tf, s) => [v2.add(J.neck, v2.add(v2.mul(tf.fwd, -6 * s), v2.mul(tf.up, -3 * s))), v2.norm(v2.add(v2.mul(tf.fwd, -1), [0, 0.2]))] },
    { n: 11, seg: 12, w0: 17, w1: 7, air: 7, attach: 0.3, bend: 0.62, seed: 2, kind: 'scarf2',
      anchor: (J, hf, tf, s) => [v2.add(J.neck, v2.add(v2.mul(tf.fwd, -5 * s), v2.mul(tf.up, -7 * s))), v2.norm(v2.add(v2.mul(tf.fwd, -1), [0, 0.45]))] },
    { n: 9, seg: 10, w0: 15, w1: 4, air: 3.6, attach: 0.6, bend: 0.78, gravity: 0.9, seed: 3, kind: 'tail',
      anchor: (J, hf, tf, s) => [v2.add(J.head, v2.add(v2.mul(hf.fwd, -0.62 * 24 * s), v2.mul(hf.up, 0.72 * 24 * s))), v2.norm(v2.add(v2.mul(hf.fwd, -0.9), v2.mul(hf.up, 0.5)))] },
    { n: 5, seg: 7, w0: 5, w1: 2, air: 6, attach: 0.2, bend: 0.5, seed: 4, kind: 'wrap1',
      anchor: (J, hf, tf, s) => [v2.lerp(J.e1, J.h1, 0.8), v2.norm(v2.add(v2.norm(v2.sub(J.e1, J.h1)), v2.mul(tf.fwd, -0.6)))] },
    { n: 5, seg: 7, w0: 5, w1: 2, air: 6, attach: 0.2, bend: 0.5, seed: 5, kind: 'wrap2',
      anchor: (J, hf, tf, s) => [v2.lerp(J.e2, J.h2, 0.8), v2.norm(v2.add(v2.norm(v2.sub(J.e2, J.h2)), v2.mul(tf.fwd, -0.6)))] },
  ],
};
const GUREN = {
  id: 'guren', seed: 7, s: 1.08, lw: 13.5, chest: 28, waist: 15, headR: 25,
  body: '#e3173a', far: '#8a0a1e', hi: '#ff9d80', line: '#140205', glow: [255, 45, 35],
  eye: '#fff7c8', eyeGlow: [255, 205, 70], energy: [255, 95, 35],
  horn: '#f4ead6', hornDark: '#9c8a74', hair: '#3e030c', hairHi: '#a3142a', cape: '#2a0408', capeIn: '#8d0d1d', sash: '#170306', vein: [255, 175, 60],
  aura: 'fire',
  ropes: [
    { n: 10, seg: 14, w0: 26, w1: 46, air: 3.6, attach: 0.32, bend: 0.5, seed: 6, kind: 'cape',
      anchor: (J, hf, tf, s) => [v2.add(J.sho, v2.mul(tf.fwd, -9 * s)), v2.norm(v2.add(v2.mul(tf.fwd, -0.55), [0, 0.85]))] },
    { n: 7, seg: 10, w0: 9, w1: 4, air: 5, attach: 0.3, bend: 0.55, seed: 7, kind: 'sash',
      anchor: (J, hf, tf, s) => [v2.add(J.hip, v2.add(v2.mul(tf.fwd, -8 * s), v2.mul(tf.up, 7 * s))), v2.norm(v2.add(v2.mul(tf.fwd, -0.8), [0, 0.6]))] },
    { n: 6, seg: 10, w0: 8, w1: 4, air: 5, attach: 0.3, bend: 0.55, seed: 8, kind: 'sash2',
      anchor: (J, hf, tf, s) => [v2.add(J.hip, v2.add(v2.mul(tf.fwd, -7 * s), v2.mul(tf.up, 3 * s))), v2.norm(v2.add(v2.mul(tf.fwd, -0.6), [0, 0.8]))] },
  ],
};

/* ---------- path helpers ---------- */
function curveTo(ctx, a, m, b) {
  let cx = 2 * m[0] - (a[0] + b[0]) / 2, cy = 2 * m[1] - (a[1] + b[1]) / 2;
  // cap the bulge for very sharp bends
  const L = Math.min(Math.hypot(m[0] - a[0], m[1] - a[1]), Math.hypot(b[0] - m[0], b[1] - m[1]));
  const dx = cx - m[0], dy = cy - m[1], d = Math.hypot(dx, dy);
  if (d > L * 0.55) { cx = m[0] + dx * L * 0.55 / d; cy = m[1] + dy * L * 0.55 / d; }
  ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(cx, cy, b[0], b[1]);
}
function polyPath(ctx, pts) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); }
function ribbonPts(pts, w0, w1, tatter = 0, seed = 1) {
  const n = pts.length, L = [], Rr = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    const tn = v2.norm(v2.sub(b, a)), nn = v2.perp(tn);
    const w = lerp(w0, w1, i / (n - 1)) * 0.5;
    L.push(v2.add(pts[i], v2.mul(nn, w))); Rr.push(v2.sub(pts[i], v2.mul(nn, w)));
  }
  const out = L.slice();
  if (tatter) {
    const e0 = L[n - 1], e1 = Rr[n - 1], dir = v2.norm(v2.sub(pts[n - 1], pts[n - 2])), r = RNG(seed);
    for (let k = 1; k < 7; k++) {
      const p = v2.lerp(e0, e1, k / 7), dd = (k % 2 ? 1 : -0.3) * tatter * r.r(0.5, 1.2);
      out.push(v2.add(p, v2.mul(dir, dd)));
    }
  }
  return out.concat(Rr.reverse());
}

/* ---------- drawing ---------- */
function drawRope(ctx, pts, rd, ch, s, sil, line) {
  const dark = sil > 0.5;
  const kind = rd.kind;
  let fill = ch.body, edge = null;
  if (kind.startsWith('scarf')) { fill = kind === 'scarf' ? ch.scarf : ch.scarfDark; edge = ch.scarfEdge; }
  else if (kind === 'tail') fill = ch.hair;
  else if (kind.startsWith('wrap')) fill = ch.wrap;
  else if (kind === 'cape') { fill = ch.cape; edge = ch.capeIn; }
  else if (kind.startsWith('sash')) fill = ch.sash;
  if (dark) { fill = FS.post.impact > 0 ? '#ffffff' : '#07050b'; edge = null; }
  const poly = ribbonPts(pts, rd.w0 * s, rd.w1 * s, kind === 'cape' ? 16 * s : 0, rd.seed);
  ctx.lineWidth = 3 * s; ctx.strokeStyle = line; ctx.fillStyle = fill;
  polyPath(ctx, poly); ctx.stroke(); ctx.fill();
  if (edge) {
    ctx.save(); ctx.strokeStyle = edge; ctx.lineWidth = (kind === 'cape' ? 5 : 2.4) * s; ctx.globalAlpha *= 0.8;
    ctx.beginPath();
    const half = Math.floor(poly.length / 2);
    if (kind === 'cape') { for (let i = 0; i < pts.length; i++) { const p = poly[i]; if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); } }
    else { for (let i = 0; i < pts.length; i++) { const p = poly[half + i] || poly[i]; if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); } }
    ctx.stroke(); ctx.restore();
  }
}
function footTip(J, k, f, s, hf) {
  const shin = v2.norm(v2.sub(J[f], J[k]));
  const fwd = J.d > 0 ? [-shin[1], shin[0]] : [shin[1], -shin[0]];
  // planted feet lie flat on the ground, airborne feet follow the shin
  const grounded = J[f][1] > GROUND - 14 * s && !J.rag;
  const dir = grounded ? [J.d, 0] : v2.norm(v2.add(v2.mul(fwd, -1), v2.mul(shin, 0.35)));
  return v2.add(J[f], v2.mul(dir, 15 * s));
}
function drawBody(J, ch, snap, t, o = {}) {
  const s = J.s || 1, lw = ch.lw * s, ow = 3.4 * s, R = ch.headR * s;
  const imp = FS.post.impact > 0;
  const sil = imp ? 1 : o.sil || 0;
  const tint = imp ? () => '#ffffff' : (c) => (sil > 0 ? rgba(mixc(rgb(c), [7, 5, 12], sil), 1) : c);
  const body = tint(ch.body), far = tint(ch.far), hi = tint(ch.hi), line = imp ? '#ffffff' : ch.line;
  const hf = headFrame(J), tf = torsoFrame(J);
  const toe1 = footTip(J, 'k1', 'f1', s, hf), toe2 = footTip(J, 'k2', 'f2', s, hf);
  const alpha = o.alpha ?? 1;
  S.save(); S.globalAlpha = alpha; S.lineCap = 'round'; S.lineJoin = 'round';

  // ---- emissive halo
  const ga = imp ? 0 : (o.glow ?? 1) * (0.32 + 0.3 * (o.aura || 0)) * alpha * (1 - sil * 0.9);
  if (ga > 0.01) {
    GL.save(); GL.lineCap = 'round'; GL.lineJoin = 'round';
    GL.strokeStyle = rgba(ch.glow, clamp(ga)); GL.lineWidth = lw * (2.6 + 1.2 * (o.aura || 0));
    GL.beginPath();
    curveTo(GL, J.sho, J.e2, J.h2); curveTo(GL, J.hip, J.k2, J.f2); GL.moveTo(J.hip[0], J.hip[1]); GL.lineTo(J.neck[0], J.neck[1]);
    curveTo(GL, J.hip, J.k1, J.f1); curveTo(GL, J.sho, J.e1, J.h1);
    GL.stroke();
    GL.fillStyle = rgba(ch.glow, clamp(ga)); GL.beginPath(); GL.arc(J.head[0], J.head[1], R * 1.5, 0, TAU); GL.fill();
    GL.restore();
  }
  const ropes = snap.ropes || [];
  const rd = ch.ropes || [];
  // ---- cloth behind the body
  rd.forEach((r, i) => { if (!r.kind.startsWith('wrap') && ropes[i] && !(o.cut && r.kind === 'scarf2')) drawRope(S, ropes[i], r, ch, s, sil, line); });
  if (ch.id === 'shiden' && ropes[3]) drawRope(S, ropes[4], rd[4], ch, s, sil, line);

  const part = (fn, w, color, highlight = true) => {
    S.beginPath(); fn(S); S.strokeStyle = line; S.lineWidth = w + ow * 2; S.stroke();
    S.beginPath(); fn(S); S.strokeStyle = color; S.lineWidth = w; S.stroke();
    if (highlight && sil < 0.5) {
      S.save(); S.translate(-w * 0.12, -w * 0.2); S.globalAlpha *= 0.55;
      S.beginPath(); fn(S); S.strokeStyle = hi; S.lineWidth = w * 0.26; S.stroke(); S.restore();
    }
  };
  const fist = (p, color) => {
    S.fillStyle = line; S.beginPath(); S.arc(p[0], p[1], lw * 0.86 + ow, 0, TAU); S.fill();
    S.fillStyle = color; S.beginPath(); S.arc(p[0], p[1], lw * 0.86, 0, TAU); S.fill();
  };
  // ---- far limbs
  part((c) => { curveTo(c, J.hip, J.k2, J.f2); c.moveTo(J.f2[0], J.f2[1]); c.lineTo(toe2[0], toe2[1]); }, lw * 0.95, far, false);
  part((c) => curveTo(c, J.sho, J.e2, J.h2), lw * 0.92, far, false);
  fist(J.h2, far);
  if (ch.id === 'shiden') wrapBand(J.e2, J.h2, lw * 0.92, ch, s, sil);
  // ---- torso
  {
    const n = [-tf.up[1], tf.up[0]], wc = ch.chest * s / 2, ww = ch.waist * s / 2;
    const hip = J.hip, neck = J.neck, sh = v2.lerp(hip, neck, 0.82);
    const pts = [v2.add(hip, v2.mul(n, ww)), v2.add(sh, v2.mul(n, wc)), v2.add(neck, v2.mul(n, wc * 0.5)), v2.sub(neck, v2.mul(n, wc * 0.5)), v2.sub(sh, v2.mul(n, wc)), v2.sub(hip, v2.mul(n, ww))];
    S.lineWidth = ow * 2; S.strokeStyle = line; polyPath(S, pts); S.stroke();
    S.fillStyle = line; S.beginPath(); S.arc(hip[0], hip[1], ww + ow, 0, TAU); S.fill();
    S.fillStyle = body; polyPath(S, pts); S.fill();
    S.beginPath(); S.arc(hip[0], hip[1], ww, 0, TAU); S.fill();
    if (sil < 0.5) {
      S.save(); S.globalAlpha *= 0.5; S.fillStyle = hi;
      const side = J.d > 0 ? -1 : 1;
      const hp = [v2.add(v2.lerp(hip, sh, 0.15), v2.mul(n, ww * 0.55 * side)), v2.add(sh, v2.mul(n, wc * 0.6 * side)), v2.add(sh, v2.mul(n, wc * 0.25 * side)), v2.add(v2.lerp(hip, sh, 0.2), v2.mul(n, ww * 0.2 * side))];
      polyPath(S, hp); S.fill(); S.restore();
    }
    if (ch.id === 'guren') veins(J, ch, s, t, o, 'torso');
  }
  // ---- head
  if (ch.id === 'shiden') headShiden(J, hf, R, s, ch, tint, line, ow, sil, o);
  else headGuren(J, hf, R, s, ch, tint, line, ow, sil, o);
  // ---- near limbs
  part((c) => { curveTo(c, J.hip, J.k1, J.f1); c.moveTo(J.f1[0], J.f1[1]); c.lineTo(toe1[0], toe1[1]); }, lw, body);
  if (ch.id === 'guren') veins(J, ch, s, t, o, 'leg');
  part((c) => curveTo(c, J.sho, J.e1, J.h1), lw, body);
  fist(J.h1, body);
  if (ch.id === 'shiden') { wrapBand(J.e1, J.h1, lw, ch, s, sil); if (ropes[3]) drawRope(S, ropes[3], rd[3], ch, s, sil, line); }
  if (ch.id === 'guren') veins(J, ch, s, t, o, 'arm');
  // scarf knot at the neck
  if (ch.id === 'shiden') {
    const a = v2.add(J.neck, v2.add(v2.mul(tf.fwd, 7 * s), v2.mul(tf.up, -2 * s))), b = v2.add(J.neck, v2.add(v2.mul(tf.fwd, -8 * s), v2.mul(tf.up, -5 * s)));
    S.lineCap = 'round';
    S.strokeStyle = line; S.lineWidth = 11 * s + ow * 2; S.beginPath(); S.moveTo(a[0], a[1]); S.lineTo(b[0], b[1]); S.stroke();
    S.strokeStyle = sil > 0.5 ? '#07050b' : ch.scarf; S.lineWidth = 11 * s; S.beginPath(); S.moveTo(a[0], a[1]); S.lineTo(b[0], b[1]); S.stroke();
  }
  S.restore();
  return { hf, tf };
}
function wrapBand(e, h, w, ch, s, sil) {
  const a = v2.lerp(e, h, 0.66), b = v2.lerp(e, h, 0.9);
  S.save(); S.lineCap = 'butt';
  S.strokeStyle = sil > 0.5 ? '#07050b' : ch.wrap; S.lineWidth = w * 1.05;
  S.beginPath(); S.moveTo(a[0], a[1]); S.lineTo(b[0], b[1]); S.stroke();
  S.strokeStyle = 'rgba(80,60,120,0.6)'; S.lineWidth = 1.4 * s;
  for (let k = 1; k < 4; k++) { const m = v2.lerp(a, b, k / 4), n = v2.mul(v2.perp(v2.norm(v2.sub(b, a))), w * 0.5); S.beginPath(); S.moveTo(m[0] + n[0], m[1] + n[1]); S.lineTo(m[0] - n[0] * 0.8 + (b[0] - a[0]) * 0.1, m[1] - n[1] * 0.8 + (b[1] - a[1]) * 0.1); S.stroke(); }
  S.restore();
}
function veins(J, ch, s, t, o, which) {
  const k = 0.55 + 0.45 * clamp(o.aura || 0) + 0.15 * Math.sin(t * 9);
  const segs = which === 'arm' ? [[J.sho, J.e1], [J.e1, J.h1]] : which === 'leg' ? [[J.hip, J.k1], [J.k1, J.f1]] : [[J.hip, J.neck]];
  S.save(); S.globalCompositeOperation = 'lighter'; S.lineCap = 'round';
  for (const [a, b] of segs) {
    const pts = boltPoints(v2.lerp(a, b, 0.12), v2.lerp(a, b, 0.88), (which.length * 31) + Math.round(a[0] * 0) + 5, { gens: 3, disp: 0.06 });
    S.strokeStyle = rgba(ch.vein, 0.75 * k); S.lineWidth = 1.7 * s; drawPolyline(S, pts);
    GL.save(); GL.strokeStyle = rgba(ch.vein, 0.5 * k); GL.lineWidth = 7 * s; drawPolyline(GL, pts); GL.restore();
  }
  S.restore();
}
function eyeShape(J, hf, R, ch, eyes, s, angry) {
  const H = J.head, F = hf.fwd, U = hf.up;
  const P = (u, v) => [H[0] + F[0] * u * R + U[0] * v * R, H[1] + F[1] * u * R + U[1] * v * R];
  const a = P(0.18, 0.12), b = P(0.86, angry ? 0.3 : 0.24), m = v2.lerp(a, b, 0.5);
  const th = R * 0.16;
  S.save(); S.globalAlpha *= clamp(eyes);
  S.fillStyle = ch.eye;
  S.beginPath(); S.moveTo(a[0], a[1]);
  S.quadraticCurveTo(m[0] + U[0] * th, m[1] + U[1] * th, b[0], b[1]);
  S.quadraticCurveTo(m[0] - U[0] * th * 0.5, m[1] - U[1] * th * 0.5, a[0], a[1]); S.fill();
  S.restore();
  const c = P(0.55, 0.2);
  blob(GL, ch.eyeGlow, c[0], c[1], R * (0.45 + 0.45 * eyes), clamp(eyes) * 0.8);
  return c;
}
function headShiden(J, hf, R, s, ch, tint, line, ow, sil, o) {
  const H = J.head, F = hf.fwd, U = hf.up;
  const P = (u, v) => [H[0] + F[0] * u * R + U[0] * v * R, H[1] + F[1] * u * R + U[1] * v * R];
  const hair = tint(ch.hair);
  // back hair (behind the skull)
  const back = [P(0.35, 1.0), P(-0.25, 1.22), P(-1.05, 1.08), P(-0.85, 0.72), P(-1.42, 0.5), P(-0.95, 0.25), P(-1.25, -0.18), P(-0.55, -0.05), P(-0.1, 0.3)];
  S.lineWidth = ow * 2; S.strokeStyle = line; S.fillStyle = hair; polyPath(S, back); S.stroke(); S.fill();
  // skull
  S.fillStyle = line; S.beginPath(); S.arc(H[0], H[1], R + ow, 0, TAU); S.fill();
  S.fillStyle = tint(ch.body); S.beginPath(); S.arc(H[0], H[1], R, 0, TAU); S.fill();
  // hair cap + spiky bangs over the brow
  const cap = [P(1.02, 0.42), P(0.75, 0.62), P(0.95, 0.12), P(0.48, 0.5), P(0.62, 0.02), P(0.18, 0.46), P(-0.3, 0.55), P(-0.95, 0.2), P(-0.9, 0.6), P(-0.45, 0.95), P(0.15, 1.04), P(0.65, 0.86)];
  S.fillStyle = hair; polyPath(S, cap); S.fill();
  S.lineWidth = ow * 1.2; S.strokeStyle = line; S.stroke();
  if (sil < 0.5) { S.save(); S.strokeStyle = ch.hairHi; S.lineWidth = 2.2 * s; S.globalAlpha *= 0.8; S.beginPath(); S.moveTo(...P(-0.4, 0.86)); S.quadraticCurveTo(...P(0.1, 1.02), ...P(0.55, 0.8)); S.stroke(); S.restore(); }
  // topknot
  const tk = P(-0.62, 0.78);
  S.fillStyle = line; S.beginPath(); S.arc(tk[0], tk[1], R * 0.3 + ow, 0, TAU); S.fill();
  S.fillStyle = hair; S.beginPath(); S.arc(tk[0], tk[1], R * 0.3, 0, TAU); S.fill();
  S.strokeStyle = ch.scarfEdge; S.lineWidth = 3 * s; S.beginPath(); S.arc(tk[0], tk[1], R * 0.3, -0.6, 1.2); S.stroke();
  if ((o.eyes || 0) > 0.02) eyeShape(J, hf, R, ch, o.eyes, s, false);
  if ((o.mouth || 0) > 0.02) mouthShape(J, hf, R, o.mouth, line);
}
function headGuren(J, hf, R, s, ch, tint, line, ow, sil, o) {
  const H = J.head, F = hf.fwd, U = hf.up;
  const P = (u, v) => [H[0] + F[0] * u * R + U[0] * v * R, H[1] + F[1] * u * R + U[1] * v * R];
  // wild mane behind the head
  const mane = [P(0.2, 1.0), P(-0.35, 1.45), P(-0.6, 1.0), P(-1.35, 1.25), P(-1.0, 0.6), P(-1.75, 0.55), P(-1.05, 0.15), P(-1.6, -0.25), P(-0.85, -0.25), P(-1.05, -0.75), P(-0.4, -0.45), P(0, 0.2)];
  S.lineWidth = ow * 2; S.strokeStyle = line; S.fillStyle = tint(ch.hair); polyPath(S, mane); S.stroke(); S.fill();
  if (sil < 0.5) { S.save(); S.strokeStyle = ch.hairHi; S.globalAlpha *= 0.7; S.lineWidth = 2.4 * s; S.beginPath(); S.moveTo(...P(-0.3, 1.1)); S.lineTo(...P(-1.1, 0.95)); S.moveTo(...P(-0.5, 0.5)); S.lineTo(...P(-1.4, 0.45)); S.stroke(); S.restore(); }
  // far horn (behind)
  const horn = (b0, b1, c, tip, col) => {
    S.beginPath(); S.moveTo(b0[0], b0[1]); S.quadraticCurveTo(c[0], c[1], tip[0], tip[1]); S.quadraticCurveTo((c[0] + b1[0]) / 2, (c[1] + b1[1]) / 2, b1[0], b1[1]); S.closePath();
    S.lineWidth = ow * 2; S.strokeStyle = line; S.stroke(); S.fillStyle = col; S.fill();
  };
  horn(P(-0.28, 0.9), P(0.02, 0.98), P(-0.25, 1.55), P(0.28, 1.95), tint(ch.hornDark));
  // skull
  S.fillStyle = line; S.beginPath(); S.arc(H[0], H[1], R + ow, 0, TAU); S.fill();
  S.fillStyle = tint(ch.body); S.beginPath(); S.arc(H[0], H[1], R, 0, TAU); S.fill();
  // near horn
  horn(P(0.12, 0.92), P(0.5, 0.78), P(0.25, 1.5), P(0.98, 1.8), tint(ch.horn));
  // brow ridge (scowl)
  S.strokeStyle = line; S.lineWidth = 4 * s; S.beginPath(); S.moveTo(...P(0.2, 0.46)); S.lineTo(...P(0.95, 0.28)); S.stroke();
  if ((o.eyes || 0) > 0.02) eyeShape(J, hf, R, ch, o.eyes, s, true);
  if ((o.mouth || 0) > 0.02) mouthShape(J, hf, R, o.mouth, line, true);
}
function mouthShape(J, hf, R, k, line, fangs) {
  const H = J.head, F = hf.fwd, U = hf.up;
  const P = (u, v) => [H[0] + F[0] * u * R + U[0] * v * R, H[1] + F[1] * u * R + U[1] * v * R];
  const a = P(0.45, -0.35), b = P(0.92, -0.3), c = P(0.7, -0.35 - 0.45 * k);
  S.save(); S.fillStyle = line;
  S.beginPath(); S.moveTo(a[0], a[1]); S.lineTo(b[0], b[1]); S.quadraticCurveTo(c[0] + (c[0] - (a[0] + b[0]) / 2), c[1] + (c[1] - (a[1] + b[1]) / 2), a[0], a[1]); S.fill();
  if (fangs) { S.fillStyle = '#fff'; const f1 = P(0.55, -0.36), f2 = P(0.6, -0.5), f3 = P(0.65, -0.36); S.beginPath(); S.moveTo(...f1); S.lineTo(...f2); S.lineTo(...f3); S.fill(); }
  S.restore();
}

/* ---------- motion smears (classic animation in-betweens) ---------- */
function drawSmears(actor, t, ch, alpha) {
  const A = actor.at(t - 1 / FPS).J, B = actor.at(t).J, C = actor.at(t - 2 / FPS).J;
  const s = B.s || 1;
  for (const [p, d] of [['e1', 'h1'], ['e2', 'h2'], ['k1', 'f1'], ['k2', 'f2']]) {
    const dist = Math.hypot(B[d][0] - C[d][0], B[d][1] - C[d][1]);
    const k = sat(55 * s, 150 * s, dist);
    if (k <= 0) continue;
    S.save(); S.globalAlpha = alpha * 0.55 * k;
    const g = S.createLinearGradient(C[d][0], C[d][1], B[d][0], B[d][1]);
    g.addColorStop(0, rgba(rgb(ch.body), 0)); g.addColorStop(1, rgba(mixc(rgb(ch.body), [255, 255, 255], 0.35), 1));
    S.fillStyle = g;
    S.beginPath(); S.moveTo(C[p][0], C[p][1]); S.lineTo(C[d][0], C[d][1]); S.lineTo(A[d][0], A[d][1]); S.lineTo(B[d][0], B[d][1]); S.lineTo(B[p][0], B[p][1]); S.closePath(); S.fill();
    S.restore();
    // speed streaks off the fist / foot
    S.save(); S.globalCompositeOperation = 'lighter'; S.globalAlpha = alpha * 0.7 * k; S.strokeStyle = rgba(ch.glow, 1); S.lineWidth = 2 * s;
    const dv = v2.norm(v2.sub(B[d], C[d]));
    for (let i = -1; i <= 1; i++) { const o = v2.add(B[d], v2.mul(v2.perp(dv), i * 9 * s)); const e = v2.sub(o, v2.mul(dv, dist * 1.4)); S.beginPath(); S.moveTo(o[0], o[1]); S.lineTo(e[0], e[1]); S.stroke(); }
    S.restore();
  }
}
function ghostBody(J, ch, alpha) {
  const s = J.s || 1;
  S.save(); S.globalCompositeOperation = 'lighter'; S.lineCap = 'round'; S.lineJoin = 'round';
  S.strokeStyle = rgba(ch.glow, alpha); S.lineWidth = ch.lw * s;
  S.beginPath();
  curveTo(S, J.sho, J.e1, J.h1); curveTo(S, J.sho, J.e2, J.h2); curveTo(S, J.hip, J.k1, J.f1); curveTo(S, J.hip, J.k2, J.f2);
  S.moveTo(J.hip[0], J.hip[1]); S.lineTo(J.neck[0], J.neck[1]); S.stroke();
  S.fillStyle = rgba(ch.glow, alpha); S.beginPath(); S.arc(J.head[0], J.head[1], ch.headR * s, 0, TAU); S.fill();
  S.restore();
}

/* ---------- auras ---------- */
function lightningAura(J, t, level, ch, seed = 3) {
  if (level <= 0.01) return;
  const f = Math.floor(t * FPS / 2), n = Math.round(2 + Math.min(level, 2.2) * 7);
  for (let i = 0; i < n; i++) {
    const r = RNG(f * 131 + i * 7 + seed);
    if (!r.chance(0.8)) continue;
    const p = bodyPoint(J, r), a = r.f() * TAU, L = r.r(22, 60 + 50 * Math.min(level, 1.6)) * (J.s || 1);
    bolt(p, [p[0] + Math.cos(a) * L, p[1] + Math.sin(a) * L - 10], f * 17 + i, { color: ch.energy, width: 1.8 * (J.s || 1), gens: 4, disp: 0.35 });
  }
}
function fireAura2(actor, t, level, o = {}) {
  if (level <= 0.01) return;
  flames(t, { rate: 40 + 160 * level, life: 0.4 + 0.22 * level, size: (14 + 15 * level) * (o.fireSize || 1), rise: 160 + 170 * level, spread: 40, seed: o.seed || 41 },
    (ts, r) => { const sn = actor.at(ts); if ((sn.st.aura || 0) < 0.05 || (sn.st.alpha ?? 1) < 0.3) return null; const p = bodyPoint(sn.J, r); return [p[0], p[1], 0.55 + Math.min(sn.st.aura, 1.6) * 0.5]; });
}
function drawBlade(J, ch, k, t) {
  const s = J.s || 1, dir = v2.norm(v2.sub(J.h1, J.e1));
  const big = ch.id === 'guren';
  const L = (big ? 330 : 270) * s * clamp(k), tip = v2.add(J.h1, v2.mul(dir, L));
  const n = v2.perp(dir), wB = (big ? 26 : 11) * s;
  const col = ch.energy;
  const shape = [v2.add(J.h1, v2.mul(n, wB * 0.5)), v2.add(v2.lerp(J.h1, tip, 0.75), v2.mul(n, wB * 0.6)), tip, v2.sub(v2.lerp(J.h1, tip, 0.8), v2.mul(n, wB * 0.35)), v2.sub(J.h1, v2.mul(n, wB * 0.4))];
  S.save(); S.globalCompositeOperation = 'lighter';
  S.fillStyle = rgba(col, 0.55); polyPath(S, shape.map((p) => v2.add(p, v2.mul(v2.sub(p, v2.lerp(J.h1, tip, 0.5)), 0.12)))); S.fill();
  S.fillStyle = rgba(mixc(col, [255, 255, 255], 0.75), 0.95); polyPath(S, shape); S.fill();
  S.restore();
  GL.save(); GL.lineCap = 'round'; GL.strokeStyle = rgba(col, 0.9); GL.lineWidth = (big ? 70 : 45) * s;
  GL.beginPath(); GL.moveTo(J.h1[0], J.h1[1]); GL.lineTo(tip[0], tip[1]); GL.stroke(); GL.restore();
  const f = Math.floor(t * 30);
  if (!big) for (let i = 0; i < 2; i++) { const r = RNG(f * 7 + i), p = v2.lerp(J.h1, tip, r.f()); bolt(p, v2.add(p, [r.s() * 70, r.s() * 70]), f * 3 + i, { color: col, width: 1.6, gens: 4 }); }
  else flames(t, { rate: 120, life: 0.35, size: 22, rise: 140, seed: 78 }, (ts, r) => v2.lerp(J.h1, tip, r.f()));
  return tip;
}
function eyeTrail2(actor, t, dur = 0.14) {
  const pts = [], ch = actor.ch;
  for (let i = 0; i <= 12; i++) {
    const sn = actor.at(t - dur * i / 12);
    if ((sn.st.alpha ?? 1) < 0.2 || (sn.st.eyes || 0) < 0.2) break;
    const J = sn.J, hf = headFrame(J), R = ch.headR * (J.s || 1);
    pts.push([J.head[0] + hf.fwd[0] * 0.55 * R + hf.up[0] * 0.2 * R, J.head[1] + hf.fwd[1] * 0.55 * R + hf.up[1] * 0.2 * R]);
  }
  if (pts.length < 3) return;
  S.save(); S.globalCompositeOperation = 'lighter'; S.lineCap = 'round';
  for (let i = 0; i < pts.length - 1; i++) {
    const u = i / (pts.length - 1);
    S.strokeStyle = rgba(mixc([255, 255, 255], ch.eyeGlow, u), 1 - u); S.lineWidth = 6 * (1 - u) + 1;
    S.beginPath(); S.moveTo(pts[i][0], pts[i][1]); S.lineTo(pts[i + 1][0], pts[i + 1][1]); S.stroke();
  }
  S.restore();
  GL.save(); GL.lineCap = 'round'; GL.strokeStyle = rgba(ch.eyeGlow, 0.8); GL.lineWidth = 18; drawPolyline(GL, pts); GL.restore();
}

/** the full actor: afterimages, smears, auras, body, blade */
function drawActor(actor, t, o = {}) {
  const snap = actor.at(t);
  if (!snap) return null;
  const st = snap.st, ch = actor.ch;
  const alpha = (st.alpha ?? 1) * (o.alpha ?? 1);
  if (alpha <= 0.01) return snap;
  const ghosts = Math.round(st.ghost || 0);
  for (let k = ghosts; k >= 1; k--) ghostBody(actor.at(t - k * 0.026).J, ch, 0.42 * (1 - k / (ghosts + 1)) * alpha);
  if (o.smear !== false && !snap.rag) drawSmears(actor, t, ch, alpha);
  if (ch.aura === 'fire' && (st.aura || 0) > 0.01) fireAura2(actor, t, st.aura * (o.auraK ?? 1), o);
  const sil = o.sil ?? st.sil ?? 0;
  const r = drawBody(snap.J, ch, snap, t, { alpha, sil, glow: (st.glow ?? 1) * (o.glow ?? 1), aura: st.aura || 0, eyes: st.eyes || 0, mouth: st.mouth || 0, cut: o.cut });
  if (ch.aura === 'lightning' && (st.aura || 0) > 0.01) lightningAura(snap.J, t, st.aura * (o.auraK ?? 1), ch);
  if ((st.blade || 0) > 0.01) snap.tip = drawBlade(snap.J, ch, st.blade, t);
  if (o.eyeTrail) eyeTrail2(actor, t, o.eyeTrail);
  snap.hf = r.hf; snap.tf = r.tf;
  return snap;
}
