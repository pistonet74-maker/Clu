/* =====================================================================
 * rig.js — the stickman skeleton, pose library, keyframe tracks and the
 * character renderer (outline + glow + headband / scarf + glowing eyes).
 *
 * Angle convention (degrees, character facing right):
 *   0 = straight down, 90 = forward, 180 = straight up, -90 = backward.
 * Upper arms / thighs are absolute in the body frame, elbows / knees are
 * relative bends (elbow + = natural, knee - = natural).
 * `rot` pitches the whole body forward, `lean` only the torso.
 * ===================================================================== */
'use strict';

const GROUND = 0;
const RIG = { torso: 92, neck: 33, headR: 25, shDrop: 9, ua: 58, fa: 56, th: 72, sh: 70, lw: 12 };
const PK = ['lean', 'head', 'a1', 'e1', 'a2', 'e2', 'l1', 'k1', 'l2', 'k2'];

const P = (lean, head, a1, e1, a2, e2, l1, k1, l2, k2, pf = [1, 1]) => ({ lean, head, a1, e1, a2, e2, l1, k1, l2, k2, pf });
const POSES = {
  //            lean head   a1   e1    a2   e2    l1   k1    l2   k2
  stand:      P(3, 0, 12, 15, -10, 18, 7, -5, -7, -4),
  standTall:  P(-2, -12, 8, 8, -6, 10, 6, -2, -6, -2),
  stance:     P(10, 6, 45, 100, 22, 128, 30, -30, -28, -14),
  stanceLow:  P(18, 10, 52, 98, 28, 122, 42, -58, -36, -30),
  guard:      P(14, 18, 62, 112, 50, 122, 32, -40, -30, -18),
  crossBlock: P(18, 22, 72, 96, 84, 76, 36, -48, -36, -10),
  windup:     P(0, 6, -55, 112, 68, 62, 32, -36, -36, -14),
  punch:      P(22, 10, 90, 0, -18, 122, 42, -38, -46, 0),
  punch2:     P(22, 10, -14, 120, 90, 0, 42, -38, -46, 0),
  crouch:     P(36, 8, 55, 110, 32, 120, 72, -118, 48, -112),
  uppercut:   P(-12, -16, 158, 14, -30, 100, 14, -10, -26, -12, [1, 1]),
  kickChamber:P(-10, 12, 40, 110, -40, 70, 96, -112, -4, -8, [0, 1]),
  kick:       P(-30, 14, 32, 110, -72, 40, 96, 0, -6, -10, [0, 1]),
  highKick:   P(-42, 26, 22, 118, -104, 30, 136, 0, -8, -6, [0, 1]),
  axeKick:    P(-16, 12, 62, 40, -62, 42, 176, 0, -6, -2, [0, 1]),
  spinKick:   P(-34, 10, -62, 30, 160, 20, 100, 0, 40, -100, [0, 0]),
  dash:       P(56, -36, -122, 12, -136, 6, 76, -96, -56, -50, [0, 0]),
  dashFist:   P(46, -30, -62, 116, -112, 22, 76, -96, -56, -50, [0, 0]),
  hitHead:    P(-36, -36, 132, 30, 150, 26, 26, -16, -26, -10),
  hitGut:     P(52, 26, 30, 40, 10, 52, 16, -36, -20, -26),
  flyBack:    P(-14, -22, 122, 30, 100, 40, 62, -42, 40, -62, [0, 0]),
  tuck:       P(40, 30, 62, 120, 52, 128, 112, -150, 100, -150, [0, 0]),
  jump:       P(6, -16, 150, 16, 128, 22, 32, -62, -10, -40, [0, 0]),
  fall:       P(-8, -10, 160, 30, 120, 40, 20, -30, -20, -60, [0, 0]),
  land:       P(42, -12, -52, 22, 62, 30, 78, -122, -34, -96, [1, 0]),
  kneel:      P(26, 36, 24, 10, 10, 16, 82, -86, -6, -84, [1, 0]),
  lie:        P(0, -12, 172, 10, 160, 22, 5, -6, -6, -12, [0, 0]),
  charge:     P(-12, -42, -42, 82, -52, 86, 34, -32, -34, -20),
  chargeHunch:P(36, 26, 30, 122, 20, 126, 42, -58, -30, -42),
  beamCharge: P(6, 12, -46, 102, -52, 106, 46, -48, -42, -16),
  beamFire:   P(18, 8, 90, 0, 86, 4, 46, -52, -50, -4),
  beamStrain: P(28, 14, 92, 0, 88, 4, 56, -70, -58, -2),
  iaiReady:   P(28, 6, 30, 88, 8, 100, 62, -78, -46, -34),
  iaiAfter:   P(36, 16, -104, 6, 32, 62, 82, -102, -66, -10),
  float:      P(8, 6, 42, 96, 26, 112, 22, -42, -14, -56, [0, 0]),
  catchUp:    P(2, -10, 128, -4, 30, 118, 30, -30, -28, -14),
  throwOver:  P(40, 10, 166, 26, 130, 40, 40, -44, -34, -12),
  slap:       P(-6, -4, 142, 28, -32, 100, 34, -34, -30, -12),
  palm:       P(20, 6, 94, -6, -42, 62, 42, -42, -46, -4),
  flyKick:    P(-18, 14, -40, 30, 40, 96, 92, -2, 8, -120, [0, 0]),
  flyPunch:   P(30, 4, 92, 0, -60, 40, 24, -60, -30, -40, [0, 0]),
  hover:      P(4, 2, 30, 30, -14, 34, 12, -26, -10, -40, [0, 0]),
};

