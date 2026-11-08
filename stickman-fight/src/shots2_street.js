/* =====================================================================
 * shots2_street.js — 11.2 → 17.6 s : the street fight
 *   limbo dodge · back-flip · spinning back kick → GUREN ragdolls into a
 *   car · GUREN hurls a burning car → SHIDEN slices it in half → the halves
 *   explode behind him · tackle · punch barrage · lightning uppercut
 * ===================================================================== */
'use strict';

const ST = (() => {
  /* ---------------- SHIDEN ---------------- */
  const A = new Track({ x: -300, g: true, pose: 'stance', dir: 1, eyes: 1, aura: 0.25, bob: 0.6 });
  A.k(11.2).k(11.62, {})
    .k(11.78, { pose: 'limbo', bob: 0, e: 'out', stiff: 1.4 }).k(11.92, {})
    .k(11.98, { pose: 'crouch', e: 'inOut' })
    .k(12.06, { pose: 'tuck', g: false, y: -300, x: -360, rot: -120, e: 'out' })
    .k(12.28, { y: -330, x: -430, rot: -300, e: 'linear' })
    .k(12.42, { pose: 'land', g: true, x: -470, rot: -360, slide: 1, e: 'in' })
    .k(12.55, { pose: 'crouch', slide: 0, e: 'out' })
    .k(12.62, { run: 1, runF: 4.5, ghost: 2, e: 'snap' })
    .k(12.8, { x: -90, run: 0, pose: 'stance', e: 'linear' })
    .k(12.84, { dir: -1, pose: 'kickChamber', rot: -360, e: 'hold' })
    .k(12.92, { pose: 'spinBack', stiff: 2, ghost: 0, e: 'snap' })
    .k(13.12, { pose: 'spinBack' })
    .k(13.3, { dir: 1, pose: 'stance', bob: 0.5, stiff: 1, e: 'hold' })
    .k(14.55, {})
    .k(14.66, { pose: 'chopUp', blade: 0.75, aura: 0.6, bob: 0, e: 'out' });
  /* ---------------- GUREN (first pass: up to the ragdoll) ---------------- */
  const B = new Track({ x: 300, g: true, pose: 'stance', dir: -1, eyes: 1, aura: 0.3, bob: 0.6, s: GUREN.s });
  B.k(11.2).k(11.25, { pose: 'roar', mouth: 0.8, aura: 0.9, bob: 0, e: 'out' }).k(11.5, { mouth: 0.3 })
    .k(11.6, { pose: 'windup', mouth: 0, aura: 0.5, x: 230, e: 'inOut' })
    .k(11.8, { pose: 'punch', pm: { lean: 32 }, x: 60, stiff: 1.8, e: 'snap' }).k(11.92, { stiff: 1 })
    .k(12.0, { pose: 'windup', x: 70, e: 'out' })
    .k(12.1, { pose: 'uppercut', x: 100, stiff: 1.8, e: 'snap' }).k(12.3, { stiff: 1 })
    .k(12.55, { pose: 'stance', x: 120, bob: 0.4, e: 'inOut' })
    .k(12.86, { pose: 'guard', bob: 0, e: 'snap' })
    .k(12.92, { pose: 'hitGut', e: 'snap' })
    .k(13.95, { pose: 'kneel', x: 600 });
  A.fit(12.92, 'f1', [J_tmp(B, 12.92, 'sho')[0] - 6], false);
  const rd = [{ t: 12.92, until: 13.92, blend: 0.35, impulse: [1650, -900], spin: 5.5, hit: 'sho', boxes: [{ x0: 500, x1: 740, y0: -95, y1: 0, t0: 12.9, t1: 13.4 }] }];
  const pass1 = new Actor(GUREN, B, { t0: 11.2, t1: 14.0, ragdoll: rd }).bake();
  const sx = pass1.at(13.9).J.hip[0];
  const k13 = B.keys.find((k) => k.t === 13.95); k13.x = sx;
  /* ---------------- GUREN (second pass: get up, lift and hurl a car) ---------------- */
  const carX = sx + 210;
  B.k(14.2, { pose: 'roar', mouth: 0.8, aura: 1.0, e: 'out' })
    .k(14.3, { pose: 'crouch', dir: 1, mouth: 0, x: sx + 40, e: 'inOut' })
    .k(14.42, { pose: 'liftUp', x: sx + 60, e: 'out' })
    .k(14.56, { pose: 'liftUp', pm: { lean: -22 }, dir: -1, e: 'hold' })
    .k(14.66, { pose: 'hurl', stiff: 1.8, e: 'snap' })
    .k(15.0, { pose: 'stance', aura: 0.8, stiff: 1, e: 'inOut' })
    .k(15.35, {})
    .k(15.42, { run: 1, runF: 4.4, ghost: 2, e: 'snap' });
  const carry = { t0: 14.42, t1: 14.66 };
  const car1 = carBody({ x: 620, y: 0, t0: 13.15, vx: 760, vy: -560, w: 2.3 });
  // the thrown car: released from GUREN's hands
  const g2 = new Actor(GUREN, B, { t0: 11.2, t1: 15.1, ragdoll: rd }).bake();
  const hands = (t) => { const J = g2.at(t).J; return v2.lerp(J.h1, J.h2, 0.5); };
  const rel = hands(14.66);
  const thrown = carBody({ x: rel[0], y: rel[1] + 12, t0: 14.66, vx: -2350, vy: -520, w: -4.6 });
  // find when it reaches SHIDEN
  const shX = A.at(14.6).x;
  let tS = 14.8;
  for (let t = 14.66; t < 15.4; t += 1 / 240) { if (thrown.at(t).x < shX + 130) { tS = Math.round(t * 60) / 60; break; } }
  const cs = thrown.at(tS);
  const cut = { a: [-118, -24], b: [118, -76] };
  const upperClip = [cut.a, cut.b, [140, -260], [-140, -260]], lowerClip = [cut.a, cut.b, [140, 80], [-140, 80]];
  const vxC = (thrown.at(tS).x - thrown.at(tS - 1 / 60).x) * 60;
  const half1 = bakeBody({ verts: boxVerts(236, 50, 0, -72), x: cs.x, y: cs.y, a: cs.a, t0: tS, vx: vxC * 0.85, vy: -900, w: -6, m: 3, dur: 3 });
  const half2 = bakeBody({ verts: boxVerts(236, 46, 0, -24), x: cs.x, y: cs.y, a: cs.a, t0: tS, vx: vxC * 0.75, vy: 100, w: 3, m: 3, dur: 3 });
  const boom1 = tS + 0.3, boom2 = tS + 0.42;
  A.k(tS, { pose: 'chopDown', blade: 1, stiff: 2.2, e: 'snap' }).k(tS + 0.5, { blade: 0, stiff: 1 })
    .k(15.55, { pose: 'stance', aura: 0.4, bob: 0.4 })
    .k(15.7, { pose: 'crossBlock', bob: 0, e: 'out' });
  /* ---------------- tackle, barrage, uppercut ---------------- */
  const shXb = A.at(15.7).x;
  B.k(15.72, { pose: 'tackle', run: 0, x: shXb + 150, ghost: 0, e: 'linear' })
    .k(15.98, { pose: 'stance', x: shXb - 80 + 215, e: 'out' });
  A.k(15.98, { x: shXb - 80, slide: 1, e: 'out' }).k(16.02, { slide: 0 });
  const mid = shXb - 80 + 107;
  for (let k = 0; k < 8; k++) {
    const t = 16.02 + k * 0.1, p = k % 2 ? 'punch' : 'punch2', q = k % 2 ? 'punch2' : 'punch';
    A.k(t, { pose: p, pm: { lean: 18 + (k % 3) * 3 }, stiff: 2.2, e: 'snap' });
    B.k(t + 0.05, { pose: q, pm: { lean: 20 + (k % 2) * 4 }, stiff: 2.2, e: 'snap' });
  }
  B.k(16.86, { pose: 'windup', stiff: 1.4, e: 'out' }).k(16.96, { pose: 'punch', pm: { lean: 34 }, stiff: 2, e: 'snap' })
    .k(17.06, { pose: 'hitHead', e: 'snap' })
    .k(17.6, { pose: 'flyBack', g: false, y: -1500, x: mid + 160, rot: -300, e: 'out' });
  A.k(16.86, { pose: 'stance', stiff: 1.4 }).k(16.94, { pose: 'crouch', e: 'snap' })
    .k(17.06, { pose: 'uppercut', aura: 1.2, stiff: 2.4, e: 'snap' }).k(17.25, { stiff: 1 })
    .k(17.36, { pose: 'crouch', e: 'inOut' })
    .k(17.6, { pose: 'jump', g: false, y: -700, x: mid - 40, e: 'out' });
  const a = makeActor(SHIDEN, A, { t0: 11.2, t1: 17.65 });
  const b = makeActor(GUREN, B, { t0: 11.2, t1: 17.65, ragdoll: rd });
  /* ---------------- events ---------------- */
  ev(11.25, 'roar'); ev(11.78, 'whoosh', { big: 1 }); ev(11.82, 'swish');
  ev(12.06, 'flip'); ev(12.42, 'land'); ev(12.62, 'dash');
  ev(12.92, 'kickHit', { shake: 34, flash: 0.45, impact: 3, chroma: 10, x: 120 });
  ev(13.15, 'carSmash', { shake: 30, x: 620 }); gust(13.15, 620, -60, 1600, 600);
  ev(14.2, 'roar'); ev(14.42, 'lift'); ev(14.66, 'hurl', { shake: 10 });
  ev(tS, 'slice', { shake: 26, flash: 0.5, impact: 2, x: cs.x });
  ev(boom1, 'carBoom', { shake: 40, flash: 0.35, x: half1.at(boom1).x }); gust(boom1, half1.at(boom1).x, -100, 2600, 1400);
  ev(boom2, 'carBoom', { shake: 36, flash: 0.3, x: half2.at(boom2).x }); gust(boom2, half2.at(boom2).x, -60, 2400, 1400);
  ev(15.42, 'charge'); ev(15.72, 'tackleHit', { shake: 28, flash: 0.3, x: shXb });
  for (let k = 0; k < 8; k++) ev(16.02 + k * 0.1 + 0.05, 'rushHit', { k, shake: 7 });
  ev(16.96, 'whoosh'); ev(17.06, 'uppercutBig', { shake: 46, flash: 0.6, impact: 3, chroma: 12, x: mid });
  ev(17.42, 'leap', { shake: 14 });
  return { A, B, a, b, car1, thrown, half1, half2, upperClip, lowerClip, carry, hands, tS, boom1, boom2, mid, carX, shXb, cs };
})();
function J_tmp(track, t, k) { return solve(track.at(t))[k]; }

