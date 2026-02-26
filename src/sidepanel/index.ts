import type { DietStats, Bias } from '../lib/types';
import { BIAS_LABELS, BIAS_SHORT } from '../lib/types';

const BIAS_KEYS: Bias[] = [0, 1, 2, 3, 4];
const BIAS_COLORS: Record<Bias, string> = {
  0: '#3b82f6', 1: '#60a5fa', 2: '#a855f7', 3: '#f97316', 4: '#ef4444',
};

let currentPeriod: 'week' | 'month' = 'week';

const $loading = document.getElementById('loading')!;
const $locked = document.getElementById('locked')!;
const $dashboard = document.getElementById('dashboard')!;

// --- SVG gradient for score ring ---
function injectGradient() {
  const svg = document.querySelector('.ring-svg')!;
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  grad.id = 'ring-gradient';
  grad.setAttribute('x1', '0%');
  grad.setAttribute('y1', '0%');
  grad.setAttribute('x2', '100%');
  grad.setAttribute('y2', '100%');

  const stops = [
    { offset: '0%', color: '#06b6d4' },
    { offset: '50%', color: '#a855f7' },
    { offset: '100%', color: '#ec4899' },
  ];
  for (const s of stops) {
    const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop.setAttribute('offset', s.offset);
    stop.setAttribute('stop-color', s.color);
    grad.appendChild(stop);
  }
  defs.appendChild(grad);
  svg.prepend(defs);
}

async function loadStats() {
  $loading.classList.remove('hidden');
  $locked.classList.add('hidden');
  $dashboard.classList.add('hidden');

  const stats: DietStats = await chrome.runtime.sendMessage({
    type: 'get-stats',
    period: currentPeriod,
  });

  $loading.classList.add('hidden');

  if (stats.totalArticles < 10) {
    showLocked(stats.totalArticles);
  } else {
    showDashboard(stats);
  }
}

function showLocked(count: number) {
  $locked.classList.remove('hidden');
  document.getElementById('current-count')!.textContent = String(count);
  const fill = document.getElementById('progress-fill')!;
  fill.style.width = `${(count / 10) * 100}%`;
}

function showDashboard(stats: DietStats) {
  $dashboard.classList.remove('hidden');

  // Score ring
  const scoreDisplay = document.getElementById('score-display')!;
  scoreDisplay.textContent = String(stats.score);
  const ringFill = document.getElementById('ring-fill')!;
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (stats.score / 100) * circumference;
  ringFill.style.strokeDashoffset = String(offset);

  // Spectrum bar
  for (const b of BIAS_KEYS) {
    const seg = document.getElementById(`seg-${BIAS_SHORT[b]}`)!;
    seg.style.flexGrow = String(stats.biasPercentages[b] || 0.5);
  }

  // Spectrum legend
  const $legend = document.getElementById('spectrum-legend')!;
  $legend.innerHTML = '';
  for (const b of BIAS_KEYS) {
    const pct = stats.biasPercentages[b];
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `<div class="legend-dot" data-bias="${BIAS_SHORT[b]}"></div>${BIAS_LABELS[b]} ${pct}%`;
    $legend.appendChild(item);
  }

  // Stats
  document.getElementById('article-count')!.textContent = String(stats.totalArticles);
  document.getElementById('source-count')!.textContent = String(stats.uniqueSources);
  const credLabels = ['V.Low', 'Low', 'Mixed', 'OK', 'High', 'V.High'];
  document.getElementById('cred-avg')!.textContent = credLabels[Math.round(stats.avgCredibility)] || '--';

  // Blind spots
  const $spotsSection = document.getElementById('blind-spots-section')!;
  const $spots = document.getElementById('blind-spots')!;
  $spots.innerHTML = '';

  if (stats.blindSpots.length === 0) {
    $spotsSection.classList.add('hidden');
  } else {
    $spotsSection.classList.remove('hidden');
    for (const spot of stats.blindSpots) {
      const card = document.createElement('div');
      card.className = 'blind-spot-card';

      // Build perspective links for the missing bias categories
      const links = spot.biasMissing.map(b => {
        const query = encodeURIComponent(stats.topSources[0]?.name || 'news');
        return `<a class="perspective-link" href="https://news.google.com/search?q=${query}" target="_blank">${BIAS_LABELS[b]}</a>`;
      }).join('');

      card.innerHTML = `
        <strong>No ${spot.topic}</strong> this ${currentPeriod}.
        <div class="perspective-links">Try: ${links}</div>
      `;
      $spots.appendChild(card);
    }
  }

  // Top sources
  const $sources = document.getElementById('top-sources')!;
  $sources.innerHTML = '';
  for (const src of stats.topSources) {
    const row = document.createElement('div');
    row.className = 'source-row';
    row.innerHTML = `
      <div class="source-bias-dot" style="background:${BIAS_COLORS[src.bias]}"></div>
      <div class="source-name">${src.name}</div>
      <div class="source-count">${src.count}</div>
    `;
    $sources.appendChild(row);
  }
}

