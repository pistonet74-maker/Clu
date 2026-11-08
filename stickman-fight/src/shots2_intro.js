/* =====================================================================
 * shots2_intro.js — 0.0 → 11.2 s
 *   the burning city · GUREN on a burning wreck · SHIDEN strikes down ·
 *   VS · the sprint (cars blown away) · first clash (glass rain) · title
 * ===================================================================== */
'use strict';

/* ---------- 0.0 – 3.2  District 7 is burning ---------- */
(() => {
  ev(0, 'intro');
  ev(1.0, 'farBlast'); ev(2.3, 'farBlast');
  const blasts = [{ t: 1.0, x: -380, y: -380, p: 0.3, size: 1.4 }, { t: 2.3, x: 520, y: -260, p: 0.3, size: 1.1 }];
  // a tiny figure on a burning wreck in the middle of the avenue
  const G = new Track({ x: 520, g: true, floor: -96, pose: 'standTall', dir: -1, eyes: 0.4, s: GUREN.s, aura: 0.2 });
  G.k(0).k(3.2);
  const g = makeActor(GUREN, G, { t0: 0, t1: 3.3 });
  shot(0, 3.2, (t, lt) => {
    const u = lt / 3.2;
    const cam = shaken({ x: lerp(-700, 120, E.inOut(u)), y: lerp(-780, -560, E.inOut(u)), zoom: lerp(0.4, 0.5, E.inOut2(u)), rot: 0 });
    cityBG(cam, { blasts });
    drawCarBody(WRECK_A, t, { fire: 1.2 });
    act(g, t, { glow: 0.6 });
    cityEmbers(cam, { rate: 120 });
    foreground({ smoke: 0.3 });
    FS.post.letterbox = 1;
    FS.post.fade = 1 - sat(0, 1.2, lt);
    screenSpace();
    const ca = window01(t, 0.9, 3.05, 0.5, 0.3);
    text(S, '第七区 ・ 炎上', 160, 850, { font: FONT.brush, size: 50, align: 'left', alpha: ca, color: '#ffe9dc' });
    text(S, 'DISTRICT 7  —  ABLAZE', 163, 905, { font: FONT.sub, size: 30, spacing: 8, align: 'left', alpha: ca * 0.85, color: '#ffb48a' });
  });
})();
const WRECK_A = carBody({ x: 520, y: 0, t0: 999 });

/* ---------- 3.2 – 4.8  GUREN ---------- */
(() => {
  const G = new Track({ x: 0, g: true, floor: -96, pose: 'standTall', dir: 1, eyes: 0, s: GUREN.s, aura: 0.25, glow: 0.3 });
  G.k(3.2).k(3.36, {}).k(3.42, { dir: -1, pose: 'roar', e: 'out' }).k(3.5, { eyes: 2.2, mouth: 0.7, e: 'snap' }).k(3.9, { eyes: 1.2, mouth: 0.2, aura: 0.6 }).k(4.8, { aura: 0.8, mouth: 0 });
  const g = makeActor(GUREN, G, { t0: 3.2, t1: 4.85, prewarm: 1.2 });
  const car = carBody({ x: 0, y: 0, t0: 999 });
  ev(3.2, 'cut'); ev(3.5, 'eyeGlint', { who: 'guren' }); ev(3.52, 'roar'); ev(3.56, 'nameSlam', { who: 'guren' });
  shot(3.2, 4.8, (t, lt) => {
    const sn = g.at(t), H = sn.J.head;
    const z = lerp(2.15, 2.4, E.inOut2(lt / 1.6));
    const cam = shaken({ x: H[0] + (W / 2 - 1250) / z, y: H[1] + 120, zoom: z, rot: 0.04 }, 2);
    cityBG(cam, { dim: 0.45 });
    drawCarBody(car, t, { fire: 1.1 });
    act(g, t, { fireSize: 0.7 });
    const ep = v2.add(H, v2.add(v2.mul(headFrame(sn.J).fwd, 13), v2.mul(headFrame(sn.J).up, 5)));
    flare(t, 3.5, ep[0], ep[1], { r: 28, life: 0.45, color: [255, 210, 90], star: 2.4, points: 4, glow: 0.6 });
    cityEmbers(cam, { rate: 140 });
    nameCard(t, 3.56, { x: 560, y: 450, kanji: '紅蓮', size: 300, spacing: 10, name: 'GUREN', sub: '— THE CRIMSON LOTUS —', band: 'rgba(120,8,14,0.9)', stroke: '#1c0204', shadow: '#ff3a2a', subColor: '#ffb09a', from: -1 });
    FS.post.letterbox = 1;
    FS.post.flash += 0.6 * pulse(t, 3.2, 0.001, 0.05);
  });
})();

