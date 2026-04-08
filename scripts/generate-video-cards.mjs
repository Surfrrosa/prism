#!/usr/bin/env node

/**
 * Generate hook and closer video cards for Prism promo video.
 * 1920x1080 PNG frames.
 */

import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../static');

const BG = '#1a1127';
const SPECTRUM = ['#3B82F6', '#60A5FA', '#A855F7', '#F97316', '#EF4444'];

function spectrumBar(x, y, w, h) {
  const r = Math.round(h / 2);
  const segW = w / SPECTRUM.length;
  const bars = SPECTRUM.map((color, i) =>
    `<rect x="${x + segW * i}" y="${y}" width="${segW + 1}" height="${h}" fill="${color}"/>`
  ).join('\n    ');
  return `<defs><clipPath id="barClip-${y}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ry="${r}"/></clipPath></defs>
  <g clip-path="url(#barClip-${y})">${bars}</g>`;
}

function prismIcon(size) {
  const s = size;
  const p = s * 0.08;
  const cx = s / 2;
  const top = p + s * 0.05;
  const bottom = s - p;
  const left = p + s * 0.05;
  const right = s - p - s * 0.05;
  const rayStartX = cx + s * 0.1;
  const rayEndX = right + s * 0.05;
  const raySpread = s * 0.35;
  const rayStartY = cx;

  const rays = SPECTRUM.map((color, i) => {
    const t = i / (SPECTRUM.length - 1);
    const endY = rayStartY - raySpread / 2 + raySpread * t;
    const width = Math.max(s * 0.03, 1.5);
    return `<line x1="${rayStartX}" y1="${rayStartY}" x2="${rayEndX}" y2="${endY}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" opacity="0.9"/>`;
  }).join('\n      ');

  const beamStartX = left - s * 0.05;
  const beamEndX = cx - s * 0.1;

  return `<g>
      <line x1="${beamStartX}" y1="${cx}" x2="${beamEndX}" y2="${cx}"
        stroke="white" stroke-width="${Math.max(s * 0.04, 2)}"
        stroke-linecap="round" opacity="0.7"/>
      ${rays}
      <polygon points="${cx},${top} ${left},${bottom} ${right},${bottom}"
        fill="none" stroke="white"
        stroke-width="${Math.max(s * 0.04, 1.5)}"
        stroke-linejoin="round" opacity="0.85"/>
      <polygon points="${cx},${top} ${left},${bottom} ${right},${bottom}"
        fill="rgba(168, 85, 247, 0.15)"/>
    </g>`;
}

// --- Hook card ---
function hookCard() {
  const w = 1920, h = 1080;
  const cx = w / 2, cy = h / 2;

  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="${h}" fill="${BG}"/>
  <radialGradient id="glow" cx="50%" cy="45%" r="50%">
    <stop offset="0%" stop-color="#a855f7" stop-opacity="0.10"/>
    <stop offset="100%" stop-color="${BG}" stop-opacity="0"/>
  </radialGradient>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>

  <!-- Scanlines -->
  ${Array.from({ length: 60 }, (_, i) =>
    `<line x1="0" y1="${18 * i}" x2="${w}" y2="${18 * i}" stroke="white" stroke-width="0.4" opacity="0.025"/>`
  ).join('\n  ')}

  <!-- Main text -->
  <text x="${cx}" y="${cy - 60}" text-anchor="middle"
    font-family="'SF Mono', 'Consolas', 'Liberation Mono', monospace"
    font-size="52" font-weight="700" fill="white">
    Most people read from 2 perspectives.
  </text>
  <text x="${cx}" y="${cy + 20}" text-anchor="middle"
    font-family="'SF Mono', 'Consolas', 'Liberation Mono', monospace"
    font-size="52" font-weight="700" fill="#a78bfa">
    There are 5.
  </text>

  <!-- Spectrum bar -->
  ${spectrumBar(cx - 300, cy + 90, 600, 10)}
</svg>`;
}

// --- Closer card ---
function closerCard() {
  const w = 1920, h = 1080;
  const cx = w / 2, cy = h / 2;
  const iconSize = 120;

  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="${h}" fill="${BG}"/>
  <radialGradient id="glow2" cx="50%" cy="42%" r="45%">
    <stop offset="0%" stop-color="#a855f7" stop-opacity="0.10"/>
    <stop offset="100%" stop-color="${BG}" stop-opacity="0"/>
  </radialGradient>
  <rect width="${w}" height="${h}" fill="url(#glow2)"/>

  <!-- Scanlines -->
  ${Array.from({ length: 60 }, (_, i) =>
    `<line x1="0" y1="${18 * i}" x2="${w}" y2="${18 * i}" stroke="white" stroke-width="0.4" opacity="0.025"/>`
  ).join('\n  ')}

  <!-- Prism icon -->
  <g transform="translate(${cx - iconSize / 2}, ${cy - 180})">
    ${prismIcon(iconSize)}
  </g>

  <!-- Title -->
  <text x="${cx}" y="${cy + 10}" text-anchor="middle"
    font-family="'SF Mono', 'Consolas', 'Liberation Mono', monospace"
    font-size="72" font-weight="700" fill="white" letter-spacing="8">
    PRISM
  </text>

  <!-- Tagline -->
  <text x="${cx}" y="${cy + 70}" text-anchor="middle"
    font-family="'SF Mono', 'Consolas', 'Liberation Mono', monospace"
    font-size="28" fill="#a78bfa" letter-spacing="1">
    See the full spectrum.
  </text>

  <!-- Spectrum bar -->
  ${spectrumBar(cx - 250, cy + 120, 500, 8)}

  <!-- CTA -->
  <text x="${cx}" y="${cy + 200}" text-anchor="middle"
    font-family="'SF Mono', 'Consolas', 'Liberation Mono', monospace"
    font-size="18" fill="#8b80a8">
    Available on the Chrome Web Store
  </text>
</svg>`;
}

const cards = [
  { name: 'video-hook.png', fn: hookCard },
  { name: 'video-closer.png', fn: closerCard },
];

for (const card of cards) {
  const svg = card.fn();
  const outPath = path.join(OUT, card.name);
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log(`Generated ${card.name} (1920x1080)`);
}

console.log('Done.');
