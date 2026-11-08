/* =====================================================================
 * shots_ground.js — 8.0 → 19.2 s
 *   the launch · first clash + title · the ground fight
 * ===================================================================== */
'use strict';

const GB = (() => {
  /* ------------------------------ tracks ------------------------------ */
  const R = new Track({ x: -620, pose: 'stance', dir: 1, eyes: 1, aura: 0.15 });
  const Hm = new Track({ x: 620, pose: 'stance', dir: -1, eyes: 1, aura: 0.2 });

  // launch + first clash
  R.k(8.0).k(8.22, { pose: 'crouch', x: -635, e: 'out' })
    .k(8.45, { pose: 'dash', g: false, y: -125, x: -560, ghost: 4, e: 'snap' })
    .k(9.42, { pose: 'dashFist', x: -95, y: -150, e: 'linear' })
    .k(9.6, { pose: 'punch', g: true, ghost: 0, e: 'snap', aura: 0.5 })
    .k(9.95, { e: 'linear' }).k(10.5, {})
    .k(10.9, { pose: 'guard', x: -300, e: 'out', aura: 0.2 })
    .k(11.2, { pose: 'stance', x: -300 });
  Hm.k(8.0).k(8.22, { pose: 'crouch', x: 635, e: 'out' })
    .k(8.45, { pose: 'dash', g: false, y: -125, x: 560, ghost: 4, e: 'snap' })
    .k(9.42, { pose: 'dashFist', x: 95, y: -150, e: 'linear' })
    .k(9.6, { pose: 'punch', g: true, ghost: 0, e: 'snap', aura: 0.5 })
    .k(9.95, { e: 'linear' }).k(10.5, {})
    .k(10.9, { pose: 'guard', x: 300, e: 'out', aura: 0.2 })
    .k(11.2, { pose: 'stance', x: 300 });
  R.fit(9.6, 'h1', [-4]);
  Hm.fit(9.6, 'h1', [4]);

  // ---- exchange 1: straight → duck → uppercut → back flip
  R.k(11.35, {}).k(11.47, { pose: 'crouch', x: -292, e: 'snap' }).k(11.7, {})
    .k(11.8, { pose: 'uppercut', e: 'snap', aura: 0.35 }).k(12.05, { e: 'linear' })
    .k(12.35, { pose: 'stance', x: -262, aura: 0.15 });
  Hm.k(11.32, { pose: 'dashFist', g: false, y: -132, x: 230, ghost: 3, e: 'snap' })
    .k(11.55, { pose: 'punch', g: true, ghost: 0, e: 'out' }).k(11.72, {})
    .k(11.8, { pose: 'hitHead', e: 'snap' });
  Hm.fit(11.55, 'h1', [jointAt(R, 11.35, 'head')[0] + 26]);
  R.fit(11.8, 'h1', [jointAt(Hm, 11.8, 'head')[0] - 4]);
  const hx = Hm.at(11.8).x;
  Hm.k(11.86, { pose: 'flyBack', g: false, y: -270, x: hx + 50, rot: -30, e: 'out' })
    .k(12.1, { pose: 'tuck', y: -470, x: 30, rot: -200, e: 'linear' })
    .k(12.36, { y: -300, x: 170, rot: -320, e: 'linear' })
    .k(12.5, { pose: 'land', g: true, x: 230, rot: -360, e: 'in' })
    .k(12.64, { pose: 'crouch', x: 255, e: 'out' });

  // ---- exchange 2: flaming spin kick → cross block
  R.k(12.75, { pose: 'crossBlock', x: -272, e: 'out' }).k(13.2, { e: 'linear' })
    .k(13.45, { x: -392, e: 'out' })
    .k(13.52, { pose: 'stance', x: -386, mode: 'rush', aura: 0.4, e: 'out' })
    .k(14.72, { mode: 'rush', e: 'linear' })
    .k(14.75, { mode: null });
  Hm.k(12.8, { pose: 'spinKick', g: false, y: -215, x: 120, rot: -360, aura: 0.6, e: 'out' })
    .k(13.0, { y: -238, x: -40, rot: -560, e: 'linear' })
    .k(13.2, { pose: 'kick', rot: -720, e: 'out' });
  Hm.fit(13.2, 'f1', jointAt(R, 13.2, 'h1'));
  Hm.k(13.42, { pose: 'stance', g: true, x: -392 + 178, e: 'out' })
    .k(13.52, { mode: 'rush', aura: 0.5, e: 'out' })
    .k(14.72, { mode: 'rush', e: 'linear' })
    .k(14.74, { mode: null, pose: 'windup', e: 'out' })
    .k(14.8, { pose: 'punch', e: 'snap' });
  R.k(14.8, { pose: 'hitHead', e: 'snap' });
  Hm.fit(14.8, 'h1', [jointAt(R, 14.8, 'head')[0] + 8]);

  // ---- exchange 3: launched into the pillar
  R.k(14.92, { pose: 'flyBack', g: false, y: -235, x: -470, rot: -40, e: 'out' })
    .k(15.17, { x: -718, y: -215, rot: -75, e: 'linear' })
    .k(15.2, { x: -738, y: -225, rot: -20, e: 'out' })
    .k(15.45, { pose: 'kneel', g: true, x: -700, rot: 0, e: 'in' }).k(15.62, {})
    .k(15.74, { pose: 'catchUp', x: -690, e: 'snap' }).k(15.8, {})
    .k(15.95, { eyes: 1.6 })
    .k(16.15, { pose: 'throwOver', x: -680, e: 'inOut' })
    .k(16.33, { pose: 'punch', x: -666, e: 'in', eyes: 1 })
    .k(16.47, { pose: 'crouch', x: -652, e: 'out' })
    .k(16.62, { pose: 'jump', g: false, y: -380, x: -560, e: 'out' })
    .k(16.92, { pose: 'axeKick', y: -640, x: -420, aura: 1.0, e: 'out' })
    .k(17.12, { pose: 'flyPunch', rot: 70, y: -430, x: -310, e: 'in', ghost: 3 })
    .k(17.3, { pose: 'land', g: true, rot: 0, x: -252, e: 'in', ghost: 0 })
    .k(17.62, { aura: 0.5 });
  Hm.k(15.0, {}).k(15.3, { pose: 'stance', e: 'inOut' }).k(15.42, {})
    .k(15.45, { alpha: 0, e: 'hold' })
    .k(15.58, { alpha: 1, g: false, x: -560, y: -470, pose: 'axeKick', rot: 0, e: 'hold' })
    .k(15.8, { pose: 'highKick', rot: 35, e: 'in' });
  Hm.fit(15.8, 'f1', jointAt(R, 15.8, 'h1'));
  Hm.k(15.95, {})
    .k(16.15, { pose: 'flyBack', rot: -110, x: -610, y: -520, e: 'inOut' })
    .k(16.35, { pose: 'lie', g: true, rot: -90, x: -470, e: 'in' })
    .k(16.5, { pose: 'flyBack', g: false, y: -140, x: -420, rot: -110, e: 'out' })
    .k(16.75, { pose: 'tuck', y: -220, x: -230, rot: -330, e: 'linear' })
    .k(16.95, { pose: 'crouch', g: true, x: -110, rot: -360, e: 'in' })
    .k(17.12, { pose: 'tuck', g: false, y: -220, x: 60, rot: -660, e: 'out' })
    .k(17.3, { pose: 'crouch', g: true, x: 212, rot: -720, e: 'in' }).k(17.45, {});

  // ---- exchange 4: fireballs ↔ deflections
  const swapPalm = { a1: -30, e1: 92, a2: 96, e2: -6 };
  Hm.k(17.52, { pose: 'palm', x: 222, e: 'snap', aura: 0.8 }).k(17.62, { pose: 'windup' })
    .k(17.72, { pose: 'palm', pm: swapPalm, e: 'snap' }).k(17.82, { pose: 'windup' })
    .k(17.92, { pose: 'palm', e: 'snap' }).k(18.2, { pose: 'stance', aura: 0.4 }).k(18.44, {})
    .k(18.48, { pm: { a2: -152, e2: -24, head: -12, lean: 4 }, e: 'snap' }).k(18.5, {}).k(18.72, {})
    .k(18.82, { pose: 'crouch', e: 'inOut' })
    .k(18.97, { pose: 'jump', g: false, y: -700, x: 180, e: 'out', aura: 0.8 })
    .k(19.2, { y: -1500, x: 280, e: 'linear' });
  R.k(17.68, { pose: 'stance' }).k(17.72, { pose: 'slap', e: 'snap' }).k(17.82, { pose: 'stance' })
    .k(17.92, { pose: 'slap', pm: { a1: -30, e1: 100, a2: 142, e2: 28 }, e: 'snap' }).k(18.02, { pose: 'stance' })
    .k(18.12, { pose: 'slap', e: 'snap' }).k(18.25, { pose: 'stance' }).k(18.29, {})
    .k(18.3, { alpha: 0, e: 'hold' })
    .k(18.42, { alpha: 1, x: 470, dir: -1, pose: 'kickChamber', g: false, y: -200, e: 'hold' })
    .k(18.5, { pose: 'highKick', e: 'snap' });
  R.fit(18.5, 'f1', jointAt(Hm, 18.5, 'h2'));
  R.k(18.72, {}).k(18.82, { pose: 'crouch', g: true, e: 'inOut' })
    .k(18.97, { pose: 'jump', g: false, y: -700, x: 470, e: 'out', aura: 0.8 })
    .k(19.2, { y: -1500, x: 400, e: 'linear' });

  /* ------------------------------ camera ------------------------------ */
  const C = new Keys({ x: 0, y: -260, zoom: 0.5, rot: 0 });
  C.k(8.0).k(9.45, { y: -220, zoom: 1.0 }, 'in').k(9.6, { y: -215, zoom: 1.35 }, 'snap').k(9.95, { zoom: 1.45 }, 'linear')
    .cut(11.2, { x: 0, y: -235, zoom: 1.0, rot: 0 })
    .k(11.5, { x: -110, zoom: 1.12 }).k(11.8, { x: -150, y: -270, zoom: 1.3 }, 'snap')
    .k(12.3, { x: -20, y: -330, zoom: 0.9 }).k(12.7, { x: 0, y: -250, zoom: 1.0 })
    .k(13.2, { x: -190, y: -245, zoom: 1.32 }, 'out')
    .k(13.52, { x: -300, y: -235, zoom: 1.9, rot: -0.03 }, 'snap').k(14.74, { zoom: 2.05, rot: 0.03 }, 'linear')
    .k(14.8, { x: -340, y: -250, zoom: 1.6, rot: 0 }, 'snap')
    .k(15.2, { x: -640, y: -265, zoom: 1.15 }, 'in').k(15.55, { x: -640, y: -290, zoom: 1.0 })
    .k(15.8, { x: -650, y: -330, zoom: 1.5 }, 'snap').k(15.95, { zoom: 1.56 }, 'linear')
    .k(16.35, { x: -560, y: -250, zoom: 1.1 }, 'out')
    .k(16.92, { x: -390, y: -420, zoom: 0.78 }, 'out')
    .k(17.3, { x: -160, y: -250, zoom: 0.95 }, 'in').k(17.6, { x: -30, y: -255, zoom: 0.9 }).k(18.25, { x: 0, y: -255, zoom: 0.95 })
    .cut(18.42, { x: 330, y: -300, zoom: 1.6, rot: 0.04 }).k(18.72, { zoom: 1.78 }, 'linear')
    .cut(18.82, { x: 320, y: -300, zoom: 1.0, rot: 0 }).k(19.2, { x: 330, y: -880, zoom: 0.72 }, 'in');

  /* ------------------------------ effects & events ------------------------------ */
  const FX = [];
  const add = (f) => FX.push(f);
  const P = {};
  // launch
  ev(8.22, 'crouch');
  ev(8.45, 'launch', { shake: 14 });
  add((t) => {
    for (const x of [-620, 620]) {
      dust(t, 8.45, x, 0, { n: 16, seed: x > 0 ? 3 : 4, size: 50, vmax: 500, alpha: 0.6 });
      debris(t, 8.45, x, 0, { n: 10, seed: x > 0 ? 5 : 6, vx: 400, vy: 900, smax: 12 });
    }
    crater(-620, 8.45, { w: 90, seed: 2, cracks: 6, color: [120, 200, 255] });
    crater(620, 8.45, { w: 90, seed: 3, cracks: 6, color: [255, 140, 60] });
    // dash trails: dust kicked up below the fighters
    for (const [tr, s] of [[R, 1], [Hm, 2]]) {
      emit(t, { rate: 70, life: 0.9, from: 8.45, to: 9.55, seed: 30 + s }, (ts, age, r, u) => {
        const x = tr.at(ts).x;
        blob(S, [150, 130, 140], x + r.s() * 30 - tr.at(ts).dir * age * 60, -age * 40 - r.f() * 20, 26 + 60 * u, 0.45 * (1 - u), 0.3);
      });
    }
  });
  // first clash
  const CL = jointAt(R, 9.6, 'h1');
  P.clash = CL;
  ev(9.6, 'clash', { shake: 55, flash: 1.0, impact: 4, chroma: 16, shakeDecay: 0.35, x: 0 });
  add((t) => {
    crater(0, 9.6, { w: 300, seed: 9, cracks: 12, color: [200, 170, 255], cool: 0.8 });
    shockwave(t, 9.6, 0, -2, { r: 1700, squash: 0.1, width: 30, life: 0.9, color: [220, 200, 255] });
    shockwave(t, 9.6, CL[0], CL[1], { r: 950, width: 36, life: 0.55, color: [190, 220, 255] });
    shockwave(t, 9.68, CL[0], CL[1], { r: 1400, width: 22, life: 0.7, color: [255, 190, 140] });
    dust(t, 9.62, 0, 0, { n: 30, seed: 12, size: 70, vmax: 1300, up: 220, alpha: 0.65, life: 1.8 });
    debris(t, 9.6, 0, -10, { n: 30, seed: 13, vx: 1300, vy: 1500, smax: 22 });
    sparks(t, 9.6, CL[0], CL[1], { n: 70, seed: 14, vmax: 2600, life: 0.6, color: [190, 220, 255], width: 4 });
    sparks(t, 9.6, CL[0], CL[1], { n: 50, seed: 15, vmax: 2200, life: 0.6, color: [255, 150, 60], width: 4 });
    flare(t, 9.667, CL[0], CL[1], { r: 200, life: 0.5, color: [230, 210, 255] });
    if (t > 9.6 && t < 10.0) {
      const f = Math.floor(t * 30);
      for (let i = 0; i < 6; i++) {
        const r = RNG(f * 9 + i), a = -Math.PI + r.f() * Math.PI * 1.0, L = r.r(200, 520);
        bolt(CL, [CL[0] + Math.cos(a) * L * -1, CL[1] + Math.sin(a) * L * 0.7], f * 13 + i, { color: [80, 200, 255], width: 3, branches: 1 });
      }
      flames(t, { rate: 220, life: 0.5, size: 34, rise: 120, spread: 400, seed: 16, from: 9.6, to: 10.0 }, (ts, r) => [CL[0] + r.r(0, 160), CL[1] + r.s() * 60]);
    }
  });
  // uppercut
  P.upper = jointAt(Hm, 11.8, 'head');
  ev(11.8, 'hit', { shake: 24, flash: 0.35, impact: 2, x: P.upper[0] });
  add((t) => {
    sparks(t, 11.8, P.upper[0], P.upper[1], { n: 30, seed: 21, ang: -100, spread: 140, vmax: 1700, color: [140, 220, 255] });
    flare(t, 11.8, P.upper[0], P.upper[1], { r: 90, life: 0.25, color: [150, 220, 255] });
    shockwave(t, 11.8, P.upper[0], P.upper[1], { r: 260, width: 14, life: 0.3, color: [160, 220, 255] });
    dust(t, 12.5, 230, 0, { n: 12, seed: 22, size: 40, dir: 1, vmax: 400, alpha: 0.5 });
  });
  ev(12.5, 'land');
  // spin kick fire trail + block
  P.block = jointAt(R, 13.2, 'h1');
  ev(12.8, 'whoosh', { big: 1 });
  ev(13.2, 'block', { shake: 26, flash: 0.3, x: P.block[0] });
  add((t) => {
    flames(t, { rate: 200, life: 0.35, size: 20, rise: 60, spread: 30, seed: 23, from: 12.8, to: 13.22 }, (ts) => jointAt(Hm, ts, 'f1'));
    sparks(t, 13.2, P.block[0], P.block[1], { n: 40, seed: 24, ang: 180, spread: 160, vmax: 1800, color: [255, 160, 60] });
    flare(t, 13.2, P.block[0], P.block[1], { r: 110, life: 0.3, color: [255, 170, 90] });
    flames(t, { rate: 300, life: 0.45, size: 30, rise: 80, spread: 420, seed: 25, from: 13.2, to: 13.3 }, (ts, r) => [P.block[0] + r.s() * 20, P.block[1] + r.s() * 40]);
    emit(t, { rate: 60, life: 0.8, from: 13.2, to: 13.45, seed: 26 }, (ts, age, r, u) => {
      const x = R.at(ts).x;
      blob(S, [150, 130, 140], x + 40 + r.s() * 30, -age * 50, 24 + 50 * u, 0.5 * (1 - u), 0.3);
    });
  });
  // rush
  const rushT = [];
  for (let k = 0; k < 12; k++) rushT.push(13.55 + k * 0.1);
  P.rushM = [(-386 + -214) / 2, -215];
  rushT.forEach((tt, k) => ev(tt, 'rushHit', { k, shake: 6 }));
  add((t) => {
    if (t < 13.5 || t > 14.8) return;
    rushT.forEach((tt, k) => {
      const r = RNG(k * 5 + 1);
      const p = [P.rushM[0] + r.s() * 20, P.rushM[1] + r.s() * 40];
      sparks(t, tt, p[0], p[1], { n: 12, seed: 40 + k, vmax: 1200, life: 0.22, color: k % 2 ? [255, 160, 70] : [120, 210, 255], width: 2.6 });
      flare(t, tt, p[0], p[1], { r: 40, life: 0.12, color: k % 2 ? [255, 170, 100] : [150, 220, 255], streak: false, glow: 0.6 });
    });
  });
  // big hit + pillar crash
  P.big = jointAt(R, 14.8, 'head');
  ev(14.8, 'hitBig', { shake: 46, flash: 0.75, impact: 3, chroma: 12, x: P.big[0] });
  ev(15.2, 'crash', { shake: 36, x: -770 });
  add((t) => {
    sparks(t, 14.8, P.big[0], P.big[1], { n: 50, seed: 51, ang: 180, spread: 120, vmax: 2400, color: [255, 170, 80], width: 4 });
    flare(t, 14.8, P.big[0], P.big[1], { r: 150, life: 0.35, color: [255, 190, 120] });
    shockwave(t, 14.8, P.big[0], P.big[1], { r: 420, width: 20, life: 0.4, color: [255, 200, 150] });
    debris(t, 15.2, -770, -230, { n: 26, seed: 52, vx: 700, bias: -250, vy: 900, smax: 26 });
    dust(t, 15.2, -770, -60, { n: 24, seed: 53, size: 80, vmax: 600, up: 300, alpha: 0.7, life: 2.2 });
    dust(t, 15.22, -770, 0, { n: 14, seed: 54, size: 50, vmax: 900, alpha: 0.5 });
  });
  // teleport + catch + slam
  P.tpOut = jointAt(Hm, 15.42, 'hip');
  P.tpIn = jointAt(Hm, 15.58, 'hip');
  P.catch = jointAt(R, 15.8, 'h1');
  ev(15.45, 'teleport'); ev(15.58, 'teleport');
  ev(15.8, 'catch', { shake: 24, flash: 0.4, impact: 2, x: P.catch[0] });
  ev(16.35, 'slam', { shake: 46, flash: 0.3, x: -470 });
  add((t) => {
    for (const [tt, p] of [[15.45, P.tpOut], [15.58, P.tpIn]]) {
      flare(t, tt, p[0], p[1], { r: 110, life: 0.25, color: [255, 120, 40] });
      flames(t, { rate: 400, life: 0.4, size: 30, rise: 100, spread: 500, seed: 60 + tt, from: tt, to: tt + 0.06 }, (ts, r) => [p[0] + r.s() * 40, p[1] + r.s() * 80]);
    }
    sparks(t, 15.8, P.catch[0], P.catch[1], { n: 34, seed: 61, ang: 90, spread: 200, vmax: 1500, color: [255, 200, 120] });
    flare(t, 15.8, P.catch[0], P.catch[1], { r: 100, life: 0.3, color: [200, 230, 255] });
    shockwave(t, 15.8, P.catch[0], P.catch[1], { r: 300, width: 14, life: 0.35 });
    crater(-470, 16.35, { w: 210, seed: 6, cracks: 9, color: [255, 150, 60] });
    dust(t, 16.35, -470, 0, { n: 22, seed: 62, size: 64, vmax: 900, up: 200, alpha: 0.65, life: 1.6 });
    debris(t, 16.35, -470, -10, { n: 18, seed: 63, vx: 800, vy: 1200, smax: 18 });
    shockwave(t, 16.35, -470, -4, { r: 900, squash: 0.12, width: 24, life: 0.6, color: [255, 200, 160] });
    dust(t, 16.62, -652, 0, { n: 12, seed: 64, size: 40, vmax: 500, alpha: 0.5 });
  });
  // thunder slam
  P.slamX = -252;
  ev(16.62, 'jump');
  ev(17.12, 'dive');
  ev(17.3, 'thunderSlam', { shake: 56, flash: 0.85, impact: 3, chroma: 14, x: P.slamX });
  add((t) => {
    // lightning trail during the dive
    if (t > 16.95 && t < 17.32) {
      const f = Math.floor(t * 40);
      const a = jointAt(R, Math.max(16.95, t - 0.12), 'h1'), b = jointAt(R, t, 'h1');
      bolt(a, b, f, { color: [90, 200, 255], width: 4, gens: 5, disp: 0.3 });
    }
    if (t > 17.24 && t < 17.42) bolt([P.slamX + 60, -1600], [P.slamX, 0], Math.floor(t * 40) + 3, { color: [120, 210, 255], width: 9, branches: 4, disp: 0.12 });
    crater(P.slamX, 17.3, { w: 290, seed: 7, cracks: 13, color: [120, 210, 255], cool: 0.7 });
    flare(t, 17.3, P.slamX, -30, { r: 230, life: 0.45, color: [130, 210, 255] });
    shockwave(t, 17.3, P.slamX, -4, { r: 1500, squash: 0.1, width: 28, life: 0.8, color: [140, 210, 255] });
    shockwave(t, 17.32, P.slamX, -120, { r: 700, width: 26, life: 0.45, color: [140, 210, 255] });
    debris(t, 17.3, P.slamX, -10, { n: 34, seed: 71, vx: 1100, vy: 1700, smax: 24, hot: [120, 200, 255] });
    dust(t, 17.32, P.slamX, 0, { n: 26, seed: 72, size: 70, vmax: 1100, up: 240, alpha: 0.6, life: 1.7 });
    sparks(t, 17.3, P.slamX, -20, { n: 60, seed: 73, ang: -90, spread: 170, vmax: 2400, color: [120, 210, 255], width: 4 });
    if (t > 17.3 && t < 17.75) {
      const f = Math.floor(t * 30);
      for (let i = 0; i < 7; i++) {
        const r = RNG(f * 17 + i), dirx = i % 2 ? 1 : -1;
        bolt([P.slamX, -6], [P.slamX + dirx * r.r(250, 900), -r.r(0, 90)], f * 7 + i, { color: [90, 200, 255], width: 3, branches: 1, disp: 0.18, alpha: 1 - sat(17.3, 17.75, t) * 0.7 });
      }
    }
  });
  // fireballs
  const FBS = [[17.52, 'h1', 17.72, 'h1'], [17.72, 'h2', 17.92, 'h2'], [17.92, 'h1', 18.12, 'h1']].map(([tl, jl, td, jd], i) => {
    const from = jointAt(Hm, tl, jl), to = jointAt(R, td, jd);
    const end = [to[0] - 260 - i * 120, to[1] - 520 + i * 60];
    ev(tl, 'fireball', { x: from[0] });
    ev(td, 'deflect', { shake: 10, flash: 0.12, x: to[0] });
    ev(td + 0.32, 'explode', { shake: 8, x: end[0] });
    return { tl, td, te: td + 0.32, from, to, end, i };
  });
  add((t) => {
    for (const f of FBS) {
      if (t >= f.tl && t < f.td) {
        const u = (t - f.tl) / (f.td - f.tl), p = v2.lerp(f.from, f.to, u);
        fireball(t, p[0], p[1], (f.to[0] - f.from[0]) / (f.td - f.tl), 0, { r: 30 });
      } else if (t >= f.td && t < f.te) {
        const u = (t - f.td) / (f.te - f.td), p = v2.lerp(f.to, f.end, E.out2(u));
        fireball(t, p[0], p[1], (f.end[0] - f.to[0]) * 3, (f.end[1] - f.to[1]) * 3, { r: 26 });
      }
      sparks(t, f.td, f.to[0], f.to[1], { n: 22, seed: 80 + f.i, ang: -120, spread: 120, vmax: 1300, color: [255, 180, 80] });
      flare(t, f.td, f.to[0], f.to[1], { r: 70, life: 0.18, color: [255, 200, 120], streak: false });
      flare(t, f.te, f.end[0], f.end[1], { r: 160, life: 0.4, color: [255, 140, 50] });
      sparks(t, f.te, f.end[0], f.end[1], { n: 30, seed: 90 + f.i, vmax: 1300, life: 0.5, color: [255, 150, 50], gravity: 400 });
      flames(t, { rate: 500, life: 0.5, size: 36, rise: 80, spread: 300, seed: 95 + f.i, from: f.te, to: f.te + 0.05 }, (ts, r) => [f.end[0] + r.s() * 30, f.end[1] + r.s() * 30]);
    }
  });
  // vanish (lightning step) + block from behind + leap
  P.zapA = jointAt(R, 18.29, 'hip');
  P.zapB = jointAt(R, 18.42, 'hip');
  P.back = jointAt(R, 18.5, 'f1');
  ev(18.3, 'zap');
  ev(18.5, 'block2', { shake: 28, flash: 0.35, impact: 2, x: P.back[0] });
  ev(18.97, 'leap', { shake: 18 });
  add((t) => {
    if (t > 18.3 && t < 18.5) {
      const f = Math.floor(t * 40);
      const u = sat(18.3, 18.42, t), b = v2.lerp(P.zapA, P.zapB, u);
      bolt(P.zapA, b, f, { color: [100, 210, 255], width: 7 * (1 - sat(18.42, 18.5, t)) + 1, gens: 6, disp: 0.12, branches: 2 });
    }
    flare(t, 18.3, P.zapA[0], P.zapA[1], { r: 120, life: 0.25, color: [120, 210, 255] });
    flare(t, 18.42, P.zapB[0], P.zapB[1], { r: 120, life: 0.25, color: [120, 210, 255] });
    sparks(t, 18.5, P.back[0], P.back[1], { n: 40, seed: 101, vmax: 1700, color: [255, 200, 140] });
    flare(t, 18.5, P.back[0], P.back[1], { r: 75, life: 0.3, color: [220, 220, 255] });
    for (const x of [jointAt(R, 18.82, 'hip')[0], jointAt(Hm, 18.82, 'hip')[0]]) {
      dust(t, 18.97, x, 0, { n: 16, seed: 102 + (x > 300 ? 1 : 0), size: 54, vmax: 700, alpha: 0.6 });
      crater(x, 18.97, { w: 110, seed: 8 + (x > 300 ? 1 : 0), cracks: 7, color: x > 300 ? [120, 200, 255] : [255, 150, 60] });
    }
  });

  return { R, Hm, C, FX, P };
})();

