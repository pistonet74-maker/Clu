/* =====================================================================
 * shots_sky.js — 19.2 → 27.2 s
 *   helix ascent · comet duel around the moon · silhouettes against the
 *   moon · mega collision · axe kick · meteor crash
 * ===================================================================== */
'use strict';

const SKY_PAL = palMix(PAL.night, PAL.high, 0.75);

/* comet trail for a track (used while `streak` > 0) */
function comet(track, ch, t, k = 1, o = {}) {
  const n = 18, dur = o.dur || 0.22, pts = [];
  for (let i = 0; i <= n; i++) {
    const st = track.at(t - dur * i / n);
    pts.push([st.x, st.y - 90 * (st.s || 1)]);
  }
  const w0 = (o.w || 30) * k;
  S.save(); S.globalCompositeOperation = 'lighter'; S.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const u = i / n;
    S.strokeStyle = rgba(mixc([255, 255, 255], ch.glow, Math.min(1, u * 1.6)), (1 - u) * 0.95);
    S.lineWidth = w0 * (1 - u * 0.85);
    S.beginPath(); S.moveTo(pts[i][0], pts[i][1]); S.lineTo(pts[i + 1][0], pts[i + 1][1]); S.stroke();
  }
  S.restore();
  GL.save(); GL.lineCap = 'round'; GL.lineJoin = 'round';
  GL.strokeStyle = rgba(ch.glow, 0.85 * k); GL.lineWidth = w0 * 3;
  drawPolyline(GL, pts.slice(0, Math.ceil(n * 0.7)));
  GL.restore();
  blob(S, [255, 255, 255], pts[0][0], pts[0][1], w0 * 1.4, k);
  blob(GL, ch.glow, pts[0][0], pts[0][1], w0 * 5, k);
  if (ch === HOMURA) embers(t, { rate: 80, life: 0.5, spread: 60, rise: 60, size: 3, seed: 7 }, (ts) => { const st = track.at(ts); return st.streak > 0.3 ? [st.x, st.y - 90] : null; });
  return pts[0];
}
function skyHit(t, t0, p, big = 1, seed = 1) {
  flare(t, t0, p[0], p[1], { r: 120 * big, life: 0.32, color: [240, 220, 255] });
  sparks(t, t0, p[0], p[1], { n: 26 * big, seed, vmax: 1700 * big, color: [120, 210, 255], life: 0.4, gravity: 200 });
  sparks(t, t0, p[0], p[1], { n: 26 * big, seed: seed + 50, vmax: 1700 * big, color: [255, 150, 60], life: 0.4, gravity: 200 });
  shockwave(t, t0, p[0], p[1], { r: 380 * big, width: 18 * big, life: 0.4, color: [210, 200, 255] });
}
function skyBG(cam, o = {}) {
  screenSpace();
  drawSky(cam, { pal: SKY_PAL, moon: o.moon || { x: 0, y: -150, r: 330, p: 0.04 }, clouds: false, stars: 1, hole: o.hole });
  cloudSea(cam, {});
  setCam(cam);
}

