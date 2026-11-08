/* =====================================================================
 * shots2_final.js — 40.0 → 64.0 s
 *   eyes in the smoke · blades · six sword clashes (a lamp post and a car
 *   are cut) · the iai pass 一閃 · the delayed cut: GUREN falls and the
 *   skyscraper behind him is sliced and slides off · rain · respect ·
 *   walking away · 完
 * ===================================================================== */
'use strict';

const FIN = (() => {
  const L = PC - 540, Rr = PC + 540;
  /* ---- 40.0–45.2 smoke, blades, sword clashes, final stance ---- */
  const A = new Track({ x: L, g: true, pose: 'iaiReady', dir: 1, eyes: 0, aura: 0.3, blade: 0 });
  const B = new Track({ x: Rr, g: true, pose: 'iaiReady', dir: -1, eyes: 0, aura: 0.4, blade: 0, s: GUREN.s });
  A.k(40.0).k(40.6, { eyes: 0 }).k(40.66, { eyes: 1.9, e: 'snap' }).k(41.0, { eyes: 1.1 })
    .k(41.25, { blade: 0 }).k(41.45, { blade: 1, e: 'out' }).k(41.98, { pose: 'swordGuard' });
  B.k(40.0).k(40.82, { eyes: 0 }).k(40.88, { eyes: 1.9, e: 'snap' }).k(41.2, { eyes: 1.1 })
    .k(41.65, { blade: 0 }).k(41.85, { blade: 1, e: 'out' }).k(41.98, { pose: 'swordGuard' });
  // six clashes on the beat
  const CLASH = [42.0, 42.4, 42.8, 43.2, 43.6, 44.0];
  const ax = [PC - 250, PC - 330, PC - 160, PC - 290, PC - 200, PC - 240], bx = [PC + 230, PC + 160, PC + 300, PC + 200, PC + 280, PC + 230];
  const aP = ['swordSlash', 'swordHigh', 'swordThrust', 'swordSlash', 'swordGuard', 'swordSlash'];
  const bP = ['swordHigh', 'swordSlash', 'swordGuard', 'swordHigh', 'swordSlash', 'swordThrust'];
  CLASH.forEach((tc, i) => {
    A.k(tc - 0.14, { pose: i % 2 ? 'swordHigh' : 'swordGuard', x: ax[i] - 40, run: i === 0 ? 1 : 0, e: 'inOut' })
      .k(tc, { pose: aP[i], x: ax[i], run: 0, stiff: 2.2, e: 'snap', freeze: 1 }).k(tc + 0.06, { freeze: 0, stiff: 1 });
    B.k(tc - 0.14, { pose: i % 2 ? 'swordGuard' : 'swordHigh', x: bx[i] + 40, run: i === 0 ? 1 : 0, e: 'inOut' })
      .k(tc, { pose: bP[i], x: bx[i], run: 0, stiff: 2.2, e: 'snap', freeze: 1 }).k(tc + 0.06, { freeze: 0, stiff: 1 });
  });
  A.k(44.3, { pose: 'tuck', g: false, y: -300, x: L - 60, rot: -360, e: 'out' }).k(44.55, { pose: 'iaiReady', g: true, x: L, rot: -720, e: 'in' })
    .k(45.1, { pm: { lean: 36 }, e: 'inOut' })
    .k(45.2, { pose: 'dash', pm: { a1: 40, e1: 20 }, g: false, y: -110, rot: -720, ghost: 3, e: 'snap' })
    .k(45.3, { x: Rr + 60, e: 'linear' })
    .k(45.42, { pose: 'iaiAfter', g: true, x: Rr + 60, ghost: 0, e: 'out', aura: 0.2 })
    .k(47.2, {}).k(47.6, { pose: 'standTall', blade: 0, eyes: 0.6, aura: 0, e: 'inOut' });
  B.k(44.3, { pose: 'tuck', g: false, y: -320, x: Rr + 60, rot: 360, e: 'out' }).k(44.55, { pose: 'iaiReady', g: true, x: Rr, rot: 720, e: 'in' })
    .k(45.1, { pm: { lean: 36 }, e: 'inOut' })
    .k(45.2, { pose: 'dash', pm: { a1: 40, e1: 20 }, g: false, y: -110, rot: 720, ghost: 3, e: 'snap' })
    .k(45.3, { x: L - 60, e: 'linear' })
    .k(45.42, { pose: 'iaiAfter', g: true, x: L - 60, ghost: 0, e: 'out', aura: 0.3 })
    .k(46.38, {}).k(46.4, { blade: 0, aura: 0, e: 'hold' })
    .k(46.55, { pose: 'kneel', eyes: 0.4, e: 'in' })
    .k(52.6, { pose: 'lieBack', rot: -90, eyes: 0.3 }).k(53.4, { pm: { a1: 92, e1: 4 }, eyes: 0.6, e: 'inOut' })
    .k(55.0, {}).k(55.6, { pose: 'lieBack', eyes: 0, e: 'inOut' });
  const fall = [{ t: 46.62, until: 52.3, blend: 0.4, impulse: [-120, -80], spin: -1.4, hit: 'neck' }];
  const probe = new Actor(GUREN, B, { t0: 46.0, t1: 52.4, ragdoll: fall, prewarm: 6 }).bake();
  const restX = probe.at(52.25).J.hip[0];
  for (const k of B.keys) if (k.t >= 52.6) k.x = restX;
  B.res = null;
  const a = makeActor(SHIDEN, A, { t0: 40.0, t1: 48.0 }), b = makeActor(GUREN, B, { t0: 40.0, t1: 60.8, ragdoll: fall });
  /* ---- props cut by the clashes ---- */
  const lampX = PC - 360, carX = PC + 420;
  const lampTop = bakeBody({ verts: boxVerts(16, 300, 0, -150), x: lampX, y: -150, t0: 42.42, vx: 260, vy: -300, w: 2.6, m: 1, dur: 3 });
  const carCut = { a: [-118, -70], b: [118, -30] };
  const carTop = bakeBody({ verts: boxVerts(236, 46, 0, -74), x: carX, y: 0, t0: 43.22, vx: 520, vy: -620, w: 3.4, m: 3, dur: 4 });
  const carBot = carBody0(carX);
  /* ---- the skyscraper behind GUREN is cut in half ---- */
  const T = TW1, cutL = [T.x, -1350], cutR = [T.x + T.w, -1560];
  const topPoly = [cutL, cutR, [T.x + T.w, -T.h], [T.x, -T.h]];
  const cx = (T.x + T.w / 2), cy = (-1450 - T.h) / 2;
  const local = topPoly.map((p) => [p[0] - cx, p[1] - cy]);
  const tCut = 47.0, slideDir = v2.norm(v2.sub(cutL, cutR)), acc = 520;
  const slideEnd = tCut + 1.05, sEnd = 0.5 * acc * 1.05 * 1.05;
  const fallBody = bakeBody({ verts: local, x: cx + slideDir[0] * sEnd, y: cy + slideDir[1] * sEnd, a: 0, t0: slideEnd, vx: slideDir[0] * acc * 1.05, vy: slideDir[1] * acc * 1.05, w: -0.55, m: 40, e: 0.05, mu: 0.8, dur: 4 });
  const topAt = (t) => {
    if (t < tCut) return { x: cx, y: cy, a: 0 };
    if (t < slideEnd) { const s = 0.5 * acc * (t - tCut) ** 2; return { x: cx + slideDir[0] * s, y: cy + slideDir[1] * s, a: 0 }; }
    return fallBody.at(t);
  };
  let tCrash = slideEnd + 1.2;
  for (let t = slideEnd; t < slideEnd + 3; t += 1 / 60) { const st = fallBody.at(t), c = Math.cos(st.a), s = Math.sin(st.a); if (local.some(([lx, ly]) => st.y + lx * s + ly * c > -10)) { tCrash = t; break; } }
  /* ---- events ---- */
  ev(40.0, 'smoke'); ev(40.66, 'eyeGlint', { who: 'shiden' }); ev(40.88, 'eyeGlint', { who: 'guren' });
  ev(41.25, 'bladeShiden'); ev(41.65, 'bladeGuren');
  CLASH.forEach((tc, i) => { ev(tc, 'swordClash', { k: i, shake: 26 + i * 3, flash: 0.35, impact: i === 5 ? 2 : 0, chroma: 6 }); gust(tc, PC, -260, 2600, 1200); });
  ev(42.42, 'lampCut'); ev(43.22, 'carCut');
  ev(44.6, 'heartbeat'); ev(45.0, 'heartbeat');
  ev(45.2, 'dashFinal', { shake: 10 }); ev(45.3, 'slash', { flash: 0.2 });
  ev(46.0, 'ribbonCut'); ev(46.4, 'shatter'); ev(46.6, 'kneelThud');
  ev(46.85, 'finalBlast', { shake: 52, flash: 0.8, impact: 3, chroma: 12, shakeDecay: 0.5 }); gust(46.85, L - 60, -150, 3000, 1400);
  ev(tCut, 'towerCut', { shake: 20 }); ev(tCut + 0.3, 'towerSlide', { dur: tCrash - tCut - 0.3 });
  ev(tCrash, 'towerCrash', { shake: 60, flash: 0.3, shakeDecay: 0.9 }); gust(tCrash, T.x - 400, -400, 3200, 2600);
  ev(49.6, 'rainStart'); ev(53.3, 'fistRaise'); ev(60.8, 'endCard');
  return { L, Rr, a, b, CLASH, lampX, lampTop, carX, carTop, carBot, carCut, T, cutL, cutR, topPoly, local, topAt, tCut, tCrash, fallBody };
})();

