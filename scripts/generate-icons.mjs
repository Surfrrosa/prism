#!/usr/bin/env node

/**
 * Generate Prism extension icons at 16, 32, 48, 128px.
 * Design: a triangular prism refracting white light into a spectrum.
 */

import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../static/icons');
mkdirSync(OUT, { recursive: true });

function prismSvg(size) {
  const s = size;
  const p = s * 0.08; // padding

  // Triangle points (prism shape)
  const cx = s / 2;
  const top = p + s * 0.05;
  const bottom = s - p;
  const left = p + s * 0.05;
  const right = s - p - s * 0.05;

  // Spectrum colors for the refracted light
  const spectrumColors = [
    '#3b82f6', // blue
    '#60a5fa', // light blue
    '#a855f7', // purple
    '#f97316', // orange
    '#ef4444', // red
  ];

  // Build spectrum rays coming out the right side of the prism
  const rayStartX = cx + s * 0.1;
  const rayEndX = right + s * 0.05;
  const raySpread = s * 0.35;
  const rayStartY = cx;

  const rays = spectrumColors.map((color, i) => {
    const t = i / (spectrumColors.length - 1);
    const endY = rayStartY - raySpread / 2 + raySpread * t;
    const width = Math.max(s * 0.03, 1.5);
    return `<line x1="${rayStartX}" y1="${rayStartY}" x2="${rayEndX}" y2="${endY}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" opacity="0.9"/>`;
  }).join('\n    ');

  // Input beam (white light)
  const beamStartX = left - s * 0.05;
  const beamEndX = cx - s * 0.1;

  return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${s}" height="${s}" rx="${s * 0.15}" fill="#1a1127"/>

    <!-- Input beam -->
    <line x1="${beamStartX}" y1="${cx}" x2="${beamEndX}" y2="${cx}" stroke="white" stroke-width="${Math.max(s * 0.04, 2)}" stroke-linecap="round" opacity="0.7"/>

    <!-- Spectrum rays -->
    ${rays}

    <!-- Prism triangle -->
    <polygon points="${cx},${top} ${left},${bottom} ${right},${bottom}"
      fill="none"
      stroke="white"
      stroke-width="${Math.max(s * 0.04, 1.5)}"
      stroke-linejoin="round"
      opacity="0.85"/>
    <polygon points="${cx},${top} ${left},${bottom} ${right},${bottom}"
      fill="rgba(168, 85, 247, 0.15)"/>
  </svg>`;
}

const sizes = [16, 32, 48, 128];

for (const size of sizes) {
  const svg = prismSvg(size);
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(OUT, `icon${size}.png`));
}

console.log('Icons generated:', sizes.map(s => `icon${s}.png`).join(', '));
