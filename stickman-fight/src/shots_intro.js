/* =====================================================================
 * shots_intro.js — 0.0 → 8.0 s
 *   establishing shot · RAI close-up · HOMURA close-up · VS split screen
 * ===================================================================== */
'use strict';

/* ---------- 0.0 – 3.2  establishing shot ---------- */
(() => {
  const R = new Track({ x: -800, pose: 'stand', dir: 1 });
  R.k(0).k(2.3).k(3.2, { pose: 'standTall', aura: 0.12, e: 'inOut' });
  const Hm = new Track({ x: 800, pose: 'stand', dir: -1 });
  Hm.k(0).k(1.6).k(3.2, { aura: 0.3, pose: 'standTall', e: 'inOut' });
  ev(0.0, 'intro');
  shot(0, 3.2, (t, lt) => {
    const u = lt / 3.2;
    const cam = shaken({ x: lerp(-40, 0, E.inOut(u)), y: lerp(-340, -300, u), zoom: lerp(0.4, 0.46, E.inOut2(u)), rot: 0 });
    groundBG(cam, { moon: { x: 0, y: -255, r: 235 } });
    pillar(-1250, { h: 520, w: 120 }); pillar(1400, { h: 420, w: 100 }); pillar(-300, { h: 160, w: 70 });
    windDust(t, { rate: 50, alpha: 0.3 });
    actor(R, RAI, t, { wind: 1.1 });
    actor(Hm, HOMURA, t, { wind: 1.1 });
    embers(t, { rate: 14, life: 2.2, from: 1.2, spread: 80, rise: 140, size: 2.6, seed: 4 }, (ts, r) => [800 + r.s() * 60, -r.r(0, 260)]);
    FS.post.letterbox = 1;
    FS.post.fade = 1 - sat(0, 1.1, lt);
    screenSpace();
    const ca = window01(t, 0.8, 3.05, 0.5, 0.3);
    text(S, '荒野 ・ 午前零時', 160, 850, { font: FONT.brush, size: 48, align: 'left', alpha: ca, color: '#efe8ff' });
    text(S, 'THE WASTELAND  —  MIDNIGHT', 163, 905, { font: FONT.sub, size: 30, spacing: 8, align: 'left', alpha: ca * 0.8, color: '#bba9ec' });
  });
})();

/* ---------- 3.2 – 4.8  RAI close-up + name card ---------- */
(() => {
  const R = new Track({ x: 0, pose: 'stance', dir: 1, eyes: 0, aura: 0.25, glow: 0.45 });
  R.k(3.2).k(3.33, { eyes: 0 }).k(3.38, { eyes: 2.0, e: 'snap' }).k(3.7, { eyes: 1.1, aura: 0.55 }).k(4.8, { pm: { head: 0 }, aura: 0.7 });
  ev(3.2, 'cut');
  ev(3.37, 'eyeGlint', { who: 'rai' });
  ev(3.42, 'nameSlam', { who: 'rai' });
  shot(3.2, 4.8, (t, lt) => {
    abstractBG('#0d3170', '#01050f', { radial: true, cx: 620, cy: 520 });
    speedLines(S, { angle: -0.32, n: 46, alpha: 0.12, color: '#a5e0ff', every: 2, tmax: 3 });
    const st = R.at(t), J0 = solve(st);
    const z = lerp(5.0, 5.5, E.inOut2(lt / 1.6));
    const cam = shaken({ x: J0.head[0] + (W / 2 - 610) / z, y: J0.head[1] + (H / 2 - 600) / z, zoom: z, rot: -0.05 }, 2);
    setCam(cam);
    const { J } = actor(R, RAI, t, { wind: 1.5 });
    const ep = eyePos(J, 1, J.fwdV, J.upV);
    flare(t, 3.37, ep[0], ep[1], { r: 26, life: 0.45, color: [120, 225, 255], star: 2.2, points: 4, glow: 0.6 });
    nameCard(t, 3.42, { x: 1350, y: 450, kanji: '雷', name: 'RAI', sub: '— THE  THUNDER —', band: 'rgba(8,40,100,0.9)', stroke: '#041026', shadow: '#33bbff', subColor: '#9fdcff', from: 1 });
    FS.post.letterbox = 1;
    FS.post.flash += 0.6 * pulse(t, 3.2, 0.001, 0.06);
  });
})();