const SKY = (() => {
  /* ---- 19.2–22.4 comet tracks ---- */
  const RC = new Track({ x: 400, y: -1500, g: false, pose: 'flyPunch', dir: 1, streak: 1, eyes: 1, aura: 0.4 });
  const HC = new Track({ x: 280, y: -1500, g: false, pose: 'flyPunch', dir: -1, streak: 1, eyes: 1, aura: 0.4 });
  for (let i = 0; i <= 16; i++) {
    const tt = 19.2 + i * 0.05, u = i / 16;
    const ph = TAU * (tt - 19.6) / 0.8;
    const sp = i === 0 ? 300 : 260 * Math.sin(ph) * -1;
    RC.k(tt, { x: 340 + sp, y: lerp(-1500, -3000, E.out2(u)), spl: true, e: 'linear' });
    HC.k(tt, { x: 340 - sp, y: lerp(-1500, -3000, E.out2(u)), spl: true, e: 'linear' });
  }
  const hits = [[20.0, [340, -3000]], [20.4, [-760, -3260]], [20.8, [620, -2780]], [21.2, [-260, -3420]], [21.6, [820, -3260]], [22.0, [-620, -2760]]];
  for (let i = 0; i < hits.length - 1; i++) {
    const [ta, pa] = hits[i], [tb, pb] = hits[i + 1];
    const m = v2.lerp(pa, pb, 0.5), n = v2.norm(v2.perp(v2.sub(pb, pa)));
    RC.k((ta + tb) / 2, { x: m[0] + n[0] * 520, y: m[1] + n[1] * 520, spl: true, e: 'linear' });
    HC.k((ta + tb) / 2, { x: m[0] - n[0] * 520, y: m[1] - n[1] * 520, spl: true, e: 'linear' });
    RC.k(tb, { x: pb[0], y: pb[1], spl: true, e: 'linear' });
    HC.k(tb, { x: pb[0], y: pb[1], spl: true, e: 'linear' });
  }
  RC.k(22.4, { x: -1200, y: -3100, spl: true, e: 'out' });
  HC.k(22.4, { x: 900, y: -2400, spl: true, e: 'out' });
  ev(19.6, 'skyHit', { shake: 14, flash: 0.25 });
  hits.forEach(([tt], i) => ev(tt, 'skyHit', { shake: 18, flash: 0.3, impact: i === 2 || i === 4 ? 0 : 0, big: i === 0 }));

  /* ---- 22.4–24.0 silhouettes against the moon ---- */
  const RS = new Track({ x: -330, y: -2990, g: false, pose: 'hover', dir: 1, sil: 1, eyes: 1.2, aura: 0, glow: 0.12 });
  const HS = new Track({ x: 330, y: -3010, g: false, pose: 'hover', dir: -1, sil: 1, eyes: 1.2, aura: 0, glow: 0.12 });
  RS.k(22.4).k(22.52, { pose: 'flyPunch', x: -150, y: -3000, ghost: 2, e: 'in' }).k(22.62, { e: 'out', ghost: 0 });
  HS.k(22.4).k(22.55, { pose: 'crossBlock', x: 150, e: 'out' }).k(22.62, {});
  RS.fit(22.62, 'h1', jointAt(HS, 22.62, 'h1'));
  RS.k(22.78, { pose: 'crouch', rot: 20, x: -175, y: -2960, e: 'out' })
    .k(22.95, { pose: 'uppercut', rot: 0, e: 'snap' });
  HS.k(22.76, { pose: 'flyKick', rot: -12, x: 110, y: -3020, e: 'snap' })
    .k(22.95, { pose: 'hitHead', rot: -20, e: 'snap' });
  RS.fit(22.95, 'h1', jointAt(HS, 22.95, 'head'));
  RS.k(23.2, { pose: 'hover', x: -190, y: -3000, e: 'out' }).k(23.55, { x: -320, e: 'inOut' })
    .k(23.64, { pose: 'flyPunch', x: -130, ghost: 3, e: 'in' }).k(23.8, { e: 'out', ghost: 0 }).k(24.0, {});
  HS.k(23.25, { pose: 'tuck', rot: -300, x: 260, y: -3150, e: 'out' })
    .k(23.5, { pose: 'hover', rot: -360, x: 330, y: -3010, e: 'out' })
    .k(23.64, { pose: 'flyPunch', x: 130, y: -3000, ghost: 3, e: 'in' }).k(23.8, { e: 'out', ghost: 0 }).k(24.0, {});
  RS.fit(23.8, 'h1', [-4, -3000 - 85]);
  HS.fit(23.8, 'h1', [4, -3000 - 85]);
  const pS1 = jointAt(RS, 22.62, 'h1'), pS2 = jointAt(HS, 22.95, 'head'), pS3 = [0, -3085];
  ev(22.62, 'block', { shake: 16, flash: 0.2 });
  ev(22.95, 'hit', { shake: 22, flash: 0.3, impact: 2 });
  ev(23.8, 'clash2', { shake: 40, flash: 0.7, impact: 3, chroma: 12 });

  /* ---- 24.0–25.5 standoff, mega collision, axe kick ---- */
  const RD = new Track({ x: -130, y: -3000, g: false, pose: 'flyPunch', dir: 1, eyes: 1.2, aura: 0.5 });
  const HD = new Track({ x: 130, y: -3000, g: false, pose: 'flyPunch', dir: -1, eyes: 1.2, aura: 0.5 });
  RD.k(24.0).k(24.3, { pose: 'hover', x: -560, y: -2980, e: 'out', aura: 1.0 }).k(24.8, { aura: 1.6, eyes: 1.6, pm: { lean: 14 } })
    .k(24.88, { pose: 'dashFist', x: -470, e: 'snap', ghost: 4 }).k(25.2, { pose: 'flyPunch', e: 'in' });
  HD.k(24.0).k(24.3, { pose: 'hover', x: 560, y: -3020, e: 'out', aura: 1.0 }).k(24.8, { aura: 1.6, eyes: 1.6, pm: { lean: 14 } })
    .k(24.88, { pose: 'dashFist', x: 470, e: 'snap', ghost: 4 }).k(25.2, { pose: 'flyPunch', e: 'in' });
  RD.fit(25.2, 'h1', [-4, -3085]);
  HD.fit(25.2, 'h1', [4, -3085]);
  RD.k(25.32, { ghost: 0 }).k(25.5, { pose: 'hitGut', x: -40, y: -2990, e: 'snap', aura: 0.4 });
  HD.k(25.32, { ghost: 0 }).k(25.33, { alpha: 0, e: 'hold' })
    .k(25.38, { alpha: 1, pose: 'axeKick', x: 30, y: -3330, e: 'hold' })
    .k(25.5, { pose: 'highKick', rot: 45, e: 'in' });
  HD.fit(25.5, 'f1', jointAt(RD, 25.5, 'neck'));
  HD.k(25.75, { pose: 'hover', rot: 0, y: -3150, e: 'out' });
  ev(25.2, 'megaClash', { shake: 60, flash: 1.0, impact: 4, chroma: 18, shakeDecay: 0.4 });
  ev(25.36, 'teleport');
  ev(25.5, 'axeHit', { shake: 45, flash: 0.5, impact: 3, chroma: 10 });
  const pAxe = jointAt(RD, 25.5, 'neck');

  /* ---- 25.5–26.45 meteor ---- */
  const RM = new Track({ x: -40, y: -2990, g: false, pose: 'hitGut', dir: 1, eyes: 0.6 });
  RM.k(25.5).k(25.62, { pose: 'flyBack', rot: 110, y: -2850, x: -30, e: 'out' })
    .k(26.45, { y: -120, x: 0, rot: 120, e: 'in', streak: 0.9 });
  ev(25.62, 'fall');
  ev(26.45, 'meteor', { shake: 66, flash: 0.9, impact: 4, chroma: 18, shakeDecay: 0.45 });

  return { RC, HC, RS, HS, RD, HD, RM, hits, pS1, pS2, pS3, pAxe };
})();

