/* =====================================================================
 * fx.js — stateless particle systems and anime effects.
 * Every effect is evaluated analytically from its start time, so a frame
 * never depends on the previous one.
 *   S  = crisp scene layer, GL = emissive (blurred, additive) layer.
 * ===================================================================== */
'use strict';

/** deterministic continuous emitter: calls cb for every particle alive at t */
function emit(t, o, cb) {
  const dt = 1 / o.rate;
  const from = Math.max(o.from ?? -1e9, t - o.life), to = Math.min(o.to ?? 1e9, t);
  const k0 = Math.ceil(from / dt), k1 = Math.floor(to / dt);
  for (let k = k0; k <= k1; k++) {
    const ts = k * dt, age = t - ts;
    const r = RNG((k * 7919) ^ ((o.seed || 1) * 104729));
    cb(ts, age, r, age / o.life, k);
  }
}

/* ---------------- sparks ---------------- */
function sparks(t, t0, x, y, o = {}) {
  const age = t - t0;
  const maxLife = (o.life || 0.35) * 1.3;
  if (age < 0 || age > maxLife) return;
  const n = o.n || 24, seed = o.seed || 1;
  const col = o.color || [255, 190, 80];
  const drag = o.drag ?? 5, g = o.gravity ?? 900, w = o.width || 3.2;
  S.save(); S.globalCompositeOperation = 'lighter'; S.lineCap = 'round';
  GL.save(); GL.globalCompositeOperation = 'lighter'; GL.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const r = RNG(seed * 1013 + i * 31);
    const ang = ((o.ang ?? 0) + r.s() * (o.spread ?? 360) / 2) * DEG;
    const v = r.r(o.vmin ?? 500, o.vmax ?? 1800);
    const life = (o.life || 0.35) * r.r(0.45, 1.25);
    if (age > life) continue;
    const u = age / life;
    const pos = (a) => {
      const k = (1 - Math.exp(-drag * a)) / drag;
      return [x + Math.cos(ang) * v * k, y + Math.sin(ang) * v * k + 0.5 * g * a * a];
    };
    const p = pos(age), q = pos(Math.max(0, age - (o.len ?? 0.035)));
    const ww = w * (1 - u) * r.r(0.6, 1.3) * (o.scale || 1);
    S.strokeStyle = rgba(mixc([255, 255, 255], col, u * 0.8), 1 - u * 0.6);
    S.lineWidth = ww;
    S.beginPath(); S.moveTo(q[0], q[1]); S.lineTo(p[0], p[1]); S.stroke();
    GL.strokeStyle = rgba(col, (1 - u) * 0.9);
    GL.lineWidth = ww * 4;
    GL.beginPath(); GL.moveTo(q[0], q[1]); GL.lineTo(p[0], p[1]); GL.stroke();
  }
  S.restore(); GL.restore();
}

/* ---------------- shockwave ring ---------------- */
function shockwave(t, t0, x, y, o = {}) {
  const life = o.life || 0.5, age = t - t0, u = age / life;
  if (u < 0 || u > 1) return;
  const r = (o.r || 300) * E.outExpo(u) + (o.r0 || 0);
  const sq = o.squash ?? 1;
  const col = o.color || [255, 255, 255];
  const a = Math.pow(1 - u, 1.4) * (o.alpha ?? 1);
  const w = (o.width || 26) * (1 - u * 0.85);
  S.save(); S.globalCompositeOperation = 'lighter';
  S.strokeStyle = rgba(mixc([255, 255, 255], col, 0.35), a * 0.9);
  S.lineWidth = w;
  S.beginPath(); S.ellipse(x, y, r, r * sq, o.rot || 0, 0, TAU); S.stroke();
  if (o.fill) {
    S.fillStyle = rgba(col, a * 0.18 * o.fill);
    S.fill();
  }
  S.restore();
  GL.save(); GL.globalCompositeOperation = 'lighter';
  GL.strokeStyle = rgba(col, a); GL.lineWidth = w * 3.2;
  GL.beginPath(); GL.ellipse(x, y, r, r * sq, o.rot || 0, 0, TAU); GL.stroke();
  GL.restore();
}

