/* =====================================================================
 * shots2_sky.js — 17.6 → 27.2 s : above the skyscrapers
 *   GUREN tumbles up · comet duel between towers (+ manga cut-ins) ·
 *   silhouettes against the blood moon · rooftop standoff → MEGA collision ·
 *   axe kick · falling fight along a tower facade · crash into the street
 * ===================================================================== */
'use strict';

/* towers that live in the fighters' plane (rooftops to stand on, a facade to fall along) */
const TW1 = { x: 6880, w: 420, h: 2500, seed: 401, tile: 2, off: 7, top: 'flat', fires: [[0.3, 0.2, 1.1], [0.7, 0.55, 1.3], [0.4, 0.8, 1.2]], plume: true };
const TW2 = { x: 8120, w: 440, h: 2700, seed: 402, tile: 4, off: 19, top: 'flat', fires: [[0.6, 0.25, 1.2], [0.3, 0.6, 1.4]], plume: true };
function worldTowers(cam, skip) {
  setCam(cam);
  for (const b of [TW1, TW2]) {
    if (b === skip) continue;
    S.fillStyle = '#0d0507'; buildingPath(S, b, 0); S.fill();
    const pat = winPattern(S, 'near', b.tile); pat.setTransform(new DOMMatrix([1, 0, 0, 1, b.x + b.off, -b.h]));
    S.fillStyle = pat; S.fillRect(b.x + b.w * 0.07, -b.h + 20, b.w * 0.86, b.h - 40);
    S.drawImage(UNIT_GRAD, b.x, -b.h * 0.9, b.w, b.h * 0.9);
    S.fillStyle = 'rgba(255,120,60,0.35)'; S.fillRect(b.x, -b.h - 4, b.w, 6);
    for (const [fx, fy, fs] of b.fires) {
      const px = b.x + b.w * fx, py = -b.h * (1 - fy), t = FS.t;
      S.save(); S.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 6; k++) { const ph = (t * 1.5 + k / 6 + fx) % 1; blob(S, fireColor(ph * 0.9), px + (k - 2.5) * 12 * fs, py - ph * 110 * fs, 46 * fs * (1 - ph * 0.55), (1 - ph) * 0.7, 0.3); }
      S.restore();
      blob(GL, [255, 110, 30], px, py, 120 * fs, 0.25);
    }
  }
}

function comet2(actor, t, k = 1, o = {}) {
  const n = 18, dur = o.dur || 0.22, pts = [], ch = actor.ch;
  for (let i = 0; i <= n; i++) { const J = actor.at(t - dur * i / n).J; pts.push([J.hip[0], J.hip[1] - 60]); }
  const w0 = (o.w || 30) * k;
  S.save(); S.globalCompositeOperation = 'lighter'; S.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const u = i / n;
    S.strokeStyle = rgba(mixc([255, 255, 255], ch.glow, Math.min(1, u * 1.6)), (1 - u) * 0.95);
    S.lineWidth = w0 * (1 - u * 0.85);
    S.beginPath(); S.moveTo(pts[i][0], pts[i][1]); S.lineTo(pts[i + 1][0], pts[i + 1][1]); S.stroke();
  }
  S.restore();
  GL.save(); GL.lineCap = 'round'; GL.lineJoin = 'round'; GL.strokeStyle = rgba(ch.glow, 0.85 * k); GL.lineWidth = w0 * 3;
  drawPolyline(GL, pts.slice(0, 13)); GL.restore();
  blob(S, [255, 255, 255], pts[0][0], pts[0][1], w0 * 1.4, k);
  blob(GL, ch.glow, pts[0][0], pts[0][1], w0 * 5, k);
  return pts[0];
}
function skyHit2(t, t0, p, big = 1, seed = 1) {
  flare(t, t0, p[0], p[1], { r: 120 * big, life: 0.32, color: [255, 210, 240] });
  sparks(t, t0, p[0], p[1], { n: 26 * big, seed, vmax: 1700 * big, color: [190, 140, 255], life: 0.4, gravity: 300 });
  sparks(t, t0, p[0], p[1], { n: 26 * big, seed: seed + 50, vmax: 1700 * big, color: [255, 120, 60], life: 0.4, gravity: 300 });
  shockwave(t, t0, p[0], p[1], { r: 420 * big, width: 18 * big, life: 0.4, color: [230, 190, 255] });
  glass(t, t0 + 0.04, p[0] + 120, p[1] - 80, { n: 18, seed: seed + 9, vx: 500, vy: 300, vyMin: -150, life: 2.2, w: 160 });
}

