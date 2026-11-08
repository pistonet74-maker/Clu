/* =====================================================================
 * city.js — the burning city: smoky sky, red moon, three parallax
 * skylines with lit / burning windows and neon signs, smoke plumes,
 * helicopters with searchlights, distant explosions, the street with
 * lamps, burning wrecks, puddles, embers and ash. Rain for the ending.
 * ===================================================================== */
'use strict';

const CPAL = {
  top: [7, 3, 6], upper: [30, 9, 12], mid: [86, 22, 15], low: [168, 58, 22], hor: [236, 108, 40],
  far: [52, 20, 20], farHaze: [150, 60, 34], mid2: [27, 10, 12], near: [15, 6, 8],
  road: [20, 15, 17], walk: [50, 37, 39], line: [176, 166, 152], yellow: [206, 160, 64],
};

/* ---------- window patterns ---------- */
const WIN = (() => {
  const make = (seed, cw, chh, ww, wh, lit, fire) => {
    const cols = 4, rows = 6, c = mk(cw * cols, chh * rows), x = c.getContext('2d'), r = RNG(seed);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const v = r.f();
      let col = 'rgb(10,5,6)';
      if (v < fire) col = r.chance(0.5) ? 'rgb(255,96,34)' : 'rgb(255,140,50)';
      else if (v < fire + lit) col = r.chance(0.6) ? 'rgb(255,178,92)' : 'rgb(206,120,60)';
      else if (v < fire + lit + 0.22) col = 'rgb(40,16,15)';
      x.fillStyle = col; x.fillRect(i * cw + (cw - ww) / 2, j * chh + (chh - wh) / 2, ww, wh);
    }
    return c;
  };
  const sets = {};
  sets.far = [0, 1, 2, 3, 4].map((k) => make(100 + k, 9, 13, 5, 7, 0.1, 0.05));
  sets.mid = [0, 1, 2, 3, 4].map((k) => make(200 + k, 16, 22, 9, 12, 0.07, 0.08));
  sets.near = [0, 1, 2, 3, 4].map((k) => make(300 + k, 30, 40, 17, 23, 0.05, 0.1));
  return sets;
})();
const _pat = new Map();
function winPattern(ctx, layer, k) {
  const key = layer + k + (ctx === GL ? 'g' : 's');
  if (!_pat.has(key)) _pat.set(key, ctx.createPattern(WIN[layer][k], 'repeat'));
  return _pat.get(key);
}

/* ---------- skylines ---------- */
function genSkyline(seed, x0, x1, o) {
  const r = RNG(seed), out = [];
  let x = x0;
  while (x < x1) {
    const w = r.r(o.wmin, o.wmax), h = r.r(o.hmin, o.hmax) * (r.chance(0.12) ? 1.45 : 1);
    const b = { x, w, h, tile: r.i(5), off: r.i(40), top: r.pick(['flat', 'flat', 'flat', 'step', 'antenna', 'broken', 'spire']), seed: r.i(9999), fires: [], plume: false, neon: null };
    const nf = r.chance(o.burn) ? 1 + r.i(o.maxFires) : 0;
    if (r.chance(o.brokenP || 0.2)) b.top = 'broken';
    for (let k = 0; k < nf; k++) b.fires.push([r.r(0.15, 0.85), r.r(0.1, 0.85), r.r(0.6, 1.4)]);
    b.plume = nf > 0 && r.chance(0.75);
    if (o.neon && r.chance(0.3)) b.neon = { text: r.pick(['居酒屋', 'ホテル', 'カラオケ', '薬局', '麻雀', 'ゲーム']), col: r.pick([[60, 255, 210], [255, 230, 90], [120, 255, 120], [90, 200, 255]]), y: r.r(0.25, 0.55), broken: r.chance(0.4) };
    out.push(b);
    x += w + r.r(o.gmin, o.gmax);
  }
  return out;
}
const SKY_FAR = genSkyline(11, -3600, 3600, { wmin: 70, wmax: 170, hmin: 180, hmax: 560, gmin: 4, gmax: 40, burn: 0.45, maxFires: 2, brokenP: 0.25 });
const SKY_MID = genSkyline(22, -4600, 4600, { wmin: 130, wmax: 280, hmin: 280, hmax: 780, gmin: 40, gmax: 160, burn: 0.6, maxFires: 4, brokenP: 0.3 });
const SKY_NEAR = genSkyline(33, -6200, 6200, { wmin: 280, wmax: 480, hmin: 380, hmax: 820, gmin: 260, gmax: 640, burn: 0.7, maxFires: 5, neon: true, brokenP: 0.35 });

