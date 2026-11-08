/* =====================================================================
 * shots2_power.js — 27.2 → 40.0 s
 *   meteor crash · GUREN lands on a car and laughs · SHIDEN rises ·
 *   violet storm power-up · the city's fires stream into GUREN · split
 *   scream · charge · BEAM CLASH tearing the street apart · 限界突破 ·
 *   the explosion
 * ===================================================================== */
'use strict';

const VIO = [175, 115, 255], CRIM = [255, 70, 40];
const PC = 7700;                       // centre of the arena (between the two towers)

const PW2 = (() => {
  const crater0 = SKY2.FX + 240;      // where SHIDEN hits the street
  /* ---- 27.2–33.6 ---- */
  const A = new Track({ x: crater0, g: true, pose: 'lieBack', rot: -90, dir: 1, eyes: 0, aura: 0 });
  A.k(27.2).k(28.5).k(28.95, { pose: 'kneelFist', rot: 0, e: 'inOut' }).k(29.1, {})
    .k(29.48, { pose: 'standTall', pm: { head: 40 }, aura: 0.12, e: 'inOut' })
    .k(29.62, { pm: { head: -16 }, eyes: 2.2, e: 'snap' })
    .k(29.72, { pose: 'charge', aura: 2.0, eyes: 1.6, mouth: 0.7, tremble: 1, e: 'out' })
    .k(31.2, { aura: 2.3 }).k(31.95, { mouth: 0.9 });
  const gx = PC + 520;
  const B = new Track({ x: gx, y: -1300, g: false, pose: 'fallSky', dir: -1, eyes: 1, aura: 0.6, s: GUREN.s });
  B.k(27.2).k(27.95, { pose: 'superLand', g: true, floor: -70, e: 'in' }).k(28.1, { pose: 'laugh', mouth: 0.6, tremble: 0.6, e: 'out' })
    .k(28.45, { pose: 'standTall', mouth: 0, tremble: 0 }).k(30.42, {})
    .k(30.5, { pose: 'roar', aura: 2.0, eyes: 1.8, mouth: 0.9, tremble: 1, e: 'snap' }).k(31.2, { aura: 2.3 });
  const a = makeActor(SHIDEN, A, { t0: 27.2, t1: 32.05 }), b = makeActor(GUREN, B, { t0: 27.2, t1: 32.05 });
  const landCar = carBody({ x: gx + 10, y: 0, t0: 999 });
  const bounce = [carBody({ x: crater0 - 520, y: 0, t0: 27.22, vx: -300, vy: -900, w: -2.4 }), carBody({ x: crater0 + 400, y: 0, t0: 27.24, vx: 280, vy: -820, w: 2.1 })];
  ev(27.2, 'meteor', { shake: 66, flash: 0.9, impact: 4, chroma: 18, shakeDecay: 0.45, x: crater0 }); gust(27.2, crater0, -40, 4200, 1800);
  ev(27.95, 'carCrush', { shake: 22, x: gx }); ev(28.1, 'laugh');
  ev(28.6, 'heartbeat'); ev(29.0, 'heartbeat');
  ev(29.62, 'eyeGlint', { who: 'shiden' });
  ev(29.64, 'thunderStrike', { shake: 46, flash: 0.9, impact: 2, chroma: 12 }); gust(29.64, crater0, 40, 2600, 700);
  ev(29.72, 'powerUp', { who: 'shiden', dur: 1.5 });
  ev(30.42, 'flameBurst', { shake: 46, flash: 0.7, impact: 2, chroma: 10 });
  ev(30.5, 'powerUp', { who: 'guren', dur: 1.5 });
  ev(31.2, 'split', { flash: 0.4, shake: 20 });

  /* ---- 32.0–40.0 beam clash ---- */
  const RE = new Track({ x: PC - 560, pose: 'charge', dir: 1, eyes: 1.4, aura: 1.6 });
  RE.k(32.0).k(32.35, { pose: 'beamCharge', e: 'inOut' }).k(33.45, {})
    .k(33.6, { pose: 'beamFire', stiff: 2, e: 'snap' }).k(34.2, { pose: 'beamStrain', stiff: 1, tremble: 0.6, e: 'inOut' })
    .k(35.9, {}).k(36.8, { x: PC - 615, pm: { lean: 34 }, slide: 1, e: 'inOut' })
    .k(37.3, { aura: 1.6, slide: 0 }).k(37.6, { aura: 3.0, eyes: 2.2, mouth: 0.8, e: 'snap' })
    .k(39.2, { x: PC - 580, pm: { lean: 22 }, e: 'inOut' }).k(39.6, {});
  const HE = new Track({ x: PC + 560, pose: 'charge', dir: -1, eyes: 1.4, aura: 1.6, s: GUREN.s });
  HE.k(32.0).k(32.35, { pose: 'beamCharge', e: 'inOut' }).k(33.45, {})
    .k(33.6, { pose: 'beamFire', stiff: 2, e: 'snap' }).k(34.2, { pose: 'beamStrain', stiff: 1, tremble: 0.6, e: 'inOut' })
    .k(36.8, { aura: 2.4, mouth: 0.6 }).k(37.6, { mouth: 0 })
    .k(39.2, { x: PC + 630, pm: { lean: 36 }, slide: 1, e: 'in' }).k(39.6, {});
  const re = makeActor(SHIDEN, RE, { t0: 32.0, t1: 39.7 }), he = makeActor(GUREN, HE, { t0: 32.0, t1: 39.7 });
  ev(32.35, 'chargeBall', { dur: 1.25 }); ev(33.6, 'beamFire');
  ev(33.75, 'beamClash', { shake: 55, flash: 1.0, impact: 4, chroma: 16, shakeDecay: 0.4 }); gust(33.75, PC, -200, 3600, 1600);
  ev(33.75, 'beamHold', { dur: 5.85 }); ev(36.0, 'push', { who: 'guren' });
  ev(37.25, 'eyeGlint', { who: 'shiden' }); ev(37.3, 'surgeFlash', { flash: 0.4 });
  ev(37.6, 'surge', { shake: 42, flash: 0.6, impact: 2, chroma: 10 }); gust(37.6, PC - 560, -150, 3000, 1400);
  ev(39.2, 'unstable');
  ev(39.6, 'megaExplosion', { shake: 72, flash: 1.0, impact: 5, chroma: 20, shakeDecay: 0.7 }); gust(39.6, PC + 300, -200, 6000, 3000);
  const handMid = (ac, t) => { const J = ac.at(Math.max(t, 33.6)).J; return v2.lerp(J.h1, J.h2, 0.5); };
  function junction(t) {
    const y = (handMid(re, t)[1] + handMid(he, t)[1]) / 2;
    let x = 0;
    if (t < 35.9) x = 38 * noise1(t * 2.2, 5) * sat(33.75, 34.3, t);
    else if (t < 36.8) x = lerp(38 * noise1(35.9 * 2.2, 5), -230, E.inOut(sat(35.9, 36.8, t)));
    else if (t < 37.6) x = -230 + 18 * noise1(t * 3, 6);
    else if (t < 39.2) x = lerp(-230 + 18 * noise1(37.6 * 3, 6), 300, E.in2(sat(37.6, 39.2, t)));
    else x = 300 + 14 * noise1(t * 8, 7);
    return [PC + x + 6 * noise1(t * 20, 8), y + 5 * noise1(t * 17, 9)];
  }
  return { crater0, a, b, gx, landCar, bounce, re, he, handMid, junction };
})();