const SKY2 = (() => {
  /* ---- 17.6–20.8 : ascent + comet duel ---- */
  const hits = [[18.4, [7300, -2700]], [18.8, [8100, -3000]], [19.2, [7550, -3250]], [19.6, [8350, -2620]], [20.0, [7060, -2920]], [20.4, [7820, -2560]]];
  const A = new Track({ x: 7000, y: -1300, g: false, pose: 'flyPunch', dir: 1, eyes: 1, aura: 0.4 });
  const B = new Track({ x: 6950, y: -1500, g: false, pose: 'flyBack', dir: -1, eyes: 0.6, aura: 0.3, s: GUREN.s, rot: -200 });
  A.k(17.6, { spl: true }).k(18.0, { x: 7120, y: -2150, spl: true, e: 'linear' });
  B.k(17.6).k(18.05, { x: 7240, y: -2560, rot: -540, e: 'out' }).k(18.15, { pose: 'hover', rot: -720, eyes: 1.2, e: 'out' }).k(18.25, { pose: 'flyPunch', spl: true });
  for (let i = 0; i < hits.length; i++) {
    const [tb, pb] = hits[i];
    if (i > 0) {
      const [ta, pa] = hits[i - 1], m = v2.lerp(pa, pb, 0.5), n = v2.norm(v2.perp(v2.sub(pb, pa)));
      A.k((ta + tb) / 2, { x: m[0] + n[0] * 520, y: m[1] + n[1] * 520, spl: true, e: 'linear' });
      B.k((ta + tb) / 2, { x: m[0] - n[0] * 520, y: m[1] - n[1] * 520, spl: true, e: 'linear' });
    }
    A.k(tb, { x: pb[0] - 40, y: pb[1] + 60, spl: true, e: 'linear', pose: i % 2 ? 'flyKick' : 'flyPunch' });
    B.k(tb, { x: pb[0] + 40, y: pb[1] + 60, spl: true, e: 'linear', pose: i % 2 ? 'flyPunch' : 'flyKick' });
  }
  A.k(20.8, { x: 7000, y: -2400, spl: true, e: 'out' }); B.k(20.8, { x: 8500, y: -2900, spl: true, e: 'out' });
  const a = makeActor(SHIDEN, A, { t0: 17.6, t1: 20.85 }), b = makeActor(GUREN, B, { t0: 17.6, t1: 20.85 });
  hits.forEach(([t, p], i) => { ev(t, 'skyHit', { shake: 18, flash: 0.3, big: i === 0 || i === 5 }); gust(t, p[0], p[1], 2400, 900); });

  /* ---- 20.8–22.4 : silhouettes against the moon ---- */
  const C0 = [7700, -2700];
  const SA = new Track({ x: C0[0] - 330, y: C0[1] + 10, g: false, pose: 'hover', dir: 1, eyes: 1.3, sil: 1, glow: 0.1 });
  const SB = new Track({ x: C0[0] + 330, y: C0[1] - 10, g: false, pose: 'hover', dir: -1, eyes: 1.3, sil: 1, glow: 0.1, s: GUREN.s });
  SA.k(20.8).k(20.92, { pose: 'flyPunch', x: C0[0] - 150, ghost: 2, stiff: 1.8, e: 'in' }).k(21.02, { e: 'out', ghost: 0, stiff: 1 });
  SB.k(20.8).k(20.95, { pose: 'crossBlock', x: C0[0] + 150, e: 'out' }).k(21.02, {});
  SA.fit(21.02, 'h1', J_tmp(SB, 21.02, 'h1'));
  SA.k(21.18, { pose: 'crouch', rot: 22, x: C0[0] - 175, y: C0[1] + 40, e: 'out' }).k(21.35, { pose: 'uppercut', rot: 0, stiff: 2, e: 'snap' });
  SB.k(21.16, { pose: 'flyKick', rot: -12, x: C0[0] + 110, y: C0[1] - 20, stiff: 1.8, e: 'snap' }).k(21.35, { pose: 'hitHead', rot: -20, e: 'snap' });
  SA.fit(21.35, 'h1', J_tmp(SB, 21.35, 'head'));
  SA.k(21.6, { pose: 'hover', x: C0[0] - 190, y: C0[1], stiff: 1, e: 'out' }).k(21.9, { x: C0[0] - 320, e: 'inOut' })
    .k(22.0, { pose: 'flyPunch', x: C0[0] - 130, ghost: 3, e: 'in' }).k(22.16, { e: 'out', ghost: 0, freeze: 1 }).k(22.26, { freeze: 0 }).k(22.4, {});
  SB.k(21.65, { pose: 'tuck', rot: -300, x: C0[0] + 260, y: C0[1] - 150, e: 'out' }).k(21.9, { pose: 'hover', rot: -360, x: C0[0] + 330, y: C0[1] - 10, e: 'out' })
    .k(22.0, { pose: 'flyPunch', x: C0[0] + 130, y: C0[1], ghost: 3, e: 'in' }).k(22.16, { e: 'out', ghost: 0, freeze: 1 }).k(22.26, { freeze: 0 }).k(22.4, {});
  SA.fit(22.16, 'h1', [C0[0] - 4, C0[1] - 88]); SB.fit(22.16, 'h1', [C0[0] + 4, C0[1] - 88]);
  const sa = makeActor(SHIDEN, SA, { t0: 20.8, t1: 22.45 }), sb = makeActor(GUREN, SB, { t0: 20.8, t1: 22.45 });
  ev(21.02, 'block', { shake: 16, flash: 0.2 }); ev(21.35, 'hit', { shake: 22, flash: 0.3, impact: 2 }); ev(22.16, 'clash2', { shake: 40, flash: 0.7, impact: 3, chroma: 12 });

  /* ---- 22.4–24.0 : rooftops → mega collision → axe kick ---- */
  const RA = new Track({ x: TW1.x + 250, g: true, floor: -TW1.h, pose: 'stanceLow', dir: 1, eyes: 1.4, aura: 0.9, bob: 0.4 });
  const RB = new Track({ x: TW2.x + 190, g: true, floor: -TW2.h, pose: 'stanceLow', dir: -1, eyes: 1.4, aura: 0.9, bob: 0.4, s: GUREN.s });
  const MC = [7700, -2980];
  RA.k(22.4).k(22.95, { aura: 1.8, pose: 'charge', mouth: 0.6, tremble: 1, bob: 0 }).k(23.15, { pose: 'crouch', mouth: 0, tremble: 0, e: 'out' })
    .k(23.22, { pose: 'dashFist', g: false, y: -TW1.h - 140, ghost: 4, e: 'snap' }).k(23.6, { pose: 'flyPunch', x: MC[0] - 130, y: MC[1] + 60, stiff: 2, e: 'in', freeze: 1 })
    .k(23.75, { freeze: 0, ghost: 0 }).k(23.95, { pose: 'hitGut', x: MC[0] - 60, y: MC[1] + 30, e: 'snap' });
  RB.k(22.4).k(22.95, { aura: 1.8, pose: 'roar', mouth: 0.8, tremble: 1, bob: 0 }).k(23.15, { pose: 'crouch', mouth: 0, tremble: 0, e: 'out' })
    .k(23.22, { pose: 'dashFist', g: false, y: -TW2.h - 140, ghost: 4, e: 'snap' }).k(23.6, { pose: 'flyPunch', x: MC[0] + 130, y: MC[1] + 60, stiff: 2, e: 'in', freeze: 1 })
    .k(23.75, { freeze: 0, ghost: 0 }).k(23.8, { alpha: 0, e: 'hold' })
    .k(23.86, { alpha: 1, pose: 'axeKick', x: MC[0] - 20, y: MC[1] - 330, e: 'hold' }).k(23.95, { pose: 'highKick', rot: 45, stiff: 2, e: 'snap' });
  RA.fit(23.6, 'h1', [MC[0] - 5, MC[1]]); RB.fit(23.6, 'h1', [MC[0] + 5, MC[1]]);
  RB.fit(23.95, 'f1', J_tmp(RA, 23.95, 'neck'));
  const ra = makeActor(SHIDEN, RA, { t0: 22.4, t1: 24.05 }), rb = makeActor(GUREN, RB, { t0: 22.4, t1: 24.05 });
  ev(22.95, 'powerUp', { who: 'both', dur: 0.25 }); ev(23.22, 'launch', { shake: 18 });
  ev(23.6, 'megaClash', { shake: 62, flash: 1.0, impact: 4, chroma: 18, shakeDecay: 0.4 }); gust(23.6, MC[0], MC[1], 5000, 2200);
  ev(23.84, 'teleport'); ev(23.95, 'axeHit', { shake: 46, flash: 0.5, impact: 3, chroma: 10 });

  /* ---- 24.0–27.2 : the fall along the tower ---- */
  const FX = TW1.x + TW1.w;                       // facade edge
  const FA = new Track({ x: FX + 120, y: MC[1] + 30, g: false, pose: 'hitGut', dir: 1, eyes: 0.8, aura: 0.3 });
  const FB = new Track({ x: FX + 300, y: MC[1] - 200, g: false, pose: 'highKick', rot: 45, dir: -1, eyes: 1.2, aura: 0.6, s: GUREN.s });
  FA.k(23.95).k(24.3, { pose: 'flyBack', rot: 120, y: -2400, x: FX + 150, e: 'out' })
    .k(24.7, { pose: 'fallSky', rot: 0, y: -2000, x: FX + 160, e: 'inOut' })
    .k(24.85, { pose: 'kick', rot: 0, y: -1900, x: FX + 170, stiff: 2, e: 'snap' })        // SHIDEN kicks back
    .k(25.3, { pose: 'fallSky', y: -1500, x: FX + 160, stiff: 1, e: 'inOut' })
    .k(25.5, { pose: 'crossBlock', y: -1320, x: FX + 140, e: 'out' })
    .k(25.75, { pose: 'punch', y: -1120, x: FX + 150, stiff: 2, e: 'snap' })
    .k(26.05, { pose: 'fallSky', y: -900, x: FX + 160, stiff: 1 })
    .k(26.32, { pose: 'hitGut', y: -760, x: FX + 170, stiff: 2, e: 'snap' })
    .k(27.18, { pose: 'flyBack', rot: 100, y: -120, x: FX + 240, e: 'in', streak: 1 });
  FB.k(23.95).k(24.3, { pose: 'dash', rot: 80, y: -2560, x: FX + 300, e: 'out' })
    .k(24.7, { pose: 'flyPunch', rot: 30, y: -2060, x: FX + 300, e: 'inOut' })
    .k(24.85, { pose: 'hitHead', rot: -10, y: -1990, x: FX + 330, e: 'snap' })
    .k(25.0, { pose: 'flyBack', rot: -40, y: -1880, x: FX + 60, e: 'out' })            // slammed into the facade
    .k(25.3, { pose: 'fallSky', rot: 0, y: -1560, x: FX + 300, e: 'inOut' })
    .k(25.5, { pose: 'punch', y: -1380, x: FX + 290, stiff: 2, e: 'snap' })
    .k(25.75, { pose: 'hitHead', y: -1180, x: FX + 300, e: 'snap' })
    .k(26.05, { pose: 'axeKick', y: -1020, x: FX + 230, stiff: 1, e: 'out' })
    .k(26.32, { pose: 'highKick', rot: 50, y: -900, x: FX + 220, stiff: 2.2, e: 'snap' })
    .k(27.2, { pose: 'fallSky', rot: 0, y: -700, x: FX + 260, e: 'out' });
  FA.fit(24.85, 'f1', J_tmp(FB, 24.85, 'head'));
  FB.fit(25.5, 'h1', J_tmp(FA, 25.5, 'h1'));
  FA.fit(25.75, 'h1', J_tmp(FB, 25.75, 'head'));
  FB.fit(26.32, 'f1', J_tmp(FA, 26.32, 'neck'));
  const fa = makeActor(SHIDEN, FA, { t0: 23.95, t1: 27.25 }), fb = makeActor(GUREN, FB, { t0: 23.95, t1: 27.25 });
  ev(24.85, 'hit', { shake: 22, flash: 0.3, impact: 2 }); ev(25.0, 'wallSmash', { shake: 28 });
  ev(25.5, 'block', { shake: 18, flash: 0.2 }); ev(25.75, 'hit', { shake: 22, flash: 0.3 }); ev(26.32, 'axeHit', { shake: 40, flash: 0.45, impact: 2 });
  ev(26.35, 'fall');
  return { hits, a, b, sa, sb, C0, ra, rb, MC, fa, fb, FX };
})();