/* ---------------- anime impact flare: hot core + spiky star ---------------- */
function impactStar(ctx, x, y, R, o = {}) {
  const n = o.points || 10, seed = o.seed || 3;
  const rr = RNG(seed);
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * TAU + (o.rot || 0) + rr.s() * 0.12;
    const rad = i % 2 === 0 ? R * rr.r(0.55, 1.15) : R * rr.r(0.12, 0.24);
    const px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}
function flare(t, t0, x, y, o = {}) {
  const life = o.life || 0.28, age = t - t0;
  if (age < 0 || age > life) return;
  const u = age / life, k = Math.pow(1 - u, 2);
  const col = o.color || [255, 220, 140];
  const R = (o.r || 140) * (0.6 + 0.6 * E.outExpo(u));
  GL.save(); GL.globalCompositeOperation = 'lighter';
  blob(GL, col, x, y, R * 2.2, k * 0.6 * (o.glow ?? 1));
  blob(GL, [255, 255, 255], x, y, R * 0.9, k * 0.45 * (o.glow ?? 1));
  GL.restore();
  S.save(); S.globalCompositeOperation = 'lighter';
  S.fillStyle = rgba([255, 255, 255], k);
  impactStar(S, x, y, R * (o.star ?? 1.25), { seed: o.seed || 7, rot: o.rot || 0, points: o.points || 9 });
  S.fill();
  blob(S, col, x, y, R * 0.9, k * 0.9);
  // horizontal lens streak
  if (o.streak !== false) {
    S.fillStyle = rgba(mixc(col, [255, 255, 255], 0.6), k * 0.8);
    S.beginPath(); S.ellipse(x, y, R * 4.5 * (1 - u * 0.5), R * 0.06 * (1 - u), 0, 0, TAU); S.fill();
  }
  S.restore();
}

/* ---------------- dust clouds ---------------- */
function dust(t, t0, x, y, o = {}) {
  const life = o.life || 1.4, age = t - t0;
  if (age < 0 || age > life * 1.3) return;
  const n = o.n || 14, col = o.color || [150, 132, 128];
  S.save();
  for (let i = 0; i < n; i++) {
    const r = RNG((o.seed || 5) * 977 + i * 17);
    const L = life * r.r(0.6, 1.3);
    if (age > L) continue;
    const u = age / L;
    const side = o.dir ? o.dir : (r.f() < 0.5 ? -1 : 1);
    const vx = side * r.r(o.vmin ?? 60, o.vmax ?? 700) * (o.spread ?? 1);
    const vy = -r.r(o.upMin ?? 10, o.up ?? 160);
    const k = (1 - Math.exp(-3.2 * age)) / 3.2;
    const px = x + vx * k + r.s() * (o.jitter ?? 20);
    const py = y + vy * k - age * 25;
    const size = (o.size || 46) * r.r(0.6, 1.4) * (0.5 + 1.6 * E.out(u));
    const a = (o.alpha ?? 0.55) * Math.pow(1 - u, 1.5) * Math.min(1, age * 20);
    blob(S, mixc(col, [255, 255, 255], r.f() * 0.15), px, py, size, a, 0.3);
  }
  S.restore();
}

