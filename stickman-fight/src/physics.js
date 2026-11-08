/* =====================================================================
 * physics.js — deterministic simulations, baked once at load time so that
 * every frame stays a pure lookup:
 *   Rope      Verlet strands (scarves, hair, capes, wraps)
 *   Ragdoll   Verlet stick-figure body for knock-backs and KOs
 *   RBody     2-D rigid convex polygons (cars, rubble, a sliced skyscraper)
 *   simPart   bouncing particles re-simulated from their spawn time
 * ===================================================================== */
'use strict';

const PHYS_DT = 1 / 240;
const GRAV = 2300;

/* ---------------------------- ropes ---------------------------- */
class Rope {
  constructor(n, seg, o = {}) {
    this.n = n; this.seg = seg; this.o = o;
    this.p = new Float64Array(n * 2); this.q = new Float64Array(n * 2);
    this.ready = false;
  }
  reset(a, dir) {
    for (let i = 0; i < this.n; i++) {
      this.p[i * 2] = this.q[i * 2] = a[0] + dir[0] * this.seg * i;
      this.p[i * 2 + 1] = this.q[i * 2 + 1] = a[1] + dir[1] * this.seg * i;
    }
    this.ready = true;
  }
  /** anchor: pinned point, dir: preferred leaving direction, wind: [vx,vy] (units/s) */
  step(anchor, dir, dt, wind, t) {
    const o = this.o, n = this.n, p = this.p, q = this.q, seg = this.seg;
    if (!this.ready || Math.hypot(anchor[0] - p[0], anchor[1] - p[1]) > 160) this.reset(anchor, dir);
    const air = (o.air ?? 5) * dt, g = (o.gravity ?? 1) * GRAV * dt * dt, damp = 1 - (o.damp ?? 0.01);
    const turb = o.turb ?? 1;
    q[0] = p[0]; q[1] = p[1]; p[0] = anchor[0]; p[1] = anchor[1];
    for (let i = 1; i < n; i++) {
      const x = p[i * 2], y = p[i * 2 + 1];
      const vx = x - q[i * 2], vy = y - q[i * 2 + 1];
      const fl = 0.35 + 0.65 * i / n;
      const wx = (wind[0] + turb * 320 * fl * noise1(t * 2.7 + i * 0.41, 91 + (o.seed || 0))) * dt;
      const wy = (wind[1] + turb * 260 * fl * noise1(t * 3.3 + i * 0.37, 57 + (o.seed || 0))) * dt;
      q[i * 2] = x; q[i * 2 + 1] = y;
      p[i * 2] = x + vx * damp + (wx - vx) * air;
      p[i * 2 + 1] = y + vy * damp + (wy - vy) * air + g;
    }
    const it = o.iters || 6, attach = o.attach ?? 0.25, bend = o.bend ?? 0.55;
    for (let k = 0; k < it; k++) {
      // the first link leaves the body in a preferred direction
      if (attach > 0) {
        const tx = p[0] + dir[0] * seg, ty = p[1] + dir[1] * seg;
        p[2] += (tx - p[2]) * attach; p[3] += (ty - p[3]) * attach;
      }
      for (let i = 0; i < n - 1; i++) {
        const ax = p[i * 2], ay = p[i * 2 + 1], bx = p[i * 2 + 2], by = p[i * 2 + 3];
        const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 1e-6, diff = (d - seg) / d;
        if (i === 0) { p[i * 2 + 2] -= dx * diff; p[i * 2 + 3] -= dy * diff; }
        else { p[i * 2] += dx * diff * 0.5; p[i * 2 + 1] += dy * diff * 0.5; p[i * 2 + 2] -= dx * diff * 0.5; p[i * 2 + 3] -= dy * diff * 0.5; }
      }
      // bending resistance: points i and i+2 should not fold onto each other
      for (let i = 0; i < n - 2; i++) {
        const ax = p[i * 2], ay = p[i * 2 + 1], bx = p[i * 2 + 4], by = p[i * 2 + 5];
        const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 1e-6, min = seg * 2 * bend;
        if (d < min) {
          const c = (d - min) / d * 0.5;
          if (i > 0) { p[i * 2] += dx * c; p[i * 2 + 1] += dy * c; }
          p[i * 2 + 4] -= dx * c; p[i * 2 + 5] -= dy * c;
        }
      }
      const fl = (o.floor ?? GROUND) - 2;
      for (let i = 1; i < n; i++) if (p[i * 2 + 1] > fl) { p[i * 2 + 1] = fl; q[i * 2] = p[i * 2] - (p[i * 2] - q[i * 2]) * 0.5; }
    }
  }
  snapshot() { const a = []; for (let i = 0; i < this.n; i++) a.push([this.p[i * 2], this.p[i * 2 + 1]]); return a; }
}