/* ---------- shot: launch → clash → ground fight (8.0–10.0, 11.2–19.2) ---------- */
function groundFightShot(t) {
  const base = GB.C.at(t);
  const cam = shaken(base);
  groundBG(cam, { moon: { x: 380, y: -230, r: 200 } });
  pillar(-770, { h: 430, w: 110, breakAt: 15.2 });
  pillar(1100, { h: 360, w: 90 });
  // pre-fighter effects (ground marks, dust)
  for (const f of GB.FX) f(t);
  const wind = 0.6;
  actor(GB.R, RAI, t, { wind, eyeTrail: (t > 16.6 && t < 17.35) || (t > 15.8 && t < 16.4) ? 0.12 : 0 });
  actor(GB.Hm, HOMURA, t, { wind, eyeTrail: t > 11.3 && t < 11.6 ? 0.1 : 0 });
  windDust(t, { rate: 30, alpha: 0.18, cx: base.x });
  // screen-space overlays
  screenSpace();
  if (t > 8.5 && t < 9.62) speedLines(S, { n: 46, alpha: 0.35 * sat(8.5, 8.9, t), color: '#e6e0ff', lmin: 400, lmax: 1400 });
  if (t >= 9.6 && t < 10.0) focusLines(S, ...camToScreen(cam, GB.P.clash), { alpha: 0.5, color: '#ffffff', r0: 220, n: 120 });
  if (t >= 13.52 && t < 14.75) {
    const m = camToScreen(cam, GB.P.rushM);
    focusLines(S, m[0], m[1], { alpha: 0.32, color: '#ffffff', r0: 330, n: 90 });
    FS.post.vignette = 0.85;
  }
  if (t >= 14.8 && t < 15.25) { FS.post.radialBlur = 0.06 * (1 - sat(14.8, 15.25, t)); }
  if (t >= 18.5 && t < 18.72) {
    const m = camToScreen(cam, GB.P.back);
    focusLines(S, m[0], m[1], { alpha: 0.4, color: '#ffffff', r0: 380, n: 100 });
  }
  FS.post.letterbox = 1 - sat(8.0, 8.45, t);
}
shot(8.0, 10.0, groundFightShot);
shot(11.2, 19.2, groundFightShot);

