/* =====================================================================
 * shots_finale.js — 40.4 → 57.6 s
 *   eyes in the smoke · blades · the iai pass · delayed cut · dawn ·
 *   respect · walk into the sunrise · end card
 * ===================================================================== */
'use strict';

const FN = (() => {
  const R = new Track({ x: -520, pose: 'iaiReady', dir: 1, eyes: 0, aura: 0.3, blade: 0 });
  R.k(40.4).k(40.98, { eyes: 0 }).k(41.04, { eyes: 1.8, e: 'snap' }).k(41.3, { eyes: 1.0 })
    .k(41.65, { blade: 0 }).k(41.85, { blade: 1, e: 'out' }).k(43.1, { pm: { lean: 36 }, e: 'inOut' })
    .k(43.2, { pose: 'dash', pm: { a1: 40, e1: 20 }, g: false, y: -110, e: 'snap', ghost: 3 })
    .k(43.3, { x: 540, e: 'linear' })
    .k(43.42, { pose: 'iaiAfter', g: true, x: 540, ghost: 0, e: 'out', aura: 0.2 })
    .k(45.7, {}).k(46.1, { pose: 'standTall', blade: 0, eyes: 0.6, aura: 0, e: 'inOut' });
  const Hm = new Track({ x: 520, pose: 'iaiReady', dir: -1, eyes: 0, aura: 0.4, blade: 0 });
  Hm.k(40.4).k(41.18, { eyes: 0 }).k(41.24, { eyes: 1.8, e: 'snap' }).k(41.5, { eyes: 1.0 })
    .k(42.05, { blade: 0 }).k(42.25, { blade: 1, e: 'out' }).k(43.1, { pm: { lean: 36 }, e: 'inOut' })
    .k(43.2, { pose: 'dash', pm: { a1: 40, e1: 20 }, g: false, y: -110, e: 'snap', ghost: 3 })
    .k(43.3, { x: -540, e: 'linear' })
    .k(43.42, { pose: 'iaiAfter', g: true, x: -540, ghost: 0, e: 'out', aura: 0.3 })
    .k(45.0, {}).k(45.02, { blade: 0, e: 'hold', aura: 0 })
    .k(45.2, {}).k(45.5, { pose: 'kneel', eyes: 0.4, e: 'in' })
    .k(45.62, {}).k(46.0, { pose: 'lie', rot: -90, x: -520, eyes: 0, e: 'in' });
  ev(40.4, 'smoke');
  ev(41.02, 'eyeGlint', { who: 'rai' });
  ev(41.22, 'eyeGlint', { who: 'homura' });
  ev(41.65, 'bladeRai');
  ev(42.05, 'bladeHomura');
  ev(42.4, 'windGust');
  ev(42.5, 'heartbeat'); ev(42.9, 'heartbeat');
  ev(43.2, 'dashFinal', { shake: 10 });
  ev(43.3, 'slash', { flash: 0.2 });
  ev(44.0, 'ribbonCut');
  ev(45.0, 'shatter');
  ev(45.5, 'kneelThud');
  ev(45.6, 'finalBlast', { shake: 52, flash: 0.8, impact: 3, chroma: 12, shakeDecay: 0.5 });
  ev(46.0, 'collapse');
  ev(46.4, 'outro');
  return { R, Hm };
})();

