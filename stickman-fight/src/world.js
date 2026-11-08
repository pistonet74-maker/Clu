/* =====================================================================
 * world.js — parallax backgrounds: sky, stars, moon, clouds, mountains,
 * ground, rock pillars, craters, and flat "anime abstract" backdrops.
 * ===================================================================== */
'use strict';

const PAL = {
  night: { top: [3, 4, 16], mid: [20, 18, 58], low: [62, 30, 82], hor: [140, 52, 96], far: [44, 34, 78], mid2: [26, 20, 46], ground: [22, 18, 30], rim: [92, 74, 120] },
  dawn: { top: [24, 40, 92], mid: [80, 78, 140], low: [220, 120, 128], hor: [255, 186, 120], far: [92, 72, 120], mid2: [52, 40, 70], ground: [36, 28, 40], rim: [255, 170, 130] },
  high: { top: [1, 2, 8], mid: [8, 10, 34], low: [34, 22, 70], hor: [70, 40, 100], far: [44, 34, 78], mid2: [26, 20, 46], ground: [22, 18, 30], rim: [92, 74, 120] },
};
function palMix(a, b, t) { const o = {}; for (const k in a) o[k] = mixc(a[k], b[k], t); return o; }

/** run fn with a parallax camera (p=0 infinitely far, p=1 world) on the scene layer */
function layer(cam, p, fn, ctx = S) {
  const c = { x: cam.x * p, y: cam.y * p, zoom: 1 + (cam.zoom - 1) * p, rot: cam.rot || 0 };
  camApply(ctx, c, ctx === GL ? GSCALE : 1);
  fn(ctx, c);
}

/* ---------- precomputed geometry ---------- */
const STARS = (() => { const r = RNG(77), a = []; for (let i = 0; i < 420; i++) a.push([r.r(-2600, 2600), r.r(-2400, 200), r.r(0.6, 2.2), r.f() * 10, r.f()]); return a; })();
function ridge(seed, x0, x1, step, amp, base, rough) {
  const pts = [];
  for (let x = x0; x <= x1; x += step) {
    const n = fbm1(x * rough, seed);
    const spike = Math.pow(Math.abs(noise1(x * rough * 2.7, seed + 3)), 3) * amp * 0.9;
    pts.push([x, base - (n * 0.5 + 0.5) * amp - spike]);
  }
  return pts;
}
const RIDGE_FAR = ridge(3, -4200, 4200, 24, 260, 30, 0.0016);
const RIDGE_MID = ridge(8, -4200, 4200, 18, 180, 40, 0.0028);
const SPIRES = (() => { const r = RNG(21), a = []; for (let i = 0; i < 9; i++) a.push({ x: -2400 + i * 560 + r.s() * 160, w: r.r(60, 130), h: r.r(260, 520), lean: r.s() * 0.08, seed: i }); return a; })();
const PEBBLES = (() => { const r = RNG(5), a = []; for (let i = 0; i < 260; i++) a.push([r.r(-5000, 5000), r.r(4, 260), r.r(2, 9), r.f()]); return a; })();
const CLOUDS = (() => {
  const make = (seed, w, h, lit, dark) => {
    const c = mk(w, h), x = c.getContext('2d'), r = RNG(seed);
    x.filter = 'blur(10px)';
    for (let i = 0; i < 60; i++) {
      const u = r.f();
      const px = w * (0.1 + 0.8 * u), py = h * (0.62 - 0.28 * Math.sin(Math.PI * u) * r.r(0.4, 1)) + r.s() * 10;
      const rx = r.r(w * 0.05, w * 0.13), ry = rx * r.r(0.45, 0.75);
      const g = x.createRadialGradient(px, py - ry * 0.4, 0, px, py, rx);
      g.addColorStop(0, rgba(lit, 0.55)); g.addColorStop(0.7, rgba(dark, 0.35)); g.addColorStop(1, rgba(dark, 0));
      x.fillStyle = g; x.beginPath(); x.ellipse(px, py, rx, ry, 0, 0, TAU); x.fill();
    }
    x.filter = 'none';
    return c;
  };
  return {
    night: [0, 1, 2, 3].map((i) => make(40 + i, 900, 300, [120, 100, 165], [44, 34, 76])),
    dawn: [0, 1, 2, 3].map((i) => make(50 + i, 900, 300, [255, 196, 176], [130, 86, 126])),
  };
})();

