/* =====================================================================
 * shots_power.js — 27.2 → 40.4 s
 *   the crater · Rai rises · thunder power-up · flame power-up ·
 *   split-screen scream · energy charge · BEAM CLASH · the explosion
 * ===================================================================== */
'use strict';

const BLUE = [90, 200, 255], ORANGE = [255, 120, 40];

const PW = (() => {
  /* ---- 27.2–31.2 crater + power-ups ---- */
  const R1 = new Track({ x: 0, pose: 'lie', rot: -90, dir: 1, eyes: 0, aura: 0 });
  R1.k(27.2).k(28.4)
    .k(28.85, { pose: 'kneel', rot: 0, e: 'inOut' }).k(29.0, {})
    .k(29.45, { pose: 'standTall', pm: { head: 42 }, aura: 0.12, e: 'inOut' })
    .k(29.6, { pm: { head: -14 }, eyes: 2.2, e: 'snap' })
    .k(29.72, { pose: 'charge', aura: 2.0, eyes: 1.6, e: 'out' })
    .k(31.2, { aura: 2.3 });
  const H1 = new Track({ x: 620, y: -1150, g: false, pose: 'hover', dir: -1, eyes: 1, aura: 0.6 });
  H1.k(27.2).k(28.05, { pose: 'land', g: true, e: 'in' }).k(28.4, { pose: 'standTall', e: 'out', aura: 0.3 })
    .k(30.42, {}).k(30.5, { pose: 'charge', aura: 2.0, eyes: 1.8, e: 'snap' }).k(31.2, { aura: 2.3 });
  ev(28.05, 'land', { shake: 12 });
  ev(28.6, 'heartbeat'); ev(29.0, 'heartbeat');
  ev(29.6, 'eyeGlint', { who: 'rai' });
  ev(29.64, 'thunderStrike', { shake: 46, flash: 0.9, impact: 2, chroma: 12 });
  ev(29.72, 'powerUp', { who: 'rai', dur: 1.5 });
  ev(30.42, 'flameBurst', { shake: 46, flash: 0.7, impact: 2, chroma: 10 });
  ev(30.5, 'powerUp', { who: 'homura', dur: 1.5 });
  ev(31.2, 'split', { flash: 0.4, shake: 20 });

  /* ---- 32.0–40.4 charge + beam clash ---- */
  const RE = new Track({ x: -520, pose: 'charge', dir: 1, eyes: 1.4, aura: 1.6 });
  RE.k(32.0).k(32.35, { pose: 'beamCharge', e: 'inOut' }).k(33.45, {})
    .k(33.6, { pose: 'beamFire', e: 'snap' }).k(34.2, { pose: 'beamStrain', e: 'inOut' })
    .k(35.9, {}).k(36.8, { x: -575, pm: { lean: 34 }, e: 'inOut' })
    .k(37.3, { aura: 1.6 }).k(37.6, { aura: 3.0, eyes: 2.0, e: 'snap' })
    .k(39.2, { x: -540, pm: { lean: 22 }, e: 'inOut' }).k(39.6, {});
  const HE = new Track({ x: 520, pose: 'charge', dir: -1, eyes: 1.4, aura: 1.6 });
  HE.k(32.0).k(32.35, { pose: 'beamCharge', e: 'inOut' }).k(33.45, {})
    .k(33.6, { pose: 'beamFire', e: 'snap' }).k(34.2, { pose: 'beamStrain', e: 'inOut' })
    .k(36.8, { aura: 2.4 }).k(37.6, {})
    .k(39.2, { x: 585, pm: { lean: 36 }, e: 'in' }).k(39.6, {});
  ev(32.35, 'chargeBall', { dur: 1.25 });
  ev(33.6, 'beamFire');
  ev(33.75, 'beamClash', { shake: 55, flash: 1.0, impact: 4, chroma: 16, shakeDecay: 0.4 });
  ev(33.75, 'beamHold', { dur: 5.85 });
  ev(36.0, 'push', { who: 'homura' });
  ev(37.25, 'eyeGlint', { who: 'rai' });
  ev(37.3, 'surgeFlash', { flash: 0.4 });
  ev(37.6, 'surge', { shake: 42, flash: 0.6, impact: 2, chroma: 10 });
  ev(39.2, 'unstable');
  ev(39.6, 'megaExplosion', { shake: 70, flash: 1.0, impact: 5, chroma: 20, shakeDecay: 0.7 });

  const handMid = (tr, t) => { const J = solve(tr.at(t)); return v2.lerp(J.h1, J.h2, 0.5); };
  function junction(t) {
    const y = (handMid(RE, Math.max(t, 33.6))[1] + handMid(HE, Math.max(t, 33.6))[1]) / 2;
    let x = 0;
    if (t < 35.9) x = 38 * noise1(t * 2.2, 5) * sat(33.75, 34.3, t);
    else if (t < 36.8) x = lerp(38 * noise1(35.9 * 2.2, 5), -230, E.inOut(sat(35.9, 36.8, t)));
    else if (t < 37.6) x = -230 + 18 * noise1(t * 3, 6);
    else if (t < 39.2) x = lerp(-230 + 18 * noise1(37.6 * 3, 6), 300, E.in2(sat(37.6, 39.2, t)));
    else x = 300 + 14 * noise1(t * 8, 7);
    return [x + 6 * noise1(t * 20, 8), y + 5 * noise1(t * 17, 9)];
  }
  return { R1, H1, RE, HE, junction, handMid };
})();

