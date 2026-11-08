/* =====================================================================
 * story.js — helpers shared by every shot + the global event list.
 * The shots themselves live in shots2_*.js. Times are in seconds;
 * the score runs at 150 BPM (one beat = 0.4 s) and big hits land on beats.
 * ===================================================================== */
'use strict';

const DURATION = 64.0;
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

/* ---------- wind: hot drift + radial gusts from explosions (drives all cloth) ---------- */
const GUSTS = [];
function gust(t, x, y, power = 3000, reach = 1600) { GUSTS.push({ t, x, y, power, reach }); }
WIND = (t, x, y) => {
  let wx = -230 + 140 * noise1(t * 0.35, 5), wy = -40 + 40 * noise1(t * 0.5, 6);
  for (const g of GUSTS) {
    const age = t - g.t;
    if (age < 0 || age > 1.6) continue;
    const dx = x - g.x, dy = y - g.y, d = Math.hypot(dx, dy) + 1;
    const k = g.power * Math.exp(-age * 2.6) * Math.exp(-d / g.reach);
    wx += (dx / d) * k; wy += (dy / d) * k;
  }
  return [wx, wy];
};

/* ---------- actor helpers ---------- */
const ACTORS = [];
function makeActor(ch, track, o = {}) { const a = new Actor(ch, track, o); ACTORS.push(a); return a; }
function act(a, t, o = {}) { return drawActor(a, t, o); }
const J_ = (a, t, k) => a.at(t).J[k];

/* ---------- glass: bouncing shards that glint in the firelight ---------- */
function glass(t, t0, x, y, o = {}) {
  const age = t - t0;
  if (age < 0 || age > (o.life || 2.4)) return;
  const n = o.n || 40;
  S.save();
  for (let i = 0; i < n; i++) {
    const r = RNG((o.seed || 1) * 1009 + i * 37);
    const p = simPart({ x: x + r.s() * (o.w || 60), y: y + r.s() * (o.h || 40), vx: r.s() * (o.vx || 700) + (o.bias || 0), vy: -r.r(o.vyMin ?? 100, o.vy ?? 900), drag: 0.6, e: 0.35, mu: 0.5, r: 1, w: r.s() * 30 }, age);
    const sz = r.r(3, o.size || 9), fade = 1 - sat((o.life || 2.4) * 0.7, o.life || 2.4, age);
    const glint = 0.5 + 0.5 * Math.sin(p.rot * 3 + i);
    S.save(); S.translate(p.x, p.y); S.rotate(p.rot);
    S.globalAlpha = fade;
    S.fillStyle = `rgba(${200 + 55 * glint | 0},${180 + 60 * glint | 0},${170 + 70 * glint | 0},0.85)`;
    S.beginPath(); S.moveTo(-sz, -sz * 0.4); S.lineTo(sz * 0.8, -sz * 0.7); S.lineTo(sz * 0.3, sz * 0.6); S.closePath(); S.fill();
    S.restore();
    if (glint > 0.85) blob(GL, [255, 220, 180], p.x, p.y, sz * 3, fade * 0.8);
  }
  S.restore();
}
/* ---------- debris with real bounces ---------- */
function rubble(t, t0, x, y, o = {}) {
  const age = t - t0;
  if (age < 0 || age > (o.life || 3)) return;
  const fade = 1 - sat((o.life || 3) * 0.75, o.life || 3, age);
  S.save();
  for (let i = 0; i < (o.n || 20); i++) {
    const r = RNG((o.seed || 3) * 733 + i * 13);
    const p = simPart({ x: x + r.s() * (o.jitter ?? 20), y, vx: r.s() * (o.vx ?? 900) + (o.bias || 0), vy: -r.r(o.vyMin ?? 300, o.vy ?? 1400), drag: 0.15, e: 0.35, mu: 0.35, r: 6, w: r.s() * 14 }, age);
    const sz = r.r(o.smin ?? 5, o.smax ?? 18);
    rockShape(S, p.x, p.y, sz, p.rot, i + (o.seed || 3));
    S.globalAlpha = fade; S.fillStyle = o.color || '#2a1d20'; S.fill();
    if (o.hot) { S.globalCompositeOperation = 'lighter'; S.fillStyle = rgba(o.hot, 0.7 * Math.max(0, 1 - age * 1.2)); S.fill(); S.globalCompositeOperation = 'source-over'; }
    else { S.strokeStyle = 'rgba(160,100,80,0.35)'; S.lineWidth = 1.5; S.stroke(); }
  }
  S.restore();
}
/* bouncing sparks (they skitter on the asphalt) */
function bsparks(t, t0, x, y, o = {}) {
  const age = t - t0, life = o.life || 0.7;
  if (age < 0 || age > life * 1.3) return;
  const col = o.color || [255, 190, 90];
  S.save(); S.globalCompositeOperation = 'lighter'; S.lineCap = 'round';
  for (let i = 0; i < (o.n || 30); i++) {
    const r = RNG((o.seed || 5) * 977 + i * 31);
    const L = life * r.r(0.5, 1.3); if (age > L) continue;
    const a = ((o.ang ?? -90) + r.s() * (o.spread ?? 160) / 2) * DEG, v = r.r(o.vmin ?? 400, o.vmax ?? 1600);
    const P = { x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 2.2, e: 0.45, mu: 0.25, g: 1800 };
    const p = simPart(P, age), q = simPart(P, Math.max(0, age - 0.025));
    const u = age / L;
    S.strokeStyle = rgba(mixc([255, 255, 255], col, u), 1 - u); S.lineWidth = (o.width || 3) * (1 - u * 0.7);
    S.beginPath(); S.moveTo(q.x, q.y); S.lineTo(p.x, p.y); S.stroke();
    blob(GL, col, p.x, p.y, 14, (1 - u) * 0.8);
  }
  S.restore();
}

