// Contact sheet: one PNG tiling N frames across the timeline — eyeball pacing
// and scene coverage without sitting through a full render.
//   node contact.mjs --html showreel.html --dur 15 --grid 4x3 --scale 0.25
import puppeteer from 'puppeteer-core';
import { pathToFileURL } from 'node:url';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { spawnSync, execSync } from 'node:child_process';
import path from 'node:path';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const HTML = path.resolve(arg('html', 'showreel.html'));
const DIR = path.dirname(HTML);
const DUR = +arg('dur', 15), W = +arg('w', 1080), H = +arg('h', 1920), SCALE = +arg('scale', 0.25);
const [COLS, ROWS] = arg('grid', '4x3').split('x').map(Number);
const N = COLS * ROWS, TMP = path.join(DIR, '.contact'), OUT = path.join(DIR, 'contact.png');

function findBrowser() {
  return ['C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome', '/usr/bin/chromium'].find(existsSync);
}
function findFfmpeg() {
  const home = process.env.USERPROFILE || process.env.HOME || '';
  const c = ['ffmpeg', path.join(home, 'AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe')];
  const pkgs = path.join(home, 'AppData/Local/Microsoft/WinGet/Packages');
  if (existsSync(pkgs)) for (const d of require_dir(pkgs)) if (/ffmpeg/i.test(d))
    for (const b of require_dir(path.join(pkgs, d))) { const p = path.join(pkgs, d, b, 'bin', 'ffmpeg.exe'); if (existsSync(p)) c.push(p); }
  for (const p of c) { try { execSync(`"${p}" -version`, { stdio: 'ignore' }); return p; } catch {} }
  throw new Error('ffmpeg not found');
}
import { readdirSync } from 'node:fs';
const require_dir = d => readdirSync(d);
const pad = n => String(n).padStart(3, '0');

rmSync(TMP, { recursive: true, force: true }); mkdirSync(TMP, { recursive: true });
const b = await puppeteer.launch({ executablePath: findBrowser(), headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--force-device-scale-factor=1'] });
const page = await b.newPage();
const errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(HTML).href, { waitUntil: 'networkidle0' });
await page.evaluate(() => window.__ready);
const el = await page.$('#c');
for (let i = 0; i < N; i++) {
  const t = N > 1 ? (i / (N - 1)) * (DUR - 0.001) : 0;
  await page.evaluate(tt => window.renderFrame(tt), t);
  await el.screenshot({ path: path.join(TMP, `s${pad(i)}.png`) });
}
await b.close();

const scaledW = Math.round(W * SCALE), scaledH = Math.round(H * SCALE);
const r = spawnSync(findFfmpeg(), ['-y', '-i', path.join(TMP, 's%03d.png'),
  '-vf', `scale=${scaledW}:${scaledH},tile=${COLS}x${ROWS}:margin=8:padding=6:color=0x111111`,
  '-frames:v', '1', OUT], { stdio: 'inherit' });
if (r.status !== 0) throw new Error('ffmpeg tile failed');
rmSync(TMP, { recursive: true, force: true });
console.log('page errors:', errs.length ? errs : 'none');
console.log(`done -> ${OUT}  (${COLS}x${ROWS} across ${DUR}s)`);