/* ---------- 17.6 – 20.8 ascent + comet duel ---------- */
function cutIn2(t, variant) {
  abstractBG('#ffffff', variant ? '#ffd8d8' : '#e4d8ff');
  focusLines(S, W / 2, H / 2 - 40, { color: '#000000', alpha: 0.9, r0: 300, n: 150, every: 1, seed: 9 + variant });
  const cam = { x: 0, y: -175, zoom: 2.2, rot: variant ? 0.12 : -0.1 };
  setCam(cam);
  const mkS = (ch, x, dir, pose) => { const tr = new Track({ x, y: -150, g: false, dir, pose, sil: 1, eyes: 1.8, glow: 0.3, s: ch.s, still: 1 }); tr.k(0).k(1); return new Actor(ch, tr, { t0: 0, t1: 0.6, prewarm: 0.4, wind: () => [variant ? 900 : -900, -200] }).bake(); };
  const key = 'ci' + variant;
  if (!cutIn2[key]) cutIn2[key] = variant ? [mkS(SHIDEN, -175, 1, 'flyKick'), mkS(GUREN, 175, -1, 'flyKick')] : [mkS(SHIDEN, -165, 1, 'flyPunch'), mkS(GUREN, 150, -1, 'crossBlock')];
  const [A, B] = cutIn2[key];
  act(A, 0.5, { smear: false }); act(B, 0.5, { smear: false });
  const ja = A.at(0.5).J, jb = B.at(0.5).J;
  const p = variant ? v2.lerp(ja.f1, jb.f1, 0.5) : ja.h1;
  S.save(); S.fillStyle = '#000'; impactStar(S, p[0], p[1], 80, { seed: 3 + variant, points: 9 }); S.fill();
  S.fillStyle = '#fff'; impactStar(S, p[0], p[1], 50, { seed: 5 + variant, points: 9 }); S.fill(); S.restore();
  FS.post.glow = 0.3; FS.post.bloom = 0; FS.post.grain = 0.1; FS.post.vignette = 0.2;
}
shot(17.6, 20.8, (t, lt) => {
  if ((t >= 19.2 && t < 19.32) || (t >= 20.0 && t < 20.12)) { cutIn2(t, t >= 20.0 ? 1 : 0); return; }
  let cam;
  if (t < 18.3) { const yb = SKY2.b.at(t).J.hip[1]; cam = { x: 7150, y: Math.min(-1500, yb + 80), zoom: 0.8, rot: 0.05 }; }
  else cam = { x: 7700, y: -2820, zoom: lerp(0.66, 0.6, sat(18.3, 20.8, t)), rot: lerp(-0.05, 0.06, E.inOut(sat(18.3, 20.8, t))) };
  cam = shaken(cam);
  skyBG2(cam, {});
  SKY2.hits.forEach(([tt, p], i) => skyHit2(t, tt, p, i === 0 || i === 5 ? 1.4 : 1, 20 + i));
  if (t > 18.25) { comet2(SKY2.a, t); comet2(SKY2.b, t); }
  else { comet2(SKY2.a, t); act(SKY2.b, t, {}); }
  for (const [tt] of SKY2.hits) if (t >= tt - 0.03 && t < tt + 0.1) { act(SKY2.a, t, { smear: false }); act(SKY2.b, t, { smear: false }); }
  cityEmbers(cam, { rate: 60, ash: 20 });
  screenSpace();
  if (t < 18.3) speedLines(S, { angle: Math.PI / 2, n: 40, alpha: 0.35, color: '#ffe0d8', lmin: 300, lmax: 1000 });
});

