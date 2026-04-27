import sharp from 'sharp';
import path from 'path';
import { mkdirSync } from 'fs';

export const BG = '#1a1127';
export const SPECTRUM = ['#3B82F6', '#60A5FA', '#A855F7', '#F97316', '#EF4444'];

/** Prism logo as an SVG `<g>` snippet, sized to fit a `size`x`size` box. */
export function prismIcon(size) {
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

/** Render a list of {name, fn, w, h} card definitions to PNG files in `outDir`. */
export async function renderCards(cards, outDir) {
  mkdirSync(outDir, { recursive: true });
  for (const card of cards) {
    const svg = card.fn();
    const outPath = path.join(outDir, card.name);
    await sharp(Buffer.from(svg)).png().toFile(outPath);
    const dims = card.w && card.h ? ` (${card.w}x${card.h})` : '';
    console.log(`Generated ${card.name}${dims}`);
  }
}
