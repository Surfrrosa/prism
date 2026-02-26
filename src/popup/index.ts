import type { DietStats, Bias } from '../lib/types';
import { BIAS_LABELS, BIAS_SHORT, CREDIBILITY_LABELS, Credibility } from '../lib/types';

const BIAS_KEYS: Bias[] = [0, 1, 2, 3, 4];

const $loading = document.getElementById('loading')!;
const $locked = document.getElementById('locked')!;
const $unlocked = document.getElementById('unlocked')!;

async function init() {
  // Get current page info
  const pageInfo = await chrome.runtime.sendMessage({ type: 'get-current-page' });
  if (pageInfo) showCurrentPage(pageInfo);

  // Get stats
  const stats: DietStats = await chrome.runtime.sendMessage({ type: 'get-stats', period: 'week' });

  $loading.classList.add('hidden');

  if (stats.totalArticles < 10) {
    showLocked(stats.totalArticles);
  } else {
    showUnlocked(stats);
  }
}

function showLocked(count: number) {
  $locked.classList.remove('hidden');
  document.getElementById('current-count')!.textContent = String(count);
  const fill = document.getElementById('progress-fill')!;
  fill.style.width = `${(count / 10) * 100}%`;
}

function showUnlocked(stats: DietStats) {
  $unlocked.classList.remove('hidden');

  // Score
  document.getElementById('score')!.textContent = String(stats.score);

  // Spectrum bar
  for (const b of BIAS_KEYS) {
    const seg = document.getElementById(`seg-${BIAS_SHORT[b]}`)!;
    const pct = stats.biasPercentages[b];
    seg.style.flexGrow = String(pct || 0.5); // min sliver for empty segments
  }

  // Stats
  document.getElementById('article-count')!.textContent = String(stats.totalArticles);
  document.getElementById('source-count')!.textContent = String(stats.uniqueSources);

  // Credibility label
  const credLabels = ['Very Low', 'Low', 'Mixed', 'OK', 'High', 'Very High'];
  const credIdx = Math.round(stats.avgCredibility);
  document.getElementById('cred-avg')!.textContent = credLabels[credIdx] || '--';

  // Blind spots
  const $spots = document.getElementById('blind-spots')!;
  for (const spot of stats.blindSpots.slice(0, 2)) {
    const el = document.createElement('div');
    el.className = 'blind-spot-item';
    const strong = document.createElement('strong');
    strong.textContent = 'Blind spot:';
    el.appendChild(strong);
    el.appendChild(document.createTextNode(' ' + spot.topic));
    $spots.appendChild(el);
  }
}

function showCurrentPage(info: { name: string; bias: Bias; credibility: number }) {
  const $page = document.getElementById('current-page')!;
  $page.classList.remove('hidden');
  $page.textContent = '';

  const nameSpan = document.createElement('span');
  nameSpan.className = 'source-name';
  nameSpan.textContent = info.name;

  const biasSpan = document.createElement('span');
  biasSpan.className = 'bias-tag';
  biasSpan.dataset.bias = BIAS_SHORT[info.bias];
  biasSpan.textContent = BIAS_LABELS[info.bias];

  $page.appendChild(nameSpan);
  $page.appendChild(biasSpan);
}

// Open side panel
document.getElementById('open-dashboard')?.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
    window.close();
  }
});

init();
