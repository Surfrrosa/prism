#!/usr/bin/env node

/**
 * Generate Chrome Web Store promo tile images for Prism.
 *
 * Outputs (to static/):
 *   promo-small.png   440x280
 *   promo-large.png   920x680
 *   promo-marquee.png 1400x560
 */

import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../static');

const BG = '#1a1127';
const SPECTRUM = ['#3B82F6', '#60A5FA', '#A855F7', '#F97316', '#EF4444'];

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

  return `
    <g>
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

function promoSvg(w, h, variant) {
  const barH = Math.round(h * 0.035);
  const barRadius = Math.round(barH / 2);
  const taglineSize = Math.round(h * 0.115);
  const subtitleSize = Math.round(h * 0.05);

  if (variant === 'marquee') {
    const iconSize = Math.round(h * 0.35);
    const iconX = Math.round(w * 0.08);
    const iconY = Math.round(h * 0.5 - iconSize * 0.5);
    const textCenterX = Math.round(w * 0.55);
    const taglineY = Math.round(h * 0.38);
    const subtitleY = Math.round(h * 0.52);
    const barY = Math.round(h * 0.68);
    const barW = Math.round(w * 0.50);
    const barX = Math.round(textCenterX - barW / 2);
    const segW = barW / SPECTRUM.length;

    const spectrumBar = SPECTRUM.map((color, i) =>
      `<rect x="${barX + segW * i}" y="${barY}" width="${segW + 1}" height="${barH}" fill="${color}"/>`
    ).join('\n    ');

    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="barClip">
      <rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="${barRadius}" ry="${barRadius}"/>
    </clipPath>
  </defs>
  <rect width="${w}" height="${h}" fill="${BG}"/>
  <radialGradient id="glow" cx="50%" cy="45%" r="60%">
    <stop offset="0%" stop-color="#a855f7" stop-opacity="0.08"/>
    <stop offset="100%" stop-color="${BG}" stop-opacity="0"/>
  </radialGradient>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>
  <g transform="translate(${iconX}, ${iconY})">
    ${prismIcon(iconSize)}
  </g>
  <text x="${textCenterX}" y="${taglineY}" text-anchor="middle"
    font-family="'SF Mono', 'Consolas', 'Liberation Mono', monospace"
    font-size="${taglineSize}" font-weight="700" fill="white" letter-spacing="0.5">
    See the full spectrum.
  </text>
  <text x="${textCenterX}" y="${subtitleY}" text-anchor="middle"
    font-family="'SF Mono', 'Consolas', 'Liberation Mono', monospace"
    font-size="${subtitleSize}" fill="#a78bfa" letter-spacing="0.3" opacity="0.85">
    Track your media diet. Discover your blind spots.
  </text>
  <g clip-path="url(#barClip)">
    ${spectrumBar}
  </g>
</svg>`;
  }

  // Small and large: centered vertical layout
  const barW = Math.round(w * 0.65);
  const barX = Math.round((w - barW) / 2);
  const segW = barW / SPECTRUM.length;
  const iconSize = Math.round(h * 0.22);
  const iconX = Math.round(w / 2 - iconSize / 2);

  let iconY, taglineY, subtitleY, barY;
  if (variant === 'small') {
    iconY = Math.round(h * 0.08);
    taglineY = Math.round(h * 0.52);
    subtitleY = Math.round(h * 0.65);
    barY = Math.round(h * 0.78);
  } else {
    iconY = Math.round(h * 0.10);
    taglineY = Math.round(h * 0.50);
    subtitleY = Math.round(h * 0.60);
    barY = Math.round(h * 0.74);
  }

  const spectrumBar = SPECTRUM.map((color, i) =>
    `<rect x="${barX + segW * i}" y="${barY}" width="${segW + 1}" height="${barH}" fill="${color}"/>`
  ).join('\n    ');

  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="barClip">
      <rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="${barRadius}" ry="${barRadius}"/>
    </clipPath>
  </defs>
  <rect width="${w}" height="${h}" fill="${BG}"/>
  <radialGradient id="glow" cx="50%" cy="40%" r="55%">
    <stop offset="0%" stop-color="#a855f7" stop-opacity="0.08"/>
    <stop offset="100%" stop-color="${BG}" stop-opacity="0"/>
  </radialGradient>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>
  <g transform="translate(${iconX}, ${iconY})">
    ${prismIcon(iconSize)}
  </g>
  <text x="${w / 2}" y="${taglineY}" text-anchor="middle"
    font-family="'SF Mono', 'Consolas', 'Liberation Mono', monospace"
    font-size="${taglineSize}" font-weight="700" fill="white" letter-spacing="0.5">
    See the full spectrum.
  </text>
  <text x="${w / 2}" y="${subtitleY}" text-anchor="middle"
    font-family="'SF Mono', 'Consolas', 'Liberation Mono', monospace"
    font-size="${subtitleSize}" fill="#a78bfa" letter-spacing="0.3" opacity="0.85">
    Track your media diet. Discover your blind spots.
  </text>
  <g clip-path="url(#barClip)">
    ${spectrumBar}
  </g>
</svg>`;
}

const tiles = [
  { name: 'promo-small.png',   w: 440,  h: 280, variant: 'small' },
  { name: 'promo-large.png',   w: 920,  h: 680, variant: 'large' },
  { name: 'promo-marquee.png', w: 1400, h: 560, variant: 'marquee' },
];

for (const tile of tiles) {
  const svg = promoSvg(tile.w, tile.h, tile.variant);
  const outPath = path.join(OUT, tile.name);
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log(`Generated ${tile.name} (${tile.w}x${tile.h})`);
}

console.log('Done.');