/* ---------------------------- ragdoll ---------------------------- */
const RAG_PTS = ['hip', 'sho', 'neck', 'head', 'e1', 'h1', 'e2', 'h2', 'k1', 'f1', 'k2', 'f2'];
const RAG_LINKS = [['head', 'neck'], ['neck', 'sho'], ['sho', 'hip'], ['neck', 'hip'], ['sho', 'e1'], ['e1', 'h1'], ['sho', 'e2'], ['e2', 'h2'],
  ['hip', 'k1'], ['k1', 'f1'], ['hip', 'k2'], ['k2', 'f2']];
const RAG_SOFT = [['head', 'hip', 0.6], ['head', 'sho', 0.6], ['sho', 'h1', 0.08], ['sho', 'h2', 0.08], ['hip', 'f1', 0.1], ['hip', 'f2', 0.1], ['neck', 'k1', 0.05], ['neck', 'k2', 0.05], ['k1', 'k2', 0.02]];
const RAG_MIN = [['sho', 'h1', 26], ['sho', 'h2', 26], ['hip', 'f1', 40], ['hip', 'f2', 40], ['head', 'hip', 100]];
const RAG_MASS = { hip: 4, sho: 2, neck: 1.6, head: 1.8, e1: 0.8, h1: 0.6, e2: 0.8, h2: 0.6, k1: 1.4, f1: 0.9, k2: 1.4, f2: 0.9 };