/* ---------- drawing helpers ---------- */
function slicedTower(t) {
  const F = FIN, T = F.T;
  const lower = [[T.x, 0], [T.x, F.cutL[1]], F.cutR, [T.x + T.w, 0]];
  const fill = (poly, tr) => {
    S.save();
    if (tr) { S.translate(tr.x, tr.y); S.rotate(tr.a); }
    S.beginPath(); poly.forEach((p, i) => (i ? S.lineTo(p[0], p[1]) : S.moveTo(p[0], p[1]))); S.closePath();
    S.fillStyle = '#0d0507'; S.fill();
    S.save(); S.strokeStyle = 'rgba(255,150,90,0.85)'; S.lineWidth = 7; S.lineJoin = 'round'; S.stroke(); S.restore();
    S.clip();
    const pat = winPattern(S, 'near', T.tile);
    const ox = tr ? T.x - (T.x + T.w / 2) : T.x, oy = tr ? -T.h - (-1450 - T.h) / 2 : -T.h;
    pat.setTransform(new DOMMatrix([1, 0, 0, 1, ox + T.off, oy]));
    S.fillStyle = pat; S.fillRect(-20000, -20000, 40000, 40000);
    S.restore();
  };
  if (t < F.tCut) return;
  fill(lower, null);
  fill(F.local, F.topAt(t));
  // the glowing cut line
  const k = Math.exp(-(t - F.tCut) * 1.2);
  S.save(); S.globalCompositeOperation = 'lighter'; S.strokeStyle = `rgba(230,210,255,${k})`; S.lineWidth = 6;
  S.beginPath(); S.moveTo(...F.cutL); S.lineTo(...F.cutR); S.stroke(); S.restore();
  GL.save(); GL.strokeStyle = `rgba(180,130,255,${0.9 * k})`; GL.lineWidth = 50; GL.beginPath(); GL.moveTo(...F.cutL); GL.lineTo(...F.cutR); GL.stroke(); GL.restore();
  // sparks & dust pouring from the sliding seam
  if (t < F.tCrash) emit(t, { rate: 40, life: 1.2, from: F.tCut, to: F.tCrash, seed: 501 }, (ts, age, r, u) => {
    const p = v2.lerp(F.cutL, F.cutR, r.f());
    blob(S, [90, 70, 80], p[0] + r.s() * 30, p[1] + age * 300, 40 + 120 * u, 0.4 * (1 - u), 0.3);
  });
}
function finalProps(t) {
  const F = FIN;
  // lamp post (cut at 42.42)
  S.save(); S.strokeStyle = '#0d0809'; S.lineWidth = 10; S.lineCap = 'round';
  S.beginPath(); S.moveTo(F.lampX, 0); S.lineTo(F.lampX, t < 42.42 ? -460 : -150); S.stroke();
  if (t < 42.42) { S.beginPath(); S.moveTo(F.lampX, -460); S.quadraticCurveTo(F.lampX, -500, F.lampX + 60, -500); S.stroke(); }
  S.restore();
  if (t >= 42.42) { const st = F.lampTop.at(t); S.save(); S.translate(st.x, st.y); S.rotate(st.a); S.strokeStyle = '#0d0809'; S.lineWidth = 10; S.lineCap = 'round'; S.beginPath(); S.moveTo(0, 0); S.lineTo(0, -300); S.quadraticCurveTo(0, -340, 60, -340); S.stroke(); S.restore(); }
  // car (top half cut at 43.22)
  if (t < 43.22) drawCarBody(F.carBot, t, {});
  else {
    drawCarBody(F.carBot, t, { clip: [F.carCut.a, F.carCut.b, [140, 80], [-140, 80]], fire: 0.6 });
    const st = F.carTop.at(t); S.save(); S.translate(st.x, st.y); S.rotate(st.a);
    S.beginPath(); [F.carCut.a, F.carCut.b, [140, -260], [-140, -260]].forEach((p, i) => (i ? S.lineTo(p[0], p[1]) : S.moveTo(p[0], p[1]))); S.closePath(); S.clip();
    drawCar(S, 1, {}); S.restore();
  }
}
function swordClashFX(t) {
  FIN.CLASH.forEach((tc, i) => {
    const ja = FIN.a.at(tc).J, jb = FIN.b.at(tc).J;
    const p = v2.lerp(v2.lerp(ja.h1, jb.h1, 0.5), [ (ja.h1[0] + jb.h1[0]) / 2, -300 ], 0.3);
    flare(t, tc, p[0], p[1], { r: 150, life: 0.3, color: [255, 220, 240] });
    bsparks(t, tc, p[0], p[1], { n: 40, seed: 600 + i, spread: 360, vmax: 2000, color: i % 2 ? [255, 140, 70] : [200, 150, 255], life: 0.8 });
    shockwave(t, tc, p[0], p[1], { r: 700, width: 20, life: 0.35, color: [240, 210, 255] });
    // the cutting wave flying off the clash
    const age = t - tc;
    if (age > 0 && age < 0.3) {
      const d = (i % 2 ? -1 : 1), x = p[0] + d * age * 2600;
      S.save(); S.globalCompositeOperation = 'lighter'; S.strokeStyle = `rgba(245,225,255,${1 - age / 0.3})`; S.lineWidth = 5;
      S.beginPath(); S.arc(x, p[1], 160, d > 0 ? -1.2 : Math.PI - 1.2, d > 0 ? 1.2 : Math.PI + 1.2); S.stroke(); S.restore();
    }
  });
}