/* ---------- 20.8 – 22.4 silhouettes against the blood moon ---------- */
shot(20.8, 22.4, (t, lt) => {
  const C0 = SKY2.C0;
  const cam = shaken({ x: C0[0], y: C0[1] - 20, zoom: lerp(1.0, 1.12, E.inOut2(lt / 1.6)), rot: 0.02 });
  const lc = { x: cam.x * 0.03, y: cam.y * 0.03 };
  skyBG2(cam, { moon: { x: lc.x, y: lc.y - 50, r: 600 }, towers: false, dim: 0.0, smokeAlpha: 0.35 });
  act(SKY2.sa, t, { outline: 1.5 }); act(SKY2.sb, t, { outline: 1.5 });
  const p1 = J_(SKY2.sb, 21.02, 'h1'), p2 = J_(SKY2.sb, 21.35, 'head'), p3 = [C0[0], C0[1] - 88];
  bsparks(t, 21.02, p1[0], p1[1], { n: 26, seed: 31, vmax: 1300, color: [255, 200, 140], spread: 360 });
  flare(t, 21.02, p1[0], p1[1], { r: 70, life: 0.22, color: [255, 220, 200], streak: false });
  bsparks(t, 21.35, p2[0], p2[1], { n: 30, seed: 32, ang: -90, spread: 120, vmax: 1500, color: [200, 150, 255] });
  flare(t, 21.35, p2[0], p2[1], { r: 90, life: 0.25, color: [220, 190, 255] });
  flare(t, 22.26, p3[0], p3[1], { r: 210, life: 0.45, color: [255, 220, 240] });
  sparks(t, 22.16, p3[0], p3[1], { n: 60, seed: 33, vmax: 2400, color: [255, 120, 60], width: 4 });
  sparks(t, 22.16, p3[0], p3[1], { n: 60, seed: 34, vmax: 2400, color: [190, 140, 255], width: 4 });
  shockwave(t, 22.16, p3[0], p3[1], { r: 1100, width: 34, life: 0.6, color: [240, 210, 255] });
  if (t > 22.16) impactLines(cam, p3, 0.35 * (1 - sat(22.16, 22.4, t)), 260);
  FS.post.bloom = 0.12;
});