/* ---------------- debris (rocks) ---------------- */
function rockShape(ctx, x, y, size, rot, seed) {
  const r = RNG(seed), n = 5 + r.i(3);
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * TAU, rad = size * r.r(0.6, 1.05);
    const px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
    if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
  }
  ctx.closePath();
}
function debris(t, t0, x, y, o = {}) {
  const age = t - t0;
  if (age < 0 || age > (o.life || 2.5)) return;
  const n = o.n || 12, g = o.gravity ?? 2200;
  const fadeU = sat((o.life || 2.5) * 0.7, o.life || 2.5, age);
  S.save();
  for (let i = 0; i < n; i++) {
    const r = RNG((o.seed || 11) * 733 + i * 13);
    const vx = r.s() * (o.vx ?? 900) + (o.bias || 0);
    const vy = -r.r(o.vyMin ?? 300, o.vy ?? 1400);
    const size = r.r(o.smin ?? 5, o.smax ?? 18);
    let px = x + r.s() * (o.jitter ?? 10) + vx * age;
    let py = y + vy * age + 0.5 * g * age * age;
    let rot = r.f() * TAU + r.s() * 14 * age;
    if (o.ground !== false && py > GROUND - size * 0.5) {
      // landed: solve impact time, freeze there
      const disc = vy * vy - 4 * 0.5 * g * (y - (GROUND - size * 0.5));
      const ta = disc > 0 ? (-vy + Math.sqrt(disc)) / g : age;
      px = x + vx * ta; py = GROUND - size * 0.5; rot = r.f() * TAU + r.s() * 14 * ta;
    }
    S.fillStyle = o.color || '#3b3244';
    S.globalAlpha = 1 - fadeU;
    rockShape(S, px, py, size, rot, i + (o.seed || 11));
    S.fill();
    if (o.hot) {
      S.globalCompositeOperation = 'lighter';
      S.fillStyle = rgba(o.hot, 0.6 * Math.max(0, 1 - age * 1.5));
      S.fill();
      S.globalCompositeOperation = 'source-over';
    } else {
      S.strokeStyle = 'rgba(140,120,170,0.35)'; S.lineWidth = 1.5; S.stroke();
    }
  }
  S.restore();
}

/* ---------------- lightning ---------------- */
function boltPoints(a, b, seed, o = {}) {
  const r = RNG(seed);
  let pts = [a, b];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  let disp = len * (o.disp ?? 0.22);
  const gens = o.gens ?? 6;
  for (let g = 0; g < gens; g++) {
    const np = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i], q = pts[i + 1];
      const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      const d = v2.norm(v2.perp(v2.sub(q, p)));
      const off = r.s() * disp;
      np.push([m[0] + d[0] * off, m[1] + d[1] * off], q);
    }
    pts = np;
    disp *= 0.52;
  }
  return pts;
}
function drawPolyline(ctx, pts) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
}
function bolt(a, b, seed, o = {}) {
  const pts = boltPoints(a, b, seed, o);
  const col = o.color || [90, 200, 255];
  const w = o.width || 3, al = o.alpha ?? 1;
  S.save(); S.globalCompositeOperation = 'lighter'; S.lineJoin = 'round'; S.lineCap = 'round';
  S.strokeStyle = rgba(col, 0.55 * al); S.lineWidth = w * 2.6; drawPolyline(S, pts);
  S.strokeStyle = rgba([235, 250, 255], al); S.lineWidth = w; drawPolyline(S, pts);
  S.restore();
  GL.save(); GL.globalCompositeOperation = 'lighter'; GL.lineJoin = 'round'; GL.lineCap = 'round';
  GL.strokeStyle = rgba(col, al); GL.lineWidth = w * 7; drawPolyline(GL, pts);
  GL.restore();
  // branches
  if (o.branches) {
    const r = RNG(seed * 3 + 1);
    for (let k = 0; k < o.branches; k++) {
      const i = 2 + r.i(pts.length - 4);
      const p = pts[i];
      const dir = v2.norm(v2.sub(b, a));
      const ang = Math.atan2(dir[1], dir[0]) + r.s() * 1.2;
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]) * r.r(0.15, 0.4);
      bolt(p, [p[0] + Math.cos(ang) * L, p[1] + Math.sin(ang) * L], seed * 7 + k, { ...o, width: w * 0.55, branches: 0, gens: 4 });
    }
  }
  return pts;
}

