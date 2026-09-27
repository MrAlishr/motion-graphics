// Generic frame renderer: drives a headless Chromium (Edge/Chrome) over a
// showreel HTML that exposes window.renderFrame(t) + window.__ready, dumps
// PNG frames, then encodes an mp4 with ffmpeg.
//
// Usage:
//   node render.mjs --html showreel.html --out video.mp4 --dur 15 --fps 60 --w 1080 --h 1920
//   --cache   reuse .frames when the HTML + params are byte-identical (safe: any
//             edit changes the signature and forces a full re-render). Lets you
//             re-encode, or resume an interrupted identical run, without re-shooting.
// Defaults: dur 15, fps 60, 1080x1920, out <html>.mp4
import puppeteer from 'puppeteer-core';
import { pathToFileURL } from 'node:url';
import { existsSync, mkdirSync, rmSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync, execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const has = k => argv.includes(`--${k}`);

const HTML = path.resolve(arg('html', 'showreel.html'));
const DIR = path.dirname(HTML);
const FPS = +arg('fps', 60), DUR = +arg('dur', 15), TOTAL = Math.round(FPS * DUR);
const W = +arg('w', 1080), H = +arg('h', 1920);
const OUT = path.resolve(arg('out', HTML.replace(/\.html$/, '.mp4')));
const FRAMES = path.join(DIR, '.frames');

function findBrowser() {
  const c = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];
  for (const p of c) if (existsSync(p)) return p;
  throw new Error('No Chrome/Edge found — set one in findBrowser()');
}
function findFfmpeg() {
  const home = process.env.USERPROFILE || process.env.HOME || '';
  const c = ['ffmpeg', path.join(home, 'AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe'), 'C:/ffmpeg/bin/ffmpeg.exe'];
  const pkgs = path.join(home, 'AppData/Local/Microsoft/WinGet/Packages');
  if (existsSync(pkgs)) for (const d of readdirSync(pkgs)) {
    if (!/ffmpeg/i.test(d)) continue;
    for (const b of readdirSync(path.join(pkgs, d))) {
      const p = path.join(pkgs, d, b, 'bin', 'ffmpeg.exe');
      if (existsSync(p)) c.push(p);
    }
  }
  for (const p of c) { try { execSync(`"${p}" -version`, { stdio: 'ignore' }); return p; } catch {} }
  throw new Error('ffmpeg not found — install it (winget install Gyan.FFmpeg)');
}
const pad = n => String(n).padStart(5, '0');
const CACHE = has('cache');
const SIG = path.join(FRAMES, '.sig');
const sig = createHash('sha256').update(readFileSync(HTML)).update(`${FPS}|${DUR}|${W}|${H}`).digest('hex');
const framesValid = () => existsSync(SIG) && readFileSync(SIG, 'utf8') === sig
  && Array.from({ length: TOTAL }, (_, f) => path.join(FRAMES, `f${pad(f)}.png`)).every(existsSync);

async function main() {
  const ffmpeg = findFfmpeg();

  if (CACHE && framesValid()) {
    console.log(`cache hit — reusing ${TOTAL} frames, skipping render`);
  } else {
    rmSync(FRAMES, { recursive: true, force: true });
    mkdirSync(FRAMES, { recursive: true });
    const browser = await puppeteer.launch({
      executablePath: findBrowser(), headless: 'new',
      args: ['--no-sandbox', '--disable-gpu', `--window-size=${W},${H}`, '--force-device-scale-factor=1'],
    });
    const page = await browser.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(String(e)));
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(HTML).href, { waitUntil: 'networkidle0' });
    await page.evaluate(() => window.__ready);
    if (errs.length) console.warn('page errors:', errs);

    const el = await page.$('#c');
    console.log(`rendering ${TOTAL} frames @ ${FPS}fps (${W}x${H}) ...`);
    for (let f = 0; f < TOTAL; f++) {
      await page.evaluate(tt => window.renderFrame(tt), f / FPS);
      await el.screenshot({ path: path.join(FRAMES, `f${pad(f)}.png`) });
      if (f % 120 === 0) console.log(`  ${f}/${TOTAL}`);
    }
    await browser.close();
    writeFileSync(SIG, sig);
  }

  console.log('encoding mp4 ...');
  const r = spawnSync(ffmpeg, ['-y', '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%05d.png'),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-movflags', '+faststart', OUT], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('ffmpeg failed');
  if (!CACHE) rmSync(FRAMES, { recursive: true, force: true });   // --cache keeps frames for reuse
  console.log('done ->', OUT);
}
main().catch(e => { console.error(e); process.exit(1); });
