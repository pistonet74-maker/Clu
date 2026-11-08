#!/usr/bin/env node
/* =====================================================================
 * render.js — renders STICKMAN DUEL to an MP4.
 *
 *   node render.js [--out ../stickman-duel.mp4] [--workers 4] [--from 0] [--to 57.6]
 *                  [--crf 19] [--no-audio] [--keep-frames] [--reuse-frames] [--reuse-audio]
 *                  [--patch 6.4:6.6,19.2:19.4]   (re-render only those ranges, then re-encode)
 *
 * Every frame is a pure function of time, so N headless Chromium workers
 * render interleaved frames in parallel; the soundtrack is synthesised
 * with an OfflineAudioContext in its own browser; ffmpeg muxes the result.
 * ===================================================================== */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : def; };
const flag = (name) => args.includes('--' + name);

const ROOT = __dirname;
const OUT = path.resolve(opt('out', path.join(ROOT, '..', 'stickman-duel.mp4')));
const WORK = path.join(ROOT, 'out');
const FRAMES = path.join(WORK, 'frames');
const WORKERS = +opt('workers', 4);
const CRF = opt('crf', '19');
const QUALITY = +opt('jpeg', 0.94);
const PAGE = 'file://' + path.join(ROOT, 'index.html');

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  await page.goto(PAGE);
  await page.evaluate(() => FIGHT.ready());
  return page;
}

async function renderFrames(from, to, base = from) {
  fs.mkdirSync(FRAMES, { recursive: true });
  const meta = { fps: 60 };
  const i0 = Math.round(from * meta.fps), i1 = Math.round(to * meta.fps), b0 = Math.round(base * meta.fps);
  const total = i1 - i0;
  let done = 0;
  const started = Date.now();
  const worker = async (k) => {
    const browser = await chromium.launch({ args: ['--disable-gpu'] });
    const page = await openPage(browser);
    const mine = [];
    for (let i = i0 + k; i < i1; i += WORKERS) mine.push(i);
    const BATCH = 4;
    for (let b = 0; b < mine.length; b += BATCH) {
      const ids = mine.slice(b, b + BATCH);
      const urls = await page.evaluate(([ids, q]) => ids.map((i) => FIGHT.frameJPEG(i, q)), [ids, QUALITY]);
      ids.forEach((i, j) => fs.writeFileSync(path.join(FRAMES, `f_${String(i - b0).padStart(5, '0')}.jpg`), Buffer.from(urls[j].split(',')[1], 'base64')));
      done += ids.length;
      if (k === 0 && (b / BATCH) % 10 === 0) {
        const el = (Date.now() - started) / 1000, eta = (el / done) * (total - done);
        process.stdout.write(`\r  frames ${done}/${total}  ${(done / el).toFixed(1)} fps  eta ${eta.toFixed(0)}s   `);
      }
    }
    await browser.close();
  };
  await Promise.all(Array.from({ length: WORKERS }, (_, k) => worker(k)));
  console.log(`\n  ${total} frames in ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

async function renderAudio(file) {
  const browser = await chromium.launch({ args: ['--disable-gpu'] });
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  await page.goto(PAGE);
  const r = await page.evaluate(() => FIGHT.audio());
  fs.writeFileSync(file, Buffer.from(r.b64, 'base64'));
  console.log(`  soundtrack synthesised in ${(r.ms / 1000).toFixed(1)}s (raw peak ${r.peak.toFixed(2)})`);
  await browser.close();
}

function ffmpeg(argv) {
  return new Promise((res, rej) => {
    const p = spawn('ffmpeg', argv, { stdio: ['ignore', 'inherit', 'inherit'] });
    p.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg exit ' + c))));
  });
}

(async () => {
  const from = +opt('from', 0);
  const duration = 57.6;
  const to = Math.min(+opt('to', duration), duration);
  fs.mkdirSync(WORK, { recursive: true });
  const patch = opt('patch', null);
  if (patch) {
    // re-render only some time ranges into the existing (full-length) frame sequence
    for (const r of patch.split(',')) { const [a, b] = r.split(':').map(Number); console.log(`  patching ${a}s → ${b}s`); await renderFrames(a, b, 0); }
    args.push('--reuse-frames', '--keep-frames');
  }
  const reuseFrames = flag('reuse-frames');
  if (!reuseFrames) for (const f of fs.existsSync(FRAMES) ? fs.readdirSync(FRAMES) : []) fs.unlinkSync(path.join(FRAMES, f));
  const wav = path.join(WORK, 'soundtrack.wav');
  console.log(`STICKMAN DUEL — rendering ${from}s → ${to}s with ${WORKERS} workers`);
  const jobs = reuseFrames ? [] : [renderFrames(from, to)];
  if (!flag('no-audio') && !flag('reuse-audio')) jobs.push(renderAudio(wav));
  await Promise.all(jobs);
  if (flag('no-encode')) { console.log('  frames ready (no encode)'); return; }
  const withAudio = !flag('no-audio') && fs.existsSync(wav);
  const argv = ['-hide_banner', '-loglevel', 'warning', '-stats', '-y', '-framerate', '60', '-i', path.join(FRAMES, 'f_%05d.jpg')];
  if (withAudio) argv.push('-ss', String(from), '-i', wav);
  argv.push('-c:v', 'libx264', '-preset', 'slow', '-crf', CRF, '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-tune', 'animation',
    '-x264-params', 'keyint=120:min-keyint=30', '-movflags', '+faststart');
  if (withAudio) argv.push('-c:a', 'aac', '-b:a', '256k', '-shortest');
  argv.push(OUT);
  console.log('  encoding →', OUT);
  await ffmpeg(argv);
  if (!flag('keep-frames')) for (const f of fs.readdirSync(FRAMES)) fs.unlinkSync(path.join(FRAMES, f));
  console.log('done:', OUT, (fs.statSync(OUT).size / 1e6).toFixed(1), 'MB');
})().catch((e) => { console.error(e); process.exit(1); });