/* ---------- shared drawing for the beam world ---------- */
function energyBall(t, p, col, k, seed) {
  if (k <= 0.01) return;
  const R = 70 * k * (1 + 0.1 * Math.sin(t * 40));
  blob(GL, col, p[0], p[1], R * 3, 0.7);
  S.save(); S.globalCompositeOperation = 'lighter';
  blob(S, col, p[0], p[1], R * 1.4, 0.9, 0.3);
  blob(S, [255, 255, 255], p[0], p[1], R * 0.75, 1, 0.5);
  S.restore();
  const f = Math.floor(t * 30);
  if (col === BLUE) for (let i = 0; i < 3; i++) { const r = RNG(f * 3 + i + seed), a = r.f() * TAU; bolt(p, [p[0] + Math.cos(a) * R * 2.2, p[1] + Math.sin(a) * R * 2.2], f * 5 + i, { color: col, width: 2, gens: 4 }); }
  else flames(t, { rate: 160, life: 0.35, size: 18 * k + 6, rise: 60, spread: 120, seed }, (ts, r) => { const a = r.f() * TAU; return [p[0] + Math.cos(a) * R * 0.8, p[1] + Math.sin(a) * R * 0.8]; });
  // inward-swirling motes
  S.save(); S.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 14; i++) {
    const r = RNG(seed * 31 + i), ph = (r.f() + t * r.r(1.2, 2.4)) % 1;
    const a = r.f() * TAU + ph * 3, d = (1 - ph) * 260 * k + R;
    S.fillStyle = rgba(mixc(col, [255, 255, 255], 0.6), ph);
    S.beginPath(); S.arc(p[0] + Math.cos(a) * d, p[1] + Math.sin(a) * d, 3, 0, TAU); S.fill();
  }
  S.restore();
}
function groundCracksTo(t, x0, x1, col, k, seed) {
  if (k <= 0) return;
  const pts = boltPoints([x0, 6], [lerp(x0, x1, k), 6], seed, { gens: 6, disp: 0.03 });
  S.save(); S.strokeStyle = 'rgba(8,6,12,0.9)'; S.lineWidth = 5; drawPolyline(S, pts);
  S.globalCompositeOperation = 'lighter'; S.strokeStyle = rgba(col, 0.9); S.lineWidth = 2.5; drawPolyline(S, pts); S.restore();
  GL.save(); GL.strokeStyle = rgba(col, 0.8); GL.lineWidth = 12; drawPolyline(GL, pts); GL.restore();
}
function beamWorld(t, o = {}) {
  const J = PW.junction(t);
  const hR = PW.handMid(PW.RE, t), hH = PW.handMid(PW.HE, t);
  const surge = sat(37.6, 37.75, t);
  // ground torn up beneath the junction + along the beams
  if (t > 33.75) {
    emit(t, { rate: 30, life: 1.0, from: 33.75, to: 39.6, seed: 201 }, (ts, age, r) => {
      const jx = PW.junction(ts)[0] + r.s() * 120;
      const x = jx + r.s() * 300 * age, y = -r.r(300, 900) * age + 1100 * age * age;
      if (y > 0) return;
      rockShape(S, x, y, r.r(5, 16), r.f() * 6 + age * 8, r.i(99));
      S.fillStyle = '#2a2233'; S.fill();
    });
    emit(t, { rate: 24, life: 1.2, from: 33.75, to: 39.6, seed: 202 }, (ts, age, r, u) => {
      const jx = PW.junction(ts)[0];
      blob(S, [120, 104, 120], jx + r.s() * 220 + r.s() * 200 * age, -age * 120 - 20, 60 + 140 * u, 0.4 * (1 - u), 0.3);
    });
  }
  groundCracksTo(t, -520, 0, BLUE, sat(32.9, 33.6, t), 5);
  groundCracksTo(t, 520, 0, ORANGE, sat(32.9, 33.6, t), 6);
  levitate(t, 32.1, -520, { color: BLUE, n: 14, seed: 3, spread: 260 });
  levitate(t, 32.1, 520, { color: ORANGE, n: 14, seed: 4, spread: 260 });
  actor(PW.RE, RAI, t, { wind: 1.6, seed: 3 });
  actor(PW.HE, HOMURA, t, { wind: 1.6, seed: 41 });
  // charging balls
  if (t < 33.62) {
    const k = E.out(sat(32.35, 33.45, t));
    energyBall(t, hR, BLUE, k, 1); energyBall(t, hH, ORANGE, k, 2);
  }
  // beams
  if (t >= 33.6 && t < 39.62) {
    const u = sat(33.6, 33.75, t);
    const fR = v2.lerp(hR, J, u), fH = v2.lerp(hH, J, u);
    const wR = lerp(95, 150, surge) * (t > 39.2 ? 1 + 0.25 * Math.sin(t * 60) : 1);
    const wH = lerp(95, 80, surge);
    beam(t, hR, fR, { color: BLUE, w: wR, w0: 44, seed: 3 });
    beam(t, hH, fH, { color: ORANGE, w: wH, w0: 44, seed: 4 });
    if (u >= 1) {
      const unstable = sat(39.2, 39.6, t);
      clashBall(t, J[0], J[1], { r: 85 + 55 * unstable + 25 * unstable * Math.sin(t * 90), c1: BLUE, c2: ORANGE, arcs: 7 + Math.round(unstable * 10), seed: 9 });
      sparks(t, Math.floor(t * 20) / 20, J[0], J[1], { n: 18, seed: Math.floor(t * 20), vmax: 1600, life: 0.3, color: Math.floor(t * 20) % 2 ? BLUE : ORANGE, width: 3 });
      if (Math.floor(t * 2.5) !== Math.floor((t - 1 / 60) * 2.5)) { /* periodic rings handled below */ }
      const ringT = Math.floor((t - 33.75) / 0.4) * 0.4 + 33.75;
      shockwave(t, ringT, J[0], J[1], { r: 520, width: 16, life: 0.4, color: [230, 220, 255], alpha: 0.7 });
    }
  }
  flare(t, 33.75, 0, PW.junction(33.76)[1], { r: 260, life: 0.5, color: [235, 225, 255] });
  shockwave(t, 33.75, 0, -4, { r: 2200, squash: 0.08, width: 40, life: 0.9, color: [220, 210, 255] });
  return { J, hR, hH };
}

