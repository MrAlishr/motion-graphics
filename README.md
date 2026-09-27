# motion-graphics

Make short motion-graphics videos — ads, promos, reels/stories, countdowns,
quote cards, explainers, kinetic type, logo stings — **from a text
description**, entirely in code. One HTML file draws each frame with a
`renderFrame(t)` function; a headless Chromium screenshots the frames and
ffmpeg stitches them into an MP4. No After Effects, no timeline app, no video
libraries. Deterministic and versionable in git.

Agent-agnostic and brand-neutral: it auto-matches its palette, fonts, name and
text direction to whatever project you drop it into on the first run. Works with
**Claude Code**, **Codex**, **OpenCode**, and any other AGENTS.md-aware agent —
the engine is the same, only the entry file differs.

## Install

**Claude Code** — copy as a skill (`SKILL.md` is the entry point):

```bash
# per-project
mkdir -p .claude/skills && cp -r motion-graphics-skill .claude/skills/motion-graphics
# or user-wide
cp -r motion-graphics-skill ~/.claude/skills/motion-graphics
```

**Codex / OpenCode / Cursor / Gemini CLI** — these read [`AGENTS.md`](https://agents.md):

```bash
# drop it in your project (keep the folder so AGENTS.md can reference SKILL.md)
cp -r motion-graphics-skill tools/motion-graphics
# then add one line to your project's root AGENTS.md:
#   For video/motion-graphics requests, follow ./tools/motion-graphics/AGENTS.md
```

Then just ask, e.g. *"make a 15s vertical promo reel for this project"*. On the
first run the agent reads your project's colors/fonts/name into a `brand.js` and
renders on-brand. No agent at all? See **Manual use** below.

## Requirements

- **ffmpeg** — `ffmpeg -version` (Windows: `winget install Gyan.FFmpeg`).
- **Chrome or Edge** — auto-detected (Edge ships with Windows).
- **puppeteer-core** — `npm i puppeteer-core@23` in the working dir.

## Manual use (no Claude)

```bash
cp assets/template.html   motion/showreel.html
cp assets/render.mjs assets/preview.mjs assets/build.mjs motion/
cp assets/brand.example.js motion/brand.js   # edit colors/fonts/name
cd motion && npm i puppeteer-core@23

node preview.mjs --html showreel.html --at 2,7,11,14 --safe
node build.mjs                               # patch timing → render → (mux audio) → verify
# or render directly, bypassing the harness:
node render.mjs --html showreel.html --out out.mp4 --dur 15 --fps 60 --w 1080 --h 1920
```

Edit `brand.js` for the look; edit `SPEC` in `build.mjs` (or the `__TIMING__`
block + `SCENE_FNS` in `showreel.html`) for the content and timing. Formats:
`1080x1920` vertical (default), `1080x1080` square, `1920x1080` landscape —
update `SPEC.w/h`, the HTML `W,H`, and the `<canvas>` attributes to match.

## Layout

```
motion-graphics-skill/
  SKILL.md              # entry point for Claude Code (frontmatter + full method)
  AGENTS.md             # entry point for Codex / OpenCode / others
  assets/
    template.html       # the engine — copy to showreel.html
    brand.example.js    # per-project theme — copy to brand.js
    render.mjs          # frames → mp4 (--cache reuses unchanged frames)
    preview.mjs         # sample-frame PNGs (--safe overlays title-safe guides)
    build.mjs           # timeline harness — one SPEC drives video + audio in sync
    contact.mjs         # tile a thumbnail grid into one PNG for pacing checks
    fetch-fonts.mjs     # vendor the brand fonts locally (offline/reproducible)
```

## License

MIT — see [LICENSE](LICENSE).
