/* =====================================================================
 * story.js — helpers shared by every shot + the global event list.
 * The shots themselves live in shots_*.js. Times are in seconds;
 * the score runs at 150 BPM (one beat = 0.4 s) and big hits land on beats.
 * ===================================================================== */
'use strict';

const DURATION = 57.6;
const EV = [];                      // audio + post-fx events {t, type, ...}
function ev(t, type, o = {}) { const e = { t, type, ...o }; EV.push(e); return e; }

const SHOTS = [];
function shot(t0, t1, fn) { SHOTS.push({ t0, t1, fn }); }

/* ---------- generic numeric keyframes (cameras, values) ---------- */
class Keys {
  constructor(init = {}) { this.init = init; this.keys = []; this.res = null; }
  k(t, props = {}, e) { this.keys.push({ t, ...props, e: e || props.e || 'inOut' }); this.res = null; return this; }
  cut(t, props = {}) { return this.k(t, props, 'hold'); }
  build() {
    const ks = this.keys.map((k, i) => ({ ...k, _i: i })).sort((a, b) => a.t - b.t || a._i - b._i);
    let prev = { ...this.init };
    this.res = ks.map((k) => { const r = { ...prev, ...k }; prev = r; return r; });
  }
  at(t) {
    if (!this.res) this.build();
    const K = this.res, n = K.length;
    const pick = (a) => { const o = {}; for (const k in a) if (k !== 't' && k !== 'e' && k[0] !== '_') o[k] = a[k]; return o; };
    if (t <= K[0].t) return pick(K[0]);
    if (t >= K[n - 1].t) return pick(K[n - 1]);
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (K[m].t <= t) lo = m; else hi = m; }
    const a = K[lo], b = K[hi], u = (t - a.t) / (b.t - a.t || 1), w = ease(b.e)(u);
    const o = {};
    for (const k in a) {
      if (k === 't' || k === 'e' || k[0] === '_') continue;
      o[k] = typeof a[k] === 'number' && typeof b[k] === 'number' ? a[k] + (b[k] - a[k]) * w : a[k];
    }
    return o;
  }
}

/* place a joint of a track at a world point by shifting the key at time t */
Track.prototype.fit = function (t, joint, target, useY = true) {
  const key = this.keys.find((k) => Math.abs(k.t - t) < 1e-6);
  if (!key) throw new Error('fit: no key at ' + t);
  const st = this.at(t), J = solve(st);
  key.x = (key.x ?? st.x) + (target[0] - J[joint][0]);
  if (useY && !st.g && target[1] !== undefined) key.y = (key.y ?? st.y) + (target[1] - J[joint][1]);
  this.res = null;
  return this;
};
const jointAt = (track, t, j) => solve(track.at(t))[j];

/* ---------- post-fx driven by events (flash, impact frames, shake, chroma) ---------- */
function eventFX(t) {
  let shake = 0;
  for (const e of EV) {
    const age = t - e.t;
    if (age < 0 || age > 3) continue;
    if (e.flash) FS.post.flash += e.flash * Math.exp(-age / (e.flashDecay || 0.07));
    if (e.impact && age < e.impact / FPS) {
      FS.post.impact = 1;
      FS.post.invert = Math.floor(age * FPS + 0.001) % 2 === (e.invertFirst === false ? 1 : 0);
    }
    if (e.chroma) FS.post.chroma = Math.max(FS.post.chroma, e.chroma * Math.exp(-age / 0.12));
    if (e.shake) shake += e.shake * Math.exp(-age / (e.shakeDecay || 0.2));
  }
  return shake;
}
function shaken(cam, extra = 0) {
  const a = (FS.shake + extra), t = FS.t;
  if (a < 0.05) return cam;
  return {
    ...cam,
    x: cam.x + (a / cam.zoom) * noise1(t * 36, 11),
    y: cam.y + (a / cam.zoom) * noise1(t * 39, 12),
    rot: (cam.rot || 0) + a * 0.00022 * noise1(t * 28, 13),
  };
}

function renderStory(t) {
  FS.shake = eventFX(t);
  for (const s of SHOTS) if (t >= s.t0 && t < s.t1) { s.fn(t, t - s.t0, s); break; }
}

