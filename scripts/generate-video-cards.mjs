#!/usr/bin/env node

/**
 * Generate hook and closer video cards for Prism promo video.
 * 1920x1080 PNG frames. Outputs to marketing/.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { BG, SPECTRUM, prismIcon, renderCards } from './lib/canvas-card.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../marketing');

function spectrumBar(x, y, w, h) {
  const r = Math.round(h / 2);
  const segW = w / SPECTRUM.length;
  const bars = SPECTRUM.map((color, i) =>
    `<rect x="${x + segW * i}" y="${y}" width="${segW + 1}" height="${h}" fill="${color}"/>`
  ).join('\n    ');
  return `<defs><clipPath id="barClip-${y}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ry="${r}"/></clipPath></defs>
  <g clip-path="url(#barClip-${y})">${bars}</g>`;
}

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

await renderCards(
  [
    { name: 'video-hook.png', fn: hookCard, w: 1920, h: 1080 },
    { name: 'video-closer.png', fn: closerCard, w: 1920, h: 1080 },
  ],
  OUT,
);

console.log('Done.');