/* ---------- 4.8 – 6.4  HOMURA close-up + name card ---------- */
(() => {
  const Hm = new Track({ x: 0, pose: 'stance', dir: -1, eyes: 0, aura: 0.2, glow: 0.45 });
  Hm.k(4.8).k(4.93, { eyes: 0 }).k(4.98, { eyes: 2.0, e: 'snap' }).k(5.3, { eyes: 1.1, aura: 0.35 }).k(6.4, { aura: 0.45 });
  ev(4.8, 'cut');
  ev(4.97, 'eyeGlint', { who: 'homura' });
  ev(5.02, 'nameSlam', { who: 'homura' });
  shot(4.8, 6.4, (t, lt) => {
    abstractBG('#7a1206', '#0d0202', { radial: true, cx: 1300, cy: 520 });
    speedLines(S, { angle: 0.32, n: 46, alpha: 0.12, color: '#ffc39a', every: 2, tmax: 3 });
    const st = Hm.at(t), J0 = solve(st);
    const z = lerp(5.0, 5.5, E.inOut2(lt / 1.6));
    const cam = shaken({ x: J0.head[0] + (W / 2 - 1310) / z, y: J0.head[1] + (H / 2 - 600) / z, zoom: z, rot: 0.05 }, 2);
    setCam(cam);
    embers(t, { rate: 40, life: 1.4, spread: 120, rise: 260, size: 1.6, seed: 8 }, (ts, r) => [J0.head[0] + r.s() * 120, J0.head[1] + r.r(-20, 160)]);
    const { J } = actor(Hm, HOMURA, t, { wind: 1.5 });
    const ep = eyePos(J, 1, J.fwdV, J.upV);
    flare(t, 4.97, ep[0], ep[1], { r: 26, life: 0.45, color: [255, 140, 60], star: 2.2, points: 4, glow: 0.6 });
    nameCard(t, 5.02, { x: 570, y: 450, kanji: '焔', name: 'HOMURA', sub: '— THE  FLAME —', band: 'rgba(110,10,6,0.9)', stroke: '#200402', shadow: '#ff5a1a', subColor: '#ffb08a', from: -1 });
    FS.post.letterbox = 1;
    FS.post.flash += 0.6 * pulse(t, 4.8, 0.001, 0.06);
  });
})();

