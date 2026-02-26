#!/usr/bin/env node

/**
 * Process the raw MBFC database into an optimized lookup table for the extension.
 *
 * Input:  data/mbfc-raw.json (from drmikecrowe/mbfcext, MIT license)
 * Output: static/sources.json
 *
 * Format: { "domain": [biasCode, factualCode], ... }
 *   biasCode:   0=L, 1=LC, 2=C, 3=RC, 4=R
 *   factualCode: 0=VL, 1=L, 2=M, 3=MF, 4=H, 5=VH
 *
 * Included: L, LC, C, RC, R (standard political spectrum)
 *           FN (Fake News) — mapped to nearest political bias, low credibility
 * Excluded: CP (Conspiracy), S (Satire), PS (Peer-reviewed Science)
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raw = JSON.parse(readFileSync(path.join(__dirname, '../data/mbfc-raw.json'), 'utf8'));

const BIAS_MAP = { L: 0, LC: 1, C: 2, RC: 3, R: 4 };
const CRED_MAP = { VL: 0, L: 1, M: 2, MF: 3, H: 4, VH: 5 };

// For Fake News sources, examine their URL slug to infer left/right lean.
// MBFC's URL slugs often contain hints. Default to Center if unclear.
function inferFNBias(entry) {
  const slug = (entry.u || '').toLowerCase();
  const name = (entry.n || '').toLowerCase();
  // Many FN sources have identifiable political lean from their name
  const rightSignals = ['patriot', 'freedom', 'liberty', 'conservative', 'trump', 'maga', 'america-first', 'right'];
  const leftSignals = ['progressive', 'occupy', 'liberal', 'resist', 'democrat'];
  const combined = slug + ' ' + name;
  if (rightSignals.some(s => combined.includes(s))) return 4; // R
  if (leftSignals.some(s => combined.includes(s))) return 0;  // L
  return 2; // Default to Center (unknown lean)
}

const sources = {};
const names = {};
let included = 0;
let excluded = 0;
let fnIncluded = 0;

for (const [domain, entry] of Object.entries(raw)) {
  let bias = BIAS_MAP[entry.b];
  let cred = CRED_MAP[entry.r];

  // Handle Fake News: include with inferred bias and low credibility
  if (entry.b === 'FN') {
    bias = inferFNBias(entry);
    cred = cred !== undefined ? Math.min(cred, 1) : 0; // Cap at Low
    fnIncluded++;
  }

  if (bias === undefined || cred === undefined) {
    excluded++;
    continue;
  }

  sources[domain] = [bias, cred];
  names[domain] = entry.n;
  included++;
}

const outDir = path.join(__dirname, '../static');
mkdirSync(outDir, { recursive: true });

writeFileSync(path.join(outDir, 'sources.json'), JSON.stringify(sources));
writeFileSync(path.join(outDir, 'source-names.json'), JSON.stringify(names));

const sourceSize = Buffer.byteLength(JSON.stringify(sources));
const namesSize = Buffer.byteLength(JSON.stringify(names));

console.log(`Sources database built:`);
console.log(`  ${included} sources included (${fnIncluded} Fake News), ${excluded} excluded`);
console.log(`  static/sources.json     (${(sourceSize / 1024).toFixed(1)} KB)`);
console.log(`  static/source-names.json (${(namesSize / 1024).toFixed(1)} KB)`);
