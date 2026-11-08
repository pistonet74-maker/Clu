/* =====================================================================
 * audio.js — the whole soundtrack, synthesised offline with Web Audio.
 * 150 BPM, D minor. Every sound effect is triggered by the story's event
 * list (EV), so hits land exactly on the frames where they happen.
 * ===================================================================== */
'use strict';

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

function makeKit(ctx) {
  const SR = ctx.sampleRate;
  const K = { ctx, SR, kicks: [], shapers: new Map(), ks: new Map() };
  // white noise (stereo, 2 s) and brown noise (4 s)
  const nb = ctx.createBuffer(2, SR * 2, SR);
  for (let c = 0; c < 2; c++) { const d = nb.getChannelData(c), r = RNG(70 + c); for (let i = 0; i < d.length; i++) d[i] = r.f() * 2 - 1; }
  K.noise = nb;
  const bb = ctx.createBuffer(2, SR * 4, SR);
  for (let c = 0; c < 2; c++) { const d = bb.getChannelData(c), r = RNG(80 + c); let last = 0; for (let i = 0; i < d.length; i++) { last = (last + 0.02 * (r.f() * 2 - 1)) / 1.02; d[i] = last * 3.5; } }
  K.brown = bb;
  // reverb impulse: early reflections + decaying diffuse tail
  const irLen = Math.floor(SR * 2.6), ir = ctx.createBuffer(2, irLen, SR);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c), r = RNG(90 + c);
    for (let i = 0; i < irLen; i++) { const u = i / irLen; d[i] = (r.f() * 2 - 1) * Math.pow(1 - u, 2.6) * Math.min(1, i / (SR * 0.012)); }
    for (let k = 0; k < 12; k++) { const p = Math.floor(SR * (0.008 + r.f() * 0.07)); d[p] += (r.f() * 2 - 1) * 0.8; }
  }
  K.verb = ctx.createConvolver(); K.verb.buffer = ir;
  // buses → glue compressor → limiter
  K.master = ctx.createGain(); K.master.gain.value = 0.62;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18; comp.knee.value = 10; comp.ratio.value = 3.5; comp.attack.value = 0.006; comp.release.value = 0.16;
  const lim = ctx.createDynamicsCompressor();
  lim.threshold.value = -4; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.06;
  const hpM = ctx.createBiquadFilter(); hpM.type = 'highpass'; hpM.frequency.value = 32; hpM.Q.value = 0.7;
  K.master.connect(hpM); hpM.connect(comp); comp.connect(lim); lim.connect(ctx.destination);
  K.music = ctx.createGain(); K.duck = ctx.createGain();
  const shelf = ctx.createBiquadFilter(); shelf.type = 'lowshelf'; shelf.frequency.value = 170; shelf.gain.value = -4.5;
  const pres = ctx.createBiquadFilter(); pres.type = 'peaking'; pres.frequency.value = 2400; pres.Q.value = 0.8; pres.gain.value = 3;
  K.music.connect(shelf); shelf.connect(pres); pres.connect(K.duck); K.duck.connect(K.master);
  K.musicVol = K.music.gain;
  K.drums = ctx.createGain(); K.drums.gain.value = 0.9; K.drums.connect(K.master);
  K.sfx = ctx.createGain(); K.sfx.gain.value = 1.0; K.sfx.connect(K.master);
  K.revIn = ctx.createGain(); K.revIn.connect(K.verb);
  const rv = ctx.createGain(); rv.gain.value = 0.55; K.verb.connect(rv); rv.connect(K.master);
  // dotted-eighth echo for the lead
  K.delay = ctx.createDelay(1.0); K.delay.delayTime.value = BEAT * 0.75;
  const fb = ctx.createGain(); fb.gain.value = 0.3;
  const dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 2200;
  K.delay.connect(dlp); dlp.connect(fb); fb.connect(K.delay);
  K.delayIn = ctx.createGain(); K.delayIn.connect(K.delay);
  const dOut = ctx.createGain(); dOut.gain.value = 0.45; dlp.connect(dOut); dOut.connect(K.music);
  return K;
}

/* ---------- building blocks ---------- */
function nsrc(K, t, dur, brown = false) {
  const s = K.ctx.createBufferSource();
  s.buffer = brown ? K.brown : K.noise; s.loop = true;
  s.start(t, hash(Math.floor(t * 1000) + 7) * 1.5); s.stop(t + dur + 0.05);
  return s;
}
function osc(K, type, f, t, dur) {
  const o = K.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
  o.start(t); o.stop(t + dur + 0.05); return o;
}
function env(K, t, a, peak, d, sus = 0.0001, rel = 0) {
  const g = K.ctx.createGain(), p = g.gain;
  p.setValueAtTime(0.0001, t);
  p.linearRampToValueAtTime(Math.max(peak, 0.0002), t + Math.max(a, 0.001));
  p.exponentialRampToValueAtTime(Math.max(sus, 0.0001), t + a + d);
  if (rel > 0) p.exponentialRampToValueAtTime(0.0001, t + a + d + rel);
  return g;
}
/** sustained envelope: attack, hold until `end`, release */
function envS(K, t, a, v, end, rel) {
  const g = K.ctx.createGain(), p = g.gain;
  p.setValueAtTime(0.0001, t); p.linearRampToValueAtTime(v, t + a);
  p.setValueAtTime(v, Math.max(t + a, end)); p.exponentialRampToValueAtTime(0.0001, Math.max(t + a, end) + rel);
  return g;
}
function filt(K, type, f, q = 0.7) { const b = K.ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; }
function shaper(K, amt) {
  if (K.shapers.has(amt)) return K.shapers.get(amt);
  const ws = K.ctx.createWaveShaper(), n = 2048, c = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = Math.tanh(x * amt) / Math.tanh(amt); }
  ws.curve = c; ws.oversample = 'none';
  return ws; // not cached: a waveshaper is a node with a single output chain per voice
}
function route(K, node, bus, pan = 0, rev = 0) {
  const p = K.ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1);
  node.connect(p); p.connect(bus);
  if (rev > 0) { const s = K.ctx.createGain(); s.gain.value = rev; p.connect(s); s.connect(K.revIn); }
  return p;
}
const chain = (...n) => { for (let i = 0; i < n.length - 1; i++) n[i].connect(n[i + 1]); return n[n.length - 1]; };

