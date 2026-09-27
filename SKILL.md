---
name: motion-graphics
description: Create ANY short motion-graphics video from a text description — ads, promos, fun/meme clips, social reels/stories, countdowns, quotes, explainers, kinetic typography, animated logos/intros, data/stat reveals. Pure code — one HTML file with a renderFrame(t) function, rendered to MP4 via headless Chromium + ffmpeg. No After Effects, no video libraries. Use whenever the user wants to make/generate/animate a video or motion graphics of any kind. Brand-neutral engine that auto-matches the palette, fonts, name and direction to the project it is dropped into on first run.
---

# Motion graphics from code

Produce an MP4 the way a designer would — but every frame is drawn by math. Not
promo-specific: the canvas is blank, `renderFrame(t)` draws whatever you write.
Ads, fun clips, countdowns, quote cards, explainers, kinetic type, logo stings —
all the same engine. Method: one `showreel.html` exposing `renderFrame(t)` (pure
function of seconds), a headless browser screenshots N frames, ffmpeg stitches
them. Deterministic, re-renderable, versionable in git.

## Requirements (verify first)

- **ffmpeg** — `ffmpeg -version`. Missing on Windows: `winget install Gyan.FFmpeg` (winget leaves it unlinked under `…/WinGet/Packages/…`; `render.mjs` already scans that path).
- **A Chromium** — Chrome or Edge. `render.mjs` auto-finds both; Edge ships with Windows.
- **puppeteer-core** — install once in the working dir: `npm i puppeteer-core@23` (`package.json` should have `"type":"module"`).
- **edge-tts** (only if the user wants voiceover) — `python -m pip install edge-tts`. Free Microsoft neural voices; `--list-voices` for the language you need. `build.mjs` calls it.

## The core idea

`showreel.html` defines `window.renderFrame(t)` — given time in seconds it draws
that exact moment on a `<canvas id="c">`. **No state between frames**; positions
come straight from `t`. That is what makes any frame renderable in any order and
the render reproducible. It also exposes `window.__ready` (a Promise the renderer
awaits) so fonts and images are loaded before frame 0.

## First run — match the engine to THIS project (do this before anything else)

The engine is brand-neutral. Every visual (palette, fonts, direction, name) is
read from `window.BRAND` in `brand.js`. On the first video for a project, build
that `brand.js` from the project you are in — never leave the placeholder theme:

1. **Read the project's brand.** Look, in order, for:
   - `tailwind.config.{js,ts,cjs}` → `theme.colors` / `extend.colors` (primary, accent).
   - CSS custom properties — `--primary`, `--brand`, `--accent`, `--background`, `--foreground` — in `app.css` / `globals.css` / `:root {}`.
   - Fonts — Google Fonts `<link>` in the HTML `<head>`, `font-family` in CSS, or `next/font` imports.
   - Direction — `dir="rtl"` / `<html lang="fa|ar|he">` → `dir:'rtl'`, else `'ltr'`.
   - Name + tagline — `package.json` `name`/`description`, `<title>`, or the README `# H1`.
   - A logo — `logo.png|svg` under `public/`, `src/assets/`, `static/`; copy it to `logo.png` beside `showreel.html` if found.
2. **Write `brand.js`** from `assets/brand.example.js`, filling every field you found. Omit what you cannot find — the template has neutral fallbacks. Point `fontsUrl` at the families you name.
3. If the project gives no usable signal, keep the neutral default and say so in one line, then continue — do not block.

The result: the same skill dropped into any repo produces on-brand video without
edits to the engine. Only `brand.js` (and the optional `logo.png`) is per-project.

## Workflow

1. **Copy the assets** into the working dir (e.g. a `motion/` folder):
   `template.html` → your `showreel.html`, plus `render.mjs`, `preview.mjs`,
   `build.mjs`, and your project's `brand.js` (see first-run above). Optional:
   `contact.mjs`, `fetch-fonts.mjs`.
