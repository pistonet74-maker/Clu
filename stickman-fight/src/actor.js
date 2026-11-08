/* =====================================================================
 * actor.js — turns keyframed choreography into fluid, physical motion.
 *
 * An Actor bakes its Track at 240 Hz before rendering:
 *   · every joint angle follows its keyframed target through a damped
 *     spring, gets inertial torque from how its pivot accelerates, and is
 *     dragged by its parent limb  → overlap, follow-through, overshoot
 *   · idle "life" (breathing, boxer bounce, trembling) is layered on top
 *   · planted feet are locked to the ground and step when overstretched
 *   · ragdoll segments take over on big hits and blend back afterwards
 *   · scarf, hair, cape, sash and wraps are Verlet ropes in the wind
 * The result is stored per frame, so drawing is a pure lookup.
 * ===================================================================== */
'use strict';

//            Hz    damping  inertia
const SPR = {
  lean: [5.6, 0.62, 0.3], head: [4.4, 0.46, 0.85],
  a1: [6.0, 0.52, 1.0], e1: [7.2, 0.46, 1.0], a2: [6.0, 0.52, 1.0], e2: [7.2, 0.46, 1.0],
  l1: [7.2, 0.64, 0.55], k1: [8.6, 0.58, 0.55], l2: [7.2, 0.64, 0.55], k2: [8.6, 0.58, 0.55],
};
const SEG = { lean: ['hip', 'neck'], head: ['neck', 'head'], a1: ['sho', 'e1'], e1: ['e1', 'h1'], a2: ['sho', 'e2'], e2: ['e2', 'h2'], l1: ['hip', 'k1'], k1: ['k1', 'f1'], l2: ['hip', 'k2'], k2: ['k2', 'f2'] };
const PARENT = { e1: 'a1', e2: 'a2', k1: 'l1', k2: 'l2', head: 'lean' };
const LIMIT = { e1: [-4, 172], e2: [-4, 172], k1: [-172, 3], k2: [-172, 3] };
const JNAMES = ['hip', 'sho', 'neck', 'head', 'e1', 'h1', 'e2', 'h2', 'k1', 'f1', 'k2', 'f2'];
const INERTIA = 1.0, DRAG = 0.5;
let WIND = (t, x, y) => [-260, -30];        // overridden by the story

const copyJ = (J) => { const o = { d: J.d, s: J.s, r: J.r || 0 }; for (const k of JNAMES) o[k] = [J[k][0], J[k][1]]; return o; };
const lerpJ = (A, B, u) => { const o = { d: u < 0.5 ? A.d : B.d, s: lerp(A.s, B.s, u), r: lerp(A.r || 0, B.r || 0, u) }; for (const k of JNAMES) o[k] = v2.lerp(A[k], B[k], u); return o; };
function headFrame(J) {
  const up = v2.norm(v2.sub(J.head, J.neck));
  const fwd = J.d > 0 ? [-up[1], up[0]] : [up[1], -up[0]];
  return { up, fwd };
}
function torsoFrame(J) {
  const up = v2.norm(v2.sub(J.neck, J.hip));
  const fwd = J.d > 0 ? [-up[1], up[0]] : [up[1], -up[0]];
  return { up, fwd };
}

/* idle life on top of the keyed pose */
function life(tg, t, seed, out) {
  const br = Math.sin(t * TAU * 0.42 + seed);
  out.lean += 1.5 * br; out.head -= 1.2 * br;
  out.a1 += 2.4 * noise1(t * 0.8, seed + 1); out.a2 += 2.4 * noise1(t * 0.75, seed + 2);
  out.e1 += 3 * noise1(t * 1.1, seed + 3); out.e2 += 3 * noise1(t * 1.05, seed + 4);
  out.head += 2 * noise1(t * 0.6, seed + 5);
  const bob = tg.bob || 0;
  if (bob > 0.01) {
    const b = (0.5 - 0.5 * Math.cos(t * TAU * (tg.bobF || 2.3) + seed)) * bob;
    out.k1 -= 16 * b; out.k2 -= 13 * b; out.l1 += 7 * b; out.l2 -= 4 * b;
    out.lean += 3 * b; out.a1 += 5 * b; out.a2 += 4 * b; out.head += 3 * b;
  }
  const tr = tg.tremble || 0;
  if (tr > 0.01) for (const k of PK) out[k] += tr * 3.2 * noise1(t * 31 + PK.indexOf(k) * 7.3, seed + 20);
}