/* ---------- 40.4 – 41.6  eyes in the smoke ---------- */
function smokyWorld(t, cam, smokeA) {
  groundBG(cam, { moon: { x: 380, y: -230, r: 200 } });
  screenSpace(); S.fillStyle = `rgba(40,32,44,${0.55 * smokeA})`; S.fillRect(0, 0, W, H); setCam(cam);
  crater(0, 26.45, { w: 520, seed: 31, cracks: 16, color: [255, 200, 140], cool: 0.6 });
  smokeField(t, { n: 30, x0: -1700, x1: 1700, y0: -700, y1: 0, smin: 160, smax: 380, alpha: 0.5 * smokeA, vx: -60 - 700 * sat(42.4, 43.2, t), seed: 21, color: [70, 60, 74] });
}
function eyesThrough(t, tr, ch) {
  const st = tr.at(t), J = solve(st);
  if ((st.eyes || 0) < 0.05) return;
  const fw = vecA(J.hA - 90, 1, J.d), up = vecA(J.hA, 1, J.d);
  drawEye(J, ch, 1, st.eyes, fw, up, 1);
}
shot(40.4, 41.6, (t, lt) => {
  const cam = shaken({ x: 0, y: -230, zoom: lerp(0.66, 0.72, lt / 1.2), rot: 0 });
  smokyWorld(t, cam, 1);
  actor(FN.R, RAI, t, { override: { sil: 1, glow: 0, alpha: 0.35, aura: 0 } });
  actor(FN.Hm, HOMURA, t, { override: { sil: 1, glow: 0, alpha: 0.35, aura: 0 } });
  smokeField(t, { n: 20, x0: -1700, x1: 1700, y0: -500, y1: 50, smin: 200, smax: 420, alpha: 0.45, vx: -40, seed: 22, color: [76, 64, 80] });
  eyesThrough(t, FN.R, RAI); eyesThrough(t, FN.Hm, HOMURA);
  for (const [tr, ch, tt] of [[FN.R, RAI, 41.02], [FN.Hm, HOMURA, 41.22]]) {
    const J = solve(tr.at(t)), ep = eyePos(J, 1, vecA(J.hA - 90, 1, J.d), vecA(J.hA, 1, J.d));
    flare(t, tt, ep[0], ep[1], { r: 30, life: 0.5, color: ch.eyeGlow, star: 2.4, points: 4, glow: 0.5 });
  }
  FS.post.fade = 0.85 * (1 - sat(40.4, 40.95, t));
  FS.post.fadeColor = 'rgb(78,66,76)';
  FS.post.vignette = 0.85; FS.post.letterbox = 1;
});

/* ---------- 41.6 – 42.4  the blades ---------- */
shot(41.6, 42.4, (t, lt) => {
  const left = t < 42.0;
  const tr = left ? FN.R : FN.Hm, ch = left ? RAI : HOMURA;
  const st = tr.at(t), J = solve(st);
  const z = lerp(2.3, 2.6, sat(left ? 41.6 : 42.0, left ? 42.0 : 42.4, t));
  const cam = shaken({ x: J.h1[0] + (left ? 120 : -120), y: J.h1[1] - 40, zoom: z, rot: left ? -0.05 : 0.05 }, 2);
  smokyWorld(t, cam, 0.9);
  actor(tr, ch, t, { wind: 0.8, override: { glow: 0.5 } });
  const dir = v2.norm(v2.sub(J.h1, J.e1));
  const t0 = left ? 41.65 : 42.05;
  sparks(t, t0, J.h1[0], J.h1[1], { n: 30, seed: left ? 5 : 6, ang: Math.atan2(dir[1], dir[0]) / DEG, spread: 60, vmax: 1200, color: ch.eyeGlow, life: 0.35 });
  FS.post.letterbox = 1;
});

/* ---------- 42.4 – 43.3  the smoke clears… then they move ---------- */
shot(42.4, 43.3, (t, lt) => {
  const cam = shaken({ x: 0, y: -230, zoom: lerp(0.62, 0.7, E.inOut2(sat(42.4, 43.2, t))), rot: 0 });
  smokyWorld(t, cam, 1 - 0.8 * sat(42.4, 43.0, t));
  windDust(t, { rate: 70, alpha: 0.35, speed: 1.8 });
  actor(FN.R, RAI, t, { wind: 1.8 });
  actor(FN.Hm, HOMURA, t, { wind: 1.8 });
  // a single ember drifting across the frame
  const u = sat(42.4, 43.2, t);
  const ex = lerp(500, -420, u), ey = -260 + Math.sin(u * 9) * 30;
  blob(S, [255, 200, 120], ex, ey, 5, 1); blob(GL, [255, 140, 40], ex, ey, 26, 0.8);
  if (t >= 43.2) {
    screenSpace();
    speedLines(S, { n: 70, alpha: 0.6, color: '#ffffff', lmin: 600, lmax: 2000 });
    FS.post.radialBlur = 0.05;
  }
  FS.post.letterbox = 1;
});

