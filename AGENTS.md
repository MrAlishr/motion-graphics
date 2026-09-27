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
   `render.mjs`, `preview.mjs`, and your `brand.js`.
4. **Spec:** default vertical `1080x1920` @ 60fps, 15s. Ask if unstated (format,
   length, message). Match `W,H,DUR` at the top of the HTML AND the `<canvas>`.
5. **Write scenes:** edit the `SCENES` timeline `[startSec, endSec, fn]` and the
   `fn(lt,d)` functions. Wrap content alpha in `env(lt,d)` for auto cross-fades.
6. **Preview (cheap):** `node preview.mjs --html showreel.html --at 2,7,11,14` —
   read the PNGs, confirm `page errors: none`.
7. **Render:** `node render.mjs --html showreel.html --out out.mp4 --dur 15 --fps 60 --w 1080 --h 1920`
8. **Verify** the MP4 and clean up.

## Full reference

Scene recipes (stat counter, Ken Burns, countdown, lower-third, transition),
the helper/easing catalogue, and gotchas live in **`SKILL.md`** — read it before
writing scene code. The engine and helpers are identical regardless of which
agent drives them.