/* ---------- 22.4 – 24.0 rooftops → MEGA collision → axe kick ---------- */
shot(22.4, 24.0, (t, lt) => {
  const MC = SKY2.MC;
  const z = t < 23.6 ? lerp(0.62, 0.8, E.in(sat(22.4, 23.6, t))) : 1.05;
  const cam = shaken({ x: t < 23.6 ? 7740 : MC[0], y: t < 23.6 ? -2880 : MC[1] + 10, zoom: z, rot: t < 23.6 ? 0 : -0.05 });
  const cs = camToScreen(cam, MC);
  skyBG2(cam, { hole: { x: cs[0], y: cs[1], r: 1700 * E.outExpo(sat(23.6, 24.0, t)) } });
  worldTowers(cam);
  if (t < 23.22) for (const [ac, col] of [[SKY2.ra, SHIDEN.energy], [SKY2.rb, GUREN.energy]]) { const J = ac.at(t).J, k = sat(22.6, 23.0, t); lightPillar(t, J.hip[0], 70, col, 0.5 * k, { top: J.hip[1] - 2600, bot: J.hip[1] + 140 }); }
  act(SKY2.ra, t, { eyeTrail: t > 23.2 && t < 23.62 ? 0.18 : 0 }); act(SKY2.rb, t, { eyeTrail: t > 23.2 && t < 23.62 ? 0.18 : 0 });
  flare(t, 23.68, MC[0], MC[1], { r: 300, life: 0.6, color: [255, 220, 240] });
  shockwave(t, 23.6, MC[0], MC[1], { r: 2600, width: 50, life: 0.8, color: [230, 200, 255] });
  shockwave(t, 23.66, MC[0], MC[1], { r: 1700, width: 30, life: 0.7, color: [255, 170, 130] });
  sparks(t, 23.6, MC[0], MC[1], { n: 90, seed: 41, vmax: 3000, life: 0.6, color: [190, 140, 255], width: 5 });
  sparks(t, 23.6, MC[0], MC[1], { n: 90, seed: 42, vmax: 3000, life: 0.6, color: [255, 120, 60], width: 5 });
  for (let k = 0; k < 6; k++) glass(t, 23.64 + k * 0.02, TW1.x + 60 + (k % 3) * 140, -TW1.h + 200 + k * 160, { n: 26, seed: 60 + k, vx: 700, bias: -200, vy: 400, life: 2.4, w: 120 });
  rubble(t, 23.62, TW2.x + 220, -TW2.h, { n: 22, seed: 66, vx: 700, vy: 900, smax: 24, hot: [255, 160, 90], life: 2.5 });
  if (t > 23.6 && t < 23.76) { const f = Math.floor(t * 40); for (let i = 0; i < 8; i++) { const r = RNG(f * 5 + i), a = r.f() * TAU; bolt(MC, [MC[0] + Math.cos(a) * 700, MC[1] + Math.sin(a) * 700], f * 3 + i, { color: i % 2 ? GUREN.energy : SHIDEN.energy, width: 4, branches: 1 }); } }
  const pa = J_(SKY2.ra, 23.95, 'neck');
  flare(t, 23.95, pa[0], pa[1], { r: 140, life: 0.3, color: [255, 170, 100] });
  screenSpace();
  if (t > 23.22 && t < 23.6) speedLines(S, { n: 50, alpha: 0.4, color: '#ffffff', lmin: 500, lmax: 1600 });
  if (t > 23.6) focusLines(S, cs[0], cs[1], { alpha: 0.45, r0: 240, n: 130 });
});