2. **Decide the spec** — aspect/dims, duration, fps, sound, the message beats.
   Ask the user if unstated (format, **sound**, length, what to say). Vertical
   `1080x1920` @ 60fps is the default. Sound: silent (default), music bed, or
   voiceover — most social plays **muted**, so design captions-first.
3. **Write the scenes.** Add scene functions and list them in `SCENE_FNS` (draw
   order). Each `fn(lt,d)` gets local time + duration; wrap content alpha in
   `env(lt,d)`. You do NOT hand-time scenes — timing is the harness's job (step 4).
   Adjacent scenes **crossfade** automatically over `XFADE`; no manual flashes needed.
4. **Set the SPEC + build.** Edit `SPEC` in `build.mjs`: dims/fps, `xfade`, `audio`
   (`none`/`music`/`voice`), and one entry per scene — `{ hold: seconds }` or
   `{ say: 'line' }` (duration measured from the voiceover, so text and audio can't
   drift or overlap). `node build.mjs` then measures → patches the `__TIMING__` block
   in the HTML → renders → muxes audio (if any) → verifies. Single source of timing:
   change a line, one command re-syncs everything.
   - `--skip-tts` reuse `vo*.mp3`; `--skip-render` reuse the mp4 (audio-only re-mix).
5. **Preview cheaply** before trusting the full render:
   `node preview.mjs --html showreel.html --at 2,7,11,14 --safe`
   `--safe` overlays title-safe + platform-UI zones (bottom caption band, right
   action rail) — keep key text inside the dashed box. Confirm `page errors: none`.
   For pacing across the whole clip in one image:
   `node contact.mjs --html showreel.html --dur 15 --grid 4x3` tiles evenly-spaced
   frames into `contact.png` — spot dead air / scene coverage without a full render.
6. **Verify** the MP4 (dims/duration, audio stream if expected) and clean up. Done
   only when it plays and looks right.

**Duration reality:** a voiced script's length is set by the narration read at a
hearable pace — you cannot wish it shorter. `build.mjs` reports the computed `DUR`;
if it overshoots the target, trim words (fewer list items, shorter lines) rather
than speeding the voice past readability.

**Hand-timing (no harness):** you can still edit `BEATS`/`DUR`/`XFADE`/`CAPTIONS`
in the `__TIMING__` block directly and just run `render.mjs` — the harness only
owns that block, it isn't required.

## What the template gives you

Helpers already in `template.html` — reuse, don't re-derive:

- **Easing:** `outExpo outCubic inOutCubic outBack inBack outElastic`, plus
  `clamp01 lerp env`. `env(lt,d,fin,fout)` is the per-scene fade envelope.
- **Motion principles baked in:** overshoot (`outBack`), spring settle
  (`outElastic`), stagger (loop a start offset per item), cheap motion blur
  (draw from the `t-0.02` position, as `drawParticles` does).
- **Draw helpers:** `drawBg drawGrid drawParticles postfx`, `text` (alpha
  **multiplies** the outer `globalAlpha`; direction from `BRAND.dir`), `fitText`
  (shrinks to width — use it for any label that might overflow), `rrect`, and
  `icon(name,…)` with line pictographs (bolt, shield, spark, heart, globe, check,
  rocket, star, chat, play; any other name renders its first letter).
- **Brand constants:** `INK BRAND BRAND_LIGHT BRAND_DARK ACCENT`, `DISPLAY BODY DIR`
  — all sourced from `window.BRAND`. Change the video's whole look by editing
  `brand.js`, not the engine.
- **Transitions:** `renderFrame` crossfades adjacent scenes over `XFADE` via an
  offscreen layer, so a scene's own alpha logic can't break the blend. Hard cut?
  Set `XFADE=0`.
- **Captions:** `CAPTIONS=[{t,end,text}]` draws a high-contrast pill low in the
  frame (title-safe) for muted playback. `build.mjs` auto-fills it from `say` lines.

## Any video: map the request to scenes