/* ---------- drums & percussion ---------- */
function kick(K, t, v = 1) {
  const o = osc(K, 'sine', 170, t, 0.6);
  o.frequency.exponentialRampToValueAtTime(50, t + 0.1); o.frequency.exponentialRampToValueAtTime(38, t + 0.45);
  route(K, chain(o, shaper(K, 2.4), env(K, t, 0.003, 0.78 * v, 0.34)), K.drums, 0, 0.02);
  const n = nsrc(K, t, 0.03);
  route(K, chain(n, filt(K, 'bandpass', 3800, 0.9), env(K, t, 0.001, 0.3 * v, 0.018)), K.drums, 0);
  K.kicks.push([t, v]);
}
function snare(K, t, v = 1, pan = 0.04) {
  const n = nsrc(K, t, 0.35);
  const pk = filt(K, 'peaking', 3200, 1); pk.gain.value = 5;
  route(K, chain(n, filt(K, 'highpass', 1100), pk, filt(K, 'lowpass', 9000), env(K, t, 0.002, 0.78 * v, 0.19)), K.drums, pan, 0.16);
  const o = osc(K, 'triangle', 210, t, 0.25); o.frequency.exponentialRampToValueAtTime(150, t + 0.08);
  route(K, chain(o, env(K, t, 0.002, 0.55 * v, 0.1)), K.drums, 0, 0.08);
}
function hat(K, t, v = 0.2, open = false) {
  const n = nsrc(K, t, open ? 0.4 : 0.08);
  route(K, chain(n, filt(K, 'highpass', 7800), filt(K, 'lowpass', 13000), env(K, t, 0.001, v, open ? 0.3 : 0.035)), K.drums, (hash(Math.floor(t * 977)) - 0.5) * 0.5, 0.02);
}
function crash(K, t, v = 0.4, dur = 2.4) {
  const n = nsrc(K, t, dur + 0.5);
  route(K, chain(n, filt(K, 'highpass', 3000), filt(K, 'lowpass', 11000), env(K, t, 0.002, v, dur)), K.drums, 0.2, 0.25);
  const n2 = nsrc(K, t + 0.001, dur + 0.5);
  route(K, chain(n2, filt(K, 'bandpass', 5200, 2), env(K, t, 0.002, v * 0.6, dur * 0.7)), K.drums, -0.2, 0.25);
}
function taiko(K, t, v = 1, f = 78, pan = 0) {
  const o = osc(K, 'sine', f * 1.6, t, 1.2); o.frequency.exponentialRampToValueAtTime(f, t + 0.05); o.frequency.exponentialRampToValueAtTime(f * 0.85, t + 0.8);
  route(K, chain(o, shaper(K, 1.6), env(K, t, 0.002, 0.75 * v, 0.8)), K.drums, pan, 0.32);
  const n = nsrc(K, t, 0.3);
  route(K, chain(n, filt(K, 'lowpass', 520), env(K, t, 0.002, 0.8 * v, 0.2)), K.drums, pan, 0.3);
  const n2 = nsrc(K, t, 0.05);
  route(K, chain(n2, filt(K, 'bandpass', 1800, 1.4), env(K, t, 0.001, 0.25 * v, 0.03)), K.drums, pan, 0.1);
}
function boom(K, t, v = 1, len = 2.2) {
  const o = osc(K, 'sine', 75, t, len + 0.3); o.frequency.exponentialRampToValueAtTime(30, t + len * 0.55);
  route(K, chain(o, shaper(K, 2), env(K, t, 0.004, 0.75 * v, len * 0.85)), K.sfx, 0, 0.15);
  const n = nsrc(K, t, len);
  const lp = filt(K, 'lowpass', 1400, 0.8); lp.frequency.setValueAtTime(1600, t); lp.frequency.exponentialRampToValueAtTime(90, t + len * 0.5);
  route(K, chain(n, lp, env(K, t, 0.003, 0.9 * v, len * 0.6)), K.sfx, 0, 0.45);
}
function thud(K, t, v = 0.6, pan = 0) {
  const o = osc(K, 'sine', 95, t, 0.4); o.frequency.exponentialRampToValueAtTime(42, t + 0.2);
  route(K, chain(o, env(K, t, 0.003, v, 0.26)), K.sfx, pan, 0.1);
  route(K, chain(nsrc(K, t, 0.2), filt(K, 'lowpass', 600), env(K, t, 0.002, v * 0.6, 0.12)), K.sfx, pan, 0.1);
}
function heartbeat(K, t, v = 0.7) {
  for (const [dt, a] of [[0, 1], [0.22, 0.7]]) {
    const o = osc(K, 'sine', 70, t + dt, 0.4); o.frequency.exponentialRampToValueAtTime(42, t + dt + 0.15);
    route(K, chain(o, filt(K, 'lowpass', 160), env(K, t + dt, 0.01, v * a, 0.28)), K.sfx, 0, 0.05);
  }
}

/* ---------- tonal instruments ---------- */
function bassNote(K, t, m, dur, v = 0.5, att = 0.004, rel = 0.04) {
  const f = mtof(m);
  const o1 = osc(K, 'sawtooth', f, t, dur + 0.1), o2 = osc(K, 'sawtooth', f, t, dur + 0.1), sub = osc(K, 'sine', f / 2, t, dur + 0.1);
  o1.detune.value = -9; o2.detune.value = 9;
  const lp = filt(K, 'lowpass', 2000, 5);
  lp.frequency.setValueAtTime(2800, t); lp.frequency.exponentialRampToValueAtTime(480, t + Math.min(dur, 0.2));
  const g = envS(K, t, att, v, t + dur - 0.03, rel);
  o1.connect(lp); o2.connect(lp); chain(lp, shaper(K, 1.8), g);
  const sg = K.ctx.createGain(); sg.gain.value = 0.38; sub.connect(sg); sg.connect(g);
  route(K, g, K.music, 0, 0);
}
function saws(K, t, ms, dur, v = 0.1, o = {}) {
  const lp = filt(K, 'lowpass', o.cutoff || 2600, 0.9);
  if (o.sweep) { lp.frequency.setValueAtTime(o.sweep[0], t); lp.frequency.exponentialRampToValueAtTime(o.sweep[1], t + dur); }
  const g = envS(K, t, o.attack ?? 0.012, v, t + dur, o.release ?? 0.3);
  const L = K.ctx.createGain(), C = K.ctx.createGain(), Rr = K.ctx.createGain();
  for (const m of ms) {
    for (const [cents, bus] of [[-12, L], [0, C], [12, Rr]]) {
      const s = osc(K, 'sawtooth', mtof(m), t, dur + (o.release ?? 0.3) + 0.1); s.detune.value = cents + (o.bend || 0);
      if (o.bendTo) s.detune.linearRampToValueAtTime(cents + o.bendTo, t + dur);
      s.connect(bus);
    }
  }
  const mix = K.ctx.createGain(); mix.gain.value = 1.15 / Math.sqrt(ms.length * 3);
  L.connect(lp); C.connect(lp); Rr.connect(lp); lp.connect(mix); mix.connect(g);
  route(K, g, o.bus || K.music, 0, o.rev ?? 0.22);
  // stereo width: a second, hard-panned, slightly delayed copy
  const d = K.ctx.createDelay(0.05); d.delayTime.value = 0.012; g.connect(d);
  const w = K.ctx.createGain(); w.gain.value = 0.5; d.connect(w); route(K, w, o.bus || K.music, 0.8, 0);
}
function ksBuffer(K, m, dur = 2.2) {
  const key = m + '|' + dur;
  if (K.ks.has(key)) return K.ks.get(key);
  const SR = K.SR, f = mtof(m), N = Math.max(2, Math.round(SR / f)), len = Math.floor(SR * dur);
  const buf = K.ctx.createBuffer(1, len, SR), d = buf.getChannelData(0), r = RNG(m * 13 + 1);
  const ring = new Float32Array(N);
  let prev = 0;
  for (let i = 0; i < N; i++) { prev += ((r.f() * 2 - 1) - prev) * 0.6; ring[i] = prev; }
  const rho = Math.pow(0.001, 1 / (1.7 * f));
  let idx = 0, peak = 0;
  for (let i = 0; i < len; i++) {
    const cur = ring[idx], nxt = ring[(idx + 1) % N];
    d[i] = cur; ring[idx] = (cur + nxt) * 0.5 * rho; idx = (idx + 1) % N;
    peak = Math.max(peak, Math.abs(cur));
  }
  for (let i = 0; i < len; i++) d[i] = (d[i] / (peak || 1)) * 0.8 * Math.min(1, (len - i) / (SR * 0.05));
  K.ks.set(key, buf);
  return buf;
}
function koto(K, t, m, v = 0.35, pan = 0, dur = 2.2, bus) {
  const s = K.ctx.createBufferSource(); s.buffer = ksBuffer(K, m, dur);
  const g = K.ctx.createGain(); g.gain.value = v;
  const hp = filt(K, 'highpass', 120);
  route(K, chain(s, hp, g), bus || K.music, pan, 0.28);
  s.start(t); s.stop(t + dur);
}
function lead(K, t, m, dur, v = 0.1) {
  const f = mtof(m);
  const a = osc(K, 'sawtooth', f, t, dur + 0.3), b = osc(K, 'square', f, t, dur + 0.3);
  b.detune.value = 6;
  const lfo = osc(K, 'sine', 5.6, t, dur + 0.3), lg = K.ctx.createGain();
  lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(0, t + Math.min(0.2, dur * 0.4)); lg.gain.linearRampToValueAtTime(9, t + Math.min(0.5, dur));
  lfo.connect(lg); lg.connect(a.detune); lg.connect(b.detune);
  const mix = K.ctx.createGain(); mix.gain.value = 0.5;
  const bg = K.ctx.createGain(); bg.gain.value = 0.35;
  a.connect(mix); b.connect(bg); bg.connect(mix);
  const lp = filt(K, 'lowpass', 3800, 1.1);
  const g = envS(K, t, 0.02, v, t + dur - 0.05, 0.14);
  chain(mix, lp, g);
  route(K, g, K.music, 0.06, 0.2);
  const s = K.ctx.createGain(); s.gain.value = 0.35; g.connect(s); s.connect(K.delayIn);
}
function choir(K, t, ms, dur, v = 0.06, pan = 0) {
  const g = envS(K, t, 0.35, v, t + dur, 0.7);
  const f1 = filt(K, 'bandpass', 720, 4), f2 = filt(K, 'bandpass', 1150, 5), lp = filt(K, 'lowpass', 2600);
  const mix = K.ctx.createGain(); mix.gain.value = 1.4 / Math.sqrt(ms.length * 3);
  const vib = osc(K, 'sine', 4.7, t, dur + 1), vg = K.ctx.createGain(); vg.gain.value = 7; vib.connect(vg);
  for (const m of ms) for (const c of [-8, 0, 8]) {
    const s = osc(K, 'sawtooth', mtof(m), t, dur + 1); s.detune.value = c;
    vg.connect(s.detune);
    s.connect(f1); s.connect(f2);
  }
  f1.connect(mix); f2.connect(mix); chain(mix, lp, g);
  route(K, g, K.music, pan, 0.5);
}
function pad(K, t, ms, dur, v = 0.05) { saws(K, t, ms, dur, v, { attack: 0.6, release: 1.0, cutoff: 1100, rev: 0.4 }); }