/* ---------- shared pieces ---------- */
function energyBall2(t, p, col, k, seed) {
  if (k <= 0.01) return;
  const R = 70 * k * (1 + 0.1 * Math.sin(t * 40));
  blob(GL, col, p[0], p[1], R * 3, 0.6);
  S.save(); S.globalCompositeOperation = 'lighter'; blob(S, col, p[0], p[1], R * 1.4, 0.9, 0.3); blob(S, [255, 255, 255], p[0], p[1], R * 0.75, 1, 0.5); S.restore();
  const f = Math.floor(t * 30);
  if (col === VIO) for (let i = 0; i < 3; i++) { const r = RNG(f * 3 + i + seed), a = r.f() * TAU; bolt(p, [p[0] + Math.cos(a) * R * 2.2, p[1] + Math.sin(a) * R * 2.2], f * 5 + i, { color: col, width: 2, gens: 4 }); }
  else flames(t, { rate: 160, life: 0.35, size: 18 * k + 6, rise: 60, spread: 120, seed }, (ts, r) => { const a = r.f() * TAU; return [p[0] + Math.cos(a) * R * 0.8, p[1] + Math.sin(a) * R * 0.8]; });
  S.save(); S.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 14; i++) { const r = RNG(seed * 31 + i), ph = (r.f() + t * r.r(1.2, 2.4)) % 1, a = r.f() * TAU + ph * 3, d = (1 - ph) * 260 * k + R; S.fillStyle = rgba(mixc(col, [255, 255, 255], 0.6), ph); S.beginPath(); S.arc(p[0] + Math.cos(a) * d, p[1] + Math.sin(a) * d, 3, 0, TAU); S.fill(); }
  S.restore();
}
function cracksTo(t, x0, x1, col, k, seed) {
  if (k <= 0) return;
  const pts = boltPoints([x0, 6], [lerp(x0, x1, k), 6], seed, { gens: 6, disp: 0.03 });
  S.save(); S.strokeStyle = 'rgba(8,4,6,0.9)'; S.lineWidth = 5; drawPolyline(S, pts);
  S.globalCompositeOperation = 'lighter'; S.strokeStyle = rgba(col, 0.9); S.lineWidth = 2.5; drawPolyline(S, pts); S.restore();
  GL.save(); GL.strokeStyle = rgba(col, 0.8); GL.lineWidth = 12; drawPolyline(GL, pts); GL.restore();
}
function arenaBase(t, cam, o = {}) {
  cityBG(cam, o);
  worldTowers(cam);
  crater(PW2.crater0, 27.2, { w: 480, seed: 31, cracks: 16, color: [200, 150, 255], cool: 0.5, dark: 0.75 });
  for (const c of PW2.bounce) drawCarBody(c, t, { fire: 0.8 });
}