const UNIT_GRAD = (() => { const c = mk(4, 256), x = c.getContext('2d'); const g = x.createLinearGradient(0, 256, 0, 0); g.addColorStop(0, 'rgba(255,110,40,0.55)'); g.addColorStop(0.35, 'rgba(255,90,30,0.12)'); g.addColorStop(1, 'rgba(255,90,30,0)'); x.fillStyle = g; x.fillRect(0, 0, 4, 256); return c; })();

function buildingPath(ctx, b, bottom = 900) {
  const x = b.x, w = b.w, h = b.h, r = RNG(b.seed);
  ctx.beginPath();
  ctx.moveTo(x, bottom);
  ctx.lineTo(x, -h);
  if (b.top === 'step') { ctx.lineTo(x + w * 0.2, -h); ctx.lineTo(x + w * 0.2, -h - h * 0.08); ctx.lineTo(x + w * 0.8, -h - h * 0.08); ctx.lineTo(x + w * 0.8, -h); }
  else if (b.top === 'broken') { for (let k = 1; k < 7; k++) ctx.lineTo(x + w * k / 7, -h + (k % 2 ? r.r(10, 70) : -r.r(0, 30))); }
  else if (b.top === 'spire') { ctx.lineTo(x + w * 0.42, -h); ctx.lineTo(x + w * 0.5, -h - h * 0.22); ctx.lineTo(x + w * 0.58, -h); }
  ctx.lineTo(x + w, -h);
  ctx.lineTo(x + w, bottom);
  ctx.closePath();
}
function drawSkyline(cam, list, p, layerName, col, o = {}) {
  const t = FS.t;
  layer(cam, p, (ctx, c) => {
    const half = (W / 2 + 200) / c.zoom;
    const x0 = c.x - half, x1 = c.x + half;
    for (const b of list) {
      if (b.x + b.w < x0 || b.x > x1) continue;
      ctx.fillStyle = rgba(col, 1);
      buildingPath(ctx, b); ctx.fill();
      // windows
      const pat = winPattern(ctx, layerName, b.tile);
      pat.setTransform(new DOMMatrix([1, 0, 0, 1, b.x + b.off, -b.h]));
      const topPad = b.top === 'broken' ? 80 : 16;
      ctx.fillStyle = pat; ctx.globalAlpha = o.winAlpha ?? 1;
      ctx.fillRect(b.x + b.w * 0.07, -b.h + topPad, b.w * 0.86, b.h - topPad + 60);
      ctx.globalAlpha = 1;
      // fire light from the streets below
      ctx.drawImage(UNIT_GRAD, b.x, -b.h * 0.9, b.w, b.h * 0.9 + 20);
      if (b.top === 'antenna') {
        ctx.strokeStyle = rgba(col, 1); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(b.x + b.w * 0.5, -b.h); ctx.lineTo(b.x + b.w * 0.5, -b.h - 90); ctx.stroke();
        if (Math.sin(t * 5 + b.seed) > 0.2) blob(ctx, [255, 40, 40], b.x + b.w * 0.5, -b.h - 92, 9, 1);
      }
      if (b.neon && o.neon) neonSign(ctx, b, t);
      for (const [fx, fy, fs] of b.fires) {
        const px = b.x + b.w * fx, py = -b.h * (1 - fy);
        const fl = 0.7 + 0.3 * noise1(t * 6 + fx * 50, b.seed);
        const sz = (o.fireSize || 40) * fs * fl;
        ctx.save();
        ctx.fillStyle = '#060203'; ctx.fillRect(px - sz * 0.7, py - sz * 0.2, sz * 1.4, sz * 0.9);
        ctx.globalCompositeOperation = 'lighter';
        blob(ctx, [255, 110, 30], px, py, sz * 1.5, 0.22 * fl);
        for (let k = 0; k < 6; k++) {
          const ph = (t * 1.5 + k / 6 + fx) % 1;
          blob(ctx, fireColor(ph * 0.9), px + (k - 2.5) * sz * 0.22 + noise1(t * 3 + k, b.seed + k) * sz * 0.3, py - ph * sz * 2.2, sz * (1 - ph * 0.55) * 0.75, (1 - ph) * 0.75, 0.3);
        }
        ctx.restore();
      }
    }
  });
  // emissive pass for burning windows (bloom)
  layer(cam, p, (ctx, c) => {
    const half = (W / 2 + 200) / c.zoom;
    for (const b of list) {
      if (b.x + b.w < c.x - half || b.x > c.x + half) continue;
      for (const [fx, fy, fs] of b.fires) blob(ctx, [255, 110, 30], b.x + b.w * fx, -b.h * (1 - fy), (o.fireSize || 40) * fs * 1.8, 0.22);
    }
  }, GL);
}
function neonSign(ctx, b, t) {
  const n = b.neon, on = !n.broken || noise1(t * 9, b.seed) > -0.2;
  const x = b.x + b.w * 0.82, y = -b.h * (1 - n.y);
  const chars = [...n.text], sz = Math.min(64, b.w * 0.16);
  ctx.save();
  ctx.fillStyle = '#0b0507'; ctx.fillRect(x - sz * 0.62, y - sz * 0.6, sz * 1.24, sz * chars.length * 1.05 + sz * 0.2);
  ctx.font = `${sz}px ${FONT.heavy}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  chars.forEach((ch, i) => {
    const yy = y + i * sz * 1.05;
    ctx.fillStyle = on ? rgba(mixc(n.col, [255, 255, 255], 0.45), 1) : rgba(mixc(n.col, [0, 0, 0], 0.75), 1);
    ctx.fillText(ch, x, yy);
    if (on) { ctx.globalCompositeOperation = 'lighter'; blob(ctx, n.col, x, yy, sz * 1.1, 0.35); ctx.globalCompositeOperation = 'source-over'; }
  });
  ctx.restore();
}

/* ---------- sky: gradient, red moon, smoke masses, helicopters ---------- */
const SMOKE_SPR = (() => {
  const make = (seed) => {
    const c = mk(900, 360), x = c.getContext('2d'), r = RNG(seed);
    x.filter = 'blur(14px)';
    for (let i = 0; i < 46; i++) {
      const u = r.f(), px = 900 * (0.08 + 0.84 * u), py = 360 * (0.6 - 0.32 * Math.sin(Math.PI * u) * r.r(0.4, 1)) + r.s() * 14;
      const rr = r.r(45, 120);
      const g = x.createRadialGradient(px, py + rr * 0.5, 0, px, py, rr);
      g.addColorStop(0, 'rgba(150,62,30,0.55)'); g.addColorStop(0.45, 'rgba(46,24,24,0.6)'); g.addColorStop(1, 'rgba(30,16,18,0)');
      x.fillStyle = g; x.beginPath(); x.ellipse(px, py, rr * 1.3, rr, 0, 0, TAU); x.fill();
    }
    x.filter = 'none';
    return c;
  };
  return [0, 1, 2, 3].map((k) => make(60 + k));
})();
function citySky(cam, o = {}) {
  const t = FS.t, k = o.dawn || 0;
  const horY = camToScreen({ ...cam, x: cam.x * 0.08, y: cam.y * 0.08, zoom: 1 + (cam.zoom - 1) * 0.08 }, [0, 0])[1];
  S.save(); S.setTransform(1, 0, 0, 1, 0, 0);
  S.translate(W / 2, H / 2); S.rotate(cam.rot || 0); S.translate(-W / 2, -H / 2);
  const g = S.createLinearGradient(0, horY - 1500, 0, horY + 60);
  const C = (a, b) => rgba(mixc(a, b, k), 1);
  g.addColorStop(0, C(CPAL.top, [40, 46, 70])); g.addColorStop(0.35, C(CPAL.upper, [70, 70, 96]));
  g.addColorStop(0.7, C(CPAL.mid, [120, 96, 110])); g.addColorStop(0.9, C(CPAL.low, [200, 150, 130])); g.addColorStop(1, C(CPAL.hor, [255, 214, 170]));
  S.fillStyle = g; S.fillRect(-800, -800, W + 1600, H + 1600);
  S.restore();
  // blood moon
  if (o.moon !== false) {
    const m = o.moon || {};
    layer(cam, 0.03, (ctx) => {
      const mx = m.x ?? 300, my = m.y ?? -430, R = m.r ?? 210, a = (m.alpha ?? 1) * (1 - k);
      const gl = ctx.createRadialGradient(mx, my, R * 0.8, mx, my, R * 3);
      gl.addColorStop(0, `rgba(255,90,50,${0.35 * a})`); gl.addColorStop(1, 'rgba(255,90,50,0)');
      ctx.fillStyle = gl; ctx.fillRect(mx - R * 3, my - R * 3, R * 6, R * 6);
      const g2 = ctx.createRadialGradient(mx - R * 0.3, my - R * 0.3, R * 0.1, mx, my, R);
      g2.addColorStop(0, `rgba(255,170,120,${a})`); g2.addColorStop(1, `rgba(196,60,40,${a})`);
      ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(mx, my, R, 0, TAU); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(mx, my, R, 0, TAU); ctx.clip();
      const r = RNG(12);
      for (let i = 0; i < 14; i++) { const an = r.f() * TAU, d = Math.sqrt(r.f()) * R * 0.85; blob(ctx, [120, 30, 26], mx + Math.cos(an) * d, my + Math.sin(an) * d, r.r(0.06, 0.2) * R, 0.35 * a, 0.4); }
      ctx.restore();
    });
  }
  // drifting smoke masses (two depths) — optional hole blown by shockwaves
  const drawSmoke = (ctx) => {
    for (const [p, y0, sc, n, spd, al] of [[0.05, -820, 1.5, 8, 9, 0.85], [0.12, -560, 1.9, 7, 18, 0.8]]) {
      layer(cam, p, (c) => {
        for (let i = 0; i < n; i++) {
          const img = SMOKE_SPR[i % 4], span = 6000;
          const x = ((i * 977 + t * spd * (o.smokeSpeed || 1)) % span) - span / 2;
          c.globalAlpha = al * (o.smokeAlpha ?? 1) * (1 - k * 0.5);
          c.drawImage(img, x, y0 + Math.sin(i * 2.1) * 140, img.width * sc, img.height * sc);
        }
        c.globalAlpha = 1;
      }, ctx);
    }
  };
  if (o.hole && o.hole.r > 1) {
    TX.setTransform(1, 0, 0, 1, 0, 0); TX.clearRect(0, 0, W, H); drawSmoke(TX);
    TX.setTransform(1, 0, 0, 1, 0, 0); TX.globalCompositeOperation = 'destination-out';
    const gh = TX.createRadialGradient(o.hole.x, o.hole.y, o.hole.r * 0.5, o.hole.x, o.hole.y, o.hole.r);
    gh.addColorStop(0, 'rgba(0,0,0,1)'); gh.addColorStop(1, 'rgba(0,0,0,0)'); TX.fillStyle = gh; TX.fillRect(0, 0, W, H);
    TX.globalCompositeOperation = 'source-over';
    S.save(); S.setTransform(1, 0, 0, 1, 0, 0); S.drawImage(TMP, 0, 0); S.restore();
  } else drawSmoke(S);
  if (o.helis !== false) helicopters(cam, t, k);
}
function helicopters(cam, t, dawn) {
  for (const [i, x0, y, spd] of [[0, -1600, -600, 55], [1, 1500, -720, -40]]) {
    layer(cam, 0.16, (ctx) => {
      const x = x0 + t * spd, d = Math.sign(spd);
      // searchlight sweeping the smoke
      const ang = Math.PI / 2 + 0.35 * Math.sin(t * 0.6 + i * 2);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const L = 900, sp = 0.09;
      const g = ctx.createLinearGradient(x, y, x + Math.cos(ang) * L, y + Math.sin(ang) * L);
      g.addColorStop(0, `rgba(255,240,210,${0.32 * (1 - dawn)})`); g.addColorStop(1, 'rgba(255,240,210,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y + 6);
      ctx.lineTo(x + Math.cos(ang - sp) * L, y + Math.sin(ang - sp) * L); ctx.lineTo(x + Math.cos(ang + sp) * L, y + Math.sin(ang + sp) * L); ctx.closePath(); ctx.fill();
      ctx.restore();
      // body
      ctx.save(); ctx.translate(x, y); ctx.scale(d, 1);
      ctx.fillStyle = '#0b0507';
      ctx.beginPath(); ctx.ellipse(0, 0, 26, 10, 0, 0, TAU); ctx.fill();
      ctx.fillRect(-58, -3, 40, 5); ctx.fillRect(-60, -10, 5, 12);
      const rw = 46 * Math.abs(Math.sin(t * 40));
      ctx.fillRect(-rw, -14, rw * 2, 2.5);
      ctx.restore();
      if (Math.sin(t * 6 + i) > 0.6) blob(ctx, [255, 40, 40], x - d * 56, y - 6, 8, 1);
    });
  }
}

/* ---------- smoke plumes rising from burning buildings ---------- */
function plumes(cam, list, p, scale = 1) {
  const t = FS.t;
  layer(cam, p, (ctx, c) => {
    const half = (W / 2 + 600) / c.zoom;
    for (const b of list) {
      if (!b.plume || b.x + b.w < c.x - half || b.x > c.x + half) continue;
      const bx = b.x + b.w * 0.5, by = -b.h - 10;
      for (let k = 0; k < 9; k++) {
        const ph = (t * 0.12 + k / 9 + (b.seed % 7) * 0.13) % 1;
        const yy = by - ph * 1100 * scale, xx = bx - ph * ph * 420 * scale + Math.sin(ph * 6 + b.seed) * 30;
        const sz = (60 + ph * 260) * scale;
        blob(ctx, mixc([40, 22, 22], [24, 14, 16], ph), xx, yy, sz, 0.55 * (1 - ph) * Math.min(1, ph * 6), 0.2);
        if (ph < 0.25) { ctx.globalCompositeOperation = 'lighter'; blob(ctx, [255, 100, 30], xx, yy + sz * 0.3, sz * 0.6, 0.1 * (1 - ph * 4), 0.2); ctx.globalCompositeOperation = 'source-over'; }
      }
    }
  });
}

/* ---------- distant explosion in a skyline layer ---------- */
function farBlast(cam, t0, x, y, p, size = 1) {
  const t = FS.t, age = t - t0;
  if (age < 0 || age > 3) return;
  layer(cam, p, (ctx) => {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const k = Math.exp(-age * 3), R = 120 * size * (0.4 + E.outExpo(Math.min(1, age * 2)));
    blob(ctx, [255, 230, 170], x, y, R * 1.2, k);
    blob(ctx, [255, 120, 40], x, y, R * 2.6, k * 0.8);
    ctx.restore();
    for (let i = 0; i < 6; i++) {
      const r = RNG(Math.floor(t0 * 100) + i), a = -Math.PI / 2 + r.s() * 1.2, d = age * r.r(150, 320) * size;
      blob(ctx, [44, 24, 22], x + Math.cos(a) * d, y + Math.sin(a) * d - age * 40, (40 + age * 60) * size, 0.6 * (1 - age / 3), 0.2);
    }
  });
  layer(cam, p, (ctx) => blob(ctx, [255, 140, 50], x, y, 300 * size, Math.exp(-age * 2.5) * 0.9), GL);
}

/* ---------- the street ---------- */
const LAMPS = [-2600, -1700, -800, 100, 1000, 1900, 2800].map((x, i) => ({ x, bent: i === 2 ? 0.5 : i === 5 ? -0.35 : 0, broken: i % 3 === 1 }));
const WRECKS = [{ x: -2200, s: 1, fire: true }, { x: 2350, s: 1.1, fire: true, flip: true }, { x: -3300, s: 0.9, fire: false }, { x: 3400, s: 1, fire: true }];
function carShape(ctx, s = 1, cut = null) {
  ctx.beginPath();
  ctx.moveTo(-118 * s, -18 * s); ctx.lineTo(-112 * s, -52 * s); ctx.lineTo(-62 * s, -60 * s); ctx.lineTo(-34 * s, -96 * s);
  ctx.lineTo(44 * s, -96 * s); ctx.lineTo(74 * s, -60 * s); ctx.lineTo(116 * s, -54 * s); ctx.lineTo(120 * s, -18 * s); ctx.closePath();
}
function drawCar(ctx, s = 1, o = {}) {
  const burnt = o.burnt ?? true;
  ctx.save();
  ctx.lineJoin = 'round';
  carShape(ctx, s); ctx.fillStyle = burnt ? '#1c1214' : (o.color || '#2a3550'); ctx.fill();
  ctx.lineWidth = 3 * s; ctx.strokeStyle = '#060304'; ctx.stroke();
  // windows (fire-lit)
  ctx.fillStyle = burnt ? 'rgba(255,120,50,0.35)' : 'rgba(120,150,200,0.5)';
  ctx.beginPath(); ctx.moveTo(-54 * s, -62 * s); ctx.lineTo(-30 * s, -90 * s); ctx.lineTo(2 * s, -90 * s); ctx.lineTo(2 * s, -62 * s); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(8 * s, -62 * s); ctx.lineTo(8 * s, -90 * s); ctx.lineTo(40 * s, -90 * s); ctx.lineTo(64 * s, -62 * s); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,140,80,0.25)'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(-110 * s, -40 * s); ctx.lineTo(112 * s, -40 * s); ctx.stroke();
  // wheels
  for (const wx of [-72, 72]) { ctx.fillStyle = '#050304'; ctx.beginPath(); ctx.arc(wx * s, -18 * s, 21 * s, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a2224'; ctx.beginPath(); ctx.arc(wx * s, -18 * s, 9 * s, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function carFire(ctx, x, y, s, t, seed, k = 1) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 7; i++) {
    const ph = (t * 1.4 + i / 7 + seed * 0.13) % 1;
    const xx = x + (i - 3) * 22 * s + noise1(t * 3 + i, seed) * 10, yy = y - 70 * s - ph * 150 * s * k;
    blob(ctx, fireColor(ph), xx, yy, 46 * s * (1 - ph * 0.6) * k, (1 - ph) * 0.75, 0.3);
  }
  ctx.restore();
  blob(GL, [255, 110, 30], x, y - 90 * s, 220 * s * k, 0.6);
}
function baseFires(cam, p) {
  const t = FS.t;
  layer(cam, p, (ctx, c) => {
    const half = (W / 2 + 300) / c.zoom;
    for (let i = 0; i < 40; i++) {
      const r = RNG(500 + i), x = -6000 + i * 310 + r.r(-90, 90);
      if (x < c.x - half || x > c.x + half || r.f() < 0.35) continue;
      // rubble mound
      ctx.fillStyle = '#0c0506'; ctx.beginPath(); ctx.moveTo(x - 160, 40);
      for (let k = 0; k <= 8; k++) ctx.lineTo(x - 160 + k * 40, 20 - Math.sin(k / 8 * Math.PI) * r.r(40, 110) - r.r(0, 25));
      ctx.lineTo(x + 160, 40); ctx.fill();
      // flames licking up from it
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 7; k++) {
        const ph = (t * 1.3 + k / 7 + r.f()) % 1, fx = x - 110 + k * 36 + noise1(t * 2 + k, i) * 14;
        blob(ctx, fireColor(ph), fx, -30 - ph * 210, 62 * (1 - ph * 0.6), (1 - ph) * 0.45, 0.3);
      }
      ctx.restore();
      blob(GL, [255, 110, 30], x, -80, 300, 0.3);
    }
  });
}
function cityStreet(cam, o = {}) {
  const t = FS.t, k = o.dawn || 0, wet = o.wet || 0;
  layer(cam, 1, (ctx, c) => {
    const x0 = c.x - (W / 2 + 400) / c.zoom - 300, x1 = c.x + (W / 2 + 400) / c.zoom + 300;
    // sidewalk + curb + road
    ctx.fillStyle = rgba(mixc(CPAL.walk, [70, 60, 66], k), 1); ctx.fillRect(x0, 0, x1 - x0, 16);
    ctx.fillStyle = '#0b0607'; ctx.fillRect(x0, 16, x1 - x0, 5);
    const g = ctx.createLinearGradient(0, 21, 0, 700);
    g.addColorStop(0, rgba(mixc(CPAL.road, [34, 28, 32], k), 1)); g.addColorStop(1, rgba(mixc(CPAL.road, [0, 0, 0], 0.6), 1));
    ctx.fillStyle = g; ctx.fillRect(x0, 21, x1 - x0, 3000);
    ctx.fillStyle = rgba([255, 140, 60], 0.14 * (1 - k)); ctx.fillRect(x0, -1, x1 - x0, 3);
    // lane markings
    ctx.fillStyle = rgba(CPAL.line, 0.55);
    for (let x = Math.floor(x0 / 220) * 220; x < x1; x += 220) ctx.fillRect(x, 92, 120, 6);
    ctx.fillStyle = rgba(CPAL.yellow, 0.6);
    ctx.fillRect(x0, 200, x1 - x0, 5); ctx.fillRect(x0, 210, x1 - x0, 5);
    // cracks + debris
    const r = RNG(7);
    ctx.strokeStyle = 'rgba(5,3,4,0.8)'; ctx.lineWidth = 2;
    for (let i = 0; i < 70; i++) {
      const cx = r.r(-5000, 5000), cy = r.r(30, 380), L = r.r(30, 160);
      if (cx < x0 || cx > x1) continue;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + L * 0.5, cy + r.s() * 14); ctx.lineTo(cx + L, cy + r.s() * 20); ctx.stroke();
    }
    for (let i = 0; i < 120; i++) {
      const dx = r.r(-5000, 5000), dy = r.r(-2, 300), sz = r.r(3, 12);
      if (dx < x0 || dx > x1) continue;
      rockShape(ctx, dx, dy, sz, r.f() * 6, i); ctx.fillStyle = '#251b1e'; ctx.fill();
    }
    // puddles reflecting the fires (bigger when wet)
    for (let i = 0; i < 14; i++) {
      const px = -4200 + i * 640 + r.r(-120, 120), py = r.r(60, 300), pw = r.r(90, 240) * (1 + wet), ph = pw * 0.12;
      if (px + pw < x0 || px - pw > x1) continue;
      ctx.fillStyle = 'rgba(8,5,8,0.7)'; ctx.beginPath(); ctx.ellipse(px, py, pw, ph, 0, 0, TAU); ctx.fill();
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(255,${120 + 40 * Math.sin(t * 7 + i)},50,${0.18 + 0.1 * wet})`;
      ctx.beginPath(); ctx.ellipse(px + Math.sin(t * 2 + i) * 6, py, pw * 0.6, ph * 0.4, 0, 0, TAU); ctx.fill(); ctx.restore();
    }
    // street lamps (behind the fighters)
    for (const L of LAMPS) {
      if (L.x < x0 - 300 || L.x > x1 + 300) continue;
      ctx.save(); ctx.translate(L.x, 0); ctx.rotate(L.bent * 0.6);
      ctx.strokeStyle = '#0d0809'; ctx.lineWidth = 9; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -420); ctx.quadraticCurveTo(0, -470, 60, -470); ctx.lineTo(90, -466); ctx.stroke();
      ctx.fillStyle = '#0d0809'; ctx.fillRect(70, -474, 50, 14);
      const on = !L.broken || noise1(t * 11, L.x) > 0.1;
      if (on) { ctx.globalCompositeOperation = 'lighter'; blob(ctx, [255, 210, 150], 95, -458, 26, 0.9); ctx.globalCompositeOperation = 'source-over'; }
      ctx.restore();
    }
    // background wrecks
    for (const w of WRECKS) {
      if (w.x < x0 - 300 || w.x > x1 + 300) continue;
      ctx.save(); ctx.translate(w.x, 0); if (w.flip) { ctx.translate(0, -60); ctx.rotate(Math.PI); ctx.translate(0, 60); }
      drawCar(ctx, w.s); ctx.restore();
      if (w.fire) carFire(ctx, w.x, 0, w.s, t, w.x);
    }
  });
}