/* ---------- sound effects ---------- */
function whoosh(K, t, dur = 0.35, f0 = 400, f1 = 2600, v = 0.35, p0 = 0, p1 = 0) {
  const n = nsrc(K, t, dur + 0.1);
  const bp = filt(K, 'bandpass', f0, 1.3);
  bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = K.ctx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const p = K.ctx.createStereoPanner(); p.pan.setValueAtTime(p0, t); p.pan.linearRampToValueAtTime(p1, t + dur);
  chain(n, bp, g, p); p.connect(K.sfx);
}
function punch(K, t, v = 0.8, pan = 0, heavy = 0) {
  const o = osc(K, 'sine', 130, t, 0.35); o.frequency.exponentialRampToValueAtTime(46, t + 0.12);
  route(K, chain(o, shaper(K, 3), env(K, t, 0.002, 0.8 * v, 0.18)), K.sfx, pan * 0.5, 0.08);
  route(K, chain(nsrc(K, t, 0.1), filt(K, 'bandpass', 2300, 1), env(K, t, 0.001, v * 1.1, 0.07)), K.sfx, pan, 0.12);
  route(K, chain(nsrc(K, t, 0.05), filt(K, 'highpass', 5000), env(K, t, 0.001, v * 0.35, 0.02)), K.sfx, pan, 0.05);
  if (heavy) { boom(K, t, heavy * 0.7, 1.0 + heavy * 0.6); crash(K, t, 0.18 * heavy, 1.2); }
}
function metal(K, t, v = 0.4, pan = 0, base = 520, decay = 1) {
  [[1, 1, 1.1], [2.76, 0.55, 0.7], [5.4, 0.35, 0.45], [8.93, 0.22, 0.3], [13.3, 0.12, 0.2]].forEach(([r, a, d]) => {
    const o = osc(K, 'sine', base * r, t, d * decay + 0.1);
    route(K, chain(o, env(K, t, 0.001, v * a * 0.5, d * decay)), K.sfx, pan, 0.35);
  });
  route(K, chain(nsrc(K, t, 0.08), filt(K, 'highpass', 2500), env(K, t, 0.001, v * 0.6, 0.04)), K.sfx, pan, 0.2);
}
function crackle(K, t, dur, v = 0.3, pan = 0, rate = 60, hp = 2500) {
  const r = RNG(Math.floor(t * 1000) + 3), n = Math.floor(dur * rate);
  for (let i = 0; i < n; i++) {
    const tt = t + r.f() * dur, a = v * r.r(0.2, 1);
    route(K, chain(nsrc(K, tt, 0.02), filt(K, 'highpass', hp + r.f() * 3000), env(K, tt, 0.0005, a, r.r(0.004, 0.018))), K.sfx, pan + r.s() * 0.3, 0.05);
  }
}
function zap(K, t, dur = 0.4, v = 0.35, pan = 0) {
  const o = osc(K, 'sawtooth', 92, t, dur + 0.1);
  const bp = filt(K, 'bandpass', 1300, 1.6);
  const g = K.ctx.createGain(), r = RNG(Math.floor(t * 997));
  g.gain.setValueAtTime(0.0001, t);
  for (let k = 0; k * 0.015 < dur; k++) g.gain.linearRampToValueAtTime(v * r.f() * (1 - k * 0.015 / dur), t + k * 0.015);
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  route(K, chain(o, bp, shaper(K, 2), g), K.sfx, pan, 0.2);
  crackle(K, t, dur, v * 0.9, pan, 80);
}
function thunder(K, t, v = 1, pan = 0) {
  route(K, chain(nsrc(K, t, 0.3), filt(K, 'highpass', 1200), env(K, t, 0.001, v * 0.9, 0.14)), K.sfx, pan, 0.3);
  const n = nsrc(K, t, 3, true), g = K.ctx.createGain(), r = RNG(Math.floor(t * 31));
  g.gain.setValueAtTime(0.0001, t);
  for (let k = 0; k < 40; k++) g.gain.linearRampToValueAtTime(v * 1.2 * r.r(0.3, 1) * Math.exp(-k * 0.08), t + 0.02 + k * 0.06);
  g.gain.linearRampToValueAtTime(0.0001, t + 2.8);
  route(K, chain(n, filt(K, 'lowpass', 260), g), K.sfx, pan, 0.4);
  boom(K, t, v * 0.6, 1.6);
  crackle(K, t, 0.4, v * 0.5, pan, 90);
}
function fire(K, t, dur = 0.8, v = 0.4, pan = 0) {
  const n = nsrc(K, t, dur + 0.2);
  const lp = filt(K, 'lowpass', 700, 0.8);
  lp.frequency.setValueAtTime(600, t); lp.frequency.exponentialRampToValueAtTime(2600, t + dur * 0.25); lp.frequency.exponentialRampToValueAtTime(500, t + dur);
  route(K, chain(n, lp, env(K, t, 0.04, v, dur)), K.sfx, pan, 0.25);
  crackle(K, t, dur, v * 0.45, pan, 40, 1800);
}
function explosion(K, t, v = 1, size = 1, pan = 0) {
  const n = nsrc(K, t, 3 * size);
  const lp = filt(K, 'lowpass', 5000, 0.7);
  lp.frequency.setValueAtTime(5000, t); lp.frequency.exponentialRampToValueAtTime(140, t + 1.6 * size);
  route(K, chain(n, lp, shaper(K, 2.5), env(K, t, 0.003, v, 2.4 * size)), K.sfx, pan, 0.45);
  boom(K, t, v, 1.8 * size);
  crackle(K, t + 0.05, 1.0 * size, v * 0.35, pan, 50, 1500);
}
function glint(K, t, v = 0.22, pan = 0) {
  for (const [f, a, d] of [[2700, 1, 0.7], [4150, 0.5, 0.5], [5600, 0.3, 0.35]]) {
    const o = osc(K, 'sine', f * 0.9, t, d + 0.1); o.frequency.exponentialRampToValueAtTime(f, t + 0.04);
    route(K, chain(o, env(K, t, 0.003, v * a, d)), K.sfx, pan, 0.6);
  }
  whoosh(K, t - 0.12, 0.16, 2000, 8000, v * 0.5, pan, pan);
}
function slashShing(K, t, v = 1) {
  route(K, chain(nsrc(K, t, 0.4), filt(K, 'highpass', 3800), env(K, t, 0.001, v * 0.9, 0.25)), K.sfx, 0, 0.5);
  metal(K, t, v * 0.9, 0, 1650, 1.6);
  whoosh(K, t - 0.1, 0.12, 800, 9000, v * 0.6, -0.8, 0.8);
}
function shatter(K, t, v = 0.6, pan = 0) {
  const r = RNG(Math.floor(t * 100));
  for (let i = 0; i < 26; i++) {
    const tt = t + r.f() * 0.3, f = r.r(1800, 7200), d = r.r(0.05, 0.35);
    route(K, chain(osc(K, 'sine', f, tt, d + 0.05), env(K, tt, 0.001, v * r.r(0.1, 0.35), d)), K.sfx, pan + r.s() * 0.5, 0.4);
  }
  route(K, chain(nsrc(K, t, 0.3), filt(K, 'highpass', 3000), env(K, t, 0.001, v * 0.6, 0.18)), K.sfx, pan, 0.3);
}
function riser(K, t0, t1, v = 0.3) {
  const d = t1 - t0, n = nsrc(K, t0, d + 0.1);
  const bp = filt(K, 'bandpass', 300, 2.2);
  bp.frequency.setValueAtTime(260, t0); bp.frequency.exponentialRampToValueAtTime(7000, t1);
  const g = K.ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(v, t1); g.gain.setValueAtTime(0.0001, t1 + 0.01);
  route(K, chain(n, bp, g), K.sfx, 0, 0.3);
  const o = osc(K, 'sawtooth', 110, t0, d + 0.05); o.frequency.exponentialRampToValueAtTime(880, t1);
  const tr = osc(K, 'sine', 4, t0, d + 0.05); tr.frequency.linearRampToValueAtTime(22, t1);
  const tg = K.ctx.createGain(); tg.gain.value = 0.5; tr.connect(tg);
  const g2 = K.ctx.createGain(); g2.gain.setValueAtTime(0.0001, t0); g2.gain.exponentialRampToValueAtTime(v * 0.25, t1); g2.gain.setValueAtTime(0.0001, t1 + 0.01);
  tg.connect(g2.gain);
  route(K, chain(o, filt(K, 'lowpass', 2500), g2), K.sfx, 0, 0.2);
}
function revCymbal(K, tEnd, dur = 1.4, v = 0.32) {
  const n = nsrc(K, tEnd - dur, dur + 0.05);
  const g = K.ctx.createGain(); g.gain.setValueAtTime(0.0001, tEnd - dur); g.gain.exponentialRampToValueAtTime(v, tEnd); g.gain.setValueAtTime(0.0001, tEnd + 0.005);
  route(K, chain(n, filt(K, 'highpass', 2800), g), K.sfx, 0, 0.1);
}
function windBed(K, t0, t1, v = 0.2) {
  const n = nsrc(K, t0, t1 - t0 + 0.5, true);
  const lp = filt(K, 'lowpass', 700, 0.6), bp = filt(K, 'bandpass', 500, 0.8);
  const g = envS(K, t0, Math.min(1.5, (t1 - t0) / 3), v, t1 - 0.8, 0.8);
  const lfo = osc(K, 'sine', 0.23, t0, t1 - t0 + 1), lg = K.ctx.createGain(); lg.gain.value = 300;
  lfo.connect(lg); lg.connect(bp.frequency);
  route(K, chain(n, lp, bp, g), K.sfx, 0, 0.15);
}
function drone(K, t0, t1, ms, v = 0.06, cutoff = 420) { saws(K, t0, ms, t1 - t0, v, { attack: 1.5, release: 1.2, cutoff, rev: 0.4 }); }
function beamLoop(K, t0, t1, v = 0.3) {
  const d = t1 - t0;
  const lp = filt(K, 'lowpass', 900, 3);
  const lfo = osc(K, 'sine', 7, t0, d + 0.5), lg = K.ctx.createGain(); lg.gain.value = 500; lfo.connect(lg); lg.connect(lp.frequency);
  const g = envS(K, t0, 0.08, v, t1, 0.25);
  for (const m of [38, 45, 50, 57]) {
    const s = osc(K, 'sawtooth', mtof(m), t0, d + 0.5); s.detune.setValueAtTime(0, t0); s.detune.setValueAtTime(0, t1 - 0.45); s.detune.exponentialRampToValueAtTime(1200, t1);
    s.connect(lp);
  }
  route(K, chain(lp, shaper(K, 2), g), K.sfx, 0, 0.2);
  const n = nsrc(K, t0, d + 0.5);
  const bp = filt(K, 'bandpass', 900, 0.7);
  const l2 = osc(K, 'sine', 3.3, t0, d + 0.5), lg2 = K.ctx.createGain(); lg2.gain.value = 500; l2.connect(lg2); lg2.connect(bp.frequency);
  route(K, chain(n, bp, envS(K, t0, 0.08, v * 1.3, t1, 0.25)), K.sfx, 0, 0.2);
  crackle(K, t0, d, v * 0.7, 0, 30);
}
function chargeTone(K, t0, t1, v = 0.18) {
  const o = osc(K, 'sine', 220, t0, t1 - t0 + 0.1); o.frequency.exponentialRampToValueAtTime(980, t1);
  const tr = osc(K, 'sine', 5, t0, t1 - t0 + 0.1); tr.frequency.linearRampToValueAtTime(24, t1);
  const tg = K.ctx.createGain(); tg.gain.value = v * 0.6; tr.connect(tg);
  const g = envS(K, t0, 0.3, v, t1, 0.05); tg.connect(g.gain);
  route(K, chain(o, g), K.sfx, 0, 0.3);
  crackle(K, t0, t1 - t0, v * 0.6, -0.5, 25);
  fire(K, t0, t1 - t0, v * 0.6, 0.5);
}
function powerRoar(K, t0, dur, v = 0.35, pan = 0, electric = true) {
  const n = nsrc(K, t0, dur + 0.5);
  const lp = filt(K, 'lowpass', 300, 0.9); lp.frequency.setValueAtTime(300, t0); lp.frequency.exponentialRampToValueAtTime(3200, t0 + dur);
  route(K, chain(n, lp, envS(K, t0, 0.1, v, t0 + dur, 0.4)), K.sfx, pan, 0.3);
  saws(K, t0, [26, 33, 38], dur, v * 0.9, { attack: 0.05, release: 0.4, cutoff: 700, bendTo: 300, bus: K.sfx, rev: 0.25 });
  if (electric) crackle(K, t0, dur, v * 0.8, pan, 70); else crackle(K, t0, dur, v * 0.6, pan, 40, 1500);
}