/* ---------------- fire particles (flames + embers) ---------------- */
const FIRE_RAMP = [[255, 255, 230], [255, 230, 120], [255, 150, 40], [235, 60, 20], [120, 20, 20]];
function fireColor(u) {
  const x = clamp(u) * (FIRE_RAMP.length - 1), i = Math.min(FIRE_RAMP.length - 2, Math.floor(x));
  return mixc(FIRE_RAMP[i], FIRE_RAMP[i + 1], x - i);
}
/** a single flame particle */
function flameP(x, y, size, u, a = 1) {
  const c = fireColor(u);
  S.globalCompositeOperation = 'lighter';
  blob(S, c, x, y, size, a * (1 - u) * 0.55, 0.25);
  blob(GL, c, x, y, size * 1.8, a * (1 - u) * 0.38);
  S.globalCompositeOperation = 'source-over';
}
/** generic flame emitter around points supplied by `src(ts, r)` -> [x,y] */
function flames(t, o, src) {
  emit(t, { rate: o.rate || 120, life: o.life || 0.6, from: o.from, to: o.to, seed: o.seed || 9 }, (ts, age, r, u) => {
    const p = src(ts, r);
    if (!p) return;
    const vy = -r.r(o.rise ?? 160, (o.rise ?? 160) * 2.4);
    const vx = r.s() * (o.spread ?? 50) + (o.wind || 0);
    const wob = Math.sin(age * 14 + r.f() * 6) * 10 * u;
    const x = p[0] + vx * age + wob, y = p[1] + vy * age;
    const size = (o.size || 26) * r.r(0.6, 1.3) * (1 - u * 0.65) * (p[2] ?? 1);
    flameP(x, y, size, u, o.alpha ?? 1);
  });
}
function embers(t, o, src) {
  S.save(); S.globalCompositeOperation = 'lighter';
  emit(t, { rate: o.rate || 30, life: o.life || 1.6, from: o.from, to: o.to, seed: o.seed || 19 }, (ts, age, r, u) => {
    const p = src(ts, r);
    if (!p) return;
    const vx = r.s() * (o.spread ?? 60) + (o.wind || 0), vy = -r.r(40, o.rise ?? 220);
    const x = p[0] + vx * age + Math.sin(age * 5 + r.f() * 9) * 18, y = p[1] + vy * age;
    const c = o.color || fireColor(0.3 + u * 0.5);
    const sz = (o.size || 3.2) * r.r(0.5, 1.4);
    const flick = 0.6 + 0.4 * Math.sin(age * 30 + r.f() * 20);
    S.fillStyle = rgba(c, (1 - u) * flick);
    S.beginPath(); S.arc(x, y, sz, 0, TAU); S.fill();
    blob(GL, c, x, y, sz * 5, (1 - u) * 0.8 * flick);
  });
  S.restore();
}