/* ---------- embers & ash (world space, wide area) ---------- */
function cityEmbers(cam, o = {}) {
  const t = FS.t;
  setCam(cam);
  S.save(); S.globalCompositeOperation = 'lighter';
  emit(t, { rate: o.rate || 90, life: 3.2, seed: 61 }, (ts, age, r, u) => {
    const x = cam.x + r.r(-2400, 2400) / cam.zoom + noise1(age * 0.8 + r.f() * 9, 3) * 60 - age * 120;
    const y = cam.y + r.r(-200, 1400) / cam.zoom - age * r.r(80, 240);
    const flick = 0.55 + 0.45 * Math.sin(age * 22 + r.f() * 30);
    const sz = r.r(1.5, 4.2) / Math.sqrt(cam.zoom) * 1.4;
    S.fillStyle = rgba(fireColor(0.25 + u * 0.6), (1 - u) * flick);
    S.fillRect(x, y, sz, sz);
    if (r.f() < 0.25) blob(GL, [255, 120, 40], x, y, sz * 6, (1 - u) * 0.6);
  });
  S.restore();
  // ash flakes
  emit(t, { rate: o.ash ?? 40, life: 4, seed: 62 }, (ts, age, r, u) => {
    const x = cam.x + r.r(-2400, 2400) / cam.zoom + Math.sin(age * 2 + r.f() * 9) * 30 - age * 90;
    const y = cam.y - 900 / cam.zoom + age * r.r(60, 160);
    S.fillStyle = `rgba(120,108,110,${0.5 * Math.sin(Math.PI * u)})`;
    S.fillRect(x, y, 3 / cam.zoom * 1.5, 2 / cam.zoom * 1.5);
  });
}
/* screen-space foreground smoke & big bokeh embers for depth */
function foreground(o = {}) {
  const t = FS.t;
  screenSpace();
  smokeField(t, { n: 8, x0: -400, x1: W + 400, y0: H * 0.55, y1: H + 120, smin: 160, smax: 340, alpha: (o.smoke ?? 0.22), vx: -50, seed: 71, color: [40, 26, 26] });
  S.save(); S.globalCompositeOperation = 'lighter';
  emit(t, { rate: 3, life: 2.5, seed: 72 }, (ts, age, r, u) => {
    const x = r.r(-100, W + 100) - age * r.r(200, 420), y = r.r(H * 0.3, H) - age * r.r(60, 160);
    blob(S, [255, 140, 60], x, y, r.r(10, 26), 0.35 * Math.sin(Math.PI * u));
  });
  S.restore();
}