/* ---------- extra instruments & effects for v2 ---------- */
function guitar(K, t, root, dur, v = 0.12, mute = true) {
  // distorted power chord: root + fifth + octave through an amp-ish chain
  const g = envS(K, t, 0.004, v, t + dur - (mute ? 0.02 : 0.05), mute ? 0.05 : 0.25);
  const pre = K.ctx.createGain(); pre.gain.value = 3.2;
  const lp = filt(K, 'lowpass', mute ? 1700 : 3200, 0.8), pk = filt(K, 'peaking', 800, 1.2); pk.gain.value = 4;
  const hp = filt(K, 'highpass', 90);
  for (const [m, c] of [[root, -7], [root, 7], [root + 7, 0], [root + 12, 4]]) { const o = osc(K, 'sawtooth', mtof(m), t, dur + 0.3); o.detune.value = c; o.connect(pre); }
  chain(pre, shaper(K, 7), hp, pk, lp, g);
  route(K, g, K.music, -0.25, 0.1);
  const d = K.ctx.createDelay(0.05); d.delayTime.value = 0.017; g.connect(d); const w = K.ctx.createGain(); w.gain.value = 0.8; d.connect(w); route(K, w, K.music, 0.35, 0.05);
}
function brass(K, t, ms, v = 0.16, dur = 0.7) {
  const lp = filt(K, 'lowpass', 900, 2);
  lp.frequency.setValueAtTime(700, t); lp.frequency.linearRampToValueAtTime(4200, t + 0.06); lp.frequency.exponentialRampToValueAtTime(900, t + dur);
  const g = env(K, t, 0.012, v, dur, 0.0001);
  const mix = K.ctx.createGain(); mix.gain.value = 1 / Math.sqrt(ms.length * 2);
  for (const m of ms) for (const c of [-9, 9]) { const o = osc(K, 'sawtooth', mtof(m), t, dur + 0.2); o.detune.value = c; o.connect(mix); }
  chain(mix, lp, g); route(K, g, K.music, 0, 0.35);
}
function metalCrunch(K, t, v = 0.7, pan = 0) {
  route(K, chain(nsrc(K, t, 0.6), filt(K, 'lowpass', 1800), env(K, t, 0.002, v, 0.35)), K.sfx, pan, 0.3);
  const r = RNG(Math.floor(t * 100) + 9);
  for (let i = 0; i < 6; i++) metal(K, t + r.f() * 0.12, v * 0.25, pan + r.s() * 0.3, r.r(180, 700), r.r(0.3, 0.8));
  thud(K, t, v * 0.8, pan);
}
function glassShower(K, t, dur = 1.6, v = 0.35, pan = 0) {
  const r = RNG(Math.floor(t * 100) + 3), n = Math.floor(dur * 45);
  for (let i = 0; i < n; i++) {
    const tt = t + Math.pow(r.f(), 1.6) * dur, f = r.r(2400, 8000), d = r.r(0.03, 0.18);
    route(K, chain(osc(K, 'sine', f, tt, d + 0.05), env(K, tt, 0.001, v * r.r(0.05, 0.3) * (1 - (tt - t) / dur * 0.7), d)), K.sfx, pan + r.s() * 0.7, 0.35);
  }
  route(K, chain(nsrc(K, t, 0.4), filt(K, 'highpass', 3500), env(K, t, 0.002, v * 0.7, 0.25)), K.sfx, pan, 0.3);
}
function growl(K, t, dur = 0.8, v = 0.4, pan = 0) {
  const o = osc(K, 'sawtooth', 62, t, dur + 0.2), lfo = osc(K, 'sine', 23, t, dur + 0.2), lg = K.ctx.createGain(); lg.gain.value = 30;
  lfo.connect(lg); lg.connect(o.frequency);
  const bp = filt(K, 'bandpass', 420, 1.4);
  route(K, chain(o, shaper(K, 4), bp, envS(K, t, 0.05, v, t + dur - 0.1, 0.25)), K.sfx, pan, 0.3);
  route(K, chain(nsrc(K, t, dur), filt(K, 'bandpass', 900, 0.8), envS(K, t, 0.05, v * 0.5, t + dur - 0.1, 0.2)), K.sfx, pan, 0.25);
  fire(K, t, dur, v * 0.6, pan);
}
function rainBed(K, t0, t1, v = 0.22) {
  const n = nsrc(K, t0, t1 - t0 + 0.5);
  route(K, chain(n, filt(K, 'highpass', 900), filt(K, 'lowpass', 9000), envS(K, t0, 1.2, v, t1 - 0.8, 0.8)), K.sfx, 0, 0.2);
  const r = RNG(31);
  for (let tt = t0 + 0.5; tt < t1; tt += r.r(0.02, 0.07)) route(K, chain(nsrc(K, tt, 0.02), filt(K, 'bandpass', r.r(2000, 6000), 2), env(K, tt, 0.001, v * r.r(0.1, 0.4), 0.012)), K.sfx, r.s() * 0.8, 0.1);
}
function siren(K, t0, t1, v = 0.03, pan = 0) {
  const o = osc(K, 'triangle', 650, t0, t1 - t0 + 0.2), lfo = osc(K, 'sine', 0.45, t0, t1 - t0 + 0.2), lg = K.ctx.createGain(); lg.gain.value = 180;
  lfo.connect(lg); lg.connect(o.frequency);
  route(K, chain(o, filt(K, 'lowpass', 1500), envS(K, t0, 1, v, t1 - 1, 1)), K.sfx, pan, 0.6);
}
function fireBed(K, t0, t1, v = 0.08) {
  route(K, chain(nsrc(K, t0, t1 - t0 + 0.5, true), filt(K, 'lowpass', 500), envS(K, t0, 1, v, t1 - 0.6, 0.6)), K.sfx, 0, 0.2);
  crackle(K, t0, t1 - t0, v * 1.6, 0, 9, 1600);
}
function grind(K, t, dur, v = 0.5) {
  route(K, chain(nsrc(K, t, dur + 0.5, true), filt(K, 'lowpass', 220), envS(K, t, 0.3, v, t + dur - 0.2, 0.4)), K.sfx, -0.3, 0.4);
  const r = RNG(77);
  for (let k = 0; k < dur * 4; k++) metal(K, t + r.f() * dur, v * 0.18, -0.4 + r.s() * 0.3, r.r(90, 260), r.r(0.6, 1.4));
  crackle(K, t, dur, v * 0.5, -0.3, 25, 900);
}