/* ---------- 27.2 – 28.4  the crater, Homura descends ---------- */
shot(27.2, 28.4, (t, lt) => {
  const cam = shaken({ x: 80, y: -330, zoom: lerp(0.58, 0.64, E.inOut2(lt / 1.2)), rot: 0 });
  groundBG(cam, { moon: { x: 380, y: -230, r: 200 } });
  pillar(-770, { h: 430, w: 110, breakAt: 0 }); pillar(1100, { h: 360, w: 90 });
  crater(-252, 0, { w: 290, seed: 7, cracks: 13, color: BLUE });
  crater(0, 26.45, { w: 520, seed: 31, cracks: 16, color: [255, 200, 140], cool: 0.6 });
  dust(t, 26.45, 0, -20, { n: 40, seed: 61, size: 120, vmax: 1600, up: 500, alpha: 0.8, life: 2.6 });
  dust(t, 26.47, 0, -200, { n: 26, seed: 62, size: 160, vmax: 400, upMin: 300, up: 900, alpha: 0.7, life: 2.6 });
  actor(PW.R1, RAI, t, {});
  actor(PW.H1, HOMURA, t, { wind: 0.8 });
  dust(t, 28.05, 620, 0, { n: 14, seed: 70, size: 50, vmax: 500, alpha: 0.5 });
  smokeField(t, { n: 26, x0: -900, x1: 900, y0: -260, y1: 0, smin: 90, smax: 220, alpha: 0.32, vx: -20, seed: 3 });
  windDust(t, { rate: 30, alpha: 0.2 });
});