/* ---------- rain ---------- */
function rain(cam, k, o = {}) {
  if (k <= 0.01) return;
  const t = FS.t;
  screenSpace();
  S.save(); S.strokeStyle = 'rgba(200,210,235,0.35)'; S.lineWidth = 1.6;
  const n = Math.round(420 * k), slant = o.slant ?? 0.22;
  S.beginPath();
  for (let i = 0; i < n; i++) {
    const r = RNG(i * 7 + 1), sp = r.r(1.6, 2.4), len = r.r(40, 90);
    const y = ((r.f() + t * sp) % 1) * (H + 300) - 150, x = ((r.f() * (W + 600) - y * slant - t * 60) % (W + 600) + W + 600) % (W + 600) - 300;
    S.moveTo(x, y); S.lineTo(x - len * slant, y + len);
  }
  S.stroke(); S.restore();
  // splashes on the street
  setCam(cam);
  S.save(); S.strokeStyle = 'rgba(210,220,240,0.5)'; S.lineWidth = 1.5 / Math.max(0.5, cam.zoom);
  emit(t, { rate: 160 * k, life: 0.18, seed: 81 }, (ts, age, r, u) => {
    const x = cam.x + r.r(-1, 1) * (W / 2 + 200) / cam.zoom, y = r.r(4, 260), rr = 6 + 18 * u;
    S.globalAlpha = 1 - u; S.beginPath(); S.ellipse(x, y, rr, rr * 0.3, 0, Math.PI, TAU); S.stroke();
  });
  S.restore();
}