/* ---------- 27.2 – 28.4  the crater, GUREN lands on a car ---------- */
shot(27.2, 28.4, (t, lt) => {
  const cam = shaken({ x: PC - 40, y: -330, zoom: lerp(0.58, 0.64, E.inOut2(lt / 1.2)), rot: 0 });
  arenaBase(t, cam, {});
  const c0 = PW2.crater0;
  // the crushed car under GUREN
  { const st = PW2.landCar.at(t), sq = t > 27.95 ? lerp(1, 0.68, E.outBack(sat(27.95, 28.05, t))) : 1;
    S.save(); S.translate(st.x, st.y); S.scale(1 + (1 - sq) * 0.25, sq); drawCar(S, 1, {}); S.restore(); carFire(S, st.x, -70 * sq, 1, t, 9, 0.8); }
  dust(t, 27.2, c0, -20, { n: 40, seed: 61, size: 120, vmax: 1600, up: 500, alpha: 0.8, life: 2.6 });
  dust(t, 27.22, c0, -200, { n: 26, seed: 62, size: 160, vmax: 400, upMin: 300, up: 900, alpha: 0.7, life: 2.6 });
  rubble(t, 27.2, c0, -10, { n: 40, seed: 63, vx: 1500, vy: 2000, smax: 28, hot: [220, 170, 255] });
  glass(t, 27.24, c0 - 300, -900, { n: 50, seed: 64, vx: 600, vy: 200, vyMin: -100, w: 400, life: 2.6 });
  flare(t, 27.2, c0, -60, { r: 380, life: 0.6, color: [230, 200, 255] });
  shockwave(t, 27.2, c0, -4, { r: 3000, squash: 0.09, width: 60, life: 1.0, color: [230, 210, 255] });
  bsparks(t, 27.2, c0, -20, { n: 70, seed: 65, vmax: 2800, life: 1.0, color: [200, 160, 255] });
  if (t < 27.25) comet2(SKY2.fa, t, 1.4, { dur: 0.2, w: 50 });
  act(PW2.a, t, {});
  act(PW2.b, t, {});
  dust(t, 27.95, PW2.gx, -60, { n: 14, seed: 70, size: 50, vmax: 500, alpha: 0.5 });
  smokeField(t, { n: 26, x0: PC - 1100, x1: PC + 1100, y0: -300, y1: 0, smin: 90, smax: 220, alpha: 0.32, vx: -20, seed: 3 });
  cityEmbers(cam);
  FS.post.flash += 0.3 * pulse(t, 27.2, 0.001, 0.05);
});

