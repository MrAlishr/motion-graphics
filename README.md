# motion-graphics

Make short motion-graphics videos — ads, promos, reels/stories, countdowns,
quote cards, explainers, kinetic type, logo stings — **from a text
description**, entirely in code. One HTML file draws each frame with a
`renderFrame(t)` function; a headless Chromium screenshots the frames and
ffmpeg stitches them into an MP4. No After Effects, no timeline app, no video
libraries. Deterministic and versionable in git.

It's a [Claude Code](https://claude.com/claude-code) **skill**: brand-neutral,
and it auto-matches its palette, fonts, name and text direction to whatever
project you drop it into on the first run.

## Install

Copy the skill into any project (or your user scope):

```bash
# per-project
mkdir -p .claude/skills
cp -r motion-graphics-skill .claude/skills/motion-graphics

# or user-wide (all projects)
cp -r motion-graphics-skill ~/.claude/skills/motion-graphics
```

Then just ask Claude Code, e.g. *"make a 15s vertical promo reel for this
project"*. On the first run it reads your project's colors/fonts/name into a
`brand.js` and renders on-brand.

## Requirements

- **ffmpeg** — `ffmpeg -version` (Windows: `winget install Gyan.FFmpeg`).
- **Chrome or Edge** — auto-detected (Edge ships with Windows).
- **puppeteer-core** — `npm i puppeteer-core@23` in the working dir.

## Manual use (no Claude)

```bash
cp assets/template.html   motion/showreel.html
cp assets/render.mjs assets/preview.mjs motion/
cp assets/brand.example.js motion/brand.js   # edit colors/fonts/name
cd motion && npm i puppeteer-core@23

node preview.mjs --html showreel.html --at 2,7,11,14
node render.mjs  --html showreel.html --out out.mp4 --dur 15 --fps 60 --w 1080 --h 1920
```

Edit `brand.js` for the look; edit the `SCENES` timeline in `showreel.html` for
the content. Formats: `1080x1920` vertical (default), `1080x1080` square,
`1920x1080` landscape — update `W,H,DUR` and the `<canvas>` attributes to match.

## Layout

```
motion-graphics-skill/
  SKILL.md              # the skill instructions Claude follows
  assets/
    template.html       # the engine — copy to showreel.html
    brand.example.js    # per-project theme — copy to brand.js
    render.mjs           # frames → mp4
    preview.mjs          # sample-frame PNGs for a quick check
```

## License

MIT — see [LICENSE](LICENSE).
