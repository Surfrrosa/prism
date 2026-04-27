#!/usr/bin/env node

/**
 * Generate Chrome Web Store promo tile images for Prism.
 *
 * Outputs (to marketing/):
 *   promo-small.png   440x280
 *   promo-large.png   920x680
 *   promo-marquee.png 1400x560
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { BG, SPECTRUM, prismIcon, renderCards } from './lib/canvas-card.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../marketing');

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

await renderCards(
  tiles.map(t => ({ name: t.name, w: t.w, h: t.h, fn: () => promoSvg(t.w, t.h, t.variant) })),
  OUT,
);

console.log('Done.');