/* ---------- 28.4 – 29.6  Rai gets up ---------- */
shot(28.4, 29.6, (t, lt) => {
  const cam = shaken({ x: 10, y: -175, zoom: lerp(1.25, 1.4, E.inOut2(lt / 1.2)), rot: -0.02 });
  groundBG(cam, { moon: { x: 380, y: -230, r: 200 } });
  crater(0, 26.45, { w: 520, seed: 31, cracks: 16, color: [255, 200, 140], cool: 0.6 });
  smokeField(t, { n: 22, x0: -700, x1: 700, y0: -320, y1: -40, smin: 100, smax: 240, alpha: 0.28, vx: -25, seed: 4 });
  actor(PW.R1, RAI, t, { wind: 0.5 });
  // tiny static crackles
  if (Math.floor(t * 8) % 3 === 0) { const J = solve(PW.R1.at(t)); electricAura(t, J, 0.25, { seed: 7 }); }
  smokeField(t, { n: 10, x0: -700, x1: 700, y0: -60, y1: 40, smin: 140, smax: 260, alpha: 0.35, vx: 30, seed: 5 });
  const J = solve(PW.R1.at(t));
  const ep = eyePos(J, 1, vecA(J.hA - 90, 1, J.d), vecA(J.hA, 1, J.d));
  flare(t, 29.6, ep[0], ep[1], { r: 30, life: 0.4, color: [120, 225, 255], star: 2.2, points: 4, glow: 0.6 });
  FS.post.vignette = 0.75;
});

/* ---------- 29.6 – 30.4  THUNDER power-up ---------- */
shot(29.6, 30.4, (t, lt) => {
  const z = lerp(1.6, 1.0, E.out(sat(29.62, 30.3, t)));
  const cam = shaken({ x: 0, y: -230 - 60 * (1 - z), zoom: z, rot: lerp(-0.07, 0.03, lt / 0.8) }, 6);
  groundBG(cam, { moon: { x: 380, y: -230, r: 200 } });
  screenSpace(); S.fillStyle = 'rgba(2,10,30,0.55)'; S.fillRect(0, 0, W, H); setCam(cam);
  crater(0, 29.62, { w: 520, seed: 31, cracks: 18, color: BLUE, cool: 0.25 });
  lightPillar(t, 0, 130, BLUE, ramp(29.62, 29.8, t) * (0.8 + 0.2 * Math.sin(t * 30)));
  if (t < 29.78) bolt([60, -3000], [0, -280], Math.floor(t * 40), { color: BLUE, width: 12, branches: 5, disp: 0.1 });
  levitate(t, 29.68, 0, { color: BLUE, n: 26, seed: 11, spread: 420, speed: 1.4 });
  for (const tt of [29.64, 29.9, 30.16]) shockwave(t, tt, 0, -4, { r: 1300, squash: 0.12, width: 26, life: 0.6, color: BLUE });
  actor(PW.R1, RAI, t, { wind: 2.2, seed: 5 });
  sparks(t, 29.64, 0, -150, { n: 60, seed: 12, ang: -90, spread: 120, vmax: 2200, color: BLUE, life: 0.6 });
  emit(t, { rate: 50, life: 0.7, from: 29.64, seed: 13 }, (ts, age, r, u) => {
    const x = r.s() * 260, y = -age * r.r(500, 1200);
    S.save(); S.globalCompositeOperation = 'lighter'; S.strokeStyle = rgba(BLUE, 1 - u); S.lineWidth = 3;
    S.beginPath(); S.moveTo(x, y); S.lineTo(x, y + 60); S.stroke(); S.restore();
  });
  FS.post.vignette = 0.8;
});

