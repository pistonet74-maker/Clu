// usage: node tools/snap.js out.png [cols] [scale] t1 t2 t3 ...   (or "--expr <js>" to run custom code)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const args = process.argv.slice(2);
  const out = args.shift();
  let page = 'index.html';
  if (args[0] === '--page') { args.shift(); page = args.shift(); }
  let expr = null;
  if (args[0] === '--expr') { args.shift(); expr = args.shift(); }
  const cols = +args.shift() || 3, scale = +args.shift() || 0.333;
  const times = args.map(Number);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('console', (m) => console.log('[page]', m.text()));
  p.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await p.goto('file://' + path.resolve(__dirname, '..', page));
  if (page === 'index.html') await p.evaluate(() => FIGHT.ready());
  const t0 = Date.now();
  const d = expr ? await p.evaluate(expr) : await p.evaluate(([t, c, s]) => FIGHT.sheet(t, c, s), [times, cols, scale]);
  console.log('render ms', Date.now() - t0);
  fs.writeFileSync(out, Buffer.from(d.split(',')[1], 'base64'));
  await b.close();
})();