/* ---------- 24.0 – 27.2 the fall along the tower ---------- */
shot(24.0, 27.2, (t, lt) => {
  const ja = SKY2.fa.at(t).J.hip, jb = SKY2.fb.at(t).J.hip;
  const mid = v2.lerp(ja, jb, 0.5);
  const cam = shaken({ x: SKY2.FX + 220, y: t < 26.4 ? mid[1] - 40 : lerp(mid[1] - 40, -300, E.in(sat(26.4, 27.2, t))), zoom: t < 26.4 ? 0.95 : lerp(0.95, 0.62, sat(26.4, 27.2, t)), rot: -0.06 }, 4);
  skyBG2(cam, { towers: true, dim: 0.34 });
  worldTowers(cam);
  // glass bursting where they hit the facade
  glass(t, 25.0, SKY2.FX, J_(SKY2.fb, 25.0, 'hip')[1] - 40, { n: 50, seed: 71, vx: 500, bias: 400, vy: 300, vyMin: -200, life: 2.2, w: 30, h: 120 });
  rubble(t, 25.0, SKY2.FX, J_(SKY2.fb, 25.0, 'hip')[1], { n: 10, seed: 72, vx: 400, bias: 300, vy: 300, smax: 14 });
  // shards falling with them all along the way
  emit(t, { rate: 26, life: 2.2, from: 24.0, to: 27.0, seed: 73 }, (ts, age, r, u) => {
    const x = SKY2.FX + r.r(20, 420), y = r.r(-2900, -1200) + age * 900 + 400 * age * age;
    S.fillStyle = `rgba(255,220,200,${0.7 * (1 - u)})`; S.save(); S.translate(x, y); S.rotate(age * 9 + r.f() * 6); S.fillRect(-5, -2, 10, 4); S.restore();
  });
  for (const tt of [24.85, 25.5, 25.75]) { const p = J_(tt === 25.5 ? SKY2.fa : SKY2.fb, tt, tt === 25.5 ? 'h1' : 'head'); flare(t, tt, p[0], p[1], { r: 90, life: 0.25, color: [255, 210, 190] }); bsparks(t, tt, p[0], p[1], { n: 24, seed: Math.round(tt * 10), vmax: 1300, spread: 360, color: [255, 180, 120] }); }
  const ph = J_(SKY2.fa, 26.32, 'neck');
  flare(t, 26.32, ph[0], ph[1], { r: 150, life: 0.3, color: [255, 160, 90] });
  if (t > 26.32) comet2(SKY2.fa, t, 1.2, { dur: 0.3, w: 40 });
  act(SKY2.fa, t, { wind: 2 }); act(SKY2.fb, t, { wind: 2 });
  screenSpace();
  speedLines(S, { angle: -Math.PI / 2 - 0.06, n: 50, alpha: 0.35, color: '#ffe8e0', lmin: 300, lmax: 1100 });
});