/* ---------- 30.4 – 31.2  FLAME power-up ---------- */
shot(30.4, 31.2, (t, lt) => {
  const z = lerp(1.6, 1.0, E.out(sat(30.42, 31.1, t)));
  const cam = shaken({ x: 620, y: -230 - 60 * (1 - z), zoom: z, rot: lerp(0.07, -0.03, lt / 0.8) }, 6);
  groundBG(cam, { moon: { x: 380, y: -230, r: 200 } });
  screenSpace(); S.fillStyle = 'rgba(30,6,2,0.55)'; S.fillRect(0, 0, W, H); setCam(cam);
  crater(620, 30.42, { w: 360, seed: 41, cracks: 16, color: ORANGE, cool: 0.25 });
  lightPillar(t, 620, 120, ORANGE, ramp(30.42, 30.6, t) * 0.8);
  flames(t, { rate: 260, life: 0.8, size: 40, rise: 500, spread: 120, seed: 42, from: 30.42 }, (ts, r) => [620 + r.s() * 300, -r.f() * 20]);
  for (const tt of [30.44, 30.7, 30.96]) shockwave(t, tt, 620, -4, { r: 1300, squash: 0.12, width: 26, life: 0.6, color: ORANGE });
  levitate(t, 30.45, 620, { color: ORANGE, n: 22, seed: 14, spread: 420, speed: 1.4 });
  actor(PW.H1, HOMURA, t, { wind: 2.2, seed: 43 });
  embers(t, { rate: 120, life: 1.4, spread: 260, rise: 500, size: 3.4, seed: 44, from: 30.42 }, (ts, r) => [620 + r.s() * 360, -r.f() * 300]);
  FS.post.vignette = 0.8;
});

/* ---------- 31.2 – 32.0  split screen scream ---------- */
shot(31.2, 32.0, (t, lt) => {
  const half = (left) => {
    const tr = left ? PW.R1 : PW.H1, ch = left ? RAI : HOMURA;
    const st = tr.at(t), J0 = solve(st);
    const z = lerp(3.1, 3.4, lt / 0.8);
    const sx = left ? W * 0.25 : W * 0.75;
    S.save(); GL.save(); screenSpace();
    S.beginPath(); S.rect(left ? 0 : W / 2, 0, W / 2, H); S.clip();
    GL.beginPath(); GL.rect(left ? 0 : W / 2, 0, W / 2, H); GL.clip();
    abstractBG(left ? '#0c3a86' : '#8a1606', left ? '#010614' : '#120201', { radial: true, cx: sx, cy: H / 2 });
    focusLines(S, sx, H * 0.42, { alpha: 0.25, color: left ? '#bfe6ff' : '#ffd3b8', r0: 240, n: 70, seed: left ? 3 : 4 });
    setCam(shaken({ x: J0.head[0] - (sx - W / 2) / z, y: J0.head[1] + 30, zoom: z, rot: left ? -0.06 : 0.06 }, 5));
    actor(tr, ch, t, { wind: 2, seed: left ? 3 : 41, override: { aura: left ? 1.2 : 0.8 }, fireSize: 0.45 });
    S.restore(); GL.restore();
  };
  half(true); half(false);
  screenSpace();
  const f = Math.floor(t * 30);
  bolt([W / 2, -20], [W / 2, H + 20], f, { color: [255, 255, 255], width: 6, gens: 6, disp: 0.03 });
  FS.post.vignette = 0.6;
});

