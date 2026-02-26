# Prism

**See the full spectrum.** A Chrome extension that passively tracks your news media diet and shows you your own bias blind spots.

## What it does

You install it and browse normally. Prism silently identifies news sources you read, tracks their political bias and factual reliability, and computes a **Perspective Diversity Score** (0-100).

- **Passive tracking** — no setup, no watchlists, no clicking. Just browse.
- **Diversity Score** — a single number that captures how balanced your media diet is.
- **Spectrum visualization** — see your Left/Center/Right reading distribution at a glance.
- **Blind spot detection** — find out which perspectives you're not hearing from.
- **Shareable cards** — export a 90s-retro card of your media diet to share on social.
- **Weekly reports** — Sunday notification with your weekly media summary.

## Privacy

All data stays in your browser. Prism makes zero network requests. No accounts, no analytics, no tracking. Your reading history is stored locally in IndexedDB and never leaves your machine.

## How it works

Prism matches the domains you visit against a database of 2,700+ rated news sources from [Media Bias/Fact Check](https://mediabiasfactcheck.com/) (MIT-licensed). Each source has a political bias rating (Left through Right) and a factual reporting score. Prism also detects local news outlets via heuristic domain matching.

Your Diversity Score factors in:
- **Bias entropy** — reading across all five categories scores higher than one
- **Source variety** — unique sources relative to total reads
- **Factual quality** — higher credibility sources improve your score
- **Coverage breadth** — having reads in each bias category

## Install

### From source

```bash
npm install
npm run data     # Process MBFC source database
npm run icons    # Generate extension icons
npm run build    # Build to dist/
```

Load in Chrome: `chrome://extensions` > Developer mode > Load unpacked > select `dist/`.

## Permissions

- `tabs` — read the URL when you navigate (to match against the source database)
- `storage` — save your settings
- `alarms` — weekly report notification
- `notifications` — deliver the weekly summary
- `sidePanel` — full dashboard view

No content scripts. No host permissions. No `<all_urls>`.

## Tech

- TypeScript + esbuild
- Chrome Manifest V3
- IndexedDB via [idb](https://github.com/nicolo-ribaudo/idb)
- Canvas API for shareable card generation
- MBFC open-source database (MIT license)

## License

MIT