/* ---------- forward kinematics ---------- */
function vecA(ang, len, dir) { const a = ang * DEG; return [dir * Math.sin(a) * len, Math.cos(a) * len]; }

function solve(st) {
  const p = st.pose, d = st.dir || 1, r = st.rot || 0, s = st.s || 1;
  const hip = [st.x, st.y];
  const tA = 180 - p.lean - r;
  const neck = v2.add(hip, vecA(tA, RIG.torso * s, d));
  const sho = v2.add(hip, vecA(tA, (RIG.torso - RIG.shDrop) * s, d));
  const hA = tA - p.head;
  const head = v2.add(neck, vecA(hA, RIG.neck * s, d));
  const e1 = v2.add(sho, vecA(p.a1 - r, RIG.ua * s, d));
  const h1 = v2.add(e1, vecA(p.a1 + p.e1 - r, RIG.fa * s, d));
  const e2 = v2.add(sho, vecA(p.a2 - r, RIG.ua * s, d));
  const h2 = v2.add(e2, vecA(p.a2 + p.e2 - r, RIG.fa * s, d));
  const k1 = v2.add(hip, vecA(p.l1 - r, RIG.th * s, d));
  const f1 = v2.add(k1, vecA(p.l1 + p.k1 - r, RIG.sh * s, d));
  const k2 = v2.add(hip, vecA(p.l2 - r, RIG.th * s, d));
  const f2 = v2.add(k2, vecA(p.l2 + p.k2 - r, RIG.sh * s, d));
  const J = { hip, neck, sho, head, e1, h1, e2, h2, k1, f1, k2, f2, hA, d, s, r };
  if (st.g && Math.abs((((r % 360) + 540) % 360) - 180) < 2) plantFeet(J, st);
  return J;
}

/** how far below the hip the lowest body point sits (for grounding) */
function lowestOffset(pose, rot, s) {
  const J = solve({ x: 0, y: 0, dir: 1, rot, s, pose });
  let m = -1e9;
  for (const k of ['f1', 'f2', 'k1', 'k2', 'h1', 'h2']) m = Math.max(m, J[k][1]);
  m = Math.max(m, J.head[1] + RIG.headR * s);
  return m + RIG.lw * s * 0.5;
}