/* ---------- 43.3 – 43.42  THE SLASH (stylised frame) ---------- */
shot(43.3, 43.42, (t, lt) => {
  screenSpace();
  S.fillStyle = '#000'; S.fillRect(0, 0, W, H);
  const u = sat(43.3, 43.36, t);
  const a = [-100, H * 0.62], b = [W + 100, H * 0.38];
  const m = v2.lerp(a, b, u);
  S.save(); S.lineCap = 'round';
  S.strokeStyle = 'rgba(90,200,255,0.9)'; S.lineWidth = 12; S.beginPath(); S.moveTo(a[0], a[1] + 7); S.lineTo(m[0], m[1] + 7); S.stroke();
  S.strokeStyle = 'rgba(255,110,40,0.9)'; S.lineWidth = 12; S.beginPath(); S.moveTo(a[0], a[1] - 7); S.lineTo(m[0], m[1] - 7); S.stroke();
  S.strokeStyle = '#ffffff'; S.lineWidth = 5; S.beginPath(); S.moveTo(a[0], a[1]); S.lineTo(m[0], m[1]); S.stroke();
  S.restore();
  GL.save(); GL.strokeStyle = 'rgba(255,255,255,0.7)'; GL.lineWidth = 50; GL.beginPath(); GL.moveTo(a[0], a[1]); GL.lineTo(m[0], m[1]); GL.stroke(); GL.restore();
  sparks(t, 43.32, W * 0.5, H * 0.5, { n: 60, seed: 7, ang: -14, spread: 50, vmin: 1200, vmax: 3200, color: [120, 210, 255], life: 0.3, gravity: 0 });
  sparks(t, 43.32, W * 0.5, H * 0.5, { n: 60, seed: 8, ang: 166, spread: 50, vmin: 1200, vmax: 3200, color: [255, 140, 60], life: 0.3, gravity: 0 });
  // two tiny silhouettes crossing
  text(S, '一閃', W * 0.5, H * 0.8, { font: FONT.brush, size: 120, color: '#ffffff', alpha: sat(43.33, 43.36, t), spacing: 30 });
  FS.post.vignette = 0; FS.post.grain = 0.12; FS.post.letterbox = 1;
});