/* ---------- cars as rigid bodies (and sliced halves) ---------- */
const CAR_VERTS = boxVerts(236, 92, 0, -48);
function carBody(o) { return bakeBody({ verts: CAR_VERTS, m: 6, e: 0.2, mu: 0.6, dur: 5, ...o }); }
function drawCarBody(b, t, o = {}) {
  const st = b.at(t);
  S.save(); S.translate(st.x, st.y); S.rotate(st.a);
  if (o.clip) { S.beginPath(); o.clip.forEach((p, i) => (i ? S.lineTo(p[0], p[1]) : S.moveTo(p[0], p[1]))); S.closePath(); S.clip(); }
  drawCar(S, 1, o);
  S.restore();
  if (o.fire) carFire(S, st.x, st.y, 1, t, b.o.x | 0, o.fire);
  return st;
}

/* ---------- name card ---------- */
function nameCard(t, t0, o) {
  const a = sat(t0, t0 + 0.06, t);
  if (a <= 0) return;
  const s = lerp(1.9, 1, E.outBack(sat(t0, t0 + 0.16, t)));
  const x = o.x, y = o.y;
  screenSpace();
  const bw = E.outExpo(sat(t0 - 0.06, t0 + 0.2, t));
  S.save(); S.fillStyle = o.band; S.translate(x, y + 30); S.rotate(-0.06);
  S.beginPath(); const half = 540 * bw;
  S.moveTo(-half, -150); S.lineTo(half, -170); S.lineTo(half - 30, 150); S.lineTo(-half + 20, 165); S.closePath();
  S.globalAlpha = 0.86; S.fill(); S.restore();
  const jit = (1 - sat(t0, t0 + 0.3, t)) * 10;
  text(S, o.kanji, x + jit * noise1(t * 50, 1), y - 20 + jit * noise1(t * 50, 2), { font: FONT.brush, size: o.size || 330, color: '#ffffff', scale: s, alpha: a, stroke: o.stroke, strokeWidth: 14, shadow: o.shadow, shadowBlur: 50, spacing: o.spacing || 0 });
  const a2 = sat(t0 + 0.1, t0 + 0.25, t);
  const slide = (1 - E.outExpo(sat(t0 + 0.1, t0 + 0.45, t))) * 260 * (o.from || 1);
  text(S, o.name, x + slide, y + 250, { font: FONT.title, size: 130, spacing: 26, color: '#fff', alpha: a2, skew: -0.12, stroke: '#000', strokeWidth: 10 });
  text(S, o.sub, x - slide * 0.6, y + 345, { font: FONT.sub, size: 44, spacing: 14, color: o.subColor, alpha: a2 });
}

/* ---------- screen-space impact helpers ---------- */
function impactLines(cam, p, a = 0.45, r0 = 260) { screenSpace(); const s = camToScreen(cam, p); focusLines(S, s[0], s[1], { alpha: a, r0, n: 120 }); }

/* ambient wind-blown dust streaks near the ground */
function windDust(t, o = {}) {
  S.save(); S.globalCompositeOperation = 'lighter'; S.lineCap = 'round';
  emit(t, { rate: o.rate || 40, life: 2.2, seed: o.seed || 3 }, (ts, age, r) => {
    const x = (o.cx || 0) + r.r(-1800, 2400) - age * r.r(500, 1100) * (o.speed || 1);
    const y = -r.r(0, o.h || 260) - age * r.r(-20, 40);
    const len = r.r(20, 90);
    S.strokeStyle = rgba(o.color || [230, 190, 170], (o.alpha ?? 0.25) * Math.sin(Math.PI * age / 2.2));
    S.lineWidth = r.r(1, 3);
    S.beginPath(); S.moveTo(x, y); S.lineTo(x + len, y + len * 0.04); S.stroke();
  });
  S.restore();
}
