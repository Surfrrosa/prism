#!/usr/bin/env node

/**
 * Generate Chrome Web Store screenshot images for Prism.
 *
 * Outputs (to static/):
 *   screenshot-1.png  1280x800  Popup view
 *   screenshot-2.png  1280x800  Dashboard view
 *   screenshot-3.png  1280x800  Badge + explainer
 *   screenshot-4.png  1280x800  Share card
 */

import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../static');

const BG = '#1a1127';
const CARD_BG = '#241b36';
const SPECTRUM = ['#3B82F6', '#60A5FA', '#A855F7', '#F97316', '#EF4444'];
const BIAS_LABELS = ['Left', 'Left-Center', 'Center', 'Right-Center', 'Right'];
const BIAS_SHORT = ['L', 'LC', 'C', 'RC', 'R'];
const MUTED = '#8b80a8';
const ACCENT = '#a78bfa';
const LIGHT = '#c4b5fd';

function spectrumBar(x, y, w, h, widths = [1, 1, 1, 1, 1]) {
  const total = widths.reduce((a, b) => a + b, 0);
  const r = Math.round(h / 2);
  let bars = '';
  let offset = 0;
  for (let i = 0; i < 5; i++) {
    const segW = (widths[i] / total) * w;
    bars += `<rect x="${x + offset}" y="${y}" width="${segW + 1}" height="${h}" fill="${SPECTRUM[i]}"/>`;
    offset += segW;
  }
  return `<defs><clipPath id="specClip-${y}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ry="${r}"/></clipPath></defs>
  <g clip-path="url(#specClip-${y})">${bars}</g>`;
}

function scoreRing(cx, cy, r, score, strokeW = 8) {
  const circumference = 2 * Math.PI * r;
  const progress = (score / 100) * circumference;
  return `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#2d2145" stroke-width="${strokeW}"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${ACCENT}" stroke-width="${strokeW}"
      stroke-dasharray="${progress} ${circumference - progress}"
      stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/>
    <text x="${cx}" y="${cy - 8}" text-anchor="middle" font-family="monospace" font-size="42" font-weight="700" fill="white">78</text>
    <text x="${cx}" y="${cy + 18}" text-anchor="middle" font-family="monospace" font-size="16" fill="${MUTED}">/100</text>`;
}

