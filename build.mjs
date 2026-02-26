import { build } from 'esbuild';
import { cpSync, rmSync } from 'fs';

const isDev = process.argv.includes('--dev');

rmSync('dist', { recursive: true, force: true });

await build({
  entryPoints: {
    'background': 'src/background/index.ts',
    'popup/index': 'src/popup/index.ts',
    'sidepanel/index': 'src/sidepanel/index.ts',
  },
  bundle: true,
  outdir: 'dist',
  format: 'iife',
  target: 'chrome120',
  sourcemap: isDev,
});

cpSync('static', 'dist', { recursive: true });

// Remove standalone JSON files that are already bundled into JS by esbuild
rmSync('dist/sources.json', { force: true });
rmSync('dist/source-names.json', { force: true });

// Remove CWS promo/screenshot images that shouldn't ship in the extension
import { readdirSync } from 'fs';
for (const f of readdirSync('dist')) {
  if (f.startsWith('promo-') || f.startsWith('screenshot-')) {
    rmSync(`dist/${f}`, { force: true });
  }
}

console.log(`Build complete -> dist/${isDev ? ' (with source maps)' : ''}`);