/* ---------- the score (v2) ---------- */
const CH = { Dm: [62, 65, 69], Bb: [58, 62, 65], C: [60, 64, 67], A: [57, 61, 64], Gm: [55, 58, 62], F: [57, 60, 65], D: [62, 66, 69],
  Em: [64, 67, 71], Cc: [60, 64, 67], Dd: [62, 66, 69], B: [59, 63, 66] };
const ROOT = { Dm: 38, Bb: 34, C: 36, A: 33, Gm: 31, F: 29, D: 38, Em: 40, Cc: 36, Dd: 38, B: 35 };
const BARS = { 6: 'Dm', 7: 'Dm', 8: 'Bb', 9: 'C', 10: 'A', 11: 'Dm', 12: 'Bb', 13: 'C', 14: 'A', 15: 'Gm', 16: 'A',
  17: 'Dm', 18: 'Bb', 19: 'Gm', 20: 'A', 21: 'Em', 22: 'Cc', 23: 'Dd', 24: 'B', 26: 'Dm', 27: 'A',
  31: 'Bb', 32: 'F', 33: 'C', 34: 'Dm', 35: 'Bb', 36: 'C', 37: 'D', 38: 'D' };
const MELODY = {
  7: [[74, 0, 6], [76, 6, 2], [77, 8, 4], [81, 12, 4]],
  8: [[79, 0, 12], [77, 12, 4]],
  9: [[76, 0, 6], [77, 6, 2], [79, 8, 4], [84, 12, 4]],
  10: [[81, 0, 12], [85, 12, 4]],
  11: [[86, 0, 8], [84, 8, 2], [81, 10, 2], [77, 12, 4]],
  12: [[77, 0, 6], [79, 6, 2], [82, 8, 8]],
  13: [[81, 0, 6], [79, 6, 2], [76, 8, 8]],
  14: [[85, 0, 8], [88, 8, 8]],
  15: [[79, 0, 6], [81, 6, 2], [82, 8, 4], [86, 12, 4]],
  16: [[85, 0, 8], [88, 8, 6], [89, 14, 2]],
};
[21, 22, 23, 24].forEach((b, i) => { MELODY[b] = MELODY[7 + i].map(([m, s, l]) => [m + 2, s, l]); });
const OUTRO_MEL = { 31: [[74, 0, 8], [77, 8, 8]], 32: [[72, 0, 8], [69, 8, 8]], 33: [[76, 0, 8], [79, 8, 8]], 34: [[77, 0, 16]], 35: [[74, 0, 8], [70, 8, 8]], 36: [[72, 0, 8], [76, 8, 8]], 37: [[78, 0, 16]] };
const S16 = BEAT / 4;
const barT = (b) => b * BAR;