/* ---------- 40.0 – 41.2 eyes in the smoke ---------- */
function smokeArena(t, cam, smokeA, o = {}) {
  cityBG(cam, { dim: 0.45, ...o });
  if (t < FIN.tCut) worldTowers(cam); else { worldTowersOnly2(cam); slicedTower(t); }
  screenSpace(); S.fillStyle = `rgba(46,36,42,${0.55 * smokeA})`; S.fillRect(0, 0, W, H); setCam(cam);
  crater(PW2.crater0, 27.2, { w: 480, seed: 31, cracks: 16, color: [200, 150, 255], cool: 0.5, dark: 0.75 });
  smokeField(t, { n: 30, x0: PC - 1700, x1: PC + 1700, y0: -700, y1: 0, smin: 160, smax: 380, alpha: 0.5 * smokeA, vx: -60 - 700 * sat(41.98, 42.4, t), seed: 21, color: [74, 62, 70] });
}
function worldTowersOnly2(cam) { worldTowers(cam, TW1); }
function eyesOnly(t, ac) { const sn = ac.at(t); if ((sn.st.eyes || 0) < 0.05) return; const J = sn.J, hf = headFrame(J); eyeShape(J, hf, ac.ch.headR * (J.s || 1), ac.ch, sn.st.eyes, J.s || 1, ac.ch.id === 'guren'); }
shot(40.0, 41.2, (t, lt) => {
  const cam = shaken({ x: PC, y: -240, zoom: lerp(0.66, 0.72, lt / 1.2), rot: 0 });
  smokeArena(t, cam, 1);
  act(FIN.a, t, { sil: 1, glow: 0, alpha: 0.35 }); act(FIN.b, t, { sil: 1, glow: 0, alpha: 0.35 });
  smokeField(t, { n: 20, x0: PC - 1700, x1: PC + 1700, y0: -500, y1: 50, smin: 200, smax: 420, alpha: 0.45, vx: -40, seed: 22, color: [78, 66, 74] });
  eyesOnly(t, FIN.a); eyesOnly(t, FIN.b);
  for (const [ac, tt] of [[FIN.a, 40.66], [FIN.b, 40.88]]) { const J = ac.at(t).J, hf = headFrame(J), ep = v2.add(J.head, v2.add(v2.mul(hf.fwd, 13), v2.mul(hf.up, 5))); flare(t, tt, ep[0], ep[1], { r: 30, life: 0.5, color: ac.ch.eyeGlow, star: 2.4, points: 4, glow: 0.5 }); }
  FS.post.fade = 0.85 * (1 - sat(40.0, 40.55, t)); FS.post.fadeColor = 'rgb(78,62,70)';
  FS.post.vignette = 0.85; FS.post.letterbox = 1;
});