/* ---------- 19.2 – 20.0 helix ascent through the clouds ---------- */
shot(19.2, 20.0, (t, lt) => {
  const u = lt / 0.8;
  const fy = (SKY.RC.at(t).y + SKY.HC.at(t).y) / 2;
  const cam = shaken({ x: 340, y: fy + 120, zoom: lerp(0.8, 0.66, u), rot: 0.06 * Math.sin(lt * 3) });
  FS.post.bloom = 0.15;
  skyBG(cam, { moon: { x: 0, y: -150, r: 330 } });
  worldClouds(cam, { alpha: 1 });
  comet(SKY.RC, RAI, t); comet(SKY.HC, HOMURA, t);
  { const p = SKY.RC.at(19.6); skyHit(t, 19.6, [p.x, p.y - 90], 0.8, 3); }
  FS.post.flash += 0.5 * pulse(t, 19.2, 0.001, 0.06);
  screenSpace();
  speedLines(S, { angle: Math.PI / 2, n: 40, alpha: 0.35, color: '#dfe6ff', lmin: 300, lmax: 1000 });
});

/* ---------- 20.0 – 22.4 comet duel around the moon (+ 2 manga cut-ins) ---------- */
function cutIn(t, variant) {
  abstractBG('#ffffff', variant ? '#ffd9c8' : '#d8ecff');
  focusLines(S, W / 2, H / 2 - 40, { color: '#000000', alpha: 0.9, r0: 300, n: 150, every: 1, seed: 9 + variant });
  const cam = { x: 0, y: -175, zoom: 2.25, rot: variant ? 0.12 : -0.1 };
  setCam(cam);
  const A = variant
    ? { x: -175, y: -150, g: false, dir: 1, pose: { ...POSES.flyKick }, sil: 1, eyes: 1.8, glow: 0.4 }
    : { x: -165, y: -150, g: false, dir: 1, pose: { ...POSES.flyPunch }, sil: 1, eyes: 1.8, glow: 0.4 };
  const B = variant
    ? { x: 175, y: -150, g: false, dir: -1, pose: { ...POSES.flyKick }, sil: 1, eyes: 1.8, glow: 0.4 }
    : { x: 150, y: -150, g: false, dir: -1, pose: { ...POSES.crossBlock }, sil: 1, eyes: 1.8, glow: 0.4 };
  drawFighter(A, RAI, t, { wind: 2 });
  drawFighter(B, HOMURA, t, { wind: 2 });
  const ja = solve(A), jb = solve(B);
  const p = variant ? v2.lerp(ja.f1, jb.f1, 0.5) : ja.h1;
  S.save(); S.fillStyle = '#000'; impactStar(S, p[0], p[1], 80, { seed: 3 + variant, points: 9 }); S.fill();
  S.fillStyle = '#fff'; impactStar(S, p[0], p[1], 50, { seed: 5 + variant, points: 9 }); S.fill(); S.restore();
  FS.post.glow = 0.3; FS.post.bloom = 0; FS.post.grain = 0.1; FS.post.vignette = 0.2;
}
shot(20.0, 22.4, (t, lt) => {
  if ((t >= 20.8 && t < 20.92) || (t >= 21.6 && t < 21.72)) { cutIn(t, t >= 21.6 ? 1 : 0); return; }
  const cam = shaken({ x: 0, y: -3040, zoom: lerp(0.74, 0.68, lt / 2.4), rot: lerp(-0.05, 0.07, E.inOut(lt / 2.4)) });
  FS.post.bloom = 0.15;
  skyBG(cam, { moon: { x: 0, y: -150, r: 330 } });
  SKY.hits.forEach(([tt, p], i) => skyHit(t, tt, [p[0], p[1] - 90], i === 0 ? 1.4 : 1, 20 + i));
  comet(SKY.RC, RAI, t); comet(SKY.HC, HOMURA, t);
  // the fighters flicker into view right at each collision
  for (const [tt] of SKY.hits) {
    if (t >= tt - 0.03 && t < tt + 0.08) {
      actor(SKY.RC, RAI, t, { override: { pose: { ...POSES.flyPunch }, streak: 0 } });
      actor(SKY.HC, HOMURA, t, { override: { pose: { ...POSES.flyKick }, streak: 0 } });
    }
  }
});