/* ---------------- speed lines (screen space) ---------------- */
function focusLines(ctx, cx, cy, o = {}) {
  const frame = Math.floor(FS.t * FPS / (o.every || 2));
  const r = RNG((o.seed || 1) * 1000 + frame);
  const n = o.n || 110, R0 = o.r0 || 330, out = 2400;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = o.color || '#ffffff';
  ctx.globalAlpha = o.alpha ?? 0.85;
  ctx.globalCompositeOperation = o.blend || 'source-over';
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = r.f() * TAU;
    const inner = R0 * r.r(0.85, 1.6);
    const w = r.r(o.wmin ?? 0.002, o.wmax ?? 0.012);
    const sy = o.squash ?? 1;
    ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner * sy);
    ctx.lineTo(cx + Math.cos(a - w) * out, cy + Math.sin(a - w) * out * sy);
    ctx.lineTo(cx + Math.cos(a + w) * out, cy + Math.sin(a + w) * out * sy);
  }
  ctx.fill();
  ctx.restore();
}
function speedLines(ctx, o = {}) {
  const frame = Math.floor(FS.t * FPS / (o.every || 1));
  const r = RNG((o.seed || 2) * 1000 + frame);
  const n = o.n || 50;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.translate(W / 2, H / 2); ctx.rotate(o.angle || 0); ctx.translate(-W / 2, -H / 2);
  ctx.globalCompositeOperation = o.blend || 'source-over';
  for (let i = 0; i < n; i++) {
    const y = r.r(-200, H + 200), len = r.r(o.lmin ?? 300, o.lmax ?? 1200), x = r.r(-400, W + 200);
    const th = r.r(o.tmin ?? 1, o.tmax ?? 5);
    ctx.globalAlpha = (o.alpha ?? 0.6) * r.r(0.3, 1);
    ctx.fillStyle = o.color || '#fff';
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x + len, y - th / 2); ctx.lineTo(x + len, y + th / 2); ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/* ---------------- energy beam ---------------- */
function beam(t, a, b, o) {
  const col = o.color, w = o.w || 70, w0 = o.w0 || 30, seed = o.seed || 1, al = o.alpha ?? 1;
  const d = v2.sub(b, a), L = v2.len(d), dn = v2.norm(d), nn = v2.perp(dn);
  const N = 40;
  const wob = (u, k) => 1 + 0.12 * Math.sin(u * 22 - t * 38 + k) + 0.08 * Math.sin(u * 51 + t * 61 + k * 2);
  const poly = (scale, k) => {
    const L1 = [], L2 = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const ww = lerp(w0, w, Math.pow(u, 0.6)) * scale * wob(u, k) * 0.5;
      const p = v2.add(a, v2.mul(dn, L * u));
      L1.push(v2.add(p, v2.mul(nn, ww))); L2.push(v2.sub(p, v2.mul(nn, ww)));
    }
    const pts = L1.concat(L2.reverse());
    return pts;
  };
  const fillPoly = (ctx, pts) => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts) ctx.lineTo(p[0], p[1]); ctx.closePath(); ctx.fill(); };
  GL.save(); GL.globalCompositeOperation = 'lighter';
  GL.fillStyle = rgba(col, 0.32 * al); fillPoly(GL, poly(2.0, 0));
  GL.restore();
  S.save(); S.globalCompositeOperation = 'lighter';
  S.fillStyle = rgba(col, 0.42 * al); fillPoly(S, poly(1.3, 1));
  S.fillStyle = rgba(mixc(col, [255, 255, 255], 0.35), 0.6 * al); fillPoly(S, poly(0.78, 2));
  S.fillStyle = rgba([255, 255, 255], 0.9 * al); fillPoly(S, poly(0.36, 3));
  // spiralling energy
  S.lineWidth = 3; S.strokeStyle = rgba(mixc(col, [255, 255, 255], 0.5), 0.8 * al);
  for (let k = 0; k < 2; k++) {
    S.beginPath();
    for (let i = 0; i <= 80; i++) {
      const u = i / 80;
      const ww = lerp(w0, w, Math.pow(u, 0.6)) * 0.75;
      const ph = u * L * 0.035 - t * 40 + k * Math.PI;
      const p = v2.add(v2.add(a, v2.mul(dn, L * u)), v2.mul(nn, Math.sin(ph) * ww));
      if (i) S.lineTo(p[0], p[1]); else S.moveTo(p[0], p[1]);
    }
    S.stroke();
  }
  S.restore();
  // particles streaming along the beam
  S.save(); S.globalCompositeOperation = 'lighter';
  const r = RNG(seed);
  for (let i = 0; i < 40; i++) {
    const sp = r.r(1.5, 3.5);
    const u = (r.f() + t * sp) % 1;
    const off = r.s() * lerp(w0, w, u) * 0.9;
    const p = v2.add(v2.add(a, v2.mul(dn, L * u)), v2.mul(nn, off));
    const tail = v2.sub(p, v2.mul(dn, 40 + 60 * r.f()));
    S.strokeStyle = rgba(mixc(col, [255, 255, 255], 0.7), 0.8 * al); S.lineWidth = 2.5;
    S.beginPath(); S.moveTo(tail[0], tail[1]); S.lineTo(p[0], p[1]); S.stroke();
  }
  S.restore();
}