/* ---------- 41.2 – 42.0 the blades ---------- */
shot(41.2, 41.98, (t, lt) => {
  const left = t < 41.6, ac = left ? FIN.a : FIN.b, J = ac.at(t).J;
  const z = lerp(2.2, 2.5, sat(left ? 41.2 : 41.6, left ? 41.6 : 41.98, t));
  const cam = shaken({ x: J.h1[0] + (left ? 140 : -140), y: J.h1[1] - 60, zoom: z, rot: left ? -0.05 : 0.05 }, 2);
  smokeArena(t, cam, 0.9);
  act(ac, t, { glow: 0.5, auraK: 0.5, fireSize: 0.6 });
  const dir = v2.norm(v2.sub(J.h1, J.e1)), t0 = left ? 41.25 : 41.65;
  sparks(t, t0, J.h1[0], J.h1[1], { n: 30, seed: left ? 5 : 6, ang: Math.atan2(dir[1], dir[0]) / DEG, spread: 60, vmax: 1200, color: ac.ch.energy, life: 0.35 });
  FS.post.letterbox = 1;
});

/* ---------- 42.0 – 45.3 sword clashes → the final stance → the dash ---------- */
shot(41.98, 45.3, (t, lt) => {
  const z = t < 44.3 ? 1.12 : lerp(0.66, 0.74, E.inOut2(sat(44.4, 45.2, t)));
  const cam = shaken({ x: PC + (t < 44.3 ? -10 : 0), y: t < 44.3 ? -250 : -235, zoom: z, rot: t < 44.3 ? 0.03 * Math.sin(t * 2) : 0 });
  smokeArena(t, cam, 1 - 0.8 * sat(41.98, 42.5, t));
  finalProps(t);
  swordClashFX(t);
  rubble(t, 42.42, FIN.lampX, -160, { n: 8, seed: 610, vx: 300, vy: 300, smax: 8 });
  bsparks(t, 42.42, FIN.lampX, -150, { n: 20, seed: 611, vmax: 900, spread: 360 });
  bsparks(t, 43.22, FIN.carX, -50, { n: 26, seed: 612, vmax: 1100, spread: 360 });
  glass(t, 43.22, FIN.carX, -70, { n: 26, seed: 613, vx: 500, bias: 300, vy: 600 });
  act(FIN.a, t, { eyeTrail: t > 45.18 ? 0.1 : 0 }); act(FIN.b, t, { eyeTrail: t > 45.18 ? 0.1 : 0 });
  windDust(t, { rate: 50, alpha: 0.3, speed: 1.6, cx: PC });
  cityEmbers(cam, { rate: 60 });
  screenSpace();
  if (t >= 45.2) { speedLines(S, { n: 70, alpha: 0.6, color: '#ffffff', lmin: 600, lmax: 2000 }); FS.post.radialBlur = 0.05; }
  FS.post.letterbox = 1 - sat(41.98, 42.3, t) + sat(44.3, 44.5, t);
});