/** two-bone IK: put a planted foot on the ground without moving the hip */
function ikLeg(hip, target, L1, L2, dir) {
  const dx = (target[0] - hip[0]) * dir, dy = target[1] - hip[1];
  let d = Math.hypot(dx, dy);
  d = clamp(d, Math.abs(L1 - L2) + 0.5, L1 + L2 - 0.05);
  const base = Math.atan2(dx, dy);
  const a = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const th = base + a;
  const knee = [hip[0] + dir * Math.sin(th) * L1, hip[1] + Math.cos(th) * L1];
  const fd = v2.norm([target[0] - knee[0], target[1] - knee[1]]);
  return { knee, foot: [knee[0] + fd[0] * L2, knee[1] + fd[1] * L2] };
}
function plantFeet(J, st) {
  const pf = st.pose.pf || [1, 1];
  const s = J.s, gy = GROUND - RIG.lw * s * 0.5;
  [['k1', 'f1', pf[0]], ['k2', 'f2', pf[1]]].forEach(([kk, fk, on]) => {
    if (!on) return;
    const f = J[fk];
    if (Math.abs(f[1] - gy) < 0.5) return;
    const r = ikLeg(J.hip, [f[0], gy], RIG.th * s, RIG.sh * s, J.d);
    J[kk] = r.knee; J[fk] = r.foot;
  });
}

/* ---------- keyframe tracks ---------- */
function resolvePose(p) {
  if (!p) return null;
  if (typeof p === 'string') { if (!POSES[p]) throw new Error('pose ' + p); return { ...POSES[p] }; }
  return { ...p };
}
const NONLERP = new Set(['t', 'e', 'jump', 'pose', 'pm', 'P', 'Y', 'y', 'g', 'dir', 'pf', 'tag', 'mode', 'spl']);