function composeMusic(K) {
  const ostinato = (ch) => { const c = CH[ch]; return [c[0], c[2], c[0] + 12, c[2], c[1] + 12, c[2], c[0] + 12, c[2]]; };
  // ---------- intro (0 – 6.4) ----------
  drone(K, 0.2, 6.5, [26, 33, 38], 0.09, 420);
  choir(K, 0.6, [50, 57, 62], 2.6, 0.035);
  [[0.4, 74], [0.8, 69], [1.0, 70], [1.4, 69], [2.0, 74], [2.2, 75], [2.6, 74], [2.8, 70]].forEach(([t, m]) => koto(K, t, m, 0.4, 0.15, 2.4));
  [[1.6, 0.75], [2.4, 0.85], [2.8, 0.7], [2.9, 0.55]].forEach(([t, v]) => taiko(K, t, v, 72, -0.1));
  for (let t = 3.2; t < 6.39; t += BEAT / 2) bassNote(K, t, 26 + (Math.round((t - 3.2) / (BEAT / 2)) % 4 === 3 ? 12 : 0), BEAT / 2 - 0.02, 0.18 + 0.12 * sat(3.2, 6.4, t));
  for (let t = 3.2; t < 6.39; t += BEAT) taiko(K, t, 0.35 + 0.25 * sat(3.2, 6.4, t), 82);
  for (let t = 4.8; t < 6.39; t += BEAT / 2) guitar(K, t, 38, BEAT / 2 - 0.03, 0.05 + 0.04 * sat(4.8, 6.4, t));
  // ---------- VS + the sprint (6.4 – 9.6) ----------
  saws(K, 6.4, [50, 57, 62, 65], 3.1, 0.1, { attack: 2.5, release: 0.05, sweep: [300, 5000], rev: 0.3 });
  choir(K, 6.42, [62, 65, 69], 3.0, 0.05); brass(K, 6.42, [50, 57, 62], 0.14, 0.9);
  for (let t = 6.4; t < 9.5; t += BEAT / 2) { bassNote(K, t, 26 + (Math.round((t - 6.4) / (BEAT / 2)) % 2 ? 12 : 0), BEAT / 2 - 0.02, 0.3); guitar(K, t, 38, BEAT / 2 - 0.03, 0.09); }
  for (let t = 7.2; t < 9.5; t += BEAT / 2) taiko(K, t, 0.5 + 0.3 * sat(7.2, 9.5, t), 86, (Math.round(t / (BEAT / 2)) % 2) * 0.3 - 0.15);
  for (let t = 8.0; t < 9.5; t += t < 8.8 ? S16 : S16 / 2) snare(K, t, 0.25 + 0.6 * sat(8.0, 9.5, t), 0.1);
  riser(K, 6.5, 9.55, 0.28); revCymbal(K, 9.6, 1.5, 0.3);
  // ---------- the fight (9.6 – 27.2) ----------
  const groove = (b, o = {}) => {
    const t0 = barT(b);
    const ks = o.half ? [0, 8] : [0, 3, 6, 8, 11, 14];
    ks.forEach((sx) => kick(K, t0 + sx * S16, sx === 0 ? 1 : 0.85));
    (o.half ? [8] : [4, 12]).forEach((sx) => snare(K, t0 + sx * S16, 0.95));
    if (!o.half) snare(K, t0 + 15 * S16, 0.25);
    for (let sx = 0; sx < 16; sx += o.half ? 2 : 1) hat(K, t0 + sx * S16, sx % 2 ? 0.07 : 0.14, sx === 14 && !o.half);
    taiko(K, t0, 0.55, 70, 0);
    if (o.crash) crash(K, t0, 0.32, 2.0);
  };
  const harmony = (b, o = {}) => {
    const ch = BARS[b], t0 = barT(b), r = ROOT[ch];
    const bp = [[0, 0], [2, 0], [3, 12], [5, 0], [6, 0], [8, 0], [10, 0], [11, 12], [13, 0], [14, 12]];
    if (!o.noBass) bp.forEach(([sx, oc]) => bassNote(K, t0 + sx * S16, r + oc, S16 * 1.6, 0.3));
    saws(K, t0, CH[ch].map((m) => m - 12).concat([CH[ch][0]]), BAR - 0.05, o.pad ?? 0.08, { attack: 0.01, release: 0.2, cutoff: 3000 });
    if (o.gtr !== false) [0, 2, 3, 5, 6, 8, 10, 11, 13, 14].forEach((sx) => guitar(K, t0 + sx * S16, r + 12, S16 * 1.4, o.gtrV ?? 0.085));
    if (o.ost !== false) ostinato(ch).forEach((m, i) => { koto(K, t0 + i * 2 * S16, m, 0.26, -0.35, 0.8); koto(K, t0 + (i * 2 + 1) * S16, m + (i % 2 ? 0 : 12), 0.15, 0.35, 0.6); });
    if (MELODY[b] && !o.noLead) MELODY[b].forEach(([m, sx, l]) => lead(K, t0 + sx * S16, m, l * S16, o.leadV ?? 0.12));
    if (o.choir) choir(K, t0, CH[ch], BAR, o.choir);
  };
  boom(K, 9.6, 1.0, 2.6); crash(K, 9.6, 0.5, 3.0); choir(K, 9.6, [50, 57, 62, 65, 69], 1.5, 0.09); brass(K, 9.6, [50, 57, 62, 65], 0.2, 1.2);
  groove(6, { half: true }); harmony(6, { noLead: true, ost: false, pad: 0.1, gtr: false });
  guitar(K, 9.6, 38, 1.4, 0.12, false);
  [10.8, 10.9, 11.0, 11.05, 11.1, 11.15].forEach((t, i) => taiko(K, t, 0.5 + i * 0.08, 95 - i * 3, i % 2 ? 0.3 : -0.3));
  for (let b = 7; b <= 16; b++) { groove(b, { crash: b === 7 || b === 11 || b === 14 }); harmony(b, { choir: b >= 11 ? 0.04 : 0 }); }
  // stops for the big hits
  for (const t of [12.92, 17.06, 23.6]) brass(K, t, [50, 57, 62, 65], 0.18, 0.8);
  // ---------- power-up (27.2 – 33.6) ----------
  pad(K, 27.2, [38, 45, 50, 53], 3.2, 0.07);
  choir(K, 28.8, [62, 65, 69], 1.6, 0.05); choir(K, 30.4, [58, 62, 65], 1.6, 0.06); choir(K, 31.2, [55, 58, 62, 67], 0.8, 0.07);
  saws(K, 32.0, [45, 52, 57, 61, 64], 1.55, 0.1, { attack: 1.2, release: 0.05, sweep: [400, 6000], rev: 0.3 });
  for (let t = 32.0; t < 33.55; t += BEAT / 2) { taiko(K, t, 0.5 + 0.4 * sat(32.0, 33.5, t), 88); guitar(K, t, 33 + 12, BEAT / 2 - 0.03, 0.08 + 0.05 * sat(32, 33.6, t)); }
  for (let t = 32.8; t < 33.55; t += S16 / 2) snare(K, t, 0.2 + 0.6 * sat(32.8, 33.55, t));
  for (let t = 32.0; t < 33.5; t += BEAT / 2) bassNote(K, t, 33 + (Math.round((t - 32) / (BEAT / 2)) % 2 ? 12 : 0), BEAT / 2 - 0.02, 0.3);
  riser(K, 32.0, 33.58, 0.3); revCymbal(K, 33.6, 1.2, 0.3);
  // ---------- beam clash, one step higher (33.6 – 39.6) ----------
  boom(K, 33.6, 0.8, 2.0); crash(K, 33.6, 0.45, 2.5); brass(K, 33.6, [52, 59, 64, 67], 0.2, 1.2);
  for (let b = 21; b <= 24; b++) {
    groove(b, { crash: b === 21 || b === 23 });
    for (let sx = 1; sx < 16; sx += 2) hat(K, barT(b) + sx * S16 + S16 / 2, 0.05);
    harmony(b, { choir: 0.07, leadV: 0.13, pad: 0.1, gtrV: 0.1 });
  }
  brass(K, 37.6, [52, 59, 64, 71], 0.22, 1.0);
  K.musicVol.setValueAtTime(1, 39.2); K.musicVol.linearRampToValueAtTime(1.15, 39.55); K.musicVol.setValueAtTime(0.0001, 39.6);
  // ---------- smoke + sword clashes (40.0 – 44.8) ----------
  K.musicVol.setValueAtTime(0.0001, 40.3); K.musicVol.linearRampToValueAtTime(1, 41.0);
  drone(K, 40.4, 44.8, [26, 38, 39], 0.06, 300);
  choir(K, 41.2, [62, 63], 0.8, 0.035);
  for (let t = 41.6; t < 44.75; t += S16 * 2) bassNote(K, t, (t < 43.2 ? 26 : 21) + (Math.round(t / (S16 * 2)) % 2 ? 12 : 0), S16 * 1.8, 0.22);
  [42.0, 42.4, 42.8, 43.2, 43.6, 44.0].forEach((t, i) => { taiko(K, t, 0.9, 70 + i * 2); kick(K, t, 0.9); brass(K, t, i < 3 ? [50, 57, 62] : [45, 52, 61], 0.16, 0.5); });
  for (let t = 42.0; t < 44.4; t += S16) hat(K, t, 0.06);
  K.musicVol.setValueAtTime(1, 44.7); K.musicVol.linearRampToValueAtTime(0.0001, 44.85);
  // ---------- the tower falls (46.85 – 49.6) ----------
  K.musicVol.setValueAtTime(0.0001, 46.8); K.musicVol.linearRampToValueAtTime(1, 47.0);
  choir(K, 47.0, [50, 57, 62, 65, 69], 2.6, 0.08); pad(K, 47.0, [26, 38, 45, 50], 2.6, 0.08);
  K.musicVol.setValueAtTime(1, 49.2); K.musicVol.linearRampToValueAtTime(0.0001, 49.5);
  // ---------- rain + outro (49.6 – 64.0) ----------
  K.musicVol.setValueAtTime(0.0001, 49.55); K.musicVol.linearRampToValueAtTime(1.2, 49.8);
  for (let b = 31; b <= 38; b++) {
    const ch = BARS[b], t0 = barT(b), c = CH[ch], last = b === 38;
    pad(K, t0, [ROOT[ch] + 12, ROOT[ch] + 19].concat(c.map((m) => m - 12)), last ? 2.6 : BAR + 0.15, last ? 0.055 : 0.045);
    choir(K, t0, c, last ? 2.8 : BAR, 0.04);
    bassNote(K, t0, ROOT[ch], last ? 1.8 : BAR + 0.12, 0.11, 0.08, 0.5);
    const arp = [c[0] - 12, c[1] - 12, c[2] - 12, c[0], c[1], c[2], c[0], c[2]];
    arp.forEach((m, i) => koto(K, t0 + i * BEAT / 2, m, 0.2, (i % 2 ? 0.3 : -0.3), 2.2));
    (OUTRO_MEL[b] || []).forEach(([m, sx, l]) => koto(K, t0 + sx * S16, m + 12, 0.3, 0, Math.min(2.6, l * S16 + 1)));
    taiko(K, t0, 0.35, 66);
  }
  taiko(K, 61.65, 0.8, 60); metal(K, 61.65, 0.25, 0, 880, 2.5);
  K.musicVol.setValueAtTime(1.2, 63.0); K.musicVol.linearRampToValueAtTime(0.0001, 63.95);
}

