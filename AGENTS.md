# motion-graphics — agent instructions

Portable instruction file (the [AGENTS.md](https://agents.md) standard). Read
automatically by **Codex**, **OpenCode**, Cursor, Gemini CLI, and others.
**Claude Code** uses `SKILL.md` instead — same method, richer detail.

## What this is

A pure-code motion-graphics engine: one HTML file draws every frame with a
`renderFrame(t)` function; headless Chromium screenshots the frames and ffmpeg
stitches them into an MP4. Use it whenever the user wants to make, generate, or
animate a short video / motion graphics — ads, promos, reels, countdowns, quote
cards, explainers, kinetic type, logo stings.

Do NOT load this method into every task — act on it only when the user asks for
a video.

## When the user asks for a video

1. **Verify tools:** `ffmpeg -version`; Chrome or Edge present; then
   `npm i puppeteer-core@23` in the working dir (needs `"type":"module"`).
2. **First run — match the brand to THIS project.** The engine is brand-neutral;
   all visuals come from `window.BRAND` in `brand.js`. Build it from the project:
   scan `tailwind.config.*` / CSS `--primary`/`--accent`/`--background` vars for
   colors, the `<head>` / CSS / `next/font` for fonts, `dir="rtl"` or
   `lang="fa|ar|he"` for direction, `package.json`/README/`<title>` for the name,
   and `public/`,`src/assets/` for a `logo.png`. Copy `assets/brand.example.js`
   to `brand.js` and fill what you found; omit the rest (neutral fallbacks exist).
3. **Set up the working dir:** copy `assets/template.html` → `showreel.html`, plus
   `render.mjs`, `preview.mjs`, `build.mjs`, and your `brand.js`.
4. **Spec:** default vertical `1080x1920` @ 60fps, 15s. Ask if unstated (format,
   length, **sound**, message). Most social plays muted — design captions-first.
5. **Write scenes:** add scene functions to `SCENE_FNS` (draw order); each
   `fn(lt,d)` gets local time + duration. Wrap content alpha in `env(lt,d)`.
   Adjacent scenes crossfade automatically over `XFADE`.
6. **Build (single source of timing):** edit `SPEC` in `build.mjs` — dims/fps,
   `audio` (`none`/`music`/`voice`), one entry per scene (`{hold}` or `{say:'…'}`).
   `node build.mjs` measures voiceover → patches the `__TIMING__` block → renders →
   muxes audio → verifies, so captions/voice and cuts never drift or overlap.
7. **Preview (cheap):** `node preview.mjs --html showreel.html --at 2,7,11,14 --safe`
   (title-safe + platform-UI guides) — read the PNGs, confirm `page errors: none`.
   `node contact.mjs --html showreel.html` tiles a thumbnail grid for pacing.
8. **Verify** the MP4 (dims/duration, audio stream if expected) and clean up.

No harness? You can hand-edit `BEATS`/`DUR`/`XFADE`/`CAPTIONS` in the `__TIMING__`
block and run `render.mjs` directly (`--cache` reuses frames when nothing changed).

## Full reference

Scene recipes (stat counter, Ken Burns, countdown, lower-third, transition),
the helper/easing catalogue, and gotchas live in **`SKILL.md`** — read it before
writing scene code. The engine and helpers are identical regardless of which
agent drives them.