/* ---------- 28.4 – 29.6  SHIDEN gets up ---------- */
shot(28.4, 29.6, (t, lt) => {
  const c0 = PW2.crater0;
  const cam = shaken({ x: c0 + 10, y: -185, zoom: lerp(1.25, 1.4, E.inOut2(lt / 1.2)), rot: -0.02 });
  arenaBase(t, cam, { dim: 0.42 });
  smokeField(t, { n: 22, x0: c0 - 700, x1: c0 + 700, y0: -320, y1: -40, smin: 100, smax: 240, alpha: 0.28, vx: -25, seed: 4 });
  act(PW2.a, t, { wind: 0.5 });
  if (Math.floor(t * 8) % 3 === 0) lightningAura(PW2.a.at(t).J, t, 0.25, SHIDEN, 7);
  smokeField(t, { n: 10, x0: c0 - 700, x1: c0 + 700, y0: -60, y1: 40, smin: 140, smax: 260, alpha: 0.35, vx: 30, seed: 5 });
  const J = PW2.a.at(t).J, hf = headFrame(J), ep = v2.add(J.head, v2.add(v2.mul(hf.fwd, 13), v2.mul(hf.up, 5)));
  flare(t, 29.62, ep[0], ep[1], { r: 30, life: 0.4, color: [210, 160, 255], star: 2.2, points: 4, glow: 0.6 });
  FS.post.vignette = 0.75;
});

/* ---------- 29.6 – 30.4  violet storm ---------- */
shot(29.6, 30.4, (t, lt) => {
  const c0 = PW2.crater0;
  const z = lerp(1.6, 1.0, E.out(sat(29.62, 30.3, t)));
  const cam = shaken({ x: c0, y: -230 - 60 * (1 - z), zoom: z, rot: lerp(-0.07, 0.03, lt / 0.8) }, 6);
  arenaBase(t, cam, { dim: 0.5 });
  screenSpace(); S.fillStyle = 'rgba(16,4,40,0.35)'; S.fillRect(0, 0, W, H); setCam(cam);
  crater(c0, 29.62, { w: 520, seed: 31, cracks: 18, color: VIO, cool: 0.25 });
  lightPillar(t, c0, 130, VIO, ramp(29.62, 29.8, t) * (0.8 + 0.2 * Math.sin(t * 30)));
  if (t < 29.78) bolt([c0 + 60, -3000], [c0, -280], Math.floor(t * 40), { color: VIO, width: 12, branches: 5, disp: 0.1 });
  // lightning hammering the towers around
  for (const [tt, x] of [[29.7, TW1.x + 200], [29.86, TW2.x + 260], [30.05, TW1.x + 60], [30.2, TW2.x + 120]]) if (t > tt && t < tt + 0.12) bolt([x + 200, -4000], [x, tt < 30 ? -TW1.h : -TW2.h], Math.floor(t * 40) + 3, { color: VIO, width: 7, branches: 3, disp: 0.12 });
  levitate(t, 29.68, c0, { color: VIO, n: 26, seed: 11, spread: 420, speed: 1.4 });
  for (const tt of [29.64, 29.9, 30.16]) shockwave(t, tt, c0, -4, { r: 1300, squash: 0.12, width: 26, life: 0.6, color: VIO });
  act(PW2.a, t, { wind: 2.2 });
  sparks(t, 29.64, c0, -150, { n: 60, seed: 12, ang: -90, spread: 120, vmax: 2200, color: VIO, life: 0.6 });
  FS.post.vignette = 0.8;
});

