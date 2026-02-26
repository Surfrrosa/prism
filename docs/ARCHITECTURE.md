# Architecture

## Overview

Prism is a Chrome Manifest V3 extension that passively tracks news media consumption. It has no content scripts and no host permissions — it uses only the `tabs` API to read URLs on navigation.

## Data Flow

```
Tab navigation (chrome.tabs.onUpdated)
  → background service worker
  → domain extracted from URL
  → lookup against source database (MBFC JSON + supplementary + heuristics)
  → if match: store ReadingRecord in IndexedDB
  → update toolbar badge with bias indicator (L/LC/C/RC/R)

Popup / Side panel opened
  → sends message to background
  → background queries IndexedDB for time-windowed records
  → computes DietStats (score, distribution, blind spots)
  → returns to UI for rendering
```

## Components

### Background Service Worker (`src/background/index.ts`)
- Listens for `tabs.onUpdated` with `status: 'complete'`
- Debounces via `pendingTabs` Set to avoid double-processing
- Routes messages from popup/sidepanel
- Manages weekly alarm for notifications and daily prune

### Source Lookup (`src/lib/sources.ts`)
Three-tier lookup:
1. **MBFC database** — 2,725 sources from `static/sources.json`
2. **Supplementary list** — hand-curated aggregators and international outlets
3. **Heuristic detection** — local TV call signs, news-keyword domains

Domain matching handles `www.` stripping and compound TLDs (`.co.uk`, `.com.au`).

### Storage (`src/lib/storage.ts`)
- IndexedDB database `prism` with a single `readings` object store
- Indexes on `timestamp`, `domain`, `url`
- Deduplication: same URL on same calendar day is skipped
- Settings stored in `chrome.storage.local`

### Score Algorithm (`src/lib/score.ts`)
Perspective Diversity Score (0-100):
- Bias entropy: 40 points (Shannon entropy normalized to max)
- Source variety: 25 points (unique sources / total reads ratio)
- Factual quality: 20 points (average credibility mapped to 0-20)
- Coverage breadth: 15 points (3 per bias category with reads)

Minimum 10 articles required before score is computed.

### Popup (`src/popup/index.ts`)
Quick glance: score, spectrum bar, blind spots, current page info. Links to full dashboard.

### Side Panel (`src/sidepanel/index.ts`)
Full dashboard: score ring (SVG), spectrum bar with legend, stats grid, blind spot cards with perspective links, top sources list, shareable card generator (Canvas API).

## Source Database

Raw data from the MBFC open-source extension (MIT license) is processed by `scripts/build-sources.mjs`:
- Standard political spectrum sources (L/LC/C/RC/R) included directly
- Fake News sources included with inferred political lean and capped-low credibility
- Conspiracy, Satire, and Peer-reviewed Science excluded (don't map to political spectrum)

Output: `static/sources.json` (compact `[bias, cred]` tuples) and `static/source-names.json` (display names).