/* ---------- 4.8 – 6.4  SHIDEN strikes down ---------- */
(() => {
  const S2 = new Track({ x: 0, g: true, pose: 'superLand', dir: 1, eyes: 0, aura: 0.6, glow: 0.6 });
  S2.k(4.8, { alpha: 0 }).k(4.86, { alpha: 1, e: 'hold' }).k(5.2, { aura: 0.3 }).k(5.3, { pm: { head: -30 }, e: 'out' })
    .k(5.36, { eyes: 2.2, e: 'snap' }).k(5.62, { pose: 'stance', eyes: 1.2, bob: 0.5, e: 'inOut' }).k(6.4, {});
  const s = makeActor(SHIDEN, S2, { t0: 4.8, t1: 6.45, prewarm: 0.3 });
  gust(4.86, 0, -40, 1100, 450);
  ev(4.86, 'strike', { shake: 40, flash: 0.9, impact: 2 }); ev(5.36, 'eyeGlint', { who: 'shiden' }); ev(5.42, 'nameSlam', { who: 'shiden' });
  shot(4.8, 6.4, (t, lt) => {
    const z = lerp(1.75, 2.0, E.inOut2(lt / 1.6));
    const cam = shaken({ x: -150, y: -190, zoom: z, rot: -0.04 }, 2);
    cityBG(cam, { dim: 0.4 });
    crater(0, 4.86, { w: 230, seed: 5, cracks: 11, color: [190, 130, 255], cool: 0.9 });
    if (t < 4.95) bolt([60, -2400], [0, -20], Math.floor(t * 40), { color: SHIDEN.energy, width: 12, branches: 4, disp: 0.1 });
    rubble(t, 4.86, 0, -10, { n: 18, seed: 4, vx: 700, vy: 1100, smax: 14, hot: [190, 140, 255] });
    bsparks(t, 4.86, 0, -10, { n: 40, seed: 6, color: [200, 150, 255], vmax: 1700 });
    shockwave(t, 4.86, 0, -4, { r: 900, squash: 0.12, width: 24, life: 0.6, color: [200, 160, 255] });
    dust(t, 4.88, 0, 0, { n: 16, seed: 7, size: 60, vmax: 800, alpha: 0.55 });
    const sn = act(s, t, {});
    if (sn && t > 5.3) { const H = sn.J.head; const hf = headFrame(sn.J); const ep = v2.add(H, v2.add(v2.mul(hf.fwd, 13), v2.mul(hf.up, 5))); flare(t, 5.36, ep[0], ep[1], { r: 26, life: 0.45, color: [210, 160, 255], star: 2.4, points: 4, glow: 0.6 }); }
    cityEmbers(cam, { rate: 120 });
    nameCard(t, 5.42, { x: 1330, y: 450, kanji: '紫電', size: 300, spacing: 10, name: 'SHIDEN', sub: '— THE VIOLET THUNDER —', band: 'rgba(52,14,120,0.9)', stroke: '#0d0420', shadow: '#a46bff', subColor: '#d4bcff', from: 1 });
    FS.post.letterbox = 1;
  });
})();