/* ---------- 45.3 – 45.42 一閃 ---------- */
shot(45.3, 45.42, (t, lt) => {
  screenSpace(); S.fillStyle = '#000'; S.fillRect(0, 0, W, H);
  const u = sat(45.3, 45.36, t), a = [-100, H * 0.62], b = [W + 100, H * 0.38], m = v2.lerp(a, b, u);
  S.save(); S.lineCap = 'round';
  S.strokeStyle = 'rgba(175,115,255,0.95)'; S.lineWidth = 12; S.beginPath(); S.moveTo(a[0], a[1] + 7); S.lineTo(m[0], m[1] + 7); S.stroke();
  S.strokeStyle = 'rgba(255,70,50,0.95)'; S.lineWidth = 12; S.beginPath(); S.moveTo(a[0], a[1] - 7); S.lineTo(m[0], m[1] - 7); S.stroke();
  S.strokeStyle = '#fff'; S.lineWidth = 5; S.beginPath(); S.moveTo(a[0], a[1]); S.lineTo(m[0], m[1]); S.stroke(); S.restore();
  GL.save(); GL.strokeStyle = 'rgba(255,255,255,0.7)'; GL.lineWidth = 50; GL.beginPath(); GL.moveTo(a[0], a[1]); GL.lineTo(m[0], m[1]); GL.stroke(); GL.restore();
  sparks(t, 45.32, W * 0.5, H * 0.5, { n: 60, seed: 7, ang: -14, spread: 50, vmin: 1200, vmax: 3200, color: VIO, life: 0.3, gravity: 0 });
  sparks(t, 45.32, W * 0.5, H * 0.5, { n: 60, seed: 8, ang: 166, spread: 50, vmin: 1200, vmax: 3200, color: CRIM, life: 0.3, gravity: 0 });
  text(S, '一閃', W * 0.5, H * 0.8, { font: FONT.brush, size: 120, color: '#ffffff', alpha: sat(45.33, 45.36, t), spacing: 30 });
  FS.post.vignette = 0; FS.post.grain = 0.12; FS.post.letterbox = 1;
});