/* ---------- 6.4 – 8.0  VS split screen ---------- */
(() => {
  const R = new Track({ x: 0, pose: 'stance', dir: 1, eyes: 1, aura: 0.6, glow: 0.8 });
  R.k(6.4).k(7.2, { pm: { lean: 14 } }).k(8.0, { pose: 'stanceLow', aura: 1 });
  const Hm = new Track({ x: 0, pose: 'stance', dir: -1, eyes: 1, aura: 0.45, glow: 0.8 });
  Hm.k(6.4).k(7.2, { pm: { lean: 14 } }).k(8.0, { pose: 'stanceLow', aura: 0.7 });
  ev(6.42, 'vs');
  const clip = (ctx, pts, s) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0] * s, p[1] * s) : ctx.moveTo(p[0] * s, p[1] * s))); ctx.closePath(); ctx.clip(); };
  shot(6.4, 8.0, (t, lt) => {
    const inU = E.outExpo(sat(6.33, 6.6, t));
    const offL = (1 - inU) * -1300, offR = (1 - inU) * 1300;
    const top = W * 0.575, bot = W * 0.425;
    const z = lerp(1.75, 2.0, E.inOut2(lt / 1.6));
    // left panel — RAI
    const polyL = [[offL - 50, -20], [top + offL, -20], [bot + offL, H + 20], [offL - 50, H + 20]];
    S.save(); S.setTransform(1, 0, 0, 1, 0, 0); clip(S, polyL, 1);
    GL.save(); GL.setTransform(1, 0, 0, 1, 0, 0); clip(GL, polyL, GSCALE);
    abstractBG('#1252b8', '#020816', { radial: true, cx: 480 + offL, cy: 560 });
    focusLines(S, 480 + offL, 520, { alpha: 0.22, color: '#bfe8ff', r0: 260, n: 80 });
    const stR = R.at(t), JR = solve(stR);
    setCam(shaken({ x: JR.hip[0] - (480 + offL - W / 2) / z, y: JR.hip[1] - 40 - (560 - H / 2) / z * 0, zoom: z, rot: -0.03 }, 3));
    actor(R, RAI, t, { wind: 1.2 });
    S.restore(); GL.restore();
    // right panel — HOMURA
    const polyR = [[top + offR, -20], [W + 50 + offR, -20], [W + 50 + offR, H + 20], [bot + offR, H + 20]];
    S.save(); S.setTransform(1, 0, 0, 1, 0, 0); clip(S, polyR, 1);
    GL.save(); GL.setTransform(1, 0, 0, 1, 0, 0); clip(GL, polyR, GSCALE);
    abstractBG('#b3200c', '#140202', { radial: true, cx: 1440 + offR, cy: 560 });
    focusLines(S, 1440 + offR, 520, { alpha: 0.22, color: '#ffd0b0', r0: 260, n: 80, seed: 5 });
    const stH = Hm.at(t), JH = solve(stH);
    setCam(shaken({ x: JH.hip[0] - (1440 + offR - W / 2) / z, y: JH.hip[1] - 40, zoom: z, rot: 0.03 }, 3));
    actor(Hm, HOMURA, t, { wind: 1.2 });
    S.restore(); GL.restore();
    // split line
    screenSpace();
    if (inU > 0.6) {
      const a = [top + 30, -40], b = [bot - 30, H + 40];
      S.save(); S.lineCap = 'round';
      S.strokeStyle = '#ffffff'; S.lineWidth = 14; S.beginPath(); S.moveTo(a[0], a[1]); S.lineTo(b[0], b[1]); S.stroke();
      S.restore();
      GL.save(); GL.strokeStyle = 'rgba(255,240,220,0.9)'; GL.lineWidth = 60; GL.beginPath(); GL.moveTo(a[0], a[1]); GL.lineTo(b[0], b[1]); GL.stroke(); GL.restore();
      const f = Math.floor(t * 30);
      for (let i = 0; i < 3; i++) {
        const r = RNG(f * 11 + i), u0 = r.f(), p = v2.lerp(a, b, u0);
        bolt(p, [p[0] + r.s() * 160, p[1] + r.s() * 160], f * 5 + i, { color: i % 2 ? [255, 140, 60] : [90, 200, 255], width: 2.5, gens: 5 });
      }
    }
    // VS
    const vs = sat(6.44, 6.5, t), vsS = lerp(3.2, 1, E.outBack(sat(6.44, 6.62, t)));
    if (vs > 0) {
      const jx = noise1(t * 60, 4) * 8 * (1 - sat(6.5, 7.2, t)) + noise1(t * 40, 9) * 2;
      S.save();
      S.translate(W / 2 + jx, H / 2 + 10); S.scale(vsS, vsS); S.rotate(-0.08);
      S.font = `italic 330px ${FONT.title}`; S.textAlign = 'center'; S.textBaseline = 'middle';
      S.globalAlpha = vs;
      S.lineJoin = 'round'; S.lineWidth = 26; S.strokeStyle = '#000'; S.strokeText('VS', 0, 0);
      const g = S.createLinearGradient(0, -150, 0, 150);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.48, '#ffe9a8'); g.addColorStop(0.52, '#ff9a2a'); g.addColorStop(1, '#ffef9a');
      S.fillStyle = g; S.fillText('VS', 0, 0);
      S.restore();
      blob(GL, [255, 200, 120], W / 2, H / 2, 380, 0.4 * vs);
    }
    FS.post.letterbox = 1;
    FS.post.chroma = Math.max(FS.post.chroma, 10 * pulse(t, 6.44, 0.001, 0.15));
    FS.post.flash += 0.8 * pulse(t, 6.44, 0.001, 0.08) + 0.7 * pulse(t, 6.4, 0.001, 0.05) + sat(7.82, 8.0, t);
  });
})();