/** whole city backdrop for a camera; returns after setting the world camera */
function cityBG(cam, o = {}) {
  screenSpace();
  if (FS.post.impact > 0 && !o.keepOnImpact) {        // impact frames: pure black stage
    S.save(); S.setTransform(1, 0, 0, 1, 0, 0); S.fillStyle = '#000'; S.fillRect(0, 0, W, H); S.restore();
    setCam(cam); return;
  }
  citySky(cam, o);
  drawSkyline(cam, SKY_FAR, 0.12, 'far', mixc(CPAL.far, [70, 70, 90], o.dawn || 0), { fireSize: 22 });
  plumes(cam, SKY_FAR, 0.12, 0.6);
  (o.blasts || []).forEach((b) => farBlast(cam, b.t, b.x, b.y, b.p || 0.3, b.size || 1));
  drawSkyline(cam, SKY_MID, 0.3, 'mid', mixc(CPAL.mid2, [50, 50, 66], o.dawn || 0), { fireSize: 34 });
  plumes(cam, SKY_MID, 0.3, 0.9);
  if (o.near !== false) {
    plumes(cam, SKY_NEAR, 0.62, 1.2);
    drawSkyline(cam, SKY_NEAR, 0.62, 'near', mixc(CPAL.near, [36, 34, 44], o.dawn || 0), { fireSize: 60, neon: true });
    baseFires(cam, 0.8);
  }
  if (o.street !== false) cityStreet(cam, o);
  const dim = o.dim ?? 0.3;
  if (dim > 0) { screenSpace(); S.fillStyle = `rgba(10,3,5,${dim})`; S.fillRect(0, 0, W, H); }
  setCam(cam);
}