/* ---------- sky ---------- */
function drawSky(cam, o = {}) {
  const t = FS.t;
  const pal = o.pal || PAL.night;
  S.save();
  // gradient anchored to the horizon line seen through a far parallax
  const horY = camToScreen({ ...cam, x: cam.x * 0.08, y: cam.y * 0.08, zoom: 1 + (cam.zoom - 1) * 0.08 }, [0, 0])[1];
  S.setTransform(1, 0, 0, 1, 0, 0);
  S.translate(W / 2, H / 2); S.rotate(cam.rot || 0); S.translate(-W / 2, -H / 2);
  const g = S.createLinearGradient(0, horY - 1300, 0, horY + 40);
  g.addColorStop(0, rgba(pal.top, 1)); g.addColorStop(0.45, rgba(pal.mid, 1));
  g.addColorStop(0.8, rgba(pal.low, 1)); g.addColorStop(1, rgba(pal.hor, 1));
  S.fillStyle = g; S.fillRect(-600, -600, W + 1200, H + 1200);
  S.restore();
  // stars
  if ((o.stars ?? 1) > 0) {
    layer(cam, 0.03, (ctx) => {
      ctx.fillStyle = '#fff';
      for (const s of STARS) {
        const tw = 0.55 + 0.45 * Math.sin(t * (1.5 + s[4] * 3) + s[3]);
        const fade = sat(80, -500, s[1]);
        ctx.globalAlpha = tw * fade * (o.stars ?? 1);
        ctx.fillRect(s[0], s[1] - 400, s[2], s[2]);
      }
      ctx.globalAlpha = 1;
    });
  }
  // moon
  if (o.moon !== false) drawMoon(cam, o);
  // clouds (two depths)
  if (o.clouds !== false) drawClouds(cam, o);
}
function drawMoon(cam, o) {
  const m = o.moon || {};
  const mx = m.x ?? 420, my = m.y ?? -560, R = m.r ?? 240;
  layer(cam, m.p ?? 0.04, (ctx) => {
    const g = ctx.createRadialGradient(mx, my, R * 0.9, mx, my, R * 3.4);
    g.addColorStop(0, rgba(m.halo || [255, 214, 190], 0.28 * (m.alpha ?? 1)));
    g.addColorStop(1, rgba(m.halo || [255, 214, 190], 0));
    ctx.fillStyle = g; ctx.fillRect(mx - R * 3.5, my - R * 3.5, R * 7, R * 7);
    const g2 = ctx.createRadialGradient(mx - R * 0.3, my - R * 0.35, R * 0.1, mx, my, R);
    g2.addColorStop(0, rgba(m.c1 || [240, 230, 216], m.alpha ?? 1)); g2.addColorStop(1, rgba(m.c2 || [214, 178, 168], m.alpha ?? 1));
    ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(mx, my, R, 0, TAU); ctx.fill();
    // craters
    ctx.save(); ctx.beginPath(); ctx.arc(mx, my, R, 0, TAU); ctx.clip();
    const r = RNG(12);
    for (let i = 0; i < 16; i++) {
      const a = r.f() * TAU, d = Math.sqrt(r.f()) * R * 0.85, cr = r.r(0.05, 0.22) * R;
      blob(ctx, [170, 130, 135], mx + Math.cos(a) * d, my + Math.sin(a) * d, cr, 0.4 * (m.alpha ?? 1), 0.4);
    }
    ctx.restore();
  });
  // a soft emissive halo for the bloom pass
  layer(cam, m.p ?? 0.04, (ctx) => blob(ctx, m.halo || [255, 200, 170], mx, my, R * 2.2, 0.1 * (m.alpha ?? 1)), GL);
}
function drawClouds(cam, o) {
  const t = FS.t, set = (o.dawn || 0) > 0.5 ? CLOUDS.dawn : CLOUDS.night;
  const hole = o.hole;
  const draw = (ctx) => {
    for (const [p, y0, sc, n, spd, al] of [[0.06, -760, 1.2, 7, 6, 0.55], [0.14, -430, 1.6, 6, 14, 0.5]]) {
      layer(cam, p, (c) => {
        for (let i = 0; i < n; i++) {
          const img = set[i % set.length];
          const span = 5200;
          let x = ((i * 870 + t * spd * (o.cloudSpeed || 1)) % span) - span / 2;
          const y = y0 + Math.sin(i * 2.3) * 120;
          c.globalAlpha = al * (o.cloudAlpha ?? 1);
          c.drawImage(img, x, y, img.width * sc, img.height * sc);
        }
        c.globalAlpha = 1;
      }, ctx);
    }
  };
  if (hole && hole.r > 1) {
    TX.setTransform(1, 0, 0, 1, 0, 0); TX.clearRect(0, 0, W, H);
    draw(TX);
    TX.setTransform(1, 0, 0, 1, 0, 0);
    TX.globalCompositeOperation = 'destination-out';
    const g = TX.createRadialGradient(hole.x, hole.y, hole.r * 0.55, hole.x, hole.y, hole.r);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    TX.fillStyle = g; TX.fillRect(0, 0, W, H);
    TX.globalCompositeOperation = 'source-over';
    S.save(); S.setTransform(1, 0, 0, 1, 0, 0); S.drawImage(TMP, 0, 0); S.restore();
  } else draw(S);
}