The user describes what they want ("a 10s ad for X", "a fun countdown", "a quote
reel"). Break it into 2–5 scene functions (add them to `SCENE_FNS`) and let the
`build.mjs` SPEC set each one's length. Common building blocks — most reuse template
helpers, a couple are a few lines:

- **Title / hook** — `sceneTitle` in the template (pop + underline sweep).
- **Kinetic list / feature chips** — `sceneBadges` pattern: loop items, stagger a
  start offset, `outBack`/`outElastic` in, `fitText` labels.
- **Big-number / stat counter** — animate the value:
  `const n=Math.round(lerp(0,target,outExpo(clamp01(lt/1.2))));
   text(n.toLocaleString(),W/2,H/2,220,{face:DISPLAY});`
- **Image reveal (Ken Burns)** — `img` + slow zoom/pan, gradient overlay for text:
  `const z=lerp(1.15,1,outCubic(clamp01(lt/d)));
   ctx.drawImage(img, cx-W*z/2, cy-H*z/2, W*z, H*z);` then a `BRAND_DARK` overlay.
- **Quote / lyric card** — big centered `text` line(s), word or line stagger via
  per-line `env(lt-i*0.3, …)`; grid + particles behind.
- **Countdown** — `const s=Math.ceil(d-lt); text(s,…)` with a per-second pop
  (`outBack` on `lt%1`), optional ring `arc(…, -Math.PI/2, -Math.PI/2+2π*(1-frac))`.
- **Lower-third / caption** — `rrect` pill sliding in from an edge with `outExpo`.
- **Transition / punchline** — full-bleed fill (`fillRect` with `ACCENT`) wiping
  across on `inOutCubic`, or a white flash `globalAlpha=1-lt/0.2`.

Tone follows the ask: an **ad** leans on the product + a CTA pill; a **fun** clip
can go loud — bigger overshoot, faster cuts, accent flashes, bold type. Keep the
accent color an accent; let the brand color carry the frame.

## Gotchas (learned the hard way)

- **globalAlpha:** `text()` multiplies, so a scene can set `ctx.globalAlpha=ca`
  once and everything fades together. If you add draw helpers, multiply too.
- **RTL:** for `dir:'rtl'` brands, Chromium's canvas shapes the script correctly;
  the template sets `ctx.direction=DIR`. Long labels collide — always `fitText`,
  never raw `text` for variable-length strings in a fixed box.
- **Fonts:** loaded from Google Fonts (URL in `brand.js`) inside `__ready`; the
  browser needs network at render time. The template awaits `document.fonts.ready`
  before frame 0. Run `node fetch-fonts.mjs` once to vendor them into `fonts/` and
  point `brand.js` `fontsUrl` at `fonts/fonts.css` — no network, reproducible.
- **Grain is deterministic** — `postfx(t)` seeds a mulberry32 `rng` off `t`, so
  every frame is a pure function of time (enables scrubbing and the render cache).
  Keep any new randomness a function of `t`, never `Math.random()`.
- **Duration change:** the harness owns `DUR`/`BEATS`, so re-running `build.mjs`
  after editing a scene's `hold`/`say` re-times everything. Only hand-edited
  `__TIMING__` blocks need manual updates.

## Extending

- **Audio** is a first-class, optional path in `build.mjs` (`audio: 'music'|'voice'`):
  a soft synth pad + whooshes on every cut + `edge-tts` voiceover, mixed and
  `loudnorm`'d (EBU R128, `I=-16`) so it isn't too quiet/loud on social. Voiceover
  timing is derived from the measured clips, so it can't drift from the captions.
  For a real music bed, swap the `aevalsrc` pad for `-i track.mp3`.
- **Faster iteration** (built in): `render.mjs --cache` content-hashes the HTML +
  `fps|dur|w|h` into `.frames/.sig` and reuses frames on a hit (any edit changes
  the hash and forces a full re-render, so it's safe — re-encode or resume without
  re-shooting); `contact.mjs` tiles a thumbnail grid for pacing checks;
  `fetch-fonts.mjs` vendors the fonts locally.
- **Other formats:** `--w 1080 --h 1080` (square) or `--w 1920 --h 1080`
  (landscape); set `SPEC.w/h` in `build.mjs` and match the HTML `W,H` + canvas attrs.