/* ---------- 45.42 – 49.6 the delayed cut · the tower slides off ---------- */
const CUT_PIECE2 = (t) => {
  if (t < 46.0) return;
  const J = FIN.a.at(46.0).J, age = t - 46.0;
  const anchor = [J.neck[0] - 30 - age * 130 + Math.sin(age * 3) * 25, J.neck[1] - 10 - age * 40 + age * age * 40];
  S.save(); S.fillStyle = SHIDEN.scarfDark; S.strokeStyle = SHIDEN.line; S.lineWidth = 3;
  ribbon(S, anchor, { dir: 1, vel: [-200, 0], t, s: 1, wind: 1.4, len: 110, w0: 14, w1: 6, phase: 1.7 }); S.fill(); S.stroke(); S.restore();
};
shot(45.42, 49.6, (t, lt) => {
  const far = t > 46.95;
  const cam = shaken(far
    ? { x: lerp(PC - 450, PC - 650, E.inOut(sat(46.95, 49.6, t))), y: lerp(-1200, -1300, sat(46.95, 49.6, t)), zoom: lerp(0.32, 0.28, sat(46.95, 49.6, t)), rot: 0 }
    : { x: PC, y: -205, zoom: lerp(0.7, 0.8, E.inOut2(sat(45.42, 46.95, t))), rot: 0 });
  cityBG(cam, { dim: 0.35 });
  if (t < FIN.tCut) worldTowers(cam); else { worldTowersOnly2(cam); slicedTower(t); }
  setCam(cam);
  crater(PW2.crater0, 27.2, { w: 480, seed: 31, cracks: 16, color: [200, 150, 255], cool: 0.5, dark: 0.75 });
  finalProps(t);
  windDust(t, { rate: 40, alpha: 0.28, speed: 1.4, cx: PC });
  const hx = FIN.L - 60;
  // the X burst on GUREN + fire
  if (t >= 46.85) {
    const u = sat(46.85, 47.6, t);
    blob(GL, [255, 160, 90], hx, -200, 700 * E.outExpo(u), 0.8 * (1 - u));
    flames(t, { rate: 400, life: 0.9, size: 60, rise: 500, spread: 500, seed: 31, from: 46.85, to: 47.1 }, (ts, r) => [hx + r.s() * 160, -r.f() * 260]);
  }
  shockwave(t, 46.85, hx, -4, { r: 2200, squash: 0.1, width: 40, life: 0.9, color: [255, 220, 230] });
  rubble(t, 46.85, hx, -10, { n: 26, seed: 32, vx: 1100, vy: 1500, smax: 20, hot: [255, 190, 150] });
  act(FIN.b, t, { wind: 1.2 });
  act(FIN.a, t, { wind: 1.2, cut: t >= 46.0 });
  CUT_PIECE2(t);
  // greatsword shards
  const Jh = FIN.b.at(46.38).J, bdir = v2.norm(v2.sub(Jh.h1, Jh.e1)), tip = v2.add(Jh.h1, v2.mul(bdir, 330));
  if (t >= 46.4) {
    S.save(); S.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 16; i++) {
      const r = RNG(400 + i), p0 = v2.lerp(Jh.h1, tip, r.f());
      const pp = simPart({ x: p0[0], y: p0[1], vx: r.s() * 300, vy: -r.r(100, 400), drag: 0.3, e: 0.3 }, t - 46.4);
      S.fillStyle = rgba(fireColor(0.2 + (t - 46.4)), Math.max(0, 1 - (t - 46.4) / 1.4));
      S.beginPath(); S.moveTo(pp.x, pp.y - 9); S.lineTo(pp.x + 5, pp.y); S.lineTo(pp.x, pp.y + 9); S.lineTo(pp.x - 5, pp.y); S.closePath(); S.fill();
    }
    S.restore();
    embers(t, { rate: 200, life: 1.2, spread: 160, rise: 160, size: 3, seed: 34, from: 46.4, to: 46.5 }, (ts, r) => v2.lerp(Jh.h1, tip, r.f()));
  }
  // slash mark across GUREN, then the X flash
  if (t >= 45.9 && t < 47.0) {
    const Jn = FIN.b.at(Math.min(t, 46.6)).J, a = v2.add(Jn.hip, [70, -150]), b = v2.add(Jn.hip, [-80, 30]), k = sat(45.9, 46.0, t);
    S.save(); S.globalCompositeOperation = 'lighter'; S.lineCap = 'round'; S.strokeStyle = `rgba(255,255,255,${k})`; S.lineWidth = 3 + 4 * sat(46.6, 46.85, t);
    S.beginPath(); S.moveTo(a[0], a[1]); S.lineTo(lerp(a[0], b[0], k), lerp(a[1], b[1], k)); S.stroke(); S.restore();
    GL.save(); GL.strokeStyle = 'rgba(180,130,255,0.9)'; GL.lineWidth = 30; GL.beginPath(); GL.moveTo(a[0], a[1]); GL.lineTo(b[0], b[1]); GL.stroke(); GL.restore();
  }
  if (t >= 46.85 && t < 47.25) {
    const k = 1 - sat(46.85, 47.25, t), c = v2.add(FIN.b.at(46.85).J.hip, [0, -60]);
    S.save(); S.globalCompositeOperation = 'lighter'; S.lineCap = 'round';
    for (const [dx, dy] of [[1, 0.9], [1, -0.9]]) { S.strokeStyle = `rgba(255,255,255,${k})`; S.lineWidth = 18 * k; S.beginPath(); S.moveTo(c[0] - dx * 420, c[1] - dy * 420); S.lineTo(c[0] + dx * 420, c[1] + dy * 420); S.stroke(); }
    S.restore();
  }
  // the dissolving lightning blade
  if (t >= 47.2 && t < 47.8) {
    const Jr = FIN.a.at(47.2).J, d2 = v2.norm(v2.sub(Jr.h1, Jr.e1));
    S.save(); S.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 30; i++) { const r = RNG(500 + i), age = t - 47.2, p0 = v2.add(Jr.h1, v2.mul(d2, 270 * r.f())); const x = p0[0] + r.s() * 60 * age, y = p0[1] - r.r(40, 160) * age; S.fillStyle = rgba(VIO, 1 - age / 0.6); S.fillRect(x, y, 3, 3); blob(GL, VIO, x, y, 14, (1 - age / 0.6) * 0.8); }
    S.restore();
  }
  // the tower hits the ground
  const tc = FIN.tCrash, cx = FIN.T.x - 300;
  dust(t, tc, cx, 0, { n: 50, seed: 520, size: 260, vmax: 2200, up: 700, alpha: 0.85, life: 3.5 });
  dust(t, tc + 0.05, cx, -300, { n: 30, seed: 521, size: 320, vmax: 600, upMin: 300, up: 900, alpha: 0.75, life: 3.5 });
  rubble(t, tc, cx, -40, { n: 60, seed: 522, vx: 1600, vy: 1600, smax: 46, life: 3.5 });
  glass(t, tc, cx, -200, { n: 80, seed: 523, vx: 1400, vy: 900, w: 300, life: 3 });
  shockwave(t, tc, cx, -4, { r: 4000, squash: 0.08, width: 70, life: 1.2, color: [255, 220, 200] });
  cityEmbers(cam, { rate: 60 });
  FS.post.letterbox = 1;
});

