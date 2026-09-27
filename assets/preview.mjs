// Quick sample-frame preview — render a few timestamps to PNGs, report errors.
// Usage: node preview.mjs --html showreel.html --at 1.5,5,9,13 --w 1080 --h 1920
import puppeteer from 'puppeteer-core';
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const HTML = path.resolve(arg('html', 'showreel.html'));
const DIR = path.dirname(HTML);
const W = +arg('w', 1080), H = +arg('h', 1920);
const AT = arg('at', '1.5,5,9,13').split(',').map(Number);

const browser = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium'].find(existsSync);

const b = await puppeteer.launch({ executablePath: browser, headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--force-device-scale-factor=1'] });
const page = await b.newPage();
const errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(HTML).href, { waitUntil: 'networkidle0' });
await page.evaluate(() => window.__ready);
const el = await page.$('#c');
for (const t of AT) {
  await page.evaluate(tt => window.renderFrame(tt), t);
  await el.screenshot({ path: path.join(DIR, `preview-${t}.png`) });
}
await b.close();
console.log('page errors:', errs.length ? errs : 'none');
console.log('previews:', AT.map(t => `preview-${t}.png`).join(', '));