/* ---------- drawing an actor: afterimages, auras, the body, eye trail ---------- */
function drawArmOnly(J, a, e, ch, alpha, s = 1) {
  const el = v2.add(J.sho, vecA(a - J.r, RIG.ua * s, J.d));
  const h = v2.add(el, vecA(a + e - J.r, RIG.fa * s, J.d));
  S.save(); S.globalCompositeOperation = 'lighter'; S.lineCap = 'round'; S.lineJoin = 'round';
  S.strokeStyle = rgba(ch.glow, alpha); S.lineWidth = RIG.lw * s * 1.1;
  S.beginPath(); S.moveTo(J.sho[0], J.sho[1]); S.lineTo(el[0], el[1]); S.lineTo(h[0], h[1]); S.stroke();
  S.restore();
  blob(GL, ch.glow, h[0], h[1], 30 * s, alpha);
  return h;
}
function ghostFighter(st, ch, t, alpha) {
  const J = solve(st), s = st.s || 1;
  const segs = bodySegments(J);
  S.save(); S.globalCompositeOperation = 'lighter'; S.lineCap = 'round';
  S.strokeStyle = rgba(ch.glow, alpha); S.lineWidth = RIG.lw * s;
  S.beginPath(); for (const [a, b] of segs) { S.moveTo(a[0], a[1]); S.lineTo(b[0], b[1]); } S.stroke();
  S.fillStyle = rgba(ch.glow, alpha); S.beginPath(); S.arc(J.head[0], J.head[1], RIG.headR * s, 0, TAU); S.fill();
  S.restore();
}
function eyeTrail(track, ch, t, dur = 0.14, alpha = 1) {
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const tt = t - dur * i / 12, st = track.at(tt);
    if ((st.alpha ?? 1) < 0.2) break;
    const J = solve(st);
    pts.push(eyePos(J, st.s || 1, vecA(J.hA - 90, 1, J.d), vecA(J.hA, 1, J.d)));
  }
  if (pts.length < 3) return;
  S.save(); S.globalCompositeOperation = 'lighter'; S.lineCap = 'round';
  for (let i = 0; i < pts.length - 1; i++) {
    const u = i / (pts.length - 1);
    S.strokeStyle = rgba(mixc([255, 255, 255], ch.eyeGlow, u), alpha * (1 - u));
    S.lineWidth = 5 * (1 - u) + 1;
    S.beginPath(); S.moveTo(pts[i][0], pts[i][1]); S.lineTo(pts[i + 1][0], pts[i + 1][1]); S.stroke();
  }
  S.restore();
  GL.save(); GL.lineCap = 'round'; GL.strokeStyle = rgba(ch.eyeGlow, alpha * 0.8); GL.lineWidth = 16;
  drawPolyline(GL, pts); GL.restore();
}
function actor(track, ch, t, o = {}) {
  const st = track.at(t);
  if (!st || (st.alpha ?? 1) <= 0.01) return { st, J: st ? solve(st) : null };
  if (o.override) Object.assign(st, o.override);
  const vel = track.vel(t);
  const ghosts = Math.round(st.ghost || 0);
  for (let i = ghosts; i >= 1; i--) {
    const gt = t - i * (o.ghostDt || 0.03);
    const gs = track.at(gt);
    if ((gs.alpha ?? 1) > 0.1) ghostFighter(gs, ch, gt, 0.42 * (1 - i / (ghosts + 1)) * (st.alpha ?? 1));
  }
  if (ch.aura === 'fire' && (st.aura || 0) > 0.01) fireAura(t, track, st.aura, { seed: o.seed || 41, size: o.fireSize || 1 });
  if (st.mode === 'rush') st.pose = rushPose(st.pose, t, ch === RAI ? 1 : 2);
  const J = drawFighter(st, ch, t, { vel, wind: o.wind ?? 0.6, cut: o.cut, outline: o.outline });
  if (st.mode === 'rush') rushArms(J, ch, t, st.s || 1);
  if (ch.aura === 'electric' && (st.aura || 0) > 0.01) electricAura(t, J, st.aura, { seed: o.seed || 3 });
  if (o.eyeTrail && (st.eyes || 0) > 0.2) eyeTrail(track, ch, t, o.eyeTrail, clamp(st.eyes));
  if ((st.blade || 0) > 0.01) drawBlade(J, st, ch, t);
  return { st, J, vel };
}

/* the punch barrage: alternate fists every few frames + phantom arms */
function rushPose(pose, t, seed) {
  const f = Math.floor(t * FPS / 3 + seed * 0.5);
  const r = RNG(f * 13 + seed);
  const out = { ...pose };
  if (f % 2) { out.a1 = r.r(78, 104); out.e1 = r.r(-4, 14); out.a2 = r.r(10, 40); out.e2 = 120; }
  else { out.a2 = r.r(78, 104); out.e2 = r.r(-4, 14); out.a1 = r.r(20, 50); out.e1 = 110; }
  out.lean = 20 + r.s() * 4;
  return out;
}
function rushArms(J, ch, t, s) {
  const f = Math.floor(t * FPS);
  for (let k = 0; k < 6; k++) {
    const r = RNG(f * 31 + k * 7 + (ch === RAI ? 0 : 999));
    drawArmOnly(J, r.r(70, 110), r.r(-6, 20), ch, r.r(0.2, 0.5), s);
  }
}