/** pulsing ball of clashing energy with crackling arcs */
function clashBall(t, x, y, o) {
  const R = o.r || 130, c1 = o.c1, c2 = o.c2, al = o.alpha ?? 1;
  const pul = 1 + 0.12 * Math.sin(t * 47) + 0.07 * Math.sin(t * 23.3);
  GL.save(); GL.globalCompositeOperation = 'lighter';
  blob(GL, c1, x - R * 0.3, y, R * 2.6 * pul, 0.35 * al);
  blob(GL, c2, x + R * 0.3, y, R * 2.6 * pul, 0.35 * al);
  blob(GL, [255, 255, 255], x, y, R * 1.2 * pul, 0.4 * al);
  GL.restore();
  S.save(); S.globalCompositeOperation = 'lighter';
  blob(S, c1, x - R * 0.25, y, R * 1.4 * pul, 0.6 * al, 0.2);
  blob(S, c2, x + R * 0.25, y, R * 1.4 * pul, 0.6 * al, 0.2);
  blob(S, [255, 255, 255], x, y, R * 0.95 * pul, 0.95 * al, 0.55);
  S.restore();
  const f = Math.floor(t * 30);
  for (let i = 0; i < (o.arcs ?? 6); i++) {
    const r = RNG(f * 97 + i * 13 + (o.seed || 0));
    const a = r.f() * TAU, L = R * r.r(1.4, 3.4);
    bolt([x, y], [x + Math.cos(a) * L, y + Math.sin(a) * L], f * 31 + i, { color: i % 2 ? c1 : c2, width: 2.6, gens: 5, disp: 0.3, alpha: al });
  }
}

/** glowing projectile (fireball) with a flame trail */
function fireball(t, x, y, vx, vy, o = {}) {
  const R = o.r || 34;
  const sp = Math.hypot(vx, vy) || 1;
  const dx = -vx / sp, dy = -vy / sp;
  S.save(); S.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 14; i++) {
    const u = i / 14;
    const px = x + dx * u * R * 4.5 + Math.sin(t * 40 + i) * 4 * u, py = y + dy * u * R * 4.5 + Math.cos(t * 37 + i) * 4 * u;
    flameP(px, py, R * (1.15 - u * 0.8), 0.15 + u * 0.8, 1);
  }
  blob(S, [255, 255, 235], x, y, R * 1.1, 1, 0.5);
  S.restore();
  blob(GL, [255, 120, 30], x, y, R * 3.2, 0.9);
}

/* ---------------- electric aura around a solved body ---------------- */
function bodySegments(J) {
  return [[J.hip, J.neck], [J.sho, J.e1], [J.e1, J.h1], [J.sho, J.e2], [J.e2, J.h2], [J.hip, J.k1], [J.k1, J.f1], [J.hip, J.k2], [J.k2, J.f2]];
}
function bodyPoint(J, r) {
  const segs = bodySegments(J);
  if (r.f() < 0.12) { const a = r.f() * TAU; return [J.head[0] + Math.cos(a) * RIG.headR * J.s, J.head[1] + Math.sin(a) * RIG.headR * J.s]; }
  const sg = segs[r.i(segs.length)], u = r.f();
  return v2.lerp(sg[0], sg[1], u);
}
function electricAura(t, J, level, o = {}) {
  if (level <= 0.01) return;
  const f = Math.floor(t * FPS / 2);
  const n = Math.round(3 + Math.min(level, 2) * 8);
  const col = o.color || [70, 200, 255];
  for (let i = 0; i < n; i++) {
    const r = RNG(f * 131 + i * 7 + (o.seed || 0));
    if (!r.chance(0.75)) continue;
    const p = bodyPoint(J, r);
    const a = r.f() * TAU, L = r.r(25, 70 + 55 * Math.min(level, 1.6)) * J.s;
    bolt(p, [p[0] + Math.cos(a) * L, p[1] + Math.sin(a) * L - 10], f * 17 + i, { color: col, width: 1.8 * J.s, gens: 4, disp: 0.35, alpha: 0.9 });
  }
}
/** fire aura: flames sampled along the body at spawn time */
function fireAura(t, track, level, o = {}) {
  if (level <= 0.01) return;
  const cache = new Map();
  const getJ = (ts) => { const k = Math.round(ts * 120); if (!cache.has(k)) cache.set(k, solve(track.at(ts))); return cache.get(k); };
  flames(t, { rate: 40 + 170 * level, life: 0.42 + 0.22 * level, size: (16 + 16 * level) * (o.size || 1), rise: 160 + 160 * level, spread: 40, seed: o.seed || 41, from: o.from, to: o.to },
    (ts, r) => { const st = track.at(ts); if ((st.aura || 0) < 0.05) return null; const p = bodyPoint(getJ(ts), r); return [p[0], p[1], (0.5 + Math.min(st.aura, 1.6) * 0.6) * (o.size || 1)]; });
}