/* ---------- landscape ---------- */
function fillRidge(ctx, pts, color, bottom = 3000) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(pts[0][0], bottom);
  for (const p of pts) ctx.lineTo(p[0], p[1]);
  ctx.lineTo(pts[pts.length - 1][0], bottom); ctx.closePath(); ctx.fill();
}
function drawLand(cam, o = {}) {
  const pal = o.pal || PAL.night;
  // far ridge with haze
  layer(cam, 0.12, (ctx) => {
    fillRidge(ctx, RIDGE_FAR, rgba(pal.far, 1));
    const g = ctx.createLinearGradient(0, -260, 0, 60);
    g.addColorStop(0, rgba(pal.hor, 0)); g.addColorStop(1, rgba(pal.hor, 0.55));
    ctx.fillStyle = g; ctx.fillRect(-5000, -300, 10000, 360);
  });
  // spires + mid ridge
  layer(cam, 0.3, (ctx) => {
    for (const s of SPIRES) {
      ctx.fillStyle = rgba(mixc(pal.mid2, pal.far, 0.35), 1);
      ctx.beginPath();
      ctx.moveTo(s.x - s.w, 60); ctx.lineTo(s.x - s.w * 0.55 + s.lean * s.h, -s.h); ctx.lineTo(s.x - s.w * 0.1 + s.lean * s.h, -s.h - 18);
      ctx.lineTo(s.x + s.w * 0.45 + s.lean * s.h, -s.h + 6); ctx.lineTo(s.x + s.w, 60); ctx.closePath(); ctx.fill();
      ctx.fillStyle = rgba(pal.rim, 0.18);
      ctx.fillRect(s.x - s.w * 0.55 + s.lean * s.h, -s.h, s.w * 0.25, s.h);
    }
    fillRidge(ctx, RIDGE_MID, rgba(pal.mid2, 1));
  });
  // ground plane (world space)
  layer(cam, 1, (ctx, c) => {
    const x0 = c.x - (W / 2 + 600) / c.zoom - 400, x1 = c.x + (W / 2 + 600) / c.zoom + 400;
    const g = ctx.createLinearGradient(0, 0, 0, 700);
    g.addColorStop(0, rgba(mixc(pal.ground, pal.rim, 0.35), 1));
    g.addColorStop(0.08, rgba(pal.ground, 1));
    g.addColorStop(1, rgba(mixc(pal.ground, [0, 0, 0], 0.6), 1));
    ctx.fillStyle = g; ctx.fillRect(x0, 0, x1 - x0, 3000);
    ctx.fillStyle = rgba(pal.rim, 0.55); ctx.fillRect(x0, -1, x1 - x0, 3);
    // strata + pebbles
    ctx.fillStyle = rgba(pal.rim, 0.12);
    for (const p of PEBBLES) if (p[0] > x0 && p[0] < x1) { ctx.beginPath(); ctx.ellipse(p[0], p[1], p[2] * 2.2, p[2] * 0.6, 0, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = rgba(pal.rim, 0.1); ctx.lineWidth = 2;
    for (let k = 0; k < 6; k++) { const yy = 22 + k * k * 18; ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x1, yy + 4); ctx.stroke(); }
  });
}

/* breakable rock pillar standing on the ground (world space) */
function pillar(x, o = {}) {
  const h = o.h || 380, w = o.w || 90, t = FS.t, br = o.breakAt ?? 1e9;
  const pal = o.pal || PAL.night;
  S.save();
  S.fillStyle = rgba(mixc(pal.mid2, pal.far, 0.25), 1);
  const broken = t >= br;
  const top = broken ? -h * 0.28 : -h;
  S.beginPath();
  S.moveTo(x - w * 0.62, 0); S.lineTo(x - w * 0.5, top * 0.6); S.lineTo(x - w * 0.42, top);
  if (broken) { S.lineTo(x - w * 0.1, top - 26); S.lineTo(x + 0.1 * w, top + 8); S.lineTo(x + w * 0.3, top - 34); }
  else { S.lineTo(x - w * 0.05, top - 24); }
  S.lineTo(x + w * 0.45, top + 4); S.lineTo(x + w * 0.55, top * 0.5); S.lineTo(x + w * 0.66, 0); S.closePath(); S.fill();
  S.fillStyle = rgba(pal.rim, 0.45);
  S.beginPath(); S.moveTo(x + w * 0.2, top); S.lineTo(x + w * 0.45, top + 4); S.lineTo(x + w * 0.66, 0); S.lineTo(x + w * 0.3, 0); S.closePath(); S.fill();
  S.strokeStyle = rgba(pal.rim, 0.8); S.lineWidth = 3;
  S.beginPath(); S.moveTo(x + w * 0.45, top + 4); S.lineTo(x + w * 0.55, top * 0.5); S.lineTo(x + w * 0.66, 0); S.stroke();
  // cracks
  S.strokeStyle = 'rgba(10,8,16,0.6)'; S.lineWidth = 2;
  S.beginPath(); S.moveTo(x - w * 0.2, top * 0.2); S.lineTo(x, top * 0.35); S.lineTo(x - w * 0.1, top * 0.55); S.stroke();
  S.restore();
}

/* crater + cracks left by an impact */
function crater(x, t0, o = {}) {
  const t = FS.t;
  if (t < t0) return;
  const age = t - t0, w = o.w || 220, grow = E.outExpo(clamp(age / 0.15));
  const col = o.color || [120, 200, 255];
  S.save();
  S.fillStyle = `rgba(6,4,10,${o.dark ?? 0.8})`;
  S.beginPath(); S.ellipse(x, 6, w * grow, w * 0.12 * grow, 0, 0, TAU); S.fill();
  S.strokeStyle = 'rgba(150,130,180,0.5)'; S.lineWidth = 3;
  S.beginPath(); S.ellipse(x, 2, w * grow * 1.02, w * 0.13 * grow, 0, Math.PI, TAU); S.stroke();
  // radial cracks on the ground plane (flattened)
  const r = RNG(o.seed || 4);
  const hot = Math.exp(-age * (o.cool ?? 1.2));
  for (let i = 0; i < (o.cracks || 9); i++) {
    const a = r.f() * TAU, L = w * r.r(1.2, 2.6) * grow;
    const pts = boltPoints([x, 8], [x + Math.cos(a) * L, 8 + Math.sin(a) * L * 0.1], i + (o.seed || 4) * 9, { gens: 4, disp: 0.12 });
    S.strokeStyle = 'rgba(8,6,12,0.9)'; S.lineWidth = 3.5; drawPolyline(S, pts);
    if (hot > 0.02) {
      S.globalCompositeOperation = 'lighter';
      S.strokeStyle = rgba(col, hot); S.lineWidth = 2; drawPolyline(S, pts);
      S.globalCompositeOperation = 'source-over';
      GL.save(); GL.strokeStyle = rgba(col, hot); GL.lineWidth = 8; drawPolyline(GL, pts); GL.restore();
    }
  }
  S.restore();
}

/* flat anime backdrop: gradient + optional focus lines */
function abstractBG(c1, c2, o = {}) {
  S.save(); S.setTransform(1, 0, 0, 1, 0, 0);
  const g = o.radial
    ? S.createRadialGradient(o.cx ?? W / 2, o.cy ?? H / 2, 0, o.cx ?? W / 2, o.cy ?? H / 2, W * 0.75)
    : S.createLinearGradient(0, 0, o.horizontal ? W : 0, o.horizontal ? 0 : H);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  S.fillStyle = g; S.fillRect(0, 0, W, H);
  S.restore();
}

/* clouds placed in world space (they rush past when the camera travels vertically) */
const WORLD_CLOUDS = (() => { const r = RNG(31), a = []; for (let i = 0; i < 46; i++) a.push({ x: r.r(-2600, 2600), y: r.r(-2700, -1150), s: r.r(1.3, 3.2), k: r.i(4), a: r.r(0.35, 0.7) }); return a; })();
function worldClouds(cam, o = {}) {
  const set = CLOUDS.night;
  layer(cam, 1, (ctx) => {
    for (const c of WORLD_CLOUDS) {
      const img = set[c.k];
      ctx.globalAlpha = c.a * (o.alpha ?? 1);
      ctx.drawImage(img, c.x - img.width * c.s / 2, c.y - img.height * c.s / 2, img.width * c.s, img.height * c.s);
    }
    ctx.globalAlpha = 1;
  });
}
/* a sea of clouds far below (for the sky battle) */
function cloudSea(cam, o = {}) {
  const set = CLOUDS.night, t = FS.t;
  for (const [p, Y, sc, al] of [[0.35, -830, 2.6, 0.75], [0.5, -1220, 3.2, 0.85]]) {
    layer(cam, p, (ctx, c) => {
      const base = Math.floor(c.x / 900) * 900;
      for (let i = -6; i <= 6; i++) {
        const img = set[((i + Math.floor(c.x / 900)) % 4 + 4) % 4];
        const x = base + i * 900 + ((t * 30 * p) % 900);
        ctx.globalAlpha = al * (o.alpha ?? 1);
        ctx.drawImage(img, x - img.width * sc / 2, Y, img.width * sc, img.height * sc);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = rgba([40, 30, 70], al * 0.9 * (o.alpha ?? 1));
      ctx.fillRect(c.x - 6000, Y + 300 * sc * 0.6, 12000, 6000);
    });
  }
}