class Track {
  constructor(init = {}) { this.init = init; this.keys = []; this.res = null; }
  k(t, props = {}) { this.keys.push({ t, ...props }); this.res = null; return this; }
  last() { return this.keys[this.keys.length - 1]; }
  build() {
    const keys = this.keys.map((k, i) => ({ ...k, _i: i })).sort((a, b) => a.t - b.t || a._i - b._i);
    let prev = { x: 0, y: 0, dir: 1, rot: 0, s: 1, g: true, alpha: 1, aura: 0, eyes: 0, sil: 0, ghost: 0,
      blade: 0, lift: 0, streak: 0, glow: 1, P: resolvePose('stand'), ...this.init };
    if (this.init.pose) prev.P = resolvePose(this.init.pose);
    this.res = keys.map((k) => {
      const r = { ...prev, ...k };
      r.e = k.e || 'inOut';
      r.jump = k.jump || 0;
      r.P = k.pose !== undefined ? resolvePose(k.pose) : { ...prev.P };
      if (k.pm) Object.assign(r.P, k.pm);
      delete r.pose; delete r.pm;
      r.Y = r.g ? GROUND - lowestOffset(r.P, r.rot, r.s) + (r.lift || 0) : r.y;
      prev = r;
      return r;
    });
  }
  at(t) {
    if (!this.res) this.build();
    const K = this.res, n = K.length;
    if (!n) return null;
    if (t <= K[0].t) return this._state(K[0], K[0], 0, 0, 0);
    if (t >= K[n - 1].t) return this._state(K[n - 1], K[n - 1], 0, 0, n - 1);
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (K[m].t <= t) lo = m; else hi = m; }
    const a = K[lo], b = K[hi];
    const u = (t - a.t) / (b.t - a.t || 1);
    return this._state(a, b, u, ease(b.e)(u), lo);
  }
  _state(a, b, u, w, i) {
    const st = {};
    for (const key in a) {
      if (NONLERP.has(key) || key[0] === '_') continue;
      const va = a[key], vb = b[key];
      st[key] = typeof va === 'number' && typeof vb === 'number' ? va + (vb - va) * w : va;
    }
    const pose = {};
    for (const k of PK) pose[k] = a.P[k] + (b.P[k] - a.P[k]) * w;
    pose.pf = w < 0.5 ? a.P.pf : b.P.pf;
    st.pose = pose;
    st.dir = u >= 1 ? b.dir : a.dir;
    st.g = a.g && b.g;
    if (b.spl || a.spl) {
      const K = this.res;
      const p0 = K[Math.max(0, i - 1)], p3 = K[Math.min(K.length - 1, i + 2)];
      st.x = catmull(p0.x, a.x, b.x, p3.x, w);
      st.y = catmull(p0.Y, a.Y, b.Y, p3.Y, w);
    } else {
      st.x = a.x + (b.x - a.x) * w;
      st.y = st.g ? GROUND - lowestOffset(pose, st.rot, st.s) + (st.lift || 0) : a.Y + (b.Y - a.Y) * w;
    }
    if (b.jump) st.y -= 4 * b.jump * u * (1 - u);
    st.mode = a.mode;
    return st;
  }
  vel(t, dt = 1 / 60) {
    const a = this.at(t - dt), b = this.at(t);
    return [(b.x - a.x) / dt, (b.y - a.y) / dt];
  }
}
function catmull(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

/* ---------- characters ---------- */
const RAI = {
  id: 'rai', body: '#eef9ff', far: '#a9cfe6', outline: '#1aa6ff', glow: [40, 180, 255],
  eye: '#e8feff', eyeGlow: [60, 220, 255], cloth: '#22b8ff', clothDark: '#0b5ab5', aura: 'electric',
  core: [210, 245, 255],
};
const HOMURA = {
  id: 'homura', body: '#1a0c10', far: '#3a1a20', outline: '#ff4a14', glow: [255, 90, 20],
  eye: '#fff1c8', eyeGlow: [255, 60, 10], cloth: '#d8122c', clothDark: '#6d0613', aura: 'fire',
  core: [255, 220, 150],
};

/** cloth ribbon (headband tails / scarf) trailing from `anchor`, driven by velocity + wind */
function ribbon(ctx, anchor, o) {
  const N = 14, L = o.len, vel = o.vel || [0, 0];
  const speed = Math.hypot(vel[0], vel[1]);
  const wind = o.wind ?? 0.6;
  let base = [-o.dir * (0.6 + wind) - vel[0] * 0.003, -0.25 - vel[1] * 0.003];
  base = v2.norm(base);
  const perp = v2.perp(base);
  const flutter = clamp(0.35 + speed / 900 + wind * 0.4, 0, 1.6);
  const droop = clamp(1 - speed / 350 - wind * 0.8, 0, 1);
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, sl = u * L;
    const wave = Math.sin(sl * 0.06 - o.t * (9 + speed * 0.01) + o.phase) * (4 + 13 * flutter) * Math.pow(u, 1.1) * o.s;
    const wave2 = Math.sin(sl * 0.13 - o.t * 17 + o.phase * 2) * 3 * flutter * u * o.s;
    pts.push([
      anchor[0] + base[0] * sl + perp[0] * (wave + wave2),
      anchor[1] + base[1] * sl + perp[1] * (wave + wave2) + droop * u * u * L * 0.7,
    ]);
  }
  // build a tapered polygon
  const left = [], right = [];
  for (let i = 0; i <= N; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N, i + 1)];
    const tn = v2.norm(v2.sub(b, a)), nn = v2.perp(tn);
    const w = lerp(o.w0, o.w1, i / N) * 0.5;
    left.push([pts[i][0] + nn[0] * w, pts[i][1] + nn[1] * w]);
    right.push([pts[i][0] - nn[0] * w, pts[i][1] - nn[1] * w]);
  }
  ctx.beginPath();
  ctx.moveTo(left[0][0], left[0][1]);
  for (let i = 1; i <= N; i++) ctx.lineTo(left[i][0], left[i][1]);
  for (let i = N; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
  ctx.closePath();
  return pts;
}

