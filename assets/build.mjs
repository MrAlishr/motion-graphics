// Build harness for the motion-graphics engine. ONE timeline drives both the
// video and the audio, so captions/voiceover and cuts stay in sync and never
// overlap.
//
//   node build.mjs                 # tts (if any) -> patch timing -> render -> mux -> verify
//   node build.mjs --skip-tts      # reuse vo*.mp3, still re-time
//   node build.mjs --skip-render   # reuse the mp4 (timing unchanged)
//
// Edit SPEC below. Each scene is either { hold: seconds } or { say: 'line' }
// (duration measured from the voiceover). `audio`: 'none' | 'music' | 'voice'.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync, execSync } from 'node:child_process';
import path from 'node:path';

// ============ SPEC — edit this ============================================
const SPEC = {
  html: 'showreel.html', out: 'out.mp4',
  dur: 15, fps: 60, w: 1080, h: 1920,
  xfade: 0.45,                       // crossfade window between scenes
  audio: 'none',                     // 'none' | 'music' | 'voice'
  voice: 'en-US-AriaNeural', rate: '+0%',   // edge-tts voice for `say` lines
  lead: 0.28, tail: 0.55,            // silence before / hold after each spoken line
  caption: true,                     // burn muted-first captions from `say` lines
  scenes: [
    { hold: 7.5 },                   // e.g. { say: 'Your first line' } to time from voice
    { hold: 7.5 },
  ],
};
// ==========================================================================

const argv = process.argv.slice(2), has = k => argv.includes(`--${k}`);
const DIR = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'));
const HTML = path.join(DIR, SPEC.html), VIDEO = path.join(DIR, SPEC.out);
const OUT = VIDEO.replace(/\.mp4$/, '-audio.mp4');
const hasVoice = SPEC.audio === 'voice' && SPEC.scenes.some(s => s.say);

function find(name) {
  const home = process.env.USERPROFILE || process.env.HOME || '';
  const c = [name, path.join(home, `AppData/Local/Microsoft/WinGet/Links/${name}.exe`)];
  const pkgs = path.join(home, 'AppData/Local/Microsoft/WinGet/Packages');
  if (existsSync(pkgs)) for (const d of readdirSync(pkgs)) { if (!/ffmpeg/i.test(d)) continue;
    for (const b of readdirSync(path.join(pkgs, d)))
      { const p = path.join(pkgs, d, b, 'bin', `${name}.exe`); if (existsSync(p)) c.push(p); } }
  for (const p of c) { try { execSync(`"${p}" -version`, { stdio: 'ignore' }); return p; } catch {} }
  throw new Error(`${name} not found`);
}
const ffmpeg = find('ffmpeg'), ffprobe = find('ffprobe');
const probe = f => parseFloat(execSync(`"${ffprobe}" -v error -show_entries format=duration -of default=nw=1:nk=1 "${f}"`).toString());

// ---- voiceover: synth each `say` line, measure it ------------------------
const voFile = i => path.join(DIR, `vo${i + 1}.mp3`);
if (hasVoice && !has('skip-tts')) SPEC.scenes.forEach((s, i) => {
  if (!s.say) return;
  const r = spawnSync('python', ['-m', 'edge_tts', '--voice', SPEC.voice, `--rate=${SPEC.rate}`,
    '--text', s.say, '--write-media', voFile(i)], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`edge-tts failed on scene ${i + 1}`);
});

// ---- derive the shared timeline ------------------------------------------
const beats = [], caps = []; let t = 0;
SPEC.scenes.forEach((s, i) => {
  beats.push(+t.toFixed(3));
  let len;
  if (s.say) {
    const d = probe(voFile(i)); len = SPEC.lead + d + SPEC.tail;
    if (SPEC.caption) caps.push({ t: +(t + SPEC.lead).toFixed(2), end: +(t + SPEC.lead + d).toFixed(2), text: s.say });
  } else len = s.hold ?? 3;
  t += len;
});
const DUR = +t.toFixed(2);
const voStart = SPEC.scenes.map((s, i) => s.say ? beats[i] + SPEC.lead : null);
console.log(`timeline: DUR=${DUR}s  BEATS=[${beats.join(', ')}]`);