// Screenshot 1: Popup view
function screenshot1() {
  const w = 1280, h = 800;
  const popupW = 340, popupH = 480;
  const px = (w - popupW) / 2, py = (h - popupH) / 2;

  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="${h}" fill="#0c0815"/>
  <radialGradient id="bg1" cx="50%" cy="45%" r="60%">
    <stop offset="0%" stop-color="#a855f7" stop-opacity="0.06"/>
    <stop offset="100%" stop-color="#0c0815" stop-opacity="0"/>
  </radialGradient>
  <rect width="${w}" height="${h}" fill="url(#bg1)"/>

  <!-- Popup card -->
  <rect x="${px}" y="${py}" width="${popupW}" height="${popupH}" rx="12" fill="${CARD_BG}" stroke="#3d2e5c" stroke-width="1"/>

  <!-- Header -->
  <text x="${w / 2}" y="${py + 40}" text-anchor="middle" font-family="monospace" font-size="22" font-weight="700" fill="${LIGHT}" letter-spacing="3">PRISM</text>

  <!-- Score -->
  <text x="${w / 2}" y="${py + 120}" text-anchor="middle" font-family="monospace" font-size="64" font-weight="700" fill="white">78</text>
  <text x="${w / 2}" y="${py + 148}" text-anchor="middle" font-family="monospace" font-size="14" fill="${MUTED}">Perspective Diversity Score</text>

  <!-- Spectrum bar -->
  ${spectrumBar(px + 30, py + 180, popupW - 60, 14, [15, 25, 30, 20, 10])}

  <!-- Bias labels -->
  ${BIAS_SHORT.map((label, i) => {
    const lx = px + 30 + ((popupW - 60) / 5) * (i + 0.5);
    return `<text x="${lx}" y="${py + 210}" text-anchor="middle" font-family="monospace" font-size="10" fill="${MUTED}">${label}</text>`;
  }).join('\n  ')}

  <!-- Stats -->
  <text x="${px + 50}" y="${py + 260}" text-anchor="middle" font-family="monospace" font-size="28" font-weight="700" fill="white">45</text>
  <text x="${px + 50}" y="${py + 278}" text-anchor="middle" font-family="monospace" font-size="10" fill="${MUTED}">articles</text>

  <text x="${w / 2}" y="${py + 260}" text-anchor="middle" font-family="monospace" font-size="28" font-weight="700" fill="white">12</text>
  <text x="${w / 2}" y="${py + 278}" text-anchor="middle" font-family="monospace" font-size="10" fill="${MUTED}">sources</text>

  <text x="${px + popupW - 50}" y="${py + 260}" text-anchor="middle" font-family="monospace" font-size="28" font-weight="700" fill="white">High</text>
  <text x="${px + popupW - 50}" y="${py + 278}" text-anchor="middle" font-family="monospace" font-size="10" fill="${MUTED}">credibility</text>

  <!-- Blind spots -->
  <text x="${px + 30}" y="${py + 330}" font-family="monospace" font-size="12" font-weight="700" fill="${LIGHT}">BLIND SPOTS</text>
  <rect x="${px + 30}" y="${py + 342}" width="${popupW - 60}" height="40" rx="6" fill="#1e1533"/>
  <text x="${px + 40}" y="${py + 366}" font-family="monospace" font-size="11" fill="${ACCENT}">Right-Center perspectives missing</text>

  <rect x="${px + 30}" y="${py + 390}" width="${popupW - 60}" height="40" rx="6" fill="#1e1533"/>
  <text x="${px + 40}" y="${py + 414}" font-family="monospace" font-size="11" fill="${ACCENT}">Right perspectives missing</text>

  <!-- Caption -->
  <text x="${w / 2}" y="${h - 40}" text-anchor="middle" font-family="monospace" font-size="16" fill="${MUTED}">Quick glance at your media diet</text>
</svg>`;
}

// Screenshot 2: Dashboard view
function screenshot2() {
  const w = 1280, h = 800;
  const panelW = 420, panelH = 680;
  const px = (w - panelW) / 2, py = (h - panelH) / 2;

  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="${h}" fill="#0c0815"/>
  <radialGradient id="bg2" cx="50%" cy="40%" r="55%">
    <stop offset="0%" stop-color="#a855f7" stop-opacity="0.06"/>
    <stop offset="100%" stop-color="#0c0815" stop-opacity="0"/>
  </radialGradient>
  <rect width="${w}" height="${h}" fill="url(#bg2)"/>

  <!-- Dashboard panel -->
  <rect x="${px}" y="${py}" width="${panelW}" height="${panelH}" rx="12" fill="${CARD_BG}" stroke="#3d2e5c" stroke-width="1"/>

  <!-- Header -->
  <text x="${w / 2}" y="${py + 35}" text-anchor="middle" font-family="monospace" font-size="18" font-weight="700" fill="${LIGHT}" letter-spacing="3">PRISM</text>
  <text x="${w / 2}" y="${py + 55}" text-anchor="middle" font-family="monospace" font-size="11" fill="${MUTED}">This week</text>

  <!-- Score ring -->
  ${scoreRing(w / 2, py + 145, 55, 78)}

  <!-- Spectrum section -->
  <text x="${px + 24}" y="${py + 235}" font-family="monospace" font-size="12" font-weight="700" fill="${LIGHT}">READING SPECTRUM</text>
  ${spectrumBar(px + 24, py + 250, panelW - 48, 18, [15, 25, 30, 20, 10])}

  <!-- Spectrum labels with percentages -->
  ${BIAS_LABELS.map((label, i) => {
    const pcts = [15, 25, 30, 20, 10];
    const lx = px + 24 + ((panelW - 48) / 5) * (i + 0.5);
    return `
      <circle cx="${lx}" cy="${py + 286}" r="4" fill="${SPECTRUM[i]}"/>
      <text x="${lx}" y="${py + 300}" text-anchor="middle" font-family="monospace" font-size="9" fill="${MUTED}">${pcts[i]}%</text>`;
  }).join('\n  ')}

  <!-- Stats grid -->
  <text x="${px + 24}" y="${py + 340}" font-family="monospace" font-size="12" font-weight="700" fill="${LIGHT}">STATS</text>
  <rect x="${px + 24}" y="${py + 352}" width="${(panelW - 60) / 2}" height="50" rx="6" fill="#1e1533"/>
  <text x="${px + 24 + (panelW - 60) / 4}" y="${py + 378}" text-anchor="middle" font-family="monospace" font-size="22" font-weight="700" fill="white">45</text>
  <text x="${px + 24 + (panelW - 60) / 4}" y="${py + 394}" text-anchor="middle" font-family="monospace" font-size="9" fill="${MUTED}">articles</text>

  <rect x="${px + 36 + (panelW - 60) / 2}" y="${py + 352}" width="${(panelW - 60) / 2}" height="50" rx="6" fill="#1e1533"/>
  <text x="${px + 36 + (panelW - 60) * 3 / 4}" y="${py + 378}" text-anchor="middle" font-family="monospace" font-size="22" font-weight="700" fill="white">12</text>
  <text x="${px + 36 + (panelW - 60) * 3 / 4}" y="${py + 394}" text-anchor="middle" font-family="monospace" font-size="9" fill="${MUTED}">sources</text>

  <!-- Blind spots -->
  <text x="${px + 24}" y="${py + 440}" font-family="monospace" font-size="12" font-weight="700" fill="${LIGHT}">BLIND SPOTS</text>
  <rect x="${px + 24}" y="${py + 452}" width="${panelW - 48}" height="65" rx="8" fill="#1e1533"/>
  <text x="${px + 36}" y="${py + 474}" font-family="monospace" font-size="11" font-weight="700" fill="${ACCENT}">Right-Center</text>
  <text x="${px + 36}" y="${py + 492}" font-family="monospace" font-size="10" fill="${MUTED}">Try: The Wall Street Journal, The Economist</text>

  <rect x="${px + 24}" y="${py + 524}" width="${panelW - 48}" height="65" rx="8" fill="#1e1533"/>
  <text x="${px + 36}" y="${py + 546}" font-family="monospace" font-size="11" font-weight="700" fill="${ACCENT}">Right</text>
  <text x="${px + 36}" y="${py + 564}" font-family="monospace" font-size="10" fill="${MUTED}">Try: National Review, The Daily Wire</text>

  <!-- Top sources -->
  <text x="${px + 24}" y="${py + 620}" font-family="monospace" font-size="12" font-weight="700" fill="${LIGHT}">TOP SOURCES</text>
  ${['NPR (LC)', 'Reuters (C)', 'CNN (L)', 'AP News (C)', 'BBC (LC)'].map((s, i) => {
    const sy = py + 638 + i * 18;
    return `<text x="${px + 36}" y="${sy}" font-family="monospace" font-size="10" fill="${MUTED}">${i + 1}. ${s}</text>`;
  }).join('\n  ')}

  <!-- Caption -->
  <text x="${w / 2}" y="${h - 30}" text-anchor="middle" font-family="monospace" font-size="16" fill="${MUTED}">Full dashboard with actionable insights</text>
</svg>`;
}