/** draw one fighter. st: track state; ch: character; t: time; o: {vel, wind} */
function drawFighter(st, ch, t, o = {}) {
  if (!st || (st.alpha ?? 1) <= 0.01) return null;
  const J = solve(st);
  const s = st.s || 1, lw = RIG.lw * s, R = RIG.headR * s;
  const alpha = st.alpha ?? 1;
  const sil = st.sil || 0;
  const body = sil > 0 ? rgba(mixc(rgb(ch.body), [6, 6, 12], sil), 1) : ch.body;
  const far = sil > 0 ? rgba(mixc(rgb(ch.far), [14, 12, 20], sil), 1) : ch.far;
  const outline = sil > 0 ? rgba(mixc(rgb(ch.outline), [4, 4, 8], sil * 0.85), 1) : ch.outline;
  const vel = o.vel || [0, 0];
  const ow = (o.outline ?? 2.6) * s;

  const limbsFar = [[J.sho, J.e2, J.h2], [J.hip, J.k2, J.f2]];
  const limbsNear = [[J.hip, J.k1, J.f1], [J.sho, J.e1, J.h1]];
  const torso = [J.hip, J.neck];
  const strokePath = (ctx, pts) => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke(); };

  // head orientation
  const upV = vecA(J.hA, 1, J.d);              // neck -> head direction
  const fwdV = vecA(J.hA - 90, 1, J.d);         // facing direction of the face
  const backV = [-fwdV[0], -fwdV[1]];

  S.save();
  S.globalAlpha = alpha;
  S.lineCap = 'round'; S.lineJoin = 'round';

  // ---- glow halo (emissive layer)
  const ga = (st.glow ?? 1) * (0.42 + 0.32 * (st.aura || 0)) * alpha;
  if (ga > 0.01) {
    GL.save();
    GL.lineCap = 'round'; GL.lineJoin = 'round';
    GL.strokeStyle = rgba(ch.glow, clamp(ga * 0.8));
    GL.lineWidth = lw * (2.3 + 1.3 * (st.aura || 0));
    for (const L of [...limbsFar, torso, ...limbsNear]) strokePath(GL, L);
    GL.fillStyle = rgba(ch.glow, clamp(ga * 0.8));
    GL.beginPath(); GL.arc(J.head[0], J.head[1], R + lw * 1.4, 0, TAU); GL.fill();
    GL.restore();
  }

  // ---- cloth behind the body
  const clothFill = sil > 0.5 ? '#06060c' : ch.cloth;
  const clothDark = sil > 0.5 ? '#06060c' : ch.clothDark;
  if (ch.id === 'rai' && !o.noCloth) {
    const knot = v2.add(J.head, v2.add(v2.mul(backV, R * 0.92), v2.mul(upV, R * 0.18)));
    const rib = { dir: J.d, vel, t, s, wind: o.wind, len: 98 * s * (st.band ?? 1), w0: 9 * s, w1: 4 * s, phase: 0 };
    S.lineWidth = ow * 1.6; S.strokeStyle = outline;
    S.fillStyle = clothDark; ribbon(S, knot, { ...rib, len: rib.len * (o.cut ? 0 : 0.8), phase: 1.7 }); if (!o.cut) { S.stroke(); S.fill(); }
    S.fillStyle = clothFill; ribbon(S, knot, rib); S.stroke(); S.fill();
  }
  if (ch.id === 'homura' && !o.noCloth) {
    const nk = v2.add(J.neck, v2.add(v2.mul(backV, lw * 0.4), v2.mul(upV, -lw * 0.2)));
    const rib = { dir: J.d, vel, t, s, wind: o.wind, len: 150 * s, w0: 15 * s, w1: 5 * s, phase: 0.6 };
    S.lineWidth = ow * 1.4; S.strokeStyle = outline;
    S.fillStyle = clothDark; ribbon(S, nk, { ...rib, len: rib.len * 0.72, phase: 2.4 }); S.stroke(); S.fill();
    S.fillStyle = clothFill; ribbon(S, nk, rib); S.stroke(); S.fill();
  }

  // ---- outline pass (one merged silhouette)
  S.strokeStyle = outline;
  S.lineWidth = lw + ow * 2;
  for (const L of [...limbsFar, torso, ...limbsNear]) strokePath(S, L);
  S.fillStyle = outline;
  S.beginPath(); S.arc(J.head[0], J.head[1], R + ow, 0, TAU); S.fill();
  S.beginPath(); S.arc(J.h1[0], J.h1[1], lw * 0.82 + ow, 0, TAU); S.arc(J.h2[0], J.h2[1], lw * 0.82 + ow, 0, TAU); S.fill();

  // ---- body pass
  S.lineWidth = lw;
  S.strokeStyle = far;
  for (const L of limbsFar) strokePath(S, L);
  S.fillStyle = far; S.beginPath(); S.arc(J.h2[0], J.h2[1], lw * 0.82, 0, TAU); S.fill();
  S.strokeStyle = body;
  strokePath(S, torso);
  S.fillStyle = body;
  S.beginPath(); S.arc(J.head[0], J.head[1], R, 0, TAU); S.fill();
  for (const L of limbsNear) strokePath(S, L);
  S.beginPath(); S.arc(J.h1[0], J.h1[1], lw * 0.82, 0, TAU); S.fill();

  // ---- head accessories
  if (ch.id === 'rai' && !o.noCloth) {
    // headband across the forehead
    S.save();
    S.beginPath(); S.arc(J.head[0], J.head[1], R, 0, TAU); S.clip();
    S.strokeStyle = sil > 0.5 ? '#06060c' : ch.cloth; S.lineWidth = R * 0.42; S.lineCap = 'butt';
    const c = v2.add(J.head, v2.mul(upV, R * 0.2));
    const pA = v2.add(c, v2.mul(fwdV, R * 1.2)), pB = v2.add(c, v2.add(v2.mul(backV, R * 1.2), v2.mul(upV, -R * 0.12)));
    S.beginPath(); S.moveTo(pA[0], pA[1]); S.lineTo(pB[0], pB[1]); S.stroke();
    S.restore();
  }
  if (ch.id === 'homura' && !o.noCloth) {
    S.strokeStyle = sil > 0.5 ? '#06060c' : ch.cloth; S.lineWidth = lw * 1.25; S.lineCap = 'round';
    const a = v2.add(J.neck, v2.add(v2.mul(fwdV, lw * 0.55), v2.mul(upV, -lw * 0.3)));
    const b = v2.add(J.neck, v2.add(v2.mul(backV, lw * 0.55), v2.mul(upV, -lw * 0.1)));
    S.beginPath(); S.moveTo(a[0], a[1]); S.lineTo(b[0], b[1]); S.stroke();
  }

  // ---- eyes
  const eyes = st.eyes || 0;
  if (eyes > 0.01) drawEye(J, ch, s, eyes, fwdV, upV, alpha);
  S.restore();
  J.fwdV = fwdV; J.upV = upV;
  return J;
}