class Actor {
  /** ch: character design · track: keyframes · o: {t0, t1, ragdoll:[...], wind, prewarm} */
  constructor(ch, track, o = {}) {
    this.ch = ch; this.track = track; this.o = o;
    track.build();
    this.t0 = o.t0 ?? track.res[0].t;
    this.t1 = o.t1 ?? track.res[track.res.length - 1].t + 0.4;
    this.frames = null;
  }
  bake() {
    const dt = PHYS_DT, tr = this.track, ch = this.ch, seed = ch.seed || 1;
    const preF = Math.round((this.o.prewarm ?? 0.8) * FPS);
    const fA = Math.ceil(this.t0 * FPS - 1e-6), fB = Math.floor(this.t1 * FPS + 1e-6);
    const T0 = (fA - preF) / FPS;
    const nSteps = (fB - fA + preF) * 4;
    this.fA = fA; this.frames = new Array(fB - fA + 1);
    const th = {}, om = {}, acc = {};
    let tg = tr.at(T0), prev = tg;
    for (const k of PK) { th[k] = tg.pose[k]; om[k] = 0; acc[k] = 0; }
    const hist = [], jAcc = {};
    const locks = [null, null], stepFrom = [null, null], stepT = [-9, -9];
    const ropes = (ch.ropes || []).map((r) => new Rope(r.n, r.seg * (ch.s || 1), r));
    const rs = this.o.ragdoll || [];
    let rag = null, ragSeg = null, hold = null;
    const windFn = this.o.wind || ((t, x, y) => WIND(t, x, y));
    for (let i = 0; i <= nSteps; i++) {
      const t = T0 + i * dt;
      tg = tr.at(t);
      const cut = i > 0 && (Math.abs(tg.x - prev.x) > 80 || Math.abs(tg.y - prev.y) > 80 || tg.dir !== prev.dir || (tg.alpha > 0.5) !== (prev.alpha > 0.5));
      prev = tg;
      const storeF = i % 4 === 0 ? fA - preF + i / 4 : null;
      const freezing = (tg.freeze || 0) > 0.5;
      if (freezing && hold) {                          // hit-stop: everything holds
        if (storeF !== null && storeF >= fA) this.frames[storeF - fA] = { ...hold, st: { ...hold.st, ...pickProps(tg) } };
        continue;
      }
      if (!freezing) hold = null;
      // ---- springs toward the keyed pose (+ life)
      const tgt = {};
      for (const k of PK) tgt[k] = tg.pose[k];
      if ((tg.run || 0) > 0.01) {
        const rp = runPose(t * TAU * (tg.runF || 3.2) + seed, 1), k = clamp(tg.run);
        for (const q of PK) tgt[q] = lerp(tgt[q], rp[q], k);
      }
      if (!tg.still) life(tg, t, seed, tgt);
      const stiff = tg.stiff || 1;
      if (cut || i === 0) {
        for (const k of PK) { th[k] = tgt[k]; om[k] = 0; acc[k] = 0; }
        hist.length = 0; for (const k in jAcc) delete jAcc[k];
        locks[0] = locks[1] = null;
      } else {
        const J1 = hist[0];
        const air = !tg.g;
        for (const k of PK) {
          const [hz, z, gain] = SPR[k];
          const w0 = TAU * hz * stiff;
          let a = w0 * w0 * (tgt[k] - th[k]) - 2 * z * w0 * om[k];
          const legs = k[0] === 'l' || k[0] === 'k';
          if (J1 && (air || !legs) && !rag) {
            const [pv, cv] = SEG[k], A = jAcc[pv];
            if (A) {
              const ux = J1[cv][0] - J1[pv][0], uy = J1[cv][1] - J1[pv][1], L = Math.hypot(ux, uy) || 1;
              const zc = (ux / L) * A[1] - (uy / L) * A[0];
              a += J1.d * (1.5 / L) * zc * gain * INERTIA * (180 / Math.PI);
            }
          }
          if (PARENT[k]) a -= DRAG * acc[PARENT[k]];
          acc[k] = a;
          om[k] += a * dt; th[k] += om[k] * dt;
          const lim = LIMIT[k];
          if (lim) {
            if (th[k] < lim[0]) { th[k] = lim[0]; if (om[k] < 0) om[k] *= -0.2; }
            if (th[k] > lim[1]) { th[k] = lim[1]; if (om[k] > 0) om[k] *= -0.2; }
          }
        }
      }
      // ---- forward kinematics
      const pose = { ...th, pf: (tg.run || 0) > 0.5 ? [0, 0] : tg.pose.pf };
      const s = tg.s || 1;
      const FL = tg.floor || 0;
      const st = { x: tg.x, y: tg.y, dir: tg.dir, rot: tg.rot, s, pose, g: tg.g, floor: FL };
      if (tg.g) st.y = FL - lowestOffset(pose, tg.rot, s) + (tg.lift || 0);
      let J = solve(st);
      // ---- foot locks (no sliding feet) with quick steps when overstretched
      const flat = Math.abs((((tg.rot || 0) % 360) + 540) % 360 - 180) < 2;
      if (tg.g && flat && !tg.slide && !cut) {
        for (const fi of [0, 1]) {
          const fk = fi ? 'f2' : 'f1', kk = fi ? 'k2' : 'k1';
          if (!pose.pf[fi]) { locks[fi] = null; continue; }
          const L1 = RIG.th * s, L2 = RIG.sh * s;
          const anim = J[fk];
          if (!locks[fi]) locks[fi] = [anim[0], FL - RIG.lw * s * 0.5];
          let target = locks[fi];
          const reach = Math.hypot(target[0] - J.hip[0], target[1] - J.hip[1]);
          if (reach > (L1 + L2) * 0.985 || Math.abs(anim[0] - target[0]) > 64 * s) {
            stepFrom[fi] = target; stepT[fi] = t; locks[fi] = [anim[0], FL - RIG.lw * s * 0.5]; target = locks[fi];
          }
          const su = (t - stepT[fi]) / 0.11;
          if (su < 1 && stepFrom[fi]) {
            const u = smooth(clamp(su));
            target = [lerp(stepFrom[fi][0], anim[0], u), lerp(stepFrom[fi][1], target[1], u) - Math.sin(Math.PI * u) * 22 * s];
            locks[fi] = [anim[0], FL - RIG.lw * s * 0.5];
          }
          const r = ikLeg(J.hip, target, L1, L2, J.d);
          J[kk] = r.knee; J[fk] = r.foot;
        }
      } else { locks[0] = locks[1] = null; }
      // ---- ragdoll segments
      const seg = rs.find((r) => t >= r.t && t < (r.until ?? 1e9) + (r.blend ?? 0.3));
      if (seg) {
        if (ragSeg !== seg) {
          const Jp = hist[0] || J, V = {};
          const imp = seg.impulse || [0, 0], spin = seg.spin || 0;
          for (const k of JNAMES) {
            const m = k === (seg.hit || 'neck') ? 1.3 : k[0] === 'f' || k[0] === 'k' ? 0.8 : 1;
            const rx = J[k][0] - J.hip[0], ry = J[k][1] - J.hip[1];
            V[k] = [(J[k][0] - Jp[k][0]) / dt * 0.5 + imp[0] * m - spin * ry, (J[k][1] - Jp[k][1]) / dt * 0.5 + imp[1] * m + spin * rx];
          }
          rag = new Ragdoll(J, V, seg); ragSeg = seg;
        }
        rag.step(dt, t);
        const RJ = rag.joints();
        const until = seg.until ?? 1e9;
        if (t < until) J = RJ;
        else J = lerpJ(RJ, J, smooth(sat(until, until + (seg.blend ?? 0.3), t)));
        J.rag = 1;
      } else { rag = null; ragSeg = null; }
      // ---- joint accelerations (for inertia)
      hist.unshift(J); if (hist.length > 3) hist.pop();
      if (hist.length === 3) {
        for (const k of JNAMES) {
          const a = hist[0][k], b = hist[1][k], c = hist[2][k];
          let ax = (a[0] - 2 * b[0] + c[0]) / (dt * dt), ay = (a[1] - 2 * b[1] + c[1]) / (dt * dt);
          const m = Math.hypot(ax, ay), cap = 45000;
          if (m > cap) { ax *= cap / m; ay *= cap / m; }
          const o = jAcc[k] || [ax, ay];
          jAcc[k] = [lerp(o[0], ax, 0.22), lerp(o[1], ay, 0.22)];
        }
      }
      // ---- cloth
      const w = windFn(t, J.hip[0], J.hip[1]);
      const hf = headFrame(J), tf = torsoFrame(J);
      for (let ri = 0; ri < ropes.length; ri++) {
        const [a, dir] = ch.ropes[ri].anchor(J, hf, tf, ch.s || 1);
        ropes[ri].o.floor = J.rag ? (ragSeg.floor ?? GROUND) : FL;
        ropes[ri].step(a, dir, dt, w, t);
      }
      if ((storeF !== null && storeF >= fA) || freezing) {
        const snap = { J: copyJ(J), st: pickProps(tg), ropes: ropes.map((r) => r.snapshot()), rag: !!J.rag };
        snap.J.rag = J.rag;
        if (storeF !== null && storeF >= fA) this.frames[storeF - fA] = snap;
        if (freezing) hold = snap;
      }
    }
    return this;
  }
  /** snapshot at time t (interpolated between baked frames) */
  at(t) {
    if (!this.frames) this.bake();
    const u = t * FPS - this.fA;
    const n = this.frames.length;
    if (u <= 0) return this.frames[0];
    if (u >= n - 1) return this.frames[n - 1];
    const i = Math.floor(u), k = u - i;
    if (k < 1e-4) return this.frames[i];
    const A = this.frames[i], B = this.frames[i + 1];
    return { J: lerpJ(A.J, B.J, k), st: k < 0.5 ? A.st : B.st, ropes: A.ropes.map((r, ri) => r.map((p, pi) => v2.lerp(p, B.ropes[ri][pi], k))), rag: A.rag };
  }
  vel(t) { const a = this.at(t - 1 / FPS).J.hip, b = this.at(t).J.hip; return [(b[0] - a[0]) * FPS, (b[1] - a[1]) * FPS]; }
  joint(t, k) { return this.at(t).J[k]; }
  /** where the ragdoll came to rest (for placing the get-up keys) */
  settle(t) { return this.at(t).J.hip; }
}
const PROPS = ['alpha', 'eyes', 'aura', 'glow', 'blade', 'mouth', 'ghost', 'sil', 'mode', 'dir', 'smear', 'charge', 'x'];
function pickProps(tg) { const o = {}; for (const k of PROPS) o[k] = tg[k]; return o; }