/* --------------------------- drawing --------------------------- */
function streetWorld(t, cam) {
  const W2 = ST;
  // the car GUREN smashes into, then the thrown car / its halves
  drawCarBody(W2.car1, t, { fire: t > 13.15 ? 1 : 0 });
  if (t < W2.carry.t0) drawCarBody(carBody0(W2.carX), t, {});
  else if (t < W2.carry.t1) {
    const h = W2.hands(t), J = W2.b.at(t).J;
    S.save(); S.translate(h[0], h[1] + 12); S.rotate(J.d > 0 ? 0.05 : -0.05); drawCar(S, 1, {}); S.restore();
    carFire(S, h[0], h[1] + 12, 1, t, 77, 0.7);
  } else if (t < W2.tS) drawCarBody(W2.thrown, t, { fire: 1.1 });
  else {
    if (t < W2.boom1) drawCarBody(W2.half1, t, { clip: W2.upperClip, fire: 0.8 });
    if (t < W2.boom2) drawCarBody(W2.half2, t, { clip: W2.lowerClip, fire: 0.8 });
  }
  // impacts & destruction
  const hitP = J_(W2.b, 12.92, 'sho');
  flare(t, 12.92, hitP[0], hitP[1], { r: 120, life: 0.3, color: [210, 170, 255] });
  bsparks(t, 12.92, hitP[0], hitP[1], { n: 34, seed: 41, ang: 0, spread: 120, vmax: 1900, color: [200, 150, 255] });
  shockwave(t, 12.92, hitP[0], hitP[1], { r: 380, width: 18, life: 0.35, color: [210, 170, 255] });
  glass(t, 13.15, 620, -80, { n: 40, seed: 42, vx: 600, bias: 300, vy: 800, life: 2.4 });
  rubble(t, 13.15, 620, -20, { n: 12, seed: 43, vx: 500, bias: 200, vy: 700, smax: 12 });
  dust(t, 13.15, 620, 0, { n: 14, seed: 44, size: 60, vmax: 700, alpha: 0.5 });
  // the slice
  const cs = W2.cs;
  flare(t, W2.tS, cs.x, cs.y - 50, { r: 150, life: 0.3, color: [220, 190, 255] });
  if (t >= W2.tS && t < W2.tS + 0.18) {
    const u = sat(W2.tS, W2.tS + 0.08, t), c = Math.cos(cs.a), s = Math.sin(cs.a);
    const P = (p) => [cs.x + p[0] * c - p[1] * s, cs.y + p[0] * s + p[1] * c];
    const a = P([-260, -2]), b = P([260, -98]), m = v2.lerp(a, b, u);
    S.save(); S.globalCompositeOperation = 'lighter'; S.strokeStyle = `rgba(240,225,255,${1 - sat(W2.tS + 0.08, W2.tS + 0.18, t)})`; S.lineWidth = 6; S.lineCap = 'round';
    S.beginPath(); S.moveTo(a[0], a[1]); S.lineTo(m[0], m[1]); S.stroke(); S.restore();
    GL.save(); GL.strokeStyle = 'rgba(200,150,255,0.9)'; GL.lineWidth = 40; GL.beginPath(); GL.moveTo(a[0], a[1]); GL.lineTo(m[0], m[1]); GL.stroke(); GL.restore();
  }
  bsparks(t, W2.tS, cs.x, cs.y - 50, { n: 40, seed: 45, ang: 180, spread: 120, vmax: 1800, color: [255, 200, 140] });
  for (const [tb, hb, sd] of [[W2.boom1, W2.half1, 1], [W2.boom2, W2.half2, 2]]) {
    const p = hb.at(tb);
    flare(t, tb, p.x, p.y - 60, { r: 260, life: 0.55, color: [255, 170, 80] });
    flames(t, { rate: 500, life: 0.9, size: 60, rise: 260, spread: 520, seed: 46 + sd, from: tb, to: tb + 0.12 }, (ts, r) => [p.x + r.s() * 80, p.y - 40 + r.s() * 40]);
    rubble(t, tb, p.x, p.y - 20, { n: 22, seed: 48 + sd, vx: 1100, vy: 1300, smax: 16, hot: [255, 170, 90] });
    glass(t, tb, p.x, p.y - 60, { n: 30, seed: 50 + sd, vx: 1000, vy: 1000, life: 2.2 });
    shockwave(t, tb, p.x, p.y - 60, { r: 700, width: 26, life: 0.5, color: [255, 190, 120] });
    if (t > tb) emit(t, { rate: 30, life: 2.4, from: tb, to: tb + 1.6, seed: 52 + sd }, (ts, age, r, u) => blob(S, [40, 26, 26], p.x + r.s() * 60 - age * 60, p.y - 80 - age * 220, 60 + 140 * u, 0.55 * (1 - u), 0.2));
  }
  // tackle + barrage + uppercut
  const tk = [W2.shXb + 40, -200];
  bsparks(t, 15.72, tk[0], tk[1], { n: 30, seed: 55, ang: 180, spread: 140, vmax: 1500 });
  flare(t, 15.72, tk[0], tk[1], { r: 100, life: 0.25, color: [255, 200, 160] });
  for (let k = 0; k < 8; k++) {
    const tt = 16.02 + k * 0.1 + 0.05, r = RNG(k * 7 + 3), p = [W2.mid + r.s() * 20, -215 + r.s() * 40];
    bsparks(t, tt, p[0], p[1], { n: 12, seed: 60 + k, vmax: 1100, life: 0.4, color: k % 2 ? [255, 160, 80] : [200, 150, 255], spread: 360 });
    flare(t, tt, p[0], p[1], { r: 46, life: 0.12, streak: false, glow: 0.6, color: k % 2 ? [255, 190, 130] : [210, 180, 255] });
  }
  const up = J_(W2.b, 17.06, 'head');
  flare(t, 17.06, up[0], up[1], { r: 170, life: 0.4, color: [210, 170, 255] });
  bsparks(t, 17.06, up[0], up[1], { n: 50, seed: 70, ang: -90, spread: 120, vmax: 2200, color: [200, 150, 255] });
  shockwave(t, 17.06, up[0], up[1], { r: 520, width: 22, life: 0.4, color: [210, 170, 255] });
  if (t > 17.0 && t < 17.3) { const f = Math.floor(t * 40); for (let i = 0; i < 4; i++) { const r = RNG(f * 5 + i); bolt(up, [up[0] + r.s() * 320, up[1] - r.r(100, 500)], f * 3 + i, { color: SHIDEN.energy, width: 3, branches: 1 }); } }
  crater(W2.mid - 40, 17.42, { w: 110, seed: 12, cracks: 7, color: [190, 130, 255] });
  dust(t, 17.42, W2.mid - 40, 0, { n: 14, seed: 71, size: 50, vmax: 600, alpha: 0.5 });
}
const _parked = new Map();
function carBody0(x) { if (!_parked.has(x)) _parked.set(x, carBody({ x, y: 0, t0: 999 })); return _parked.get(x); }