/* ---------- sound effects from the story events ---------- */
function composeSFX(K) {
  const pan = (e) => { const c = e.t < 17.6 ? 0 : 7700; return clamp(((e.x ?? c) - c) / 900, -0.7, 0.7); };
  windBed(K, 0, 6.6, 0.16);
  fireBed(K, 0.2, 49.6, 0.07);
  siren(K, 0.3, 6.8, 0.028, -0.4); siren(K, 1.6, 7.5, 0.02, 0.5);
  windBed(K, 40.0, 49.7, 0.14);
  rainBed(K, 49.6, 64.0, 0.2);
  route(K, chain(osc(K, 'sine', 3700, 40.0, 3.4), envS(K, 40.0, 0.4, 0.012, 43.0, 0.3)), K.sfx, 0, 0.1);
  for (const [t, d, f0, f1, v, p0, p1] of [[8.2, 0.5, 300, 2600, 0.45, -0.6, 0], [8.22, 0.5, 280, 2400, 0.45, 0.6, 0], [9.15, 0.45, 600, 4200, 0.4, 0, 0]]) whoosh(K, t, d, f0, f1, v, p0, p1);
  for (let i = 0; i < 6; i++) { const t = 18.4 + i * 0.4; whoosh(K, t - 0.3, 0.3, 500, 3800, 0.3, i % 2 ? 0.7 : -0.7, 0); }
  { const o = osc(K, 'sine', 1900, 26.35, 0.9); o.frequency.exponentialRampToValueAtTime(240, 27.18);
    route(K, chain(o, envS(K, 26.35, 0.3, 0.08, 27.15, 0.04)), K.sfx, 0, 0.2); fire(K, 26.35, 0.85, 0.35, 0); whoosh(K, 26.6, 0.55, 3000, 400, 0.4, 0, 0); }
  for (let t = 24.1; t < 26.3; t += 0.55) whoosh(K, t, 0.5, 200, 900, 0.25, 0.2, -0.2);
  for (const e of EV) {
    const t = e.t, p = pan(e);
    switch (e.type) {
      case 'farBlast': explosion(K, t, 0.25, 0.8, 0.4); break;
      case 'cut': boom(K, t, 0.45, 1.2); break;
      case 'eyeGlint': glint(K, t, 0.2, e.who === 'shiden' ? -0.3 : 0.3); break;
      case 'roar': growl(K, t, 0.7, 0.4, p); break;
      case 'nameSlam': taiko(K, t, 1.0, 64); boom(K, t, 0.6, 1.6); crash(K, t, 0.3, 1.8); if (e.who === 'shiden') zap(K, t, 0.5, 0.3, -0.3); else fire(K, t, 0.9, 0.4, 0.3); break;
      case 'strike': thunder(K, t, 1.0, 0); punch(K, t, 0.8, 0, 0.8); break;
      case 'vs': boom(K, t, 0.9, 2.0); crash(K, t, 0.45, 2.2); metal(K, t, 0.35, 0, 300, 1.4); break;
      case 'crouch': whoosh(K, t, 0.2, 200, 700, 0.15); break;
      case 'launch': thud(K, t, 0.8, -0.5); thud(K, t + 0.01, 0.8, 0.5); crash(K, t, 0.12, 0.6); break;
      case 'carFlip': metalCrunch(K, t, 0.6, p); glassShower(K, t + 0.05, 0.8, 0.25, p); break;
      case 'clash': punch(K, t, 1.0, 0, 1.4); metal(K, t, 0.5, 0, 420, 1.4); thunder(K, t + 0.02, 0.5, -0.3); fire(K, t, 1.0, 0.4, 0.3); break;
      case 'glassRain': glassShower(K, t, 2.4, 0.45, 0); break;
      case 'whoosh': whoosh(K, t, 0.4, 300, 2200, 0.4, 0.4, -0.3); break;
      case 'swish': whoosh(K, t - 0.06, 0.18, 800, 3000, 0.3, 0.2, -0.2); break;
      case 'flip': whoosh(K, t, 0.35, 400, 1500, 0.3, -0.2, -0.4); break;
      case 'dash': case 'charge': whoosh(K, t, 0.3, 300, 2600, 0.35, p - 0.3, p + 0.3); break;
      case 'land': case 'kneelThud': thud(K, t, 0.5, p); break;
      case 'kickHit': punch(K, t, 1.0, p, 0.9); break;
      case 'carSmash': metalCrunch(K, t, 0.9, p); glassShower(K, t + 0.03, 1.2, 0.35, p); break;
      case 'lift': growl(K, t, 0.35, 0.25, p); metal(K, t, 0.2, p, 160, 0.8); break;
      case 'hurl': whoosh(K, t, 0.45, 200, 1400, 0.45, 0.4, -0.5); fire(K, t, 0.5, 0.3, 0); break;
      case 'slice': slashShing(K, t, 0.9); metalCrunch(K, t + 0.02, 0.5, p); break;
      case 'carBoom': explosion(K, t, 0.8, 1.0, p); glassShower(K, t + 0.04, 1.0, 0.25, p); break;
      case 'tackleHit': punch(K, t, 0.8, p, 0.5); break;
      case 'rushHit': punch(K, t, 0.42 + (e.k % 3) * 0.05, e.k % 2 ? 0.3 : -0.3, 0); break;
      case 'uppercutBig': punch(K, t, 1.0, p, 1.2); zap(K, t, 0.4, 0.4, p); break;
      case 'leap': thud(K, t, 0.7, 0); whoosh(K, t, 0.4, 250, 2600, 0.4); break;
      case 'skyHit': punch(K, t, 0.8, 0, e.big ? 0.8 : 0.3); metal(K, t, 0.2, 0, 560); glassShower(K, t + 0.05, 0.6, 0.15, 0.4); break;
      case 'block': punch(K, t, 0.6, p, 0.2); metal(K, t, 0.3, p, 640, 0.8); break;
      case 'hit': punch(K, t, 0.85, p, 0.4); break;
      case 'clash2': punch(K, t, 1.0, 0, 1.0); metal(K, t, 0.4, 0, 480, 1.2); break;
      case 'powerUp': powerRoar(K, t, e.dur || 1.5, 0.32, e.who === 'shiden' ? -0.2 : 0.2, e.who !== 'guren'); break;
      case 'megaClash': punch(K, t, 1.0, 0, 1.6); explosion(K, t, 0.6, 1.0, 0); thunder(K, t + 0.03, 0.4, -0.4); glassShower(K, t + 0.08, 2.2, 0.4, 0); break;
      case 'teleport': whoosh(K, t - 0.08, 0.12, 300, 5000, 0.3, p, p); fire(K, t, 0.35, 0.3, p); break;
      case 'axeHit': punch(K, t, 1.0, 0, 0.9); break;
      case 'wallSmash': metalCrunch(K, t, 0.6, -0.3); glassShower(K, t, 1.4, 0.4, -0.3); break;
      case 'fall': fire(K, t, 0.8, 0.3, 0); break;
      case 'meteor': explosion(K, t, 1.0, 1.4, 0); crash(K, t, 0.4, 2.5); glassShower(K, t + 0.06, 2.0, 0.35, 0); break;
      case 'carCrush': metalCrunch(K, t, 0.8, p); break;
      case 'laugh': for (let k = 0; k < 4; k++) growl(K, t + k * 0.11, 0.08, 0.18, p); break;
      case 'heartbeat': heartbeat(K, t, 0.75); break;
      case 'thunderStrike': thunder(K, t, 1.0, 0); break;
      case 'flameBurst': fire(K, t, 1.6, 0.6, 0.3); boom(K, t, 0.7, 1.6); growl(K, t, 1.0, 0.3, 0.3); break;
      case 'split': crash(K, t, 0.35, 1.6); boom(K, t, 0.5, 1.2); break;
      case 'chargeBall': chargeTone(K, t, t + e.dur, 0.16); break;
      case 'beamFire': whoosh(K, t - 0.05, 0.25, 300, 4000, 0.5, -0.6, 0); whoosh(K, t - 0.05, 0.25, 280, 3800, 0.5, 0.6, 0); break;
      case 'beamClash': explosion(K, t, 0.7, 0.8, 0); crash(K, t, 0.45, 2.2); break;
      case 'beamHold': beamLoop(K, t, t + e.dur, 0.2); break;
      case 'push': powerRoar(K, t, 0.8, 0.2, 0.3, false); break;
      case 'surgeFlash': glint(K, t, 0.25, -0.2); boom(K, t, 0.5, 1.0); break;
      case 'surge': thunder(K, t, 0.8, -0.3); boom(K, t, 0.8, 1.6); crash(K, t, 0.4, 2.0); break;
      case 'unstable': riser(K, t, t + 0.4, 0.3); break;
      case 'megaExplosion': explosion(K, t, 1.0, 2.2, 0); crash(K, t, 0.5, 3.5); thunder(K, t + 0.05, 0.6, 0); glassShower(K, t + 0.1, 2.5, 0.4, 0); break;
      case 'bladeShiden': zap(K, t, 0.5, 0.35, -0.4); glint(K, t + 0.2, 0.18, -0.4); break;
      case 'bladeGuren': fire(K, t, 0.8, 0.45, 0.4); glint(K, t + 0.2, 0.16, 0.4); break;
      case 'swordClash': metal(K, t, 0.6, (e.k % 2 ? 0.2 : -0.2), 700 + e.k * 40, 1.2); punch(K, t, 0.6, 0, 0.4); if (e.k % 2) fire(K, t, 0.4, 0.25, 0.3); else zap(K, t, 0.25, 0.25, -0.3); break;
      case 'lampCut': metal(K, t, 0.4, -0.3, 900, 1.0); metalCrunch(K, t + 0.9, 0.4, -0.3); break;
      case 'carCut': slashShing(K, t, 0.5); metalCrunch(K, t + 0.6, 0.5, 0.3); break;
      case 'dashFinal': whoosh(K, t, 0.12, 300, 6000, 0.5, -0.8, 0.8); break;
      case 'slash': slashShing(K, t, 1.0); break;
      case 'ribbonCut': whoosh(K, t, 0.5, 900, 400, 0.12, -0.2, -0.6); break;
      case 'shatter': shatter(K, t, 0.6, -0.4); break;
      case 'finalBlast': explosion(K, t, 1.0, 1.3, -0.4); thunder(K, t + 0.02, 0.6, -0.3); fire(K, t, 1.2, 0.5, -0.4); crash(K, t, 0.4, 2.5); break;
      case 'towerCut': slashShing(K, t, 0.9); boom(K, t + 0.05, 0.7, 2.0); break;
      case 'towerSlide': grind(K, t, e.dur, 0.55); break;
      case 'towerCrash': explosion(K, t, 1.0, 2.4, -0.4); boom(K, t, 1.0, 3.0); glassShower(K, t + 0.1, 2.6, 0.4, -0.3); crash(K, t, 0.4, 3.0); break;
      case 'rainStart': thunder(K, t, 0.8, -0.5); break;
      case 'fistRaise': glint(K, t, 0.14, 0); break;
      default: break;
    }
  }
}

