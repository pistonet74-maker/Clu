'use strict';
// standalone visual tests for the v2 rig (designs, fluid motion, ragdoll, cloth)
function clearAll(bg = '#3a3440') {
  S.setTransform(1, 0, 0, 1, 0, 0); S.globalAlpha = 1; S.globalCompositeOperation = 'source-over';
  S.fillStyle = bg; S.fillRect(0, 0, W, H);
  GL.setTransform(1, 0, 0, 1, 0, 0); GL.clearRect(0, 0, GLOWC.width, GLOWC.height);
}
function groundLine(cam) { setCam(cam); S.strokeStyle = '#776d80'; S.lineWidth = 3; S.beginPath(); S.moveTo(-3000, 0); S.lineTo(3000, 0); S.stroke(); }
window.TEST = {
  sheet(names) {
    names = names || ['stand', 'stance', 'guard', 'punch', 'kick', 'highKick', 'crouch', 'dash', 'flyBack', 'charge', 'beamFire', 'iaiReady'];
    const cols = 6, cw = 320, chh = 360, rows = Math.ceil(names.length / cols) * 2;
    const c = mk(cols * cw, rows * chh), x = c.getContext('2d');
    x.fillStyle = '#2b2630'; x.fillRect(0, 0, c.width, c.height);
    let idx = 0;
    for (const ch of [SHIDEN, GUREN]) for (const n of names) {
      FS.reset(1);
      clearAll();
      const air = POSES[n].pf && !POSES[n].pf[0] && !POSES[n].pf[1];
      const tr = new Track({ x: 0, g: !air, y: -170, pose: n, dir: 1, eyes: 1, s: ch.s });
      tr.k(0).k(3);
      const a = new Actor(ch, tr, { t0: 0, t1: 2, wind: () => [-300, -20] }).bake();
      const cam = { x: 0, y: -150, zoom: 0.85, rot: 0 };
      groundLine(cam);
      drawActor(a, 1.5, {});
      FS.post.bloom = 0; FS.post.grain = 0; FS.post.vignette = 0;
      postProcess(1);
      x.drawImage(OUT, W / 2 - 200, H / 2 - 330, 400, 450, (idx % cols) * cw, Math.floor(idx / cols) * chh, cw, chh);
      x.fillStyle = '#ff0'; x.font = '18px Inter'; x.fillText(ch.id + ' · ' + n, (idx % cols) * cw + 8, Math.floor(idx / cols) * chh + 22);
      idx++;
    }
    return c.toDataURL('image/png');
  },
  // onion skin of a keyed move: fluid arcs, overshoot, foot locks
  motion(ch, build, t0, t1, n, cam) {
    const tr = build();
    const a = new Actor(ch, tr, { t0: t0 - 0.2, t1: t1 + 0.2, wind: () => [-300, -20] }).bake();
    FS.reset(t1); clearAll('#2a2530');
    groundLine(cam);
    for (let i = 0; i < n; i++) {
      const t = lerp(t0, t1, i / (n - 1));
      drawActor(a, t, { alpha: i === n - 1 ? 1 : 0.18 + 0.5 * i / n, smear: i === n - 1 });
    }
    FS.post.bloom = 0; FS.post.grain = 0; FS.post.vignette = 0;
    postProcess(t1);
    return OUT.toDataURL('image/png');
  },
};
TEST.closeup = function (pose = 'stance', zoom = 2.2, t = 1.5) {
  FS.reset(t); clearAll('#3a3440');
  const cam = { x: 0, y: -175, zoom, rot: 0 };
  groundLine(cam);
  const mk2 = (ch, x, dir) => { const tr = new Track({ x, g: true, pose, dir, eyes: 1, s: ch.s }); tr.k(0).k(3); return new Actor(ch, tr, { t0: 0, t1: 2, wind: () => [-300, -20] }).bake(); };
  const a = mk2(SHIDEN, -150, 1), b = mk2(GUREN, 150, -1);
  drawActor(a, t, {}); drawActor(b, t, {});
  FS.post.bloom = 0; FS.post.grain = 0; FS.post.vignette = 0;
  postProcess(t);
  return OUT.toDataURL('image/png');
};
TEST.punchSeq = function () {
  return TEST.motion(SHIDEN, () => {
    const tr = new Track({ x: -200, g: true, pose: 'stance', dir: 1, eyes: 1, bob: 0.6 });
    tr.k(0).k(0.5).k(0.62, { pose: 'windup', e: 'out' }).k(0.72, { pose: 'punch', e: 'snap', bob: 0 }).k(0.95, {}).k(1.2, { pose: 'stance', bob: 0.6 });
    return tr;
  }, 0.5, 1.05, 8, { x: -120, y: -170, zoom: 1.6, rot: 0 });
};
TEST.dashSeq = function () {
  return TEST.motion(GUREN, () => {
    const tr = new Track({ x: -700, g: true, pose: 'stance', dir: 1, eyes: 1, s: GUREN.s });
    tr.k(0).k(0.3, { pose: 'crouch', e: 'out' }).k(0.45, { pose: 'dash', g: false, y: -125, x: -600, e: 'snap' })
      .k(0.85, { x: 250, e: 'linear' }).k(0.95, { pose: 'stance', g: true, x: 330, e: 'out', slide: 1 }).k(1.4, { slide: 0 });
    return tr;
  }, 0.3, 1.25, 12, { x: -100, y: -190, zoom: 0.9, rot: 0 });
};
TEST.ragSeq = function () {
  const tr = new Track({ x: 0, g: true, pose: 'stance', dir: -1, eyes: 1, s: GUREN.s });
  tr.k(0).k(0.45).k(0.5, { pose: 'hitGut', e: 'snap' }).k(2.2, { pose: 'kneel', x: 420 }).k(2.8, { pose: 'stance', x: 420 });
  const a = new Actor(GUREN, tr, { t0: 0, t1: 3, wind: () => [-300, -20], ragdoll: [{ t: 0.5, until: 2.2, blend: 0.45, impulse: [1500, -950], spin: 7, hit: 'sho', boxes: [{ x0: 560, x1: 800, y0: -110, y1: 0 }] }] }).bake();
  FS.reset(3); clearAll('#2a2530');
  const cam = { x: 380, y: -200, zoom: 0.9, rot: 0 };
  groundLine(cam);
  S.fillStyle = '#555060'; S.fillRect(560, -110, 240, 110);
  const ts = [0.45, 0.6, 0.75, 0.9, 1.05, 1.25, 1.6, 2.2, 2.45, 2.8];
  ts.forEach((t, i) => drawActor(a, t, { alpha: i === ts.length - 1 ? 1 : 0.25 + 0.5 * i / ts.length, smear: false }));
  FS.post.bloom = 0; FS.post.grain = 0; FS.post.vignette = 0;
  postProcess(3);
  return OUT.toDataURL('image/png');
};
TEST.runSeq = function () {
  return TEST.motion(SHIDEN, () => {
    const tr = new Track({ x: -600, g: true, pose: 'stance', dir: 1, eyes: 1 });
    tr.k(0).k(0.2, { run: 1, x: -560 }).k(1.0, { x: 300, e: 'linear' }).k(1.1, { run: 0, x: 360, slide: 1, pose: 'stance', e: 'out' });
    return tr;
  }, 0.25, 0.95, 9, { x: -150, y: -190, zoom: 0.95, rot: 0 });
};
TEST.city = function (camo, t = 5) {
  FS.reset(t); clearAll('#000');
  const cam = camo || { x: 0, y: -260, zoom: 0.8, rot: 0 };
  const t0 = performance.now();
  cityBG(cam, { blasts: [{ t: t - 0.3, x: -300, y: -500, p: 0.3, size: 1.2 }] });
  const mk2 = (ch, x, dir) => { const tr = new Track({ x, g: true, pose: 'stance', dir, eyes: 1, s: ch.s, bob: 0.6 }); tr.k(0).k(9); return new Actor(ch, tr, { t0: t - 1, t1: t + 0.1 }).bake(); };
  drawActor(mk2(SHIDEN, -260, 1), t, {}); drawActor(mk2(GUREN, 260, -1), t, {});
  cityEmbers(cam);
  foreground();
  postProcess(t);
  console.log('city frame ms', (performance.now() - t0).toFixed(1));
  return OUT.toDataURL('image/png');
};