// --- Period toggle ---
document.querySelectorAll('.period-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentPeriod = (btn as HTMLElement).dataset.period as 'week' | 'month';
    loadStats();
  });
});

// --- Share card ---
document.getElementById('share-btn')?.addEventListener('click', async () => {
  const stats: DietStats = await chrome.runtime.sendMessage({
    type: 'get-stats',
    period: currentPeriod,
  });
  if (stats.score < 0) return;
  generateShareCard(stats);
});

// --- Clear data ---
document.getElementById('clear-btn')?.addEventListener('click', async () => {
  if (confirm('Clear all reading history? This cannot be undone.')) {
    await chrome.runtime.sendMessage({ type: 'clear-all' });
    loadStats();
  }
});

function generateShareCard(stats: DietStats) {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#1a1127';
  ctx.fillRect(0, 0, 600, 400);

  // Border
  ctx.strokeStyle = '#7c3aed';
  ctx.lineWidth = 2;
  ctx.strokeRect(8, 8, 584, 384);

  // Title bar
  const titleGrad = ctx.createLinearGradient(8, 8, 592, 8);
  titleGrad.addColorStop(0, '#4c1d95');
  titleGrad.addColorStop(0.5, '#a855f7');
  titleGrad.addColorStop(1, '#4c1d95');
  ctx.fillStyle = titleGrad;
  ctx.fillRect(8, 8, 584, 32);

  ctx.font = '18px "VT323", monospace';
  ctx.fillStyle = 'white';
  ctx.fillText('PRISM — YOUR MEDIA DIET', 20, 30);

  const periodLabel = currentPeriod === 'week' ? 'This Week' : 'This Month';
  ctx.font = '14px "VT323", monospace';
  ctx.fillStyle = '#9890a8';
  ctx.textAlign = 'right';
  ctx.fillText(periodLabel, 580, 30);
  ctx.textAlign = 'left';

  // Score
  ctx.font = 'bold 72px "VT323", monospace';
  const scoreGrad = ctx.createLinearGradient(40, 60, 40, 160);
  scoreGrad.addColorStop(0, '#06b6d4');
  scoreGrad.addColorStop(0.5, '#a855f7');
  scoreGrad.addColorStop(1, '#ec4899');
  ctx.fillStyle = scoreGrad;
  ctx.fillText(String(stats.score), 40, 130);

  ctx.font = '16px "VT323", monospace';
  ctx.fillStyle = '#9890a8';
  ctx.fillText('DIVERSITY SCORE', 40, 150);

  // Spectrum bar
  const barX = 40;
  const barY = 170;
  const barW = 520;
  const barH = 24;
  const colors = ['#3b82f6', '#60a5fa', '#a855f7', '#f97316', '#ef4444'];

  let xPos = barX;
  for (const b of BIAS_KEYS) {
    const pct = stats.biasPercentages[b] || 1;
    const segW = Math.max((pct / 100) * barW, 2);
    ctx.fillStyle = colors[b];
    ctx.fillRect(xPos, barY, segW, barH);
    xPos += segW;
  }

  ctx.strokeStyle = '#4c1d95';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);

  // Legend
  ctx.font = '13px "Space Mono", monospace';
  let legendX = 40;
  for (const b of BIAS_KEYS) {
    ctx.fillStyle = colors[b];
    ctx.fillRect(legendX, 206, 8, 8);
    ctx.fillStyle = '#9890a8';
    ctx.fillText(`${BIAS_LABELS[b]} ${stats.biasPercentages[b]}%`, legendX + 12, 214);
    legendX += 110;
  }

  // Stats
  ctx.font = '36px "VT323", monospace';
  ctx.fillStyle = '#e2e0e7';
  ctx.fillText(String(stats.totalArticles), 40, 270);
  ctx.fillText(String(stats.uniqueSources), 200, 270);

  ctx.font = '12px "Space Mono", monospace';
  ctx.fillStyle = '#9890a8';
  ctx.fillText('ARTICLES', 40, 286);
  ctx.fillText('SOURCES', 200, 286);

  // Blind spots
  if (stats.blindSpots.length > 0) {
    ctx.font = '14px "VT323", monospace';
    ctx.fillStyle = '#a855f7';
    ctx.fillText('BLIND SPOTS:', 40, 320);
    ctx.font = '13px "Space Mono", monospace';
    ctx.fillStyle = '#9890a8';
    const spotText = stats.blindSpots.map(s => s.topic).join(', ');
    ctx.fillText(spotText.slice(0, 60), 40, 340);
  }

  // Branding
  ctx.font = '14px "VT323", monospace';
  ctx.fillStyle = '#4c1d95';
  ctx.fillText('See your full spectrum. Get Prism.', 40, 376);

  // Download
  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prism-${currentPeriod}-${new Date().toISOString().slice(0, 10)}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

// --- Init ---
injectGradient();
loadStats();
