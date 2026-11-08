/* main.js — public API used by the renderer (render.js) and the live preview */
'use strict';
window.FIGHT = {
  W, H, FPS,
  async ready() {
    const probes = [
      [`100px ${FONT.brush}`, '紅蓮紫電第七区炎上完決着全力一閃・vs燃える街限界突破'], [`100px ${FONT.heavy}`, '決戦紅蓮紫電VS全力限界突破居酒屋ホテルカラオケ薬局麻雀ゲーム'],
      [`100px ${FONT.title}`, 'RAI HOMURA VS FINAL 0123'], [`100px ${FONT.sub}`, 'THUNDER FLAME EPISODE'],
    ];
    for (const [f, s] of probes) await document.fonts.load(f, s);
    await document.fonts.ready;
    return true;
  },
  frame(t) {
    FS.reset(t);
    S.setTransform(1, 0, 0, 1, 0, 0); S.globalAlpha = 1; S.globalCompositeOperation = 'source-over';
    S.fillStyle = '#000'; S.fillRect(0, 0, W, H);
    GL.setTransform(1, 0, 0, 1, 0, 0); GL.globalAlpha = 1; GL.globalCompositeOperation = 'source-over';
    GL.clearRect(0, 0, GLOWC.width, GLOWC.height);
    if (typeof renderStory === 'function') renderStory(t);
    postProcess(t);
  },
  frameJPEG(i, q = 0.95) { this.frame(i / FPS); return OUT.toDataURL('image/jpeg', q); },
  /** contact sheet of several times, for quick visual checks */
  sheet(times, cols = 3, scale = 0.333, fn) {
    const rows = Math.ceil(times.length / cols);
    const w = Math.round(W * scale), h = Math.round(H * scale);
    const c = mk(w * cols, h * rows), x = c.getContext('2d');
    x.fillStyle = '#222'; x.fillRect(0, 0, c.width, c.height);
    times.forEach((t, i) => {
      if (fn) fn(t); else this.frame(t);
      x.drawImage(OUT, (i % cols) * w, Math.floor(i / cols) * h, w - 2, h - 2);
      x.fillStyle = '#ff0'; x.font = '16px Inter'; x.fillText(String(typeof t === 'number' ? t.toFixed(2) : t), (i % cols) * w + 6, Math.floor(i / cols) * h + 18);
    });
    return c.toDataURL('image/png');
  },
};

/* debug: every pose of the library on a grid (grounded, both characters) */
FIGHT.poseSheet = function (names) {
  names = names || Object.keys(POSES);
  const cols = 8, rows = Math.ceil(names.length / cols);
  const cw = 240, chh = 300;
  const c = mk(cols * cw, rows * chh);
  const x = c.getContext('2d');
  x.fillStyle = '#2a2f3a'; x.fillRect(0, 0, c.width, c.height);
  names.forEach((n, i) => {
    FS.reset(0);
    S.setTransform(1, 0, 0, 1, 0, 0); S.fillStyle = '#2a2f3a'; S.fillRect(0, 0, W, H);
    GL.setTransform(1, 0, 0, 1, 0, 0); GL.clearRect(0, 0, GLOWC.width, GLOWC.height);
    const air = POSES[n].pf && !POSES[n].pf[0] && !POSES[n].pf[1];
    const tr = new Track({ x: 0, g: !air, y: -160, pose: n });
    tr.k(0, {});
    const st = tr.at(0);
    setCam({ x: 0, y: -150, zoom: 0.8, rot: 0 });
    S.strokeStyle = '#555'; S.lineWidth = 2; S.beginPath(); S.moveTo(-400, 0); S.lineTo(400, 0); S.stroke();
    drawFighter({ ...st, eyes: 1 }, i % 2 ? HOMURA : RAI, 0.3);
    FS.post.bloom = 0; FS.post.grain = 0; FS.post.vignette = 0;
    postProcess(0);
    x.drawImage(OUT, W / 2 - cw / 2 / 0.6, H / 2 - 220 / 0.6 * 0.75 - 40, cw / 0.6, chh / 0.6, (i % cols) * cw, Math.floor(i / cols) * chh, cw, chh);
    x.fillStyle = '#ff0'; x.font = '18px Inter'; x.fillText(n, (i % cols) * cw + 8, Math.floor(i / cols) * chh + 22);
  });
  return c.toDataURL('image/png');
};

/* soundtrack → base64 16-bit WAV */
FIGHT.audio = async function () {
  const t0 = performance.now();
  const buf = await renderSoundtrack();
  const { b64, peak } = wavBase64(buf);
  return { b64, peak, ms: Math.round(performance.now() - t0) };
};
FIGHT.duration = () => DURATION;

/* interactive scrubber when index.html is opened in a normal browser */
if (!navigator.webdriver) {
  window.addEventListener('load', async () => {
    await FIGHT.ready();
    const hud = document.getElementById('hud');
    hud.innerHTML = '<button id="pp">▶</button> <input id="sl" type="range" min="0" max="' + DURATION + '" step="0.0167" value="0" style="width:60vw"> <span id="tt"></span>';
    const sl = document.getElementById('sl'), tt = document.getElementById('tt'), pp = document.getElementById('pp');
    let playing = false, last = 0;
    const show = (t) => { FIGHT.frame(t); tt.textContent = t.toFixed(2) + ' s'; };
    sl.oninput = () => show(+sl.value);
    pp.onclick = () => { playing = !playing; pp.textContent = playing ? '❚❚' : '▶'; last = performance.now(); if (playing) requestAnimationFrame(loop); };
    const loop = (now) => {
      if (!playing) return;
      let t = +sl.value + (now - last) / 1000; last = now;
      if (t >= DURATION) t = 0;
      sl.value = t; show(t);
      requestAnimationFrame(loop);
    };
    show(0);
  });
}