/* ---------- the skyscraper district (sky battle, the final duel) ---------- */
const TOWERS = (() => {
  const r = RNG(77), a = [];
  let x = 5600;
  while (x < 10400) {
    const w = r.r(380, 540), h = r.r(2500, 4100);
    a.push({ x, w, h, tile: r.i(5), off: r.i(40), top: r.pick(['spire', 'antenna', 'step', 'broken', 'flat']), seed: r.i(9999),
      fires: Array.from({ length: 1 + r.i(3) }, () => [r.r(0.15, 0.85), r.r(0.05, 0.9), r.r(0.8, 1.5)]), plume: r.chance(0.7), neon: null });
    x += w + r.r(260, 520);
  }
  return a;
})();
function drawTowers(cam, o = {}) {
  plumes(cam, TOWERS, 0.88, 1.6);
  drawSkyline(cam, TOWERS, 0.88, 'near', mixc([13, 5, 7], [36, 34, 44], o.dawn || 0), { fireSize: 46 });
}
/* a sea of smoke far below (sky battle) */
function smokeSea(cam, o = {}) {
  const t = FS.t;
  for (const [p, Y, sc, al] of [[0.4, -1100, 2.8, 0.85], [0.55, -1350, 3.4, 0.9]]) {
    layer(cam, p, (ctx, c) => {
      const base = Math.floor(c.x / 1000) * 1000;
      for (let i = -6; i <= 6; i++) {
        const img = SMOKE_SPR[((i + Math.floor(c.x / 1000)) % 4 + 4) % 4];
        const x = base + i * 1000 + ((t * 25 * p) % 1000);
        ctx.globalAlpha = al * (o.alpha ?? 1);
        ctx.drawImage(img, x - img.width * sc / 2, Y, img.width * sc, img.height * sc);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = rgba([30, 14, 14], al * (o.alpha ?? 1));
      ctx.fillRect(c.x - 9000, Y + 360 * sc * 0.55, 18000, 9000);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = -4; i <= 4; i++) blob(ctx, [255, 100, 30], base + i * 1300 + 400, Y + 420 * sc * 0.5, 600, 0.18);
      ctx.restore();
    });
  }
}
/** background for shots high above the streets */
function skyBG2(cam, o = {}) {
  screenSpace();
  if (FS.post.impact > 0) { S.save(); S.setTransform(1, 0, 0, 1, 0, 0); S.fillStyle = '#000'; S.fillRect(0, 0, W, H); S.restore(); setCam(cam); return; }
  citySky(cam, { moon: o.moon || { x: 7700 * 0.03 + 60, y: -560, r: 320 }, hole: o.hole, helis: false, smokeAlpha: o.smokeAlpha });
  drawSkyline(cam, SKY_FAR, 0.12, 'far', CPAL.far, { fireSize: 22 });
  drawSkyline(cam, SKY_MID, 0.3, 'mid', CPAL.mid2, { fireSize: 34 });
  const seaA = clamp((-cam.y - 1300) / 900);
  if (seaA < 1) drawSkyline(cam, SKY_NEAR, 0.62, 'near', CPAL.near, { fireSize: 60, neon: true });
  if (seaA > 0) smokeSea(cam, { ...o, alpha: (o.alpha ?? 1) * seaA });
  if (o.towers !== false) drawTowers(cam, o);
  if (seaA < 1) { cityStreet(cam, o); }
  const dim = o.dim ?? 0.18;
  if (dim > 0) { screenSpace(); S.fillStyle = `rgba(10,3,5,${dim})`; S.fillRect(0, 0, W, H); }
  setCam(cam);
}