/* ---------- 32.0 – 33.6  charging the final attack ---------- */
shot(32.0, 33.6, (t, lt) => {
  const cam = shaken({ x: 0, y: lerp(-290, -240, lt / 1.6), zoom: lerp(0.66, 0.78, E.inOut2(lt / 1.6)), rot: 0 }, 4 * sat(32.6, 33.6, t));
  groundBG(cam, { moon: { x: 380, y: -230, r: 200 } });
  pillar(-1100, { h: 300, w: 90, breakAt: 0 });
  crater(0, 26.45, { w: 520, seed: 31, cracks: 16, color: [255, 200, 140], cool: 0.6 });
  lightPillar(t, -520, 90, BLUE, 0.35 * (1 - sat(33.3, 33.6, t)));
  lightPillar(t, 520, 90, ORANGE, 0.35 * (1 - sat(33.3, 33.6, t)));
  beamWorld(t);
  windDust(t, { rate: 40, alpha: 0.2 });
});

/* ---------- 33.6 – 40.4  BEAM CLASH ---------- */
function rightHand(tr, t) { return PW.handMid(tr, t); }
shot(33.6, 40.4, (t, lt) => {
  let cam;
  const J = PW.junction(t);
  if (t < 34.4) cam = { x: 0, y: -250, zoom: lerp(0.55, 0.5, sat(33.6, 34.4, t)), rot: 0 };
  else if (t < 35.2) { const h = solve(PW.RE.at(t)).neck; cam = { x: h[0] + 160, y: h[1] + 40, zoom: lerp(1.75, 1.9, sat(34.4, 35.2, t)), rot: -0.05 }; }
  else if (t < 36.0) { const h = solve(PW.HE.at(t)).neck; cam = { x: h[0] - 160, y: h[1] + 40, zoom: lerp(1.75, 1.9, sat(35.2, 36.0, t)), rot: 0.05 }; }
  else if (t < 36.8) cam = { x: -150, y: -170, zoom: 0.62, rot: 0.03 };
  else if (t < 37.6) { const h = solve(PW.RE.at(t)).head; cam = { x: h[0] - 60, y: h[1] + 30, zoom: lerp(2.6, 2.9, sat(36.8, 37.6, t)), rot: -0.04 }; }
  else if (t < 39.2) cam = { x: lerp(-180, 220, E.in2(sat(37.6, 39.2, t))), y: -240, zoom: lerp(0.56, 0.62, sat(37.6, 39.2, t)), rot: 0 };
  else if (t < 39.6) cam = { x: J[0], y: J[1] + 20, zoom: lerp(1.2, 1.5, sat(39.2, 39.6, t)), rot: 0.04 * Math.sin(t * 20) };
  else cam = { x: 150, y: -520, zoom: 0.28, rot: 0 };
  const cont = t > 33.75 && t < 39.6 ? 7 + 10 * sat(39.2, 39.6, t) : 0;
  cam = shaken(cam, cont);

  if (t >= 39.6) { explosionShot(t, cam); return; }
  groundBG(cam, { moon: { x: 380, y: -230, r: 200 } });
  pillar(-1100, { h: 300, w: 90, breakAt: 0 });
  crater(0, 26.45, { w: 520, seed: 31, cracks: 16, color: [255, 200, 140], cool: 0.6 });
  FS.post.bloom = 0.18;
  const w = beamWorld(t);
  // RAI's resolve: 全力 + eye flash
  if (t >= 36.8 && t < 37.6) {
    const st = PW.RE.at(t), Jr = solve(st);
    const ep = eyePos(Jr, 1, vecA(Jr.hA - 90, 1, Jr.d), vecA(Jr.hA, 1, Jr.d));
    flare(t, 37.25, ep[0], ep[1], { r: 22, life: 0.4, color: [140, 230, 255], star: 2.6, points: 4, glow: 0.5 });
    screenSpace();
    const a = sat(37.3, 37.36, t);
    if (a > 0) {
      const sc = lerp(1.8, 1, E.outBack(sat(37.3, 37.45, t)));
      text(S, '全力', W * 0.27, H * 0.44, { font: FONT.heavy, size: 300, color: '#e9f8ff', scale: sc, alpha: a, rot: -0.06, stroke: '#001a3a', strokeWidth: 16, shadow: '#2fb4ff', shadowBlur: 60 });
      text(S, 'FULL  POWER', W * 0.27, H * 0.74, { font: FONT.title, size: 60, spacing: 24, color: '#dff5ff', alpha: a * sat(37.36, 37.5, t), stroke: '#00142c', strokeWidth: 8 });
    }
  }
  screenSpace();
  if (t > 33.75 && t < 34.1) focusLines(S, ...camToScreen(cam, w.J), { alpha: 0.4 * (1 - sat(33.75, 34.1, t)), r0: 260, n: 120 });
  if (t >= 37.6 && t < 37.9) focusLines(S, ...camToScreen(cam, w.J), { alpha: 0.4, r0: 300, n: 100 });
  if (t >= 39.2) { FS.post.chroma = Math.max(FS.post.chroma, 6 + 10 * sat(39.2, 39.6, t)); FS.post.flash += 0.5 * sat(39.45, 39.6, t); }
});