class Ragdoll {
  /** J: joints now, V: per-joint velocities (units/s) */
  constructor(J, V, o = {}) {
    this.o = o; this.s = J.s || 1; this.d = J.d;
    this.p = {}; this.q = {};
    const dt = PHYS_DT;
    for (const k of RAG_PTS) { this.p[k] = [J[k][0], J[k][1]]; this.q[k] = [J[k][0] - V[k][0] * dt, J[k][1] - V[k][1] * dt]; }
    const dist = (a, b) => Math.hypot(J[a][0] - J[b][0], J[a][1] - J[b][1]);
    this.rest = RAG_LINKS.map(([a, b]) => [a, b, dist(a, b)]);
    this.soft = RAG_SOFT.map(([a, b, k]) => [a, b, dist(a, b), k]);
    this.minD = RAG_MIN.map(([a, b, m]) => [a, b, m * this.s]);
  }
  step(dt, t) {
    const g = (this.o.gravity ?? 1) * GRAV * dt * dt, damp = 1 - (this.o.air ?? 0.004);
    for (const k of RAG_PTS) {
      const p = this.p[k], q = this.q[k];
      const vx = p[0] - q[0], vy = p[1] - q[1];
      q[0] = p[0]; q[1] = p[1];
      p[0] += vx * damp; p[1] += vy * damp + g;
    }
    const im = (k) => 1 / RAG_MASS[k];
    const solve = (a, b, L, stiff = 1, onlyMin = false) => {
      const A = this.p[a], B = this.p[b];
      const dx = B[0] - A[0], dy = B[1] - A[1], d = Math.hypot(dx, dy) || 1e-6;
      if (onlyMin && d >= L) return;
      const wa = im(a), wb = im(b), c = (d - L) / d / (wa + wb) * stiff;
      A[0] += dx * c * wa; A[1] += dy * c * wa; B[0] -= dx * c * wb; B[1] -= dy * c * wb;
    };
    for (let it = 0; it < 10; it++) {
      for (const [a, b, L] of this.rest) solve(a, b, L);
      for (const [a, b, L, k] of this.soft) solve(a, b, L, k);
      for (const [a, b, L] of this.minD) solve(a, b, L, 1, true);
      this.collide(t);
    }
  }
  collide(t) {
    const s = this.s;
    for (const k of RAG_PTS) {
      const p = this.p[k], q = this.q[k], r = (k === 'head' ? RIG.headR : 7) * s;
      const fl = (this.o.floor ?? GROUND) - r;
      if (p[1] > fl) {
        const vy = p[1] - q[1], vx = p[0] - q[0];
        p[1] = fl;
        if (vy > 0) { q[1] = fl + vy * (this.o.bounce ?? 0.25); q[0] = p[0] - vx * (1 - (this.o.friction ?? 0.35)); }
        else q[1] = fl - vy;
      }
      for (const b of this.o.boxes || []) {
        if (b.t0 !== undefined && (t < b.t0 || t > b.t1)) continue;
        if (p[0] > b.x0 - r && p[0] < b.x1 + r && p[1] > b.y0 - r && p[1] < b.y1 + r) {
          const pen = [p[0] - (b.x0 - r), (b.x1 + r) - p[0], p[1] - (b.y0 - r), (b.y1 + r) - p[1]];
          const m = Math.min(...pen), i = pen.indexOf(m);
          const vx = p[0] - q[0], vy = p[1] - q[1];
          if (i === 0) { p[0] = b.x0 - r; q[0] = p[0] + Math.max(0, vx) * 0.3; }
          else if (i === 1) { p[0] = b.x1 + r; q[0] = p[0] + Math.min(0, vx) * 0.3; }
          else if (i === 2) { p[1] = b.y0 - r; if (vy > 0) { q[1] = p[1] + vy * 0.25; q[0] = p[0] - vx * 0.6; } else q[1] = p[1] - vy; }
          else { p[1] = b.y1 + r; q[1] = p[1] + Math.min(0, vy) * 0.3; }
        }
      }
    }
  }
  joints() {
    const J = { d: this.d, s: this.s, r: 0 };
    for (const k of RAG_PTS) J[k] = [this.p[k][0], this.p[k][1]];
    return J;
  }
}

