// usage: node tools/audio.js out.wav
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const out = process.argv[2] || 'soundtrack.wav';
  const b = await chromium.launch();
  const p = await b.newPage();
  p.on('pageerror', (e) => console.log('[pageerror]', e.message));
  p.on('console', (m) => console.log('[page]', m.text()));
  await p.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  const r = await p.evaluate(() => FIGHT.audio());
  fs.writeFileSync(out, Buffer.from(r.b64, 'base64'));
  console.log('audio ms', r.ms, 'raw peak', r.peak.toFixed(3), '->', out);
  await b.close();
})();