function explosionShot(t, cam) {
  const C = [300, -200];
  groundBG(cam, { moon: { x: 380, y: -250, r: 200 }, hole: { x: camToScreen(cam, C)[0], y: camToScreen(cam, C)[1] - 200, r: 2400 * E.outExpo(sat(39.6, 40.3, t)) } });
  pillar(-1100, { h: 300, w: 90, breakAt: 0 });
  const u = sat(39.6, 40.4, t);
  const R0 = lerp(200, 2600, E.outExpo(u));
  S.save(); S.globalCompositeOperation = 'lighter';
  const g = S.createRadialGradient(C[0], C[1], R0 * 0.1, C[0], C[1], R0);
  g.addColorStop(0, `rgba(255,255,255,${0.95 * (1 - u * 0.6)})`);
  g.addColorStop(0.5, `rgba(255,200,150,${0.7 * (1 - u * 0.5)})`);
  g.addColorStop(0.85, `rgba(150,170,255,${0.45 * (1 - u * 0.5)})`);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  S.fillStyle = g; S.beginPath(); S.arc(C[0], C[1], R0, Math.PI, TAU); S.lineTo(C[0] + R0, 0); S.lineTo(C[0] - R0, 0); S.fill();
  S.restore();
  blob(GL, [255, 220, 200], C[0], C[1], R0 * 0.9, 0.7 * (1 - u));
  shockwave(t, 39.6, C[0], -4, { r: 5000, r0: 300, squash: 0.08, width: 90, life: 0.9, color: [255, 230, 220] });
  shockwave(t, 39.62, C[0], C[1], { r: 3000, width: 70, life: 0.7, color: [220, 220, 255] });
  debris(t, 39.6, C[0], -40, { n: 60, seed: 301, vx: 2600, vy: 2600, smax: 40, hot: [255, 200, 150], gravity: 2000 });
  dust(t, 39.6, C[0], 0, { n: 50, seed: 302, size: 260, vmax: 3000, up: 500, alpha: 0.7, life: 1.6 });
  // the world disappears into smoke
  screenSpace();
  S.fillStyle = `rgba(78,66,76,${0.85 * sat(39.95, 40.4, t)})`; S.fillRect(0, 0, W, H);
  FS.post.flash += 0.9 * Math.exp(-(t - 39.6) / 0.18);
}