/* ---------- 22.4 – 24.0 silhouettes against the giant moon ---------- */
shot(22.4, 24.0, (t, lt) => {
  const cam = shaken({ x: 0, y: -3000, zoom: lerp(1.0, 1.12, E.inOut2(lt / 1.6)), rot: 0.02 });
  skyBG(cam, { moon: { x: 0, y: -175, r: 560, alpha: 1 } });
  FS.post.bloom = 0.12;
  actor(SKY.RS, RAI, t, { wind: 1.4, outline: 1.5 });
  actor(SKY.HS, HOMURA, t, { wind: 1.4, outline: 1.5 });
  const p1 = SKY.pS1, p2 = SKY.pS2, p3 = SKY.pS3;
  sparks(t, 22.62, p1[0], p1[1], { n: 26, seed: 31, vmax: 1300, color: [255, 200, 120] });
  flare(t, 22.62, p1[0], p1[1], { r: 70, life: 0.22, color: [255, 220, 180], streak: false });
  sparks(t, 22.95, p2[0], p2[1], { n: 30, seed: 32, ang: -90, spread: 120, vmax: 1500, color: [140, 210, 255] });
  flare(t, 22.95, p2[0], p2[1], { r: 90, life: 0.25, color: [180, 220, 255] });
  flare(t, 23.8, p3[0], p3[1], { r: 210, life: 0.45, color: [240, 220, 255] });
  sparks(t, 23.8, p3[0], p3[1], { n: 60, seed: 33, vmax: 2400, color: [255, 160, 70], width: 4 });
  sparks(t, 23.8, p3[0], p3[1], { n: 60, seed: 34, vmax: 2400, color: [120, 210, 255], width: 4 });
  shockwave(t, 23.8, p3[0], p3[1], { r: 1100, width: 34, life: 0.6, color: [230, 220, 255] });
  if (t > 23.8) { screenSpace(); focusLines(S, ...camToScreen(cam, p3), { alpha: 0.35 * (1 - sat(23.8, 24.0, t)), r0: 260 }); }
});

