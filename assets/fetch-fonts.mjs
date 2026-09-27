// Fetch the video's web fonts locally so render/preview need no network and are
// reproducible. Run once in the working dir: `node fetch-fonts.mjs`
// Generates fonts/fonts.css + the .woff2 files, then point brand.js at them:
//   fontsUrl: 'fonts/fonts.css'
//
// Edit CSS_URL to match the families in your brand.js (Google Fonts css2 syntax).
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const CSS_URL = 'https://fonts.googleapis.com/css2?family=Poppins:wght@600;800&family=Inter:wght@400;600&display=swap';
const DIR = path.resolve('fonts');
// a modern-browser UA makes Google serve woff2 (not ttf)
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

mkdirSync(DIR, { recursive: true });
const css = await (await fetch(CSS_URL, { headers: { 'User-Agent': UA } })).text();

let out = css, n = 0;
const urls = [...css.matchAll(/url\((https:\/\/[^)]+\.woff2)\)/g)].map(m => m[1]);
const seen = new Map();
for (const url of urls) {
  if (!seen.has(url)) {
    const file = `f${seen.size}.woff2`; seen.set(url, file);
    const buf = Buffer.from(await (await fetch(url, { headers: { 'User-Agent': UA } })).arrayBuffer());
    writeFileSync(path.join(DIR, file), buf); n++;
  }
  out = out.replaceAll(`url(${url})`, `url(${seen.get(url)})`);
}
writeFileSync(path.join(DIR, 'fonts.css'), out);
console.log(`done -> fonts/fonts.css + ${n} woff2 files (offline-ready; set brand.js fontsUrl:'fonts/fonts.css')`);