/* ---------- 43.42 – 46.4  aftermath: the delayed cut ---------- */
const CUT_PIECE = (t) => {
  // the severed headband tail drifting away from Rai's head
  if (t < 44.0) return;
  const st = FN.R.at(44.0), J = solve(st);
  const age = t - 44.0;
  const anchor = [J.head[0] - 30 - age * 120 + Math.sin(age * 3) * 25, J.head[1] - 10 - age * 40 + age * age * 30];
  S.save();
  S.fillStyle = RAI.clothDark; S.strokeStyle = RAI.outline; S.lineWidth = 2;
  ribbon(S, anchor, { dir: 1, vel: [-200, 0], t, s: 1, wind: 1.4, len: 62, w0: 8, w1: 3, phase: 1.7 });
  S.fill(); S.stroke();
  S.restore();
};
shot(43.42, 46.4, (t, lt) => {
  const cam = shaken({ x: 0, y: -205, zoom: lerp(0.7, 0.82, E.inOut2(sat(43.42, 46.4, t))), rot: 0 });
  groundBG(cam, { moon: { x: 380, y: -230, r: 200 } });
  crater(0, 26.45, { w: 520, seed: 31, cracks: 16, color: [255, 200, 140], cool: 0.6 });
  smokeField(t, { n: 14, x0: -1700, x1: 1700, y0: -500, y1: 0, smin: 160, smax: 300, alpha: 0.18, vx: -90, seed: 23 });
  windDust(t, { rate: 40, alpha: 0.28, speed: 1.4 });
  // the blast behind Homura
  const hx = -540;
  if (t >= 45.6) {
    const u = sat(45.6, 46.4, t);
    blob(GL, [255, 160, 80], hx, -200, 700 * E.outExpo(u), 0.8 * (1 - u));
    flames(t, { rate: 400, life: 0.9, size: 60, rise: 500, spread: 500, seed: 31, from: 45.6, to: 45.9 }, (ts, r) => [hx + r.s() * 160, -r.f() * 260]);
    for (let i = 0; i < 4 && t < 46.0; i++) {
      const f = Math.floor(t * 30), r = RNG(f * 5 + i), a = r.f() * TAU;
      bolt([hx, -180], [hx + Math.cos(a) * 500, -180 + Math.sin(a) * 400], f * 3 + i, { color: BLUE, width: 3, branches: 1 });
    }
  }
  shockwave(t, 45.6, hx, -4, { r: 2200, squash: 0.1, width: 40, life: 0.9, color: [255, 220, 200] });
  debris(t, 45.6, hx, -10, { n: 30, seed: 32, vx: 1200, vy: 1600, smax: 22, hot: [255, 190, 120] });
  dust(t, 45.6, hx, 0, { n: 30, seed: 33, size: 120, vmax: 1300, up: 300, alpha: 0.6, life: 2.0 });
  // the fighters
  actor(FN.Hm, HOMURA, t, { wind: 1.2 });
  actor(FN.R, RAI, t, { wind: 1.2, cut: t >= 44.0 });
  CUT_PIECE(t);
  // shatter of the flame blade
  const Jh = solve(FN.Hm.at(45.0));
  const bdir = v2.norm(v2.sub(Jh.h1, Jh.e1));
  const tip = v2.add(Jh.h1, v2.mul(bdir, 250));
  if (t >= 45.0) {
    S.save();
    for (let i = 0; i < 14; i++) {
      const r = RNG(400 + i), age = t - 45.0;
      if (age > 1.2) break;
      const p0 = v2.lerp(Jh.h1, tip, r.f());
      const x = p0[0] + r.s() * 300 * age, y = p0[1] - r.r(100, 400) * age + 700 * age * age;
      S.globalCompositeOperation = 'lighter';
      S.fillStyle = rgba(fireColor(0.2 + age), 1 - age / 1.2);
      S.beginPath(); S.moveTo(x, y - 9); S.lineTo(x + 5, y); S.lineTo(x, y + 9); S.lineTo(x - 5, y); S.closePath(); S.fill();
    }
    S.restore();
    embers(t, { rate: 200, life: 1.2, spread: 160, rise: 160, size: 3, seed: 34, from: 45.0, to: 45.1 }, (ts, r) => v2.lerp(Jh.h1, tip, r.f()));
  }
  // the slash mark across Homura's body, then the X flash
  const Jn = solve(FN.Hm.at(Math.min(t, 45.5)));
  if (t >= 44.6 && t < 45.75) {
    const a = v2.add(Jn.hip, [-70, -150]), b = v2.add(Jn.hip, [80, 30]);
    const k = sat(44.6, 44.7, t);
    S.save(); S.globalCompositeOperation = 'lighter'; S.lineCap = 'round';
    S.strokeStyle = `rgba(255,255,255,${k})`; S.lineWidth = 3 + 4 * sat(45.3, 45.6, t);
    S.beginPath(); S.moveTo(a[0], a[1]); S.lineTo(lerp(a[0], b[0], k), lerp(a[1], b[1], k)); S.stroke(); S.restore();
    GL.save(); GL.strokeStyle = 'rgba(140,220,255,0.9)'; GL.lineWidth = 30; GL.beginPath(); GL.moveTo(a[0], a[1]); GL.lineTo(b[0], b[1]); GL.stroke(); GL.restore();
  }
  if (t >= 45.6 && t < 46.0) {
    const k = 1 - sat(45.6, 46.0, t), c = v2.add(Jn.hip, [0, -60]);
    S.save(); S.globalCompositeOperation = 'lighter'; S.lineCap = 'round';
    for (const [dx, dy] of [[1, 0.9], [1, -0.9]]) {
      S.strokeStyle = `rgba(255,255,255,${k})`; S.lineWidth = 18 * k;
      S.beginPath(); S.moveTo(c[0] - dx * 420, c[1] - dy * 420); S.lineTo(c[0] + dx * 420, c[1] + dy * 420); S.stroke();
    }
    S.restore();
  }
  // Rai's blade dissolving into sparks
  if (t >= 45.7 && t < 46.3) {
    const Jr = solve(FN.R.at(45.7)), d2 = v2.norm(v2.sub(Jr.h1, Jr.e1));
    S.save(); S.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 30; i++) {
      const r = RNG(500 + i), age = t - 45.7, p0 = v2.add(Jr.h1, v2.mul(d2, 250 * r.f()));
      const x = p0[0] + r.s() * 60 * age, y = p0[1] - r.r(40, 160) * age;
      S.fillStyle = rgba(BLUE, 1 - age / 0.6); S.fillRect(x, y, 3, 3);
      blob(GL, BLUE, x, y, 14, (1 - age / 0.6) * 0.8);
    }
    S.restore();
  }
  FS.post.letterbox = 1 - sat(46.0, 46.4, t) * 0;
});