/* ---------- 49.6 – 60.8 rain, respect, walking away ---------- */
function walkPose2(ph) {
  const s = Math.sin(ph), c = Math.cos(ph);
  return { lean: 5, head: 2, a1: -22 * s, e1: 20 + 10 * c, a2: 22 * s, e2: 20 - 10 * c, l1: 26 * s, k1: -6 - 34 * Math.max(0, c), l2: -26 * s, k2: -6 - 34 * Math.max(0, -c), pf: [0, 0] };
}
const OUT2 = (() => {
  const x0 = FIN.Rr + 60;
  const A = new Track({ x: x0, g: true, pose: 'standTall', dir: 1, eyes: 0.6 });
  A.k(49.6).k(50.6, { dir: -1, e: 'hold' }).k(51.0, {});
  const xs = x0 - 3 * 80;
  for (let i = 0; i <= 12; i++) { const t = 51.0 + i * 0.125, ph = i * Math.PI / 2; A.k(t, { pose: walkPose2(ph), x: x0 - i * 20, e: 'linear' }); }
  A.k(52.7, { pose: 'standTall', x: xs }).k(53.6, {}).k(53.95, { pose: 'standTall', pm: { a1: 150, e1: 20 }, e: 'inOut' }).k(54.7, {})
    .k(55.0, { pose: 'standTall', e: 'inOut' }).k(55.4, { dir: 1, e: 'hold' });
  for (let i = 0; i <= 44; i++) { const t = 55.5 + i * 0.125, ph = i * Math.PI / 2; A.k(t, { pose: walkPose2(ph), x: xs + i * 22, e: 'linear' }); }
  const a = makeActor(SHIDEN, A, { t0: 49.6, t1: 60.9, prewarm: 0.6 });
  return { a };
})();
function rainWorld(t, cam, o = {}) {
  const d = ramp(54.0, 60.8, t), rk = ramp(49.6, 50.6, t);
  cityBG(cam, { dim: 0.32 - 0.1 * d, dawn: d * 0.8, wet: rk, smokeAlpha: 1 - d * 0.6, helis: false, ...o });
  worldTowersOnly2(cam); slicedTower(t);
  setCam(cam);
  crater(PW2.crater0, 27.2, { w: 480, seed: 31, cracks: 16, color: [200, 150, 255], cool: 0.5, dark: 0.6 });
  finalProps(t);
  // steam rising from the dying fires
  emit(t, { rate: 14 * rk, life: 3, from: 49.8, seed: 801 }, (ts, age, r, u) => blob(S, [150, 140, 150], cam.x + r.r(-1400, 1400) + age * 30, -age * 120 - 20, 60 + 140 * u, 0.22 * Math.sin(Math.PI * u), 0.2));
  return { d, rk };
}
shot(49.6, 53.0, (t, lt) => {
  const cam = shaken({ x: PC - 260, y: -330, zoom: lerp(0.5, 0.56, E.inOut2(lt / 3.4)), rot: 0 });
  const { rk } = rainWorld(t, cam);
  if (t < 49.75) bolt([PC - 1400, -3000], [PC - 1200, -900], Math.floor(t * 40), { color: [210, 200, 255], width: 6, branches: 3 });
  act(FIN.b, t, {}); act(OUT2.a, t, {});
  rain(cam, rk);
  FS.post.flash += 0.6 * pulse(t, 49.6, 0.001, 0.08);
  FS.post.letterbox = 1;
});
shot(53.0, 55.6, (t, lt) => {
  const cam = shaken({ x: (FIN.L + OUT2.a.at(53).J.hip[0]) / 2, y: -170, zoom: lerp(1.0, 1.1, E.inOut2(lt / 2.6)), rot: 0 });
  rainWorld(t, cam);
  act(FIN.b, t, {}); act(OUT2.a, t, {});
  rain(cam, 1);
  FS.post.letterbox = 1;
});
shot(55.6, 60.8, (t, lt) => {
  const u = E.inOut2(lt / 5.2);
  const cam = shaken({ x: lerp(PC, PC + 500, u), y: lerp(-200, -700, u), zoom: lerp(0.95, 0.4, u), rot: 0 });
  rainWorld(t, cam);
  act(FIN.b, t, {}); act(OUT2.a, t, {});
  rain(cam, 1 - 0.6 * sat(58, 60.8, t));
  FS.post.letterbox = 1;
  FS.post.fade = sat(60.2, 60.8, t);
});

