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
 * We exclude FN (Fake News), CP (Conspiracy), S (Satire), PS (Peer-reviewed Science)
 * because they don't map to the left-right political spectrum.
 * We keep only sources with a known credibility rating.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raw = JSON.parse(readFileSync(path.join(__dirname, '../data/mbfc-raw.json'), 'utf8'));

const BIAS_MAP = { L: 0, LC: 1, C: 2, RC: 3, R: 4 };
const CRED_MAP = { VL: 0, L: 1, M: 2, MF: 3, H: 4, VH: 5 };

// Also build a name lookup for the UI
const sources = {};
const names = {};
let included = 0;
let excluded = 0;

for (const [domain, entry] of Object.entries(raw)) {
  const bias = BIAS_MAP[entry.b];
  const cred = CRED_MAP[entry.r];

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
console.log(`  ${included} sources included, ${excluded} excluded`);
console.log(`  static/sources.json     (${(sourceSize / 1024).toFixed(1)} KB)`);
console.log(`  static/source-names.json (${(namesSize / 1024).toFixed(1)} KB)`);