/* ---------- 30.4 – 31.2  the city's fire flows into GUREN ---------- */
shot(30.4, 31.2, (t, lt) => {
  const gx = PW2.gx;
  const z = lerp(1.6, 1.0, E.out(sat(30.42, 31.1, t)));
  const cam = shaken({ x: gx, y: -230 - 60 * (1 - z), zoom: z, rot: lerp(0.07, -0.03, lt / 0.8) }, 6);
  arenaBase(t, cam, { dim: 0.5 });
  screenSpace(); S.fillStyle = 'rgba(40,6,2,0.35)'; S.fillRect(0, 0, W, H); setCam(cam);
  { const st = PW2.landCar.at(t); S.save(); S.translate(st.x, st.y); S.scale(1.08, 0.68); drawCar(S, 1, {}); S.restore(); }
  crater(gx, 30.42, { w: 360, seed: 41, cracks: 16, color: CRIM, cool: 0.25 });
  lightPillar(t, gx, 120, CRIM, ramp(30.42, 30.6, t) * 0.8);
  // streams of fire pulled in from every direction
  S.save(); S.globalCompositeOperation = 'lighter';
  emit(t, { rate: 220, life: 0.7, from: 30.3, seed: 42 }, (ts, age, r, u) => {
    const a = r.f() * TAU, d0 = r.r(700, 1500), d = d0 * (1 - E.in2(u));
    const x = gx + Math.cos(a + u * 1.2) * d, y = -160 + Math.sin(a + u * 1.2) * d * 0.6;
    flameP(x, y, 26 * (0.4 + u), 0.2 + u * 0.5, 0.9);
  });
  S.restore();
  flames(t, { rate: 260, life: 0.8, size: 40, rise: 500, spread: 120, seed: 43, from: 30.42 }, (ts, r) => [gx + r.s() * 300, -r.f() * 20]);
  for (const tt of [30.44, 30.7, 30.96]) shockwave(t, tt, gx, -4, { r: 1300, squash: 0.12, width: 26, life: 0.6, color: CRIM });
  levitate(t, 30.45, gx, { color: CRIM, n: 22, seed: 14, spread: 420, speed: 1.4 });
  act(PW2.b, t, { wind: 2.2, fireSize: 0.8 });
  FS.post.vignette = 0.8;
});

/* ---------- 31.2 – 32.0  split-screen scream ---------- */
shot(31.2, 32.0, (t, lt) => {
  const half = (left) => {
    const ac = left ? PW2.a : PW2.b, J0 = ac.at(t).J, z = lerp(3.0, 3.3, lt / 0.8), sx = left ? W * 0.25 : W * 0.75;
    S.save(); GL.save(); screenSpace();
    S.beginPath(); S.rect(left ? 0 : W / 2, 0, W / 2, H); S.clip();
    GL.beginPath(); GL.rect(left ? 0 : W / 2, 0, W / 2, H); GL.clip();
    abstractBG(left ? '#3c1296' : '#9a1008', left ? '#05010e' : '#120201', { radial: true, cx: sx, cy: H / 2 });
    focusLines(S, sx, H * 0.42, { alpha: 0.25, color: left ? '#dcc8ff' : '#ffd3b8', r0: 240, n: 70, seed: left ? 3 : 4 });
    setCam(shaken({ x: J0.head[0] - (sx - W / 2) / z, y: J0.head[1] + 30, zoom: z, rot: left ? -0.06 : 0.06 }, 5));
    act(ac, t, { wind: 2, auraK: left ? 0.6 : 0.45, fireSize: 0.45 });
    S.restore(); GL.restore();
  };
  half(true); half(false);
  screenSpace();
  bolt([W / 2, -20], [W / 2, H + 20], Math.floor(t * 30), { color: [255, 255, 255], width: 6, gens: 6, disp: 0.03 });
  FS.post.vignette = 0.6;
});