// ---- patch the timing block in the HTML ----------------------------------
const capLit = SPEC.caption ? caps.map(c => `{t:${c.t},end:${c.end},text:${JSON.stringify(c.text)}}`).join(',') : '';
const block = `/* __TIMING_START__ (build.mjs patches this; hand-edit only without the harness) */
let DUR=${DUR};
let BEATS=[${beats.join(', ')}];
let XFADE=${SPEC.xfade};
let CAPTIONS=[${capLit}];
/* __TIMING_END__ */`;
const html = readFileSync(HTML, 'utf8');
if (!/__TIMING_START__/.test(html)) throw new Error('no __TIMING__ block in ' + SPEC.html);
writeFileSync(HTML, html.replace(/\/\* __TIMING_START__[\s\S]*?__TIMING_END__ \*\//, block));

// ---- render --------------------------------------------------------------
if (!has('skip-render')) {
  console.log(`rendering ${DUR}s video ...`);
  const r = spawnSync('node', ['render.mjs', '--html', SPEC.html, '--out', VIDEO,
    '--dur', String(DUR), '--fps', String(SPEC.fps), '--w', String(SPEC.w), '--h', String(SPEC.h)],
    { cwd: DIR, stdio: 'inherit' });
  if (r.status !== 0) throw new Error('render.mjs failed');
}
if (!existsSync(VIDEO)) throw new Error(SPEC.out + ' missing — run without --skip-render');

// ---- audio (optional) ----------------------------------------------------
if (SPEC.audio === 'none') { console.log(`done -> ${VIDEO} (silent)`); process.exit(0); }

const inputs = ['-i', VIDEO], parts = [], labels = [];
// soft pad bed (A-minor triad)
parts.push(`aevalsrc='0.05*sin(2*PI*220*t)+0.045*sin(2*PI*261.6*t)+0.04*sin(2*PI*329.6*t)':s=44100:d=${DUR}`
  + `,afade=t=in:st=0:d=1.2,afade=t=out:st=${DUR - 1.4}:d=1.4[mus]`); labels.push('[mus]');
// whooshes on every cut after the first
beats.slice(1).forEach((b, i) => { const ms = Math.round(b * 1000);
  parts.push(`anoisesrc=d=0.35:c=pink:a=0.5:s=${1000 + i},highpass=f=400,lowpass=f=6000,`
    + `afade=t=in:st=0:d=0.03,afade=t=out:st=0.08:d=0.27,volume=0.5,adelay=${ms}|${ms}[w${i}]`); labels.push(`[w${i}]`); });
// voiceover
let n = 0;
if (hasVoice) voStart.forEach((s, i) => { if (s == null) return; const ms = Math.round(s * 1000);
  inputs.push('-i', voFile(i)); const idx = inputs.length / 2 - 1;   // video is input 0
  parts.push(`[${idx}:a]adelay=${ms}|${ms},volume=1.6[v${n}]`); labels.push(`[v${n}]`); n++; });
parts.push(`${labels.join('')}amix=inputs=${labels.length}:normalize=0:duration=longest,`
  + `atrim=0:${DUR},loudnorm=I=-16:TP=-1.5:LRA=11,aresample=44100[aout]`);

console.log('mixing audio ...');
const r = spawnSync(ffmpeg, ['-y', ...inputs, '-filter_complex', parts.join(';'),
  '-map', '0:v', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', OUT], { stdio: 'inherit' });
if (r.status !== 0) throw new Error('ffmpeg mix failed');

const info = execSync(`"${ffprobe}" -v error -select_streams a:0 -show_entries stream=codec_name -show_entries format=duration -of default=noprint_wrappers=1 "${OUT}"`).toString();
const outDur = parseFloat(info.match(/duration=([\d.]+)/)?.[1] || '0');
if (!/codec_name=aac/.test(info)) throw new Error('no audio stream in output');
if (Math.abs(outDur - DUR) > 0.5) throw new Error(`bad duration ${outDur}s (want ~${DUR})`);
console.log(`done -> ${OUT}  (aac, ${outDur.toFixed(2)}s)`);