(() => {
  const C = new Keys({ x: 0, y: -240, zoom: 1.1, rot: 0 });
  C.k(11.2).k(11.8, { x: -60, zoom: 1.25 }).k(12.3, { x: -200, y: -300, zoom: 1.0 })
    .k(12.62, { x: -280, y: -240, zoom: 1.15 }).k(12.92, { x: -40, zoom: 1.3 }, 'in')
    .k(13.3, { x: 300, y: -260, zoom: 0.85 }, 'out')
    .cut(13.7, { x: ST.carX - 120, y: -260, zoom: 1.15, rot: 0.03 }).k(14.55, { x: ST.carX - 260, zoom: 1.05 })
    .k(14.7, { x: ST.A.at(14.6).x + 60, y: -230, zoom: 1.3, rot: -0.02 }, 'in')
    .k(15.4, { x: ST.A.at(14.6).x - 60, y: -260, zoom: 1.08, rot: 0 }, 'out')
    .k(15.72, { x: ST.shXb + 60, y: -240, zoom: 1.2 }, 'in')
    .cut(16.0, { x: ST.mid, y: -225, zoom: 1.9, rot: -0.05 }).k(16.85, { zoom: 2.05, rot: 0.05 }, 'linear')
    .cut(16.9, { x: ST.mid, y: -260, zoom: 1.3, rot: 0 })
    .k(17.6, { x: ST.mid + 60, y: -900, zoom: 0.8 }, 'in');
  shot(11.2, 17.6, (t) => {
    const cam = shaken(C.at(t));
    cityBG(cam, {});
    streetWorld(t, cam);
    act(ST.a, t, { eyeTrail: (t > 12.6 && t < 12.95) || (t > 17.0 && t < 17.6) ? 0.12 : 0 });
    act(ST.b, t, { eyeTrail: t > 15.42 && t < 15.75 ? 0.12 : 0 });
    cityEmbers(cam);
    foreground({ smoke: 0.16 });
    if (t >= 16.0 && t < 16.86) impactLines(cam, [ST.mid, -215], 0.3, 330);
    if (t >= ST.tS && t < ST.tS + 0.25) impactLines(cam, [ST.cs.x, ST.cs.y - 50], 0.4, 260);
    if (t >= 17.06 && t < 17.3) impactLines(cam, J_(ST.b, 17.06, 'head'), 0.4, 240);
  });
})();