/* sidechain-style pumping on the music bus, driven by the kicks */
function applyDucking(K) {
  const g = K.duck.gain;
  g.setValueAtTime(1, 0);
  K.kicks.sort((a, b) => a[0] - b[0]);
  for (const [t, v] of K.kicks) {
    g.setValueAtTime(1, Math.max(0, t - 0.002));
    g.linearRampToValueAtTime(1 - 0.45 * v, t + 0.008);
    g.setTargetAtTime(1, t + 0.02, 0.07);
  }
}

async function renderSoundtrack() {
  const SR = 48000;
  const ctx = new OfflineAudioContext(2, Math.ceil(SR * (DURATION + 0.4)), SR);
  const K = makeKit(ctx);
  composeMusic(K);
  composeSFX(K);
  applyDucking(K);
  const buf = await ctx.startRendering();
  return buf;
}
function wavBase64(buf, fadeOut = 0.35) {
  const n = Math.floor(buf.sampleRate * DURATION), ch = [buf.getChannelData(0), buf.getChannelData(1)];
  let peak = 0;
  for (const c of ch) for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(c[i]));
  const norm = peak > 0 ? 0.86 / peak : 1;
  const bytes = new Uint8Array(44 + n * 4), dv = new DataView(bytes.buffer);
  const wr = (o, s) => { for (let i = 0; i < s.length; i++) bytes[o + i] = s.charCodeAt(i); };
  wr(0, 'RIFF'); dv.setUint32(4, 36 + n * 4, true); wr(8, 'WAVE'); wr(12, 'fmt ');
  dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 2, true); dv.setUint32(24, buf.sampleRate, true);
  dv.setUint32(28, buf.sampleRate * 4, true); dv.setUint16(32, 4, true); dv.setUint16(34, 16, true); wr(36, 'data'); dv.setUint32(40, n * 4, true);
  const fadeN = Math.floor(fadeOut * buf.sampleRate);
  for (let i = 0; i < n; i++) {
    const f = i > n - fadeN ? (n - i) / fadeN : 1;
    for (let c = 0; c < 2; c++) dv.setInt16(44 + i * 4 + c * 2, Math.max(-32767, Math.min(32767, Math.round(ch[c][i] * norm * f * 32767))), true);
  }
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return { b64: btoa(s), peak };
}