/* ---------- 46.4 – 54.4  dawn ---------- */
function walkPose(ph) {
  const s = Math.sin(ph), c = Math.cos(ph);
  return { lean: 5, head: 0, a1: -22 * s, e1: 20 + 10 * c, a2: 22 * s, e2: 20 - 10 * c,
    l1: 26 * s, k1: -6 - 34 * Math.max(0, c), l2: -26 * s, k2: -6 - 34 * Math.max(0, -c), pf: [0, 0] };
}
function stateOn(x, dir, pose, extra = {}) {
  return { x, y: GROUND - lowestOffset(pose, extra.rot || 0, 1), dir, pose, g: false, rot: 0, s: 1, alpha: 1, eyes: 0.5, aura: 0, glow: 0.7, ...extra };
}
function raiOutro(t) {
  // walk toward Homura (46.6–49.4), stand, raise a fist (51.6), turn & walk into the sunrise (52.6+)
  if (t < 46.6) return stateOn(540, -1, { ...POSES.standTall });
  if (t < 49.4) { const u = (t - 46.6); return stateOn(540 - u * 82, -1, walkPose(u * 6.2)); }
  const x0 = 540 - 2.8 * 82;
  if (t < 51.6) return stateOn(x0, -1, { ...POSES.standTall });
  if (t < 52.6) {
    const k = E.inOut(sat(51.6, 52.0, t)) * (1 - E.inOut(sat(52.3, 52.6, t)));
    const p = { ...POSES.standTall }; p.a1 = lerp(p.a1, 150, k); p.e1 = lerp(p.e1, 20, k);
    return stateOn(x0, -1, p);
  }
  const u = t - 52.6;
  return stateOn(x0 + u * 90, 1, walkPose(u * 6.4));
}
function homuraOutro(t) {
  const p = { ...POSES.lie };
  const k = E.inOut(sat(50.6, 51.4, t)) * (1 - E.inOut(sat(53.2, 53.8, t)));
  p.a1 = lerp(p.a1, 92, k); p.e1 = lerp(p.e1, 4, k);
  return stateOn(-520, -1, p, { rot: -90, eyes: 0.5 * k });
}
function dawnWorld(t, cam) {
  const d = ramp(46.4, 51.5, t);
  const pal = palMix(PAL.night, PAL.dawn, d);
  screenSpace();
  drawSky(cam, { pal, moon: { x: 380, y: lerp(-230, -40, d), r: 200, alpha: 1 - 0.75 * d }, stars: 1 - d, dawn: d, cloudAlpha: 1 });
  // the sun rising behind the far ridge
  layer(cam, 0.06, (ctx) => {
    const sy = lerp(120, -60, d);
    const g = ctx.createRadialGradient(-520, sy, 10, -520, sy, 900);
    g.addColorStop(0, `rgba(255,236,190,${0.95 * d})`); g.addColorStop(0.08, `rgba(255,210,150,${0.8 * d})`);
    g.addColorStop(0.4, `rgba(255,150,110,${0.25 * d})`); g.addColorStop(1, 'rgba(255,150,110,0)');
    ctx.fillStyle = g; ctx.fillRect(-1600, sy - 1000, 2200, 2000);
  });
  layer(cam, 0.06, (ctx) => blob(ctx, [255, 200, 140], -520, lerp(120, -60, d), 500, 0.5 * d), GL);
  drawLand(cam, { pal });
  setCam(cam);
  crater(0, 26.45, { w: 520, seed: 31, cracks: 16, color: [255, 200, 140], cool: 0.6, dark: lerp(0.8, 0.45, d) });
  embers(t, { rate: 18, life: 3, spread: 80, rise: 70, size: 2.4, seed: 61, color: [255, 210, 160] }, (ts, r) => [r.r(-1400, 1400), -r.r(0, 400)]);
  return d;
}
shot(46.4, 49.6, (t, lt) => {
  const cam = shaken({ x: 0, y: -320, zoom: lerp(0.5, 0.56, E.inOut2(lt / 3.2)), rot: 0 });
  dawnWorld(t, cam);
  smokeField(t, { n: 14, x0: -1700, x1: 1700, y0: -500, y1: 0, smin: 160, smax: 300, alpha: 0.2 * (1 - sat(46.4, 48.5, t)), vx: -60, seed: 24 });
  drawFighter(homuraOutro(t), HOMURA, t, { wind: 0.5 });
  drawFighter(raiOutro(t), RAI, t, { vel: [t > 46.6 ? -82 : 0, 0], wind: 0.8, cut: true });
  FS.post.letterbox = 1;
});
shot(49.6, 52.6, (t, lt) => {
  const cam = shaken({ x: -150, y: -160, zoom: lerp(1.05, 1.15, E.inOut2(lt / 3.0)), rot: 0 });
  dawnWorld(t, cam);
  drawFighter(homuraOutro(t), HOMURA, t, { wind: 0.5 });
  drawFighter(raiOutro(t), RAI, t, { wind: 0.9, cut: true });
  FS.post.letterbox = 1;
});
shot(52.6, 54.4, (t, lt) => {
  const u = E.inOut2(lt / 1.8);
  const cam = shaken({ x: lerp(-60, 200, u), y: lerp(-180, -560, u), zoom: lerp(0.95, 0.42, u), rot: 0 });
  dawnWorld(t, cam);
  drawFighter(homuraOutro(t), HOMURA, t, { wind: 0.5 });
  drawFighter(raiOutro(t), RAI, t, { vel: [90, 0], wind: 1.0, cut: true });
  FS.post.letterbox = 1;
  FS.post.fade = sat(53.8, 54.4, t);
});