/* ---------- 6.4 – 8.0  VS ---------- */
(() => {
  const A = new Track({ x: 0, g: true, pose: 'stance', dir: 1, eyes: 1, aura: 0.5, bob: 0.7, glow: 0.8 });
  A.k(6.4).k(7.3, { pm: { lean: 16 } }).k(8.0, { pose: 'stanceLow' });
  const B = new Track({ x: 0, g: true, pose: 'stance', dir: -1, eyes: 1, aura: 0.45, bob: 0.7, s: GUREN.s, glow: 0.8 });
  B.k(6.4).k(7.3, { pm: { lean: 16 } }).k(8.0, { pose: 'stanceLow' });
  const a = makeActor(SHIDEN, A, { t0: 6.4, t1: 8.05 }), b = makeActor(GUREN, B, { t0: 6.4, t1: 8.05 });
  ev(6.42, 'vs');
  const clip = (ctx, pts, s) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0] * s, p[1] * s) : ctx.moveTo(p[0] * s, p[1] * s))); ctx.closePath(); ctx.clip(); };
  shot(6.4, 8.0, (t, lt) => {
    const inU = E.outExpo(sat(6.33, 6.6, t));
    const offL = (1 - inU) * -1300, offR = (1 - inU) * 1300;
    const top = W * 0.575, bot = W * 0.425, z = lerp(1.75, 2.0, E.inOut2(lt / 1.6));
    const panel = (poly, bg1, bg2, cx, actor, flc, rot) => {
      S.save(); S.setTransform(1, 0, 0, 1, 0, 0); clip(S, poly, 1);
      GL.save(); GL.setTransform(1, 0, 0, 1, 0, 0); clip(GL, poly, GSCALE);
      abstractBG(bg1, bg2, { radial: true, cx, cy: 560 });
      focusLines(S, cx, 520, { alpha: 0.22, color: flc, r0: 260, n: 80 });
      const J = actor.at(t).J;
      setCam(shaken({ x: J.hip[0] - (cx - W / 2) / z, y: J.hip[1] - 40, zoom: z, rot }, 3));
      act(actor, t, { wind: 1.2, fireSize: 0.6 });
      S.restore(); GL.restore();
    };
    panel([[offL - 50, -20], [top + offL, -20], [bot + offL, H + 20], [offL - 50, H + 20]], '#4a1ab0', '#07020f', 480 + offL, a, '#d8c4ff', -0.03);
    panel([[top + offR, -20], [W + 50 + offR, -20], [W + 50 + offR, H + 20], [bot + offR, H + 20]], '#b3141f', '#140203', 1440 + offR, b, '#ffd0b0', 0.03);
    screenSpace();
    if (inU > 0.6) {
      const p0 = [top + 30, -40], p1 = [bot - 30, H + 40];
      S.save(); S.lineCap = 'round'; S.strokeStyle = '#fff'; S.lineWidth = 14; S.beginPath(); S.moveTo(...p0); S.lineTo(...p1); S.stroke(); S.restore();
      GL.save(); GL.strokeStyle = 'rgba(255,230,240,0.9)'; GL.lineWidth = 60; GL.beginPath(); GL.moveTo(...p0); GL.lineTo(...p1); GL.stroke(); GL.restore();
      const f = Math.floor(t * 30);
      for (let i = 0; i < 3; i++) { const r = RNG(f * 11 + i), p = v2.lerp(p0, p1, r.f()); bolt(p, [p[0] + r.s() * 160, p[1] + r.s() * 160], f * 5 + i, { color: i % 2 ? [255, 90, 60] : [180, 120, 255], width: 2.5, gens: 5 }); }
    }
    const vs = sat(6.44, 6.5, t), vsS = lerp(3.2, 1, E.outBack(sat(6.44, 6.62, t)));
    if (vs > 0) {
      const jx = noise1(t * 60, 4) * 8 * (1 - sat(6.5, 7.2, t)) + noise1(t * 40, 9) * 2;
      S.save(); S.translate(W / 2 + jx, H / 2 + 10); S.scale(vsS, vsS); S.rotate(-0.08);
      S.font = `italic 330px ${FONT.title}`; S.textAlign = 'center'; S.textBaseline = 'middle'; S.globalAlpha = vs;
      S.lineJoin = 'round'; S.lineWidth = 26; S.strokeStyle = '#000'; S.strokeText('VS', 0, 0);
      const g = S.createLinearGradient(0, -150, 0, 150);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.48, '#f1d8ff'); g.addColorStop(0.52, '#ff4a5a'); g.addColorStop(1, '#ffd0d6');
      S.fillStyle = g; S.fillText('VS', 0, 0); S.restore();
      blob(GL, [255, 190, 230], W / 2, H / 2, 380, 0.4 * vs);
    }
    FS.post.letterbox = 1;
    FS.post.chroma = Math.max(FS.post.chroma, 10 * pulse(t, 6.44, 0.001, 0.15));
    FS.post.flash += 0.8 * pulse(t, 6.44, 0.001, 0.08) + 0.7 * pulse(t, 6.4, 0.001, 0.05) + sat(7.85, 8.0, t);
  });
})();