/* ---------- 60.8 – 64.0 end card ---------- */
shot(60.8, 64.01, (t, lt) => {
  screenSpace();
  S.fillStyle = '#050407'; S.fillRect(0, 0, W, H);
  const a = sat(61.0, 61.4, t), reveal = E.out(sat(61.0, 61.5, t));
  S.save(); S.beginPath(); S.rect(0, 0, W * 0.32 + W * 0.36 * reveal, H); S.clip();
  text(S, '完', W / 2, H * 0.42, { font: FONT.brush, size: 380, color: '#f4efe6', alpha: a, shadow: 'rgba(255,255,255,0.25)', shadowBlur: 30 });
  S.restore();
  const sa = sat(61.65, 61.72, t), ss = lerp(1.6, 1, E.outBack(sat(61.65, 61.8, t)));
  if (sa > 0) {
    S.save(); S.translate(W / 2 + 190, H * 0.53); S.rotate(0.08); S.scale(ss, ss); S.globalAlpha = sa;
    S.fillStyle = '#c4141c'; S.fillRect(-46, -46, 92, 92); S.strokeStyle = '#f4efe6'; S.lineWidth = 3; S.strokeRect(-38, -38, 76, 76);
    S.font = `30px ${FONT.brush}`; S.fillStyle = '#f4efe6'; S.textAlign = 'center'; S.textBaseline = 'middle';
    S.fillText('紫電', 0, -15); S.fillText('紅蓮', 0, 19); S.restore();
  }
  const ta = sat(61.9, 62.4, t);
  text(S, 'STICKMAN  DUEL  II', W / 2, H * 0.72, { font: FONT.title, size: 64, spacing: 30, color: '#f4efe6', alpha: ta });
  text(S, '紫電  vs  紅蓮', W / 2, H * 0.8, { font: FONT.brush, size: 44, spacing: 10, color: '#c9b9c8', alpha: ta });
  FS.post.fade = sat(63.4, 64.0, t);
  FS.post.vignette = 0.4; FS.post.bloom = 0.1;
});