/* ---------- 32.0 – 40.0  charge + BEAM CLASH ---------- */
function beamArena(t, cam, o = {}) {
  arenaBase(t, cam, o);
  const J = PW2.junction(t), hR = PW2.handMid(PW2.re, t), hH = PW2.handMid(PW2.he, t);
  const surge = sat(37.6, 37.75, t);
  if (t > 33.75) {
    // the street is torn up and sucked into a vortex around the junction
    emit(t, { rate: 36, life: 1.4, from: 33.75, to: 39.6, seed: 201 }, (ts, age, r, u) => {
      const jx = PW2.junction(ts)[0], a = r.f() * TAU + age * r.r(3, 6), rad = lerp(r.r(200, 600), 60, u);
      const x = jx + Math.cos(a) * rad, y = J[1] + Math.sin(a) * rad * 0.5 - age * 150;
      rockShape(S, x, y, r.r(5, 16) * (1 - u * 0.5), r.f() * 6 + age * 8, r.i(99)); S.fillStyle = '#2a1d22'; S.fill();
    });
    emit(t, { rate: 24, life: 1.2, from: 33.75, to: 39.6, seed: 202 }, (ts, age, r, u) => { const jx = PW2.junction(ts)[0]; blob(S, [110, 80, 90], jx + r.s() * 220 + r.s() * 200 * age, -age * 120 - 20, 60 + 140 * u, 0.4 * (1 - u), 0.3); });
    for (let k = 0; k < 4; k++) glass(t, 34.0 + k * 0.9, (k % 2 ? TW2.x + 80 : TW1.x + 80), -900 - k * 300, { n: 24, seed: 210 + k, vx: 400, bias: k % 2 ? -300 : 300, vy: 300, vyMin: -100, w: 260, life: 2.6 });
  }
  cracksTo(t, PC - 560, PC, VIO, sat(32.9, 33.6, t), 5); cracksTo(t, PC + 560, PC, CRIM, sat(32.9, 33.6, t), 6);
  levitate(t, 32.1, PC - 560, { color: VIO, n: 14, seed: 3, spread: 260 }); levitate(t, 32.1, PC + 560, { color: CRIM, n: 14, seed: 4, spread: 260 });
  act(PW2.re, t, { wind: 1.6, auraK: o.auraK ?? 1, fireSize: o.fireSize });
  act(PW2.he, t, { wind: 1.6, auraK: o.auraK ?? 1, fireSize: o.fireSize });
  if (t < 33.62) { const k = E.out(sat(32.35, 33.45, t)); energyBall2(t, hR, VIO, k, 1); energyBall2(t, hH, CRIM, k, 2); }
  if (t >= 33.6 && t < 39.62) {
    const u = sat(33.6, 33.75, t), fR = v2.lerp(hR, J, u), fH = v2.lerp(hH, J, u);
    beam(t, hR, fR, { color: VIO, w: lerp(95, 150, surge) * (t > 39.2 ? 1 + 0.25 * Math.sin(t * 60) : 1), w0: 44, seed: 3 });
    beam(t, hH, fH, { color: CRIM, w: lerp(95, 80, surge), w0: 44, seed: 4 });
    if (u >= 1) {
      const un = sat(39.2, 39.6, t);
      clashBall(t, J[0], J[1], { r: 85 + 55 * un + 25 * un * Math.sin(t * 90), c1: VIO, c2: CRIM, arcs: 7 + Math.round(un * 10), seed: 9 });
      sparks(t, Math.floor(t * 20) / 20, J[0], J[1], { n: 18, seed: Math.floor(t * 20), vmax: 1600, life: 0.3, color: Math.floor(t * 20) % 2 ? VIO : CRIM, width: 3 });
      const ringT = Math.floor((t - 33.75) / 0.4) * 0.4 + 33.75;
      shockwave(t, ringT, J[0], J[1], { r: 520, width: 16, life: 0.4, color: [240, 220, 255], alpha: 0.7 });
    }
  }
  flare(t, 33.75, PC, PW2.junction(33.76)[1], { r: 260, life: 0.5, color: [245, 225, 255] });
  shockwave(t, 33.75, PC, -4, { r: 2200, squash: 0.08, width: 40, life: 0.9, color: [235, 215, 255] });
  return J;
}
shot(32.0, 33.6, (t, lt) => {
  const cam = shaken({ x: PC, y: lerp(-290, -240, lt / 1.6), zoom: lerp(0.66, 0.78, E.inOut2(lt / 1.6)), rot: 0 }, 4 * sat(32.6, 33.6, t));
  lightPillar(t, PC - 560, 90, VIO, 0);
  beamArena(t, cam, {});
  cityEmbers(cam);
});
shot(33.6, 40.0, (t, lt) => {
  let cam;
  const J = PW2.junction(t);
  if (t < 34.4) cam = { x: PC, y: -250, zoom: lerp(0.55, 0.5, sat(33.6, 34.4, t)), rot: 0 };
  else if (t < 35.2) { const h = PW2.re.at(t).J.neck; cam = { x: h[0] + 160, y: h[1] + 40, zoom: lerp(1.75, 1.9, sat(34.4, 35.2, t)), rot: -0.05 }; }
  else if (t < 36.0) { const h = PW2.he.at(t).J.neck; cam = { x: h[0] - 160, y: h[1] + 40, zoom: lerp(1.75, 1.9, sat(35.2, 36.0, t)), rot: 0.05 }; }
  else if (t < 36.8) cam = { x: PC - 150, y: -170, zoom: 0.62, rot: 0.03 };
  else if (t < 37.85) { const h = PW2.re.at(t).J.head; cam = { x: h[0] - 60, y: h[1] + 30, zoom: lerp(2.6, 2.95, sat(36.8, 37.85, t)), rot: -0.04 }; }
  else if (t < 39.2) cam = { x: PC + lerp(-180, 220, E.in2(sat(37.6, 39.2, t))), y: -240, zoom: lerp(0.56, 0.62, sat(37.6, 39.2, t)), rot: 0 };
  else if (t < 39.6) cam = { x: J[0], y: J[1] + 20, zoom: lerp(1.2, 1.5, sat(39.2, 39.6, t)), rot: 0.04 * Math.sin(t * 20) };
  else cam = { x: PC + 150, y: -620, zoom: 0.27, rot: 0 };
  cam = shaken(cam, t > 33.75 && t < 39.6 ? 7 + 10 * sat(39.2, 39.6, t) : 0);
  if (t >= 39.6) { bigBoom(t, cam); return; }
  FS.post.bloom = 0.18;
  const close = (t >= 34.4 && t < 36.0) || (t >= 36.8 && t < 37.85);
  beamArena(t, cam, { dim: close ? 0.45 : 0.3, auraK: close ? 0.7 : 1, fireSize: close ? 0.6 : 1 });
  if (t >= 36.8 && t < 37.85) {
    const Jr = PW2.re.at(t).J, hf = headFrame(Jr), ep = v2.add(Jr.head, v2.add(v2.mul(hf.fwd, 13), v2.mul(hf.up, 5)));
    flare(t, 37.25, ep[0], ep[1], { r: 22, life: 0.4, color: [215, 170, 255], star: 2.6, points: 4, glow: 0.5 });
    screenSpace();
    const a = sat(37.3, 37.36, t);
    if (a > 0) {
      const sc = lerp(1.8, 1, E.outBack(sat(37.3, 37.45, t)));
      text(S, '限界突破', W * 0.29, H * 0.42, { font: FONT.heavy, size: 190, color: '#f3ecff', scale: sc, alpha: a, rot: -0.06, stroke: '#14052e', strokeWidth: 14, shadow: '#a46bff', shadowBlur: 60 });
      text(S, 'LIMIT  BREAK', W * 0.29, H * 0.66, { font: FONT.title, size: 64, spacing: 26, color: '#efe6ff', alpha: a * sat(37.36, 37.5, t), stroke: '#0e0420', strokeWidth: 8 });
    }
  }
  screenSpace();
  if (t > 33.75 && t < 34.1) focusLines(S, ...camToScreen(cam, J), { alpha: 0.4 * (1 - sat(33.75, 34.1, t)), r0: 260, n: 120 });
  if (t >= 37.6 && t < 37.9) focusLines(S, ...camToScreen(cam, J), { alpha: 0.4, r0: 300, n: 100 });
  if (t >= 39.2) { FS.post.chroma = Math.max(FS.post.chroma, 6 + 10 * sat(39.2, 39.6, t)); FS.post.flash += 0.5 * sat(39.45, 39.6, t); }
});
function bigBoom(t, cam) {
  const C = [PC + 300, -200];
  const cs = camToScreen(cam, C);
  cityBG(cam, { hole: { x: cs[0], y: cs[1] - 200, r: 2600 * E.outExpo(sat(39.6, 40.3, t)) }, dim: 0.1 });
  worldTowers(cam);
  const u = sat(39.6, 40.4, t), R0 = lerp(200, 2800, E.outExpo(u));
  S.save(); S.globalCompositeOperation = 'lighter';
  const g = S.createRadialGradient(C[0], C[1], R0 * 0.1, C[0], C[1], R0);
  g.addColorStop(0, `rgba(255,255,255,${0.95 * (1 - u * 0.6)})`); g.addColorStop(0.5, `rgba(255,190,200,${0.7 * (1 - u * 0.5)})`);
  g.addColorStop(0.85, `rgba(190,140,255,${0.45 * (1 - u * 0.5)})`); g.addColorStop(1, 'rgba(255,255,255,0)');
  S.fillStyle = g; S.beginPath(); S.arc(C[0], C[1], R0, Math.PI, TAU); S.lineTo(C[0] + R0, 0); S.lineTo(C[0] - R0, 0); S.fill();
  S.restore();
  blob(GL, [255, 220, 230], C[0], C[1], R0 * 0.9, 0.7 * (1 - u));
  shockwave(t, 39.6, C[0], -4, { r: 5200, r0: 300, squash: 0.08, width: 90, life: 0.9, color: [255, 230, 240] });
  shockwave(t, 39.62, C[0], C[1], { r: 3200, width: 70, life: 0.7, color: [230, 210, 255] });
  rubble(t, 39.6, C[0], -40, { n: 60, seed: 301, vx: 2600, vy: 2600, smax: 40, hot: [255, 200, 220], life: 3 });
  glass(t, 39.62, TW1.x + 200, -1600, { n: 80, seed: 302, vx: 1400, bias: -400, vy: 600, w: 300, life: 2.6 });
  glass(t, 39.62, TW2.x + 200, -1800, { n: 80, seed: 303, vx: 1400, bias: 400, vy: 600, w: 300, life: 2.6 });
  dust(t, 39.6, C[0], 0, { n: 50, seed: 304, size: 260, vmax: 3000, up: 500, alpha: 0.7, life: 1.6 });
  screenSpace();
  S.fillStyle = `rgba(78,62,70,${0.85 * sat(39.95, 40.0, t)})`; S.fillRect(0, 0, W, H);
  FS.post.flash += 0.9 * Math.exp(-(t - 39.6) / 0.18);
}