/* ---------- 10.0 – 11.2  super-wide: the clash dome + title ---------- */
shot(10.0, 11.2, (t, lt) => {
  const cam = shaken({ x: 0, y: -520, zoom: lerp(0.3, 0.27, lt / 1.2), rot: 0 });
  const C = GB.P.clash;
  const cs = camToScreen(cam, C);
  const holeR = 1500 * E.outExpo(sat(10.0, 11.0, t));
  groundBG(cam, { moon: { x: 380, y: -250, r: 200 }, hole: { x: cs[0], y: cs[1] - 200, r: holeR } });
  pillar(-770, { h: 430, w: 110 }); pillar(1100, { h: 360, w: 90 });
  for (const f of GB.FX) f(t);
  // the expanding dome of light
  const u = sat(10.0, 11.2, t);
  const R0 = lerp(300, 3800, E.outExpo(u));
  S.save(); S.globalCompositeOperation = 'lighter';
  const g = S.createRadialGradient(C[0], C[1], R0 * 0.2, C[0], C[1], R0);
  g.addColorStop(0, `rgba(255,255,255,${0.4 * (1 - u)})`);
  g.addColorStop(0.85, `rgba(170,150,255,${0.25 * (1 - u)})`);
  g.addColorStop(0.97, `rgba(255,230,255,${0.75 * (1 - u)})`);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  S.fillStyle = g; S.beginPath(); S.arc(C[0], C[1], R0, Math.PI, TAU); S.lineTo(C[0] + R0, 0); S.lineTo(C[0] - R0, 0); S.fill();
  S.restore();
  shockwave(t, 10.0, 0, -4, { r: 4200, r0: 600, squash: 0.08, width: 60, life: 1.2, color: [220, 200, 255] });
  dust(t, 10.0, 0, 0, { n: 40, seed: 120, size: 140, vmax: 2600, up: 300, alpha: 0.6, life: 1.4, spread: 1 });
  actor(GB.R, RAI, t, {});
  actor(GB.Hm, HOMURA, t, {});
  // dust trails while they slide apart
  for (const [tr, s] of [[GB.R, 1], [GB.Hm, 2]]) {
    emit(t, { rate: 60, life: 0.8, from: 10.5, to: 10.95, seed: 130 + s }, (ts, age, r, u2) => {
      const x = tr.at(ts).x;
      blob(S, [160, 140, 150], x + r.s() * 30, -age * 40, 30 + 60 * u2, 0.5 * (1 - u2), 0.3);
    });
  }
  // title
  screenSpace();
  const ta = window01(t, 10.04, 11.2, 0.05, 0.25);
  const ts = lerp(2.6, 1, E.outBack(sat(10.04, 10.25, t))) * lerp(1, 1.06, lt / 1.2);
  const jit = (1 - sat(10.04, 10.5, t)) * 14;
  text(S, '決戦', W / 2 + noise1(t * 60, 3) * jit, 380 + noise1(t * 60, 4) * jit, {
    font: FONT.heavy, size: 250, color: '#ffffff', stroke: '#3a0a10', strokeWidth: 18, shadow: '#ff3a3a', shadowBlur: 60, scale: ts, alpha: ta, spacing: 20,
  });
  text(S, 'FINAL  CLASH', W / 2, 560, { font: FONT.title, size: 78, spacing: 34, color: '#ffe9e0', alpha: ta * sat(10.15, 10.35, t), stroke: '#000', strokeWidth: 8 });
  FS.post.flash += 0.5 * pulse(t, 10.0, 0.001, 0.12);
});