// Screenshot 3: Badge + explainer
function screenshot3() {
  const w = 1280, h = 800;

  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="${h}" fill="#0c0815"/>
  <radialGradient id="bg3" cx="50%" cy="50%" r="55%">
    <stop offset="0%" stop-color="#a855f7" stop-opacity="0.06"/>
    <stop offset="100%" stop-color="#0c0815" stop-opacity="0"/>
  </radialGradient>
  <rect width="${w}" height="${h}" fill="url(#bg3)"/>

  <!-- Title -->
  <text x="${w / 2}" y="80" text-anchor="middle" font-family="monospace" font-size="28" font-weight="700" fill="white">See bias at a glance</text>
  <text x="${w / 2}" y="110" text-anchor="middle" font-family="monospace" font-size="14" fill="${MUTED}">The toolbar badge shows the bias rating of every news site you visit</text>

  <!-- 5 example badges in a row -->
  ${SPECTRUM.map((color, i) => {
    const cx = 240 + i * 200;
    const cy = 300;

    // Browser toolbar mockup
    return `
      <!-- Site card -->
      <rect x="${cx - 80}" y="${cy - 60}" width="160" height="180" rx="12" fill="${CARD_BG}" stroke="#3d2e5c" stroke-width="1"/>

      <!-- Badge -->
      <rect x="${cx - 16}" y="${cy - 40}" width="32" height="20" rx="4" fill="${color}"/>
      <text x="${cx}" y="${cy - 25}" text-anchor="middle" font-family="monospace" font-size="11" font-weight="700" fill="white">${BIAS_SHORT[i]}</text>

      <!-- Label -->
      <text x="${cx}" y="${cy + 10}" text-anchor="middle" font-family="monospace" font-size="13" font-weight="700" fill="${LIGHT}">${BIAS_LABELS[i]}</text>

      <!-- Example source -->
      <text x="${cx}" y="${cy + 35}" text-anchor="middle" font-family="monospace" font-size="10" fill="${MUTED}">${['The Guardian', 'NPR', 'Reuters', 'WSJ', 'Fox News'][i]}</text>

      <!-- Color bar -->
      <rect x="${cx - 40}" y="${cy + 70}" width="80" height="4" rx="2" fill="${color}" opacity="0.6"/>`;
  }).join('\n  ')}

  <!-- Bottom spectrum -->
  ${spectrumBar(240, 560, 800, 8)}

  <!-- Description -->
  <text x="${w / 2}" y="620" text-anchor="middle" font-family="monospace" font-size="14" fill="${MUTED}">2,700+ news sources recognized worldwide</text>

  <!-- Features row -->
  ${[
    { label: 'Passive tracking', desc: 'No action needed' },
    { label: 'Instant recognition', desc: 'Badge updates on every visit' },
    { label: '100% private', desc: 'Zero network requests' },
  ].map((f, i) => {
    const fx = 280 + i * 280;
    return `
      <text x="${fx}" y="700" text-anchor="middle" font-family="monospace" font-size="13" font-weight="700" fill="${ACCENT}">${f.label}</text>
      <text x="${fx}" y="720" text-anchor="middle" font-family="monospace" font-size="11" fill="${MUTED}">${f.desc}</text>`;
  }).join('\n  ')}
</svg>`;
}

// Screenshot 4: Share card
function screenshot4() {
  const w = 1280, h = 800;
  const cardW = 500, cardH = 340;
  const cx = w / 2, cy = h / 2;
  const cardX = cx - cardW / 2, cardY = cy - cardH / 2 - 20;

  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="${h}" fill="#0c0815"/>
  <radialGradient id="bg4" cx="50%" cy="45%" r="50%">
    <stop offset="0%" stop-color="#a855f7" stop-opacity="0.08"/>
    <stop offset="100%" stop-color="#0c0815" stop-opacity="0"/>
  </radialGradient>
  <rect width="${w}" height="${h}" fill="url(#bg4)"/>

  <!-- Title -->
  <text x="${w / 2}" y="70" text-anchor="middle" font-family="monospace" font-size="28" font-weight="700" fill="white">Share your media diet</text>
  <text x="${w / 2}" y="100" text-anchor="middle" font-family="monospace" font-size="14" fill="${MUTED}">Generate a retro-styled card to compare with friends</text>

  <!-- Share card mockup -->
  <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="12" fill="${CARD_BG}" stroke="#3d2e5c" stroke-width="1.5"/>

  <!-- Card scanlines effect -->
  ${Array.from({ length: 20 }, (_, i) =>
    `<line x1="${cardX}" y1="${cardY + 17 * i}" x2="${cardX + cardW}" y2="${cardY + 17 * i}" stroke="white" stroke-width="0.3" opacity="0.03"/>`
  ).join('\n  ')}

  <!-- Card header -->
  <text x="${cx}" y="${cardY + 40}" text-anchor="middle" font-family="monospace" font-size="16" font-weight="700" fill="${LIGHT}" letter-spacing="4">PRISM</text>
  <text x="${cx}" y="${cardY + 60}" text-anchor="middle" font-family="monospace" font-size="10" fill="${MUTED}">MEDIA DIET REPORT</text>

  <!-- Score -->
  <text x="${cx - 120}" y="${cardY + 130}" text-anchor="middle" font-family="monospace" font-size="52" font-weight="700" fill="white">78</text>
  <text x="${cx - 120}" y="${cardY + 150}" text-anchor="middle" font-family="monospace" font-size="10" fill="${MUTED}">DIVERSITY SCORE</text>

  <!-- Stats -->
  <text x="${cx + 60}" y="${cardY + 100}" font-family="monospace" font-size="10" fill="${MUTED}">ARTICLES</text>
  <text x="${cx + 160}" y="${cardY + 100}" font-family="monospace" font-size="18" font-weight="700" fill="white">45</text>

  <text x="${cx + 60}" y="${cardY + 125}" font-family="monospace" font-size="10" fill="${MUTED}">SOURCES</text>
  <text x="${cx + 160}" y="${cardY + 125}" font-family="monospace" font-size="18" font-weight="700" fill="white">12</text>

  <text x="${cx + 60}" y="${cardY + 150}" font-family="monospace" font-size="10" fill="${MUTED}">QUALITY</text>
  <text x="${cx + 160}" y="${cardY + 150}" font-family="monospace" font-size="18" font-weight="700" fill="white">High</text>

  <!-- Spectrum bar -->
  ${spectrumBar(cardX + 40, cardY + 190, cardW - 80, 14, [15, 25, 30, 20, 10])}

  ${BIAS_SHORT.map((label, i) => {
    const lx = cardX + 40 + ((cardW - 80) / 5) * (i + 0.5);
    return `<text x="${lx}" y="${cardY + 220}" text-anchor="middle" font-family="monospace" font-size="9" fill="${MUTED}">${label}</text>`;
  }).join('\n  ')}

  <!-- Card footer -->
  <line x1="${cardX + 40}" y1="${cardY + 260}" x2="${cardX + cardW - 40}" y2="${cardY + 260}" stroke="#3d2e5c" stroke-width="0.5"/>
  <text x="${cx}" y="${cardY + 285}" text-anchor="middle" font-family="monospace" font-size="10" fill="${MUTED}">See the full spectrum. // prism</text>
  <text x="${cx}" y="${cardY + 305}" text-anchor="middle" font-family="monospace" font-size="9" fill="#6b6080">FEB 2026</text>

  <!-- Caption -->
  <text x="${w / 2}" y="${h - 50}" text-anchor="middle" font-family="monospace" font-size="16" fill="${MUTED}">One click to generate. Save and share anywhere.</text>
</svg>`;
}

const screenshots = [
  { name: 'screenshot-1.png', fn: screenshot1 },
  { name: 'screenshot-2.png', fn: screenshot2 },
  { name: 'screenshot-3.png', fn: screenshot3 },
  { name: 'screenshot-4.png', fn: screenshot4 },
];

for (const ss of screenshots) {
  const svg = ss.fn();
  const outPath = path.join(OUT, ss.name);
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log(`Generated ${ss.name} (1280x800)`);
}

console.log('Done.');