/* ---------- 24.0 – 25.5 standoff → mega collision → axe kick ---------- */
shot(24.0, 25.5, (t, lt) => {
  const z = t < 25.2 ? lerp(0.62, 0.8, E.in(sat(24.0, 25.2, t))) : 1.05;
  const cam = shaken({ x: 0, y: t < 25.2 ? -3010 : -3080, zoom: z, rot: t < 25.2 ? 0 : -0.05 });
  const cs = camToScreen(cam, [0, -3085]);
  skyBG(cam, { moon: { x: -60, y: -200, r: 380 }, hole: { x: cs[0], y: cs[1], r: 1600 * E.outExpo(sat(25.2, 25.5, t)) } });
  FS.post.bloom = 0.15;
  // charging auras: rising light pillars
  if (t < 25.2) {
    const k = sat(24.25, 24.8, t);
    for (const [tr, col] of [[SKY.RD, [90, 200, 255]], [SKY.HD, [255, 120, 40]]]) {
      const st = tr.at(t);
      blob(GL, col, st.x, st.y - 100, 260 * k, 0.5 * k);
    }
    const fl = Math.floor(t * 30);
    if (t > 24.3 && t < 24.86) for (let i = 0; i < 2; i++) {
      const J = solve(SKY.RD.at(t)), r = RNG(fl * 3 + i);
      bolt(J.head, [J.head[0] + r.s() * 300, J.head[1] - r.r(100, 400)], fl * 9 + i, { color: [90, 200, 255], width: 3, branches: 1 });
    }
  }
  actor(SKY.RD, RAI, t, { wind: 1.6, eyeTrail: t > 24.85 && t < 25.25 ? 0.18 : 0 });
  actor(SKY.HD, HOMURA, t, { wind: 1.6, eyeTrail: t > 24.85 && t < 25.25 ? 0.18 : 0 });
  const p = [0, -3085];
  flare(t, 25.27, p[0], p[1], { r: 300, life: 0.6, color: [240, 220, 255] });
  shockwave(t, 25.2, p[0], p[1], { r: 2400, width: 50, life: 0.8, color: [220, 210, 255] });
  shockwave(t, 25.26, p[0], p[1], { r: 1600, width: 30, life: 0.7, color: [255, 190, 140] });
  sparks(t, 25.2, p[0], p[1], { n: 90, seed: 41, vmax: 3000, life: 0.6, color: [120, 210, 255], width: 5 });
  sparks(t, 25.2, p[0], p[1], { n: 90, seed: 42, vmax: 3000, life: 0.6, color: [255, 150, 60], width: 5 });
  if (t > 25.2 && t < 25.35) {
    const f = Math.floor(t * 40);
    for (let i = 0; i < 8; i++) { const r = RNG(f * 5 + i), a = r.f() * TAU; bolt(p, [p[0] + Math.cos(a) * 700, p[1] + Math.sin(a) * 700], f * 3 + i, { color: i % 2 ? [255, 140, 60] : [100, 200, 255], width: 4, branches: 1 }); }
  }
  const pa = SKY.pAxe;
  flare(t, 25.5, pa[0], pa[1], { r: 140, life: 0.3, color: [255, 170, 100] });
  screenSpace();
  if (t > 24.88 && t < 25.2) speedLines(S, { n: 50, alpha: 0.4, color: '#ffffff', lmin: 500, lmax: 1600 });
  if (t > 25.2) focusLines(S, ...cs, { alpha: 0.45, r0: 240, n: 130 });
});