/* ---------- 8.0 – 11.2  the sprint, the first clash, the title ---------- */
const CL = (() => {
  const A = new Track({ x: -700, g: true, pose: 'stance', dir: 1, eyes: 1, aura: 0.3, bob: 0.5 });
  const B = new Track({ x: 700, g: true, pose: 'stance', dir: -1, eyes: 1, aura: 0.3, bob: 0.5, s: GUREN.s });
  for (const [T, sg] of [[A, -1], [B, 1]]) {
    T.k(8.0).k(8.16, { pose: 'crouch', x: sg * 712, bob: 0, e: 'out' })
      .k(8.24, { run: 1, runF: 4.2, x: sg * 660, ghost: 2, e: 'snap' })
      .k(9.3, { x: sg * 120, e: 'linear' })
      .k(9.42, { run: 0, pose: 'dashFist', g: false, y: -150, x: sg * 70, ghost: 3, e: 'in', stiff: 1.6 })
      .k(9.6, { pose: 'punch', g: true, ghost: 0, aura: 0.7, e: 'snap', stiff: 2, freeze: 1 })
      .k(9.95, { freeze: 0 })
      .k(10.5, { e: 'linear' }).k(10.95, { pose: 'guard', x: sg * 300, slide: 1, aura: 0.3, e: 'out' })
      .k(11.2, { pose: 'stance', slide: 0, bob: 0.6 });
  }
  A.fit(9.6, 'h1', [-6]); B.fit(9.6, 'h1', [6]);
  const a = makeActor(SHIDEN, A, { t0: 8.0, t1: 11.25 }), b = makeActor(GUREN, B, { t0: 8.0, t1: 11.25 });
  // parked cars blown away by the wake of the sprint, then by the shockwave
  const cars = [
    carBody({ x: -330, y: 0, t0: 8.88, vx: -500, vy: -820, w: -3.2 }),
    carBody({ x: 360, y: 0, t0: 8.83, vx: 520, vy: -760, w: 3.0 }),
    carBody({ x: -980, y: 0, t0: 9.66, vx: -900, vy: -1100, w: -4.4 }),
    carBody({ x: 1020, y: 0, t0: 9.67, vx: 950, vy: -1000, w: 4.0 }),
  ];
  ev(8.16, 'crouch'); ev(8.24, 'launch', { shake: 12 });
  ev(8.88, 'carFlip', { x: -330 }); ev(8.83, 'carFlip', { x: 360 });
  ev(9.6, 'clash', { shake: 58, flash: 1.0, impact: 4, chroma: 16, shakeDecay: 0.35, x: 0 });
  ev(9.66, 'glassRain');
  gust(9.6, 0, -200, 4200, 2000); gust(8.88, -330, -40, 1500, 500); gust(8.83, 360, -40, 1500, 500);
  return { a, b, cars, P: null };
})();
function clashPoint() { if (!CL.P) CL.P = CL.a.at(9.6).J.h1; return CL.P; }
function clashWorld(t, cam) {
  const P = clashPoint();
  for (const c of CL.cars) drawCarBody(c, t, { fire: t > c.o.t0 ? 0.9 : 0 });
  crater(0, 9.6, { w: 320, seed: 9, cracks: 13, color: [255, 160, 220], cool: 0.8 });
  for (const x of [-712, 712]) { crater(x, 8.24, { w: 90, seed: x > 0 ? 3 : 2, cracks: 6, color: x > 0 ? [255, 120, 60] : [190, 130, 255] }); dust(t, 8.24, x, 0, { n: 14, seed: x > 0 ? 3 : 4, size: 50, vmax: 500, alpha: 0.55 }); }
  shockwave(t, 9.6, 0, -2, { r: 2000, squash: 0.1, width: 34, life: 0.9, color: [255, 200, 230] });
  shockwave(t, 9.6, P[0], P[1], { r: 1000, width: 36, life: 0.55, color: [210, 170, 255] });
  shockwave(t, 9.68, P[0], P[1], { r: 1500, width: 22, life: 0.7, color: [255, 150, 120] });
  rubble(t, 9.6, 0, -10, { n: 28, seed: 13, vx: 1300, vy: 1500, smax: 22 });
  bsparks(t, 9.6, P[0], P[1], { n: 60, seed: 14, vmax: 2400, color: [200, 160, 255], spread: 360, life: 0.9 });
  bsparks(t, 9.6, P[0], P[1], { n: 50, seed: 15, vmax: 2200, color: [255, 140, 70], spread: 360, life: 0.9 });
  dust(t, 9.62, 0, 0, { n: 30, seed: 12, size: 80, vmax: 1400, up: 220, alpha: 0.6, life: 1.8 });
  flare(t, 9.667, P[0], P[1], { r: 210, life: 0.5, color: [255, 210, 240] });
  for (let k = 0; k < 7; k++) glass(t, 9.66 + k * 0.03, -900 + k * 300, -760 - (k % 3) * 120, { n: 26, seed: 20 + k, vx: 260, vy: 200, vyMin: -100, w: 140, life: 2.6 });
  if (t > 9.6 && t < 10.0) {
    const f = Math.floor(t * 30);
    for (let i = 0; i < 5; i++) { const r = RNG(f * 9 + i), an = Math.PI + r.f() * Math.PI, L = r.r(200, 520); bolt(P, [P[0] - Math.cos(an) * L, P[1] + Math.sin(an) * L * 0.7], f * 13 + i, { color: SHIDEN.energy, width: 3, branches: 1 }); }
    flames(t, { rate: 220, life: 0.5, size: 34, rise: 120, spread: 400, seed: 16, from: 9.6, to: 10.0 }, (ts, r) => [P[0] + r.r(0, 160), P[1] + r.s() * 60]);
  }
}
(() => {
  const C = new Keys({ x: 0, y: -250, zoom: 0.72, rot: 0 });
  C.k(8.0).k(9.45, { y: -230, zoom: 1.08 }, 'in').k(9.6, { y: -220, zoom: 1.35 }, 'snap').k(9.95, { zoom: 1.45 }, 'linear');
  shot(8.0, 10.0, (t) => {
    const cam = shaken(C.at(t));
    cityBG(cam, {});
    clashWorld(t, cam);
    // dust kicked up by the sprint
    for (const [ac, s] of [[CL.a, 1], [CL.b, 2]]) emit(t, { rate: 60, life: 0.9, from: 8.24, to: 9.45, seed: 30 + s }, (ts, age, r, u) => { const x = ac.at(ts).J.hip[0]; blob(S, [120, 90, 90], x + r.s() * 30, -age * 40 - r.f() * 20, 26 + 60 * u, 0.45 * (1 - u), 0.3); });
    act(CL.a, t, { eyeTrail: t > 8.9 && t < 9.65 ? 0.12 : 0 }); act(CL.b, t, { eyeTrail: t > 8.9 && t < 9.65 ? 0.12 : 0 });
    cityEmbers(cam);
    foreground({ smoke: 0.18 });
    if (t > 8.4 && t < 9.62) speedLines(S, { n: 46, alpha: 0.35 * sat(8.4, 8.9, t), color: '#ffe6e0', lmin: 400, lmax: 1400 });
    if (t >= 9.6) impactLines(cam, clashPoint(), 0.5, 220);
    FS.post.letterbox = 1 - sat(8.0, 8.4, t);
  });
  // 10.0 – 11.2  the dome over the city + title
  shot(10.0, 11.2, (t, lt) => {
    const cam = shaken({ x: 0, y: -620, zoom: lerp(0.3, 0.27, lt / 1.2), rot: 0 });
    const P = clashPoint(), cs = camToScreen(cam, P);
    cityBG(cam, { hole: { x: cs[0], y: cs[1] - 300, r: 1700 * E.outExpo(sat(10.0, 11.0, t)) }, moon: { x: 60, y: -420, r: 230 } });
    clashWorld(t, cam);
    const u = sat(10.0, 11.2, t), R0 = lerp(300, 4200, E.outExpo(u));
    S.save(); S.globalCompositeOperation = 'lighter';
    const g = S.createRadialGradient(P[0], P[1], R0 * 0.2, P[0], P[1], R0);
    g.addColorStop(0, `rgba(255,255,255,${0.38 * (1 - u)})`); g.addColorStop(0.85, `rgba(200,150,255,${0.22 * (1 - u)})`);
    g.addColorStop(0.97, `rgba(255,220,240,${0.7 * (1 - u)})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    S.fillStyle = g; S.beginPath(); S.arc(P[0], P[1], R0, Math.PI, TAU); S.lineTo(P[0] + R0, 0); S.lineTo(P[0] - R0, 0); S.fill();
    S.restore();
    shockwave(t, 10.0, 0, -4, { r: 4500, r0: 600, squash: 0.08, width: 60, life: 1.2, color: [255, 210, 230] });
    act(CL.a, t, {}); act(CL.b, t, {});
    for (const [ac, s] of [[CL.a, 1], [CL.b, 2]]) emit(t, { rate: 60, life: 0.8, from: 10.5, to: 10.95, seed: 130 + s }, (ts, age, r, u2) => { const x = ac.at(ts).J.hip[0]; blob(S, [150, 120, 120], x + r.s() * 30, -age * 40, 30 + 60 * u2, 0.5 * (1 - u2), 0.3); });
    cityEmbers(cam, { rate: 60 });
    screenSpace();
    const ta = window01(t, 10.04, 11.2, 0.05, 0.25), ts2 = lerp(2.6, 1, E.outBack(sat(10.04, 10.25, t))) * lerp(1, 1.06, lt / 1.2);
    const jit = (1 - sat(10.04, 10.5, t)) * 14;
    text(S, '決戦', W / 2 + noise1(t * 60, 3) * jit, 360 + noise1(t * 60, 4) * jit, { font: FONT.heavy, size: 250, color: '#ffffff', stroke: '#2a0610', strokeWidth: 18, shadow: '#ff2a4a', shadowBlur: 60, scale: ts2, alpha: ta, spacing: 20 });
    text(S, 'STICKMAN  DUEL  II', W / 2, 545, { font: FONT.title, size: 74, spacing: 30, color: '#fff0f2', alpha: ta * sat(10.15, 10.35, t), stroke: '#000', strokeWidth: 8 });
    text(S, '燃える街 ・ THE BURNING CITY', W / 2, 615, { font: FONT.sub, size: 38, spacing: 10, color: '#ffb8a0', alpha: ta * sat(10.25, 10.45, t) });
    FS.post.flash += 0.5 * pulse(t, 10.0, 0.001, 0.12);
  });
})();