/* glowing energy katana held in the near hand, along the forearm direction */
function drawBlade(J, st, ch, t) {
  const dir = v2.norm(v2.sub(J.h1, J.e1));
  const L = 250 * (st.s || 1) * clamp(st.blade);
  const tip = v2.add(J.h1, v2.mul(dir, L));
  const col = ch === RAI ? [90, 210, 255] : [255, 110, 30];
  S.save(); S.globalCompositeOperation = 'lighter'; S.lineCap = 'round';
  S.strokeStyle = rgba(col, 0.6); S.lineWidth = 16 * (st.s || 1);
  S.beginPath(); S.moveTo(J.h1[0], J.h1[1]); S.lineTo(tip[0], tip[1]); S.stroke();
  S.strokeStyle = rgba([255, 255, 255], 0.95); S.lineWidth = 5 * (st.s || 1);
  S.beginPath(); S.moveTo(J.h1[0], J.h1[1]); S.lineTo(tip[0], tip[1]); S.stroke();
  S.restore();
  GL.save(); GL.lineCap = 'round'; GL.strokeStyle = rgba(col, 0.9); GL.lineWidth = 40 * (st.s || 1);
  GL.beginPath(); GL.moveTo(J.h1[0], J.h1[1]); GL.lineTo(tip[0], tip[1]); GL.stroke(); GL.restore();
  const f = Math.floor(t * 30);
  if (ch === RAI) {
    for (let i = 0; i < 2; i++) {
      const r = RNG(f * 7 + i);
      const p = v2.lerp(J.h1, tip, r.f());
      bolt(p, v2.add(p, [r.s() * 60, r.s() * 60]), f * 3 + i, { color: col, width: 1.6, gens: 4 });
    }
  } else {
    flames(t, { rate: 90, life: 0.35, size: 16, rise: 120, seed: 77 }, (ts, r) => v2.lerp(J.h1, tip, r.f()));
  }
  return tip;
}

/* ambient wind-blown dust streaks near the ground */
function windDust(t, o = {}) {
  S.save(); S.globalCompositeOperation = 'lighter'; S.lineCap = 'round';
  emit(t, { rate: o.rate || 40, life: 2.2, seed: o.seed || 3 }, (ts, age, r) => {
    const x = (o.cx || 0) + r.r(-1800, 2400) - age * r.r(500, 1100) * (o.speed || 1);
    const y = -r.r(0, o.h || 260) - age * r.r(-20, 40);
    const len = r.r(20, 90);
    S.strokeStyle = rgba(o.color || [200, 180, 230], (o.alpha ?? 0.25) * Math.sin(Math.PI * age / 2.2));
    S.lineWidth = r.r(1, 3);
    S.beginPath(); S.moveTo(x, y); S.lineTo(x + len, y + len * 0.04); S.stroke();
  });
  S.restore();
}

/* full ground backdrop for a camera */
function groundBG(cam, o = {}) {
  screenSpace();
  const pal = o.pal || PAL.night;
  drawSky(cam, { pal, moon: o.moon, hole: o.hole, clouds: o.clouds, stars: o.stars, cloudAlpha: o.cloudAlpha, dawn: o.dawn });
  drawLand(cam, { pal });
  setCam(cam);
}

/* name card for the character close-ups */
function nameCard(t, t0, o) {
  const a = sat(t0, t0 + 0.06, t);
  if (a <= 0) return;
  const s = lerp(1.9, 1, E.outBack(sat(t0, t0 + 0.16, t)));
  const x = o.x, y = o.y;
  screenSpace();
  // brush band
  const bw = E.outExpo(sat(t0 - 0.06, t0 + 0.2, t));
  S.save();
  S.fillStyle = o.band;
  S.translate(x, y + 30); S.rotate(-0.06);
  S.beginPath();
  const half = 520 * bw;
  S.moveTo(-half, -150); S.lineTo(half, -170); S.lineTo(half - 30, 150); S.lineTo(-half + 20, 165); S.closePath();
  S.globalAlpha = 0.85; S.fill();
  S.restore();
  const jit = (1 - sat(t0, t0 + 0.3, t)) * 10;
  text(S, o.kanji, x + jit * noise1(t * 50, 1), y - 20 + jit * noise1(t * 50, 2), {
    font: FONT.brush, size: 420, color: '#ffffff', scale: s, alpha: a, stroke: o.stroke, strokeWidth: 14, shadow: o.shadow, shadowBlur: 50,
  });
  const a2 = sat(t0 + 0.1, t0 + 0.25, t);
  const slide = (1 - E.outExpo(sat(t0 + 0.1, t0 + 0.45, t))) * 260 * (o.from || 1);
  text(S, o.name, x + slide, y + 250, { font: FONT.title, size: 130, spacing: 26, color: '#fff', alpha: a2, skew: -0.12, stroke: '#000', strokeWidth: 10 });
  text(S, o.sub, x - slide * 0.6, y + 345, { font: FONT.sub, size: 44, spacing: 14, color: o.subColor, alpha: a2 });
}