function eyePos(J, s, fwdV, upV) {
  const R = RIG.headR * s;
  return v2.add(J.head, v2.add(v2.mul(fwdV, R * 0.5), v2.mul(upV, R * 0.12)));
}
function drawEye(J, ch, s, eyes, fwdV, upV, alpha = 1) {
  const R = RIG.headR * s;
  const c = eyePos(J, s, fwdV, upV);
  // almond slit, slanted (angry): inner end low, outer end high
  const a = v2.add(c, v2.add(v2.mul(fwdV, -R * 0.32), v2.mul(upV, R * 0.02)));
  const b = v2.add(c, v2.add(v2.mul(fwdV, R * 0.36), v2.mul(upV, R * 0.16)));
  const m = v2.mul(v2.add(a, b), 0.5);
  const th = R * 0.15;
  S.save();
  S.globalAlpha = alpha * clamp(eyes);
  S.fillStyle = ch.eye;
  S.beginPath();
  S.moveTo(a[0], a[1]);
  S.quadraticCurveTo(m[0] + upV[0] * th, m[1] + upV[1] * th, b[0], b[1]);
  S.quadraticCurveTo(m[0] - upV[0] * th * 0.6, m[1] - upV[1] * th * 0.6, a[0], a[1]);
  S.fill();
  S.restore();
  GL.save();
  blob(GL, ch.eyeGlow, c[0], c[1], R * (0.4 + 0.45 * eyes), alpha * clamp(eyes) * 0.85);
  blob(GL, [255, 255, 255], c[0], c[1], R * 0.25, alpha * clamp(eyes) * 0.5);
  GL.restore();
}