/* ---------------------------- rigid bodies ---------------------------- */
const cross2 = (ax, ay, bx, by) => ax * by - ay * bx;
class RBody {
  constructor(o) {
    this.verts = o.verts;               // local convex polygon (array of [x,y])
    this.x = o.x; this.y = o.y; this.a = o.a || 0;
    this.vx = o.vx || 0; this.vy = o.vy || 0; this.w = o.w || 0;
    this.m = o.m || 1;
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const [vx, vy] of this.verts) { x0 = Math.min(x0, vx); x1 = Math.max(x1, vx); y0 = Math.min(y0, vy); y1 = Math.max(y1, vy); }
    this.I = this.m * ((x1 - x0) ** 2 + (y1 - y0) ** 2) / 12;
    this.e = o.e ?? 0.22; this.mu = o.mu ?? 0.55;
    this.planes = o.planes || [[0, -1, -GROUND]];   // [nx, ny, d]: solid where n·p < d  (ground: -y < 0  → y > 0 is solid)
  }
  world(i) {
    const c = Math.cos(this.a), s = Math.sin(this.a), [lx, ly] = this.verts[i];
    return [this.x + lx * c - ly * s, this.y + lx * s + ly * c];
  }
  step(dt) {
    this.vy += GRAV * dt;
    this.vx *= 0.9995; this.vy *= 0.9995; this.w *= 0.998;
    this.x += this.vx * dt; this.y += this.vy * dt; this.a += this.w * dt;
    for (let it = 0; it < 4; it++) {
      let push = [0, 0], pushN = 0;
      for (let i = 0; i < this.verts.length; i++) {
        const P = this.world(i);
        for (const [nx, ny, d] of this.planes) {
          const dist = nx * P[0] + ny * P[1] - d;     // >0 outside (free), <0 penetrating
          if (dist >= 0) continue;
          const rx = P[0] - this.x, ry = P[1] - this.y;
          const vcx = this.vx - this.w * ry, vcy = this.vy + this.w * rx;
          const vn = vcx * nx + vcy * ny;
          if (vn < 0) {
            const rn = cross2(rx, ry, nx, ny);
            const j = -(1 + this.e) * vn / (1 / this.m + rn * rn / this.I);
            this.vx += j * nx / this.m; this.vy += j * ny / this.m; this.w += rn * j / this.I;
            const tx = -ny, ty = nx;
            const vcx2 = this.vx - this.w * ry, vcy2 = this.vy + this.w * rx;
            const vt = vcx2 * tx + vcy2 * ty, rt = cross2(rx, ry, tx, ty);
            let jt = -vt / (1 / this.m + rt * rt / this.I);
            jt = clamp(jt, -this.mu * j, this.mu * j);
            this.vx += jt * tx / this.m; this.vy += jt * ty / this.m; this.w += rt * jt / this.I;
          }
          push[0] += nx * -dist; push[1] += ny * -dist; pushN++;
        }
      }
      if (pushN) { this.x += push[0] / pushN * 0.6; this.y += push[1] / pushN * 0.6; }
    }
  }
}
/** simulate one body from o.t0 for o.dur seconds; returns a sampler at(t) -> {x,y,a} */
function bakeBody(o) {
  const b = new RBody(o), frames = [];
  const n = Math.ceil((o.dur || 4) * 60);
  frames.push([b.x, b.y, b.a]);
  for (let f = 1; f <= n; f++) { for (let k = 0; k < 4; k++) b.step(PHYS_DT); frames.push([b.x, b.y, b.a]); }
  return {
    o, t0: o.t0,
    at(t) {
      if (t <= o.t0) return { x: o.x, y: o.y, a: o.a || 0 };
      const u = (t - o.t0) * 60, i = Math.min(frames.length - 2, Math.floor(u)), k = Math.min(1, u - i);
      const A = frames[i], B = frames[i + 1];
      return { x: lerp(A[0], B[0], k), y: lerp(A[1], B[1], k), a: lerp(A[2], B[2], k) };
    },
  };
}
const boxVerts = (w, h, cx = 0, cy = 0) => [[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]];

/* ---------------------------- bouncing particles ---------------------------- */
/** integrate a particle from its spawn until `age` (fixed 120 Hz steps): gravity, drag, floor bounce */
function simPart(o, age) {
  let x = o.x, y = o.y, vx = o.vx, vy = o.vy, rot = o.rot || 0, w = o.w || 0;
  const dt = 1 / 120, g = o.g ?? GRAV, drag = o.drag ?? 0, e = o.e ?? 0.3, mu = o.mu ?? 0.35, fl = (o.floor ?? GROUND) - (o.r || 0);
  const n = Math.floor(age * 120);
  let bounced = 0;
  for (let i = 0; i < n; i++) {
    const k = 1 - drag * dt;
    vx *= k; vy = vy * k + g * dt;
    x += vx * dt; y += vy * dt; rot += w * dt;
    if (y > fl) {
      y = fl;
      if (vy > 0) { vy = -vy * e; vx *= 1 - mu; w = w * 0.5 + vx * 0.02; bounced++; }
      if (Math.abs(vy) < 60) { vy = 0; vx *= 0.9; w *= 0.85; }
    }
  }
  return { x, y, vx, vy, rot, bounced };
}