/* ---------- 54.4 – 57.6  end card ---------- */
shot(54.4, 57.6, (t, lt) => {
  screenSpace();
  S.fillStyle = '#050407'; S.fillRect(0, 0, W, H);
  const a = sat(54.6, 55.0, t);
  const reveal = E.out(sat(54.6, 55.1, t));
  S.save();
  S.beginPath(); S.rect(0, 0, W * 0.32 + W * 0.36 * reveal, H); S.clip();
  text(S, '完', W / 2, H * 0.42, { font: FONT.brush, size: 380, color: '#f4efe6', alpha: a, shadow: 'rgba(255,255,255,0.25)', shadowBlur: 30 });
  S.restore();
  // hanko seal
  const sa = sat(55.25, 55.32, t), ss = lerp(1.6, 1, E.outBack(sat(55.25, 55.4, t)));
  if (sa > 0) {
    S.save(); S.translate(W / 2 + 190, H * 0.53); S.rotate(0.08); S.scale(ss, ss); S.globalAlpha = sa;
    S.fillStyle = '#c4141c'; S.fillRect(-46, -46, 92, 92);
    S.strokeStyle = '#f4efe6'; S.lineWidth = 3; S.strokeRect(-38, -38, 76, 76);
    S.font = `34px ${FONT.brush}`; S.fillStyle = '#f4efe6'; S.textAlign = 'center'; S.textBaseline = 'middle';
    S.fillText('雷', 0, -15); S.fillText('焔', 0, 19);
    S.restore();
  }
  const ta = sat(55.5, 56.0, t);
  text(S, 'STICKMAN  DUEL', W / 2, H * 0.72, { font: FONT.title, size: 64, spacing: 30, color: '#f4efe6', alpha: ta });
  text(S, '雷  vs  焔', W / 2, H * 0.8, { font: FONT.brush, size: 44, spacing: 10, color: '#c9b9a8', alpha: ta });
  FS.post.fade = sat(57.0, 57.6, t);
  FS.post.vignette = 0.4; FS.post.bloom = 0.1;
});