/* ---------- 25.5 – 26.3 Rai falls like a meteor ---------- */
shot(25.5, 26.3, (t, lt) => {
  const st = SKY.RM.at(t);
  const cam = shaken({ x: st.x * 0.5, y: st.y - 60, zoom: lerp(1.1, 0.75, sat(25.5, 25.8, t)), rot: 0.12 }, 6);
  const alt = clamp(-cam.y / 3000);
  screenSpace();
  drawSky(cam, { pal: palMix(PAL.night, PAL.high, 0.75 * alt), moon: { x: -60, y: -200, r: 380 }, clouds: false });
  if (alt < 0.25) drawLand(cam, {});
  setCam(cam);
  worldClouds(cam, {});
  if (t < 25.75) actor(SKY.HD, HOMURA, t, { wind: 1 });
  comet(SKY.RM, RAI, t, 1.2, { dur: 0.3, w: 40 });
  flames(t, { rate: 160, life: 0.35, size: 34, rise: -200, spread: 60, seed: 51, from: 25.6 }, (ts) => { const s2 = SKY.RM.at(ts); return [s2.x, s2.y - 60]; });
  actor(SKY.RM, RAI, t, { wind: 2.5 });
  const pa = SKY.pAxe;
  flare(t, 25.5, pa[0], pa[1], { r: 140, life: 0.3, color: [255, 170, 100] });
  sparks(t, 25.5, pa[0], pa[1], { n: 40, seed: 52, ang: 90, spread: 140, vmax: 1800, color: [255, 170, 80] });
  screenSpace();
  speedLines(S, { angle: -Math.PI / 2 + 0.12, n: 60, alpha: 0.45, color: '#ffffff', lmin: 400, lmax: 1400 });
});

/* ---------- 26.3 – 27.2 impact on the ground ---------- */
shot(26.3, 27.2, (t, lt) => {
  const cam = shaken({ x: 0, y: -430, zoom: 0.44, rot: 0 });
  groundBG(cam, { moon: { x: 380, y: -230, r: 200 } });
  pillar(-770, { h: 430, w: 110, breakAt: 0 }); pillar(1100, { h: 360, w: 90 });
  crater(-470, 0, { w: 210, seed: 6, cracks: 9, color: [255, 150, 60] });
  crater(-252, 0, { w: 290, seed: 7, cracks: 13, color: [120, 210, 255] });
  crater(0, 26.45, { w: 520, seed: 31, cracks: 16, color: [255, 200, 140], cool: 0.6 });
  if (t < 26.45) comet(SKY.RM, RAI, t, 1.4, { dur: 0.2, w: 50 });
  // dust mushroom
  dust(t, 26.45, 0, -20, { n: 40, seed: 61, size: 120, vmax: 1600, up: 500, alpha: 0.8, life: 2.6 });
  dust(t, 26.47, 0, -200, { n: 26, seed: 62, size: 160, vmax: 400, upMin: 300, up: 900, alpha: 0.7, life: 2.6 });
  debris(t, 26.45, 0, -10, { n: 44, seed: 63, vx: 1600, vy: 2200, smax: 30, hot: [255, 190, 120] });
  flare(t, 26.45, 0, -60, { r: 420, life: 0.6, color: [255, 220, 180] });
  shockwave(t, 26.45, 0, -4, { r: 3000, squash: 0.09, width: 60, life: 1.0, color: [255, 220, 200] });
  shockwave(t, 26.47, 0, -150, { r: 1300, width: 40, life: 0.6, color: [255, 220, 200] });
  sparks(t, 26.45, 0, -20, { n: 80, seed: 64, ang: -90, spread: 160, vmax: 3000, life: 0.7, color: [255, 200, 140], width: 5 });
  FS.post.flash += 0.3 * pulse(t, 26.3, 0.001, 0.05);
});