/* ---------------- big drifting smoke ---------------- */
function smokeField(t, o = {}) {
  const r = RNG(o.seed || 1), span = (o.x1 - o.x0);
  for (let i = 0; i < (o.n || 40); i++) {
    const sp = r.r(0.6, 1.4);
    let x = o.x0 + ((r.f() * span + (o.vx || 0) * t * sp) % span + span) % span;
    const y = r.r(o.y0, o.y1) + Math.cos(t * 0.5 + i) * 18 + (o.vy || 0) * t * sp;
    x += Math.sin(t * 0.4 + i * 1.7) * 30;
    const size = r.r(o.smin || 120, o.smax || 320);
    const c = mixc(o.color || [64, 56, 70], [0, 0, 0], r.f() * 0.3);
    blob(o.ctx || S, c, x, y, size, (o.alpha ?? 0.5) * r.r(0.55, 1), 0.25);
  }
}

/* ---------------- levitating rocks (power-up) ---------------- */
function levitate(t, t0, cx, o = {}) {
  if (t < t0) return;
  const col = o.color || [90, 200, 255];
  S.save();
  for (let i = 0; i < (o.n || 18); i++) {
    const r = RNG((o.seed || 1) * 50 + i);
    const ts = t0 + r.f() * (o.stagger ?? 0.6), age = t - ts;
    if (age < 0) continue;
    const x = cx + r.s() * (o.spread || 300) + Math.sin(age * 2 + i) * 8;
    const y = -6 - age * r.r(50, 190) * (o.speed || 1) + Math.sin(age * 3 + i) * 6;
    const size = r.r(5, o.smax || 20);
    const rot = r.f() * TAU + age * r.s() * 1.5;
    rockShape(S, x, y, size, rot, i + 7);
    S.fillStyle = '#2b2333'; S.fill();
    S.strokeStyle = rgba(col, 0.8); S.lineWidth = 2; S.stroke();
    blob(GL, col, x, y, size * 2.5, 0.35);
  }
  S.restore();
}

/* ---------------- pillar of light / fire ---------------- */
function lightPillar(t, x, w, col, alpha, o = {}) {
  if (alpha <= 0.01) return;
  const top = o.top ?? -4000, bot = o.bot ?? 0;
  const fl = 1 + 0.12 * Math.sin(t * 37) + 0.08 * Math.sin(t * 61);
  S.save(); S.globalCompositeOperation = 'lighter';
  const g = S.createLinearGradient(x - w * fl, 0, x + w * fl, 0);
  g.addColorStop(0, rgba(col, 0)); g.addColorStop(0.35, rgba(col, 0.35 * alpha));
  g.addColorStop(0.5, rgba(mixc(col, [255, 255, 255], 0.7), 0.85 * alpha));
  g.addColorStop(0.65, rgba(col, 0.35 * alpha)); g.addColorStop(1, rgba(col, 0));
  S.fillStyle = g; S.fillRect(x - w * fl, top, w * 2 * fl, bot - top);
  S.restore();
  GL.save(); GL.globalCompositeOperation = 'lighter';
  GL.fillStyle = rgba(col, 0.5 * alpha); GL.fillRect(x - w * 1.6, top, w * 3.2, bot - top);
  GL.restore();
}
