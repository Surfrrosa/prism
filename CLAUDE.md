# Prism

Chrome extension (Manifest V3) that passively tracks your news media diet and computes a Perspective Diversity Score. Shows bias distribution, blind spots, and generates shareable cards. All data stays local in IndexedDB.

## Build

```bash
npm install
npm run data     # Process MBFC database -> static/sources.json
npm run icons    # Generate PNG icons from SVG (requires sharp)
npm run build    # esbuild bundles TS -> dist/
npx tsc --noEmit # Type-check only
```

Load in Chrome: `chrome://extensions` > Developer mode > Load unpacked > select `dist/`.

## Architecture

- `src/background/` — Service worker. Listens for tab navigations, matches domains against MBFC database, stores reading records in IndexedDB. Computes stats, manages badge, handles weekly notifications.
- `src/popup/` — Quick glance view. Shows diversity score, spectrum bar, blind spots, current page bias. Link to open full dashboard.
- `src/sidepanel/` — Full dashboard. Score ring, spectrum visualization, stats grid, blind spot cards with perspective links, top sources list, shareable card generator.
- `src/lib/` — Shared modules: source lookup, storage, score algorithm, types.
- `static/` — Manifest, HTML, CSS, icons, source database JSON.
- `data/` — Raw MBFC data (not shipped in extension).
- `scripts/` — Build-time scripts for icons and data processing.

## Data Source

Media Bias/Fact Check (MBFC) open-source extension database (MIT license). ~1,932 sources with bias ratings (L/LC/C/RC/R) and factual reporting scores (VL-VH). Processed from `data/mbfc-raw.json` into `static/sources.json`.

## Key Files

- `src/lib/sources.ts` — Domain lookup with subdomain fallback
- `src/lib/storage.ts` — IndexedDB operations, deduplication, pruning
- `src/lib/score.ts` — Diversity score algorithm (entropy + variety + quality + breadth)
- `src/lib/types.ts` — Bias/Credibility enums, ReadingRecord, DietStats types
- `src/background/index.ts` — Service worker: tab tracking, message routing, notifications
- `src/popup/index.ts` — Popup UI logic
- `src/sidepanel/index.ts` — Dashboard + shareable card canvas rendering
- `scripts/build-sources.mjs` — MBFC JSON processor
- `scripts/generate-icons.mjs` — SVG to PNG icon generation

## Design

90s retro computing aesthetic. VT323 + Space Mono fonts. Dark purple palette with spectrum colors (blue → purple → red). Shareable cards rendered via Canvas API.

## Session

- Read the latest session log in `docs/sessions/` before starting work.
- Write a session log at `docs/sessions/YYYY-MM-DD.md` at the end of each session.
