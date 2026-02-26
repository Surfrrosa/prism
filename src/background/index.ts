import { lookupSource, getSourcesForBias } from '../lib/sources';
import { storeReading, getReadings, clearAllData, getSettings, saveSettings, pruneOldReadings } from '../lib/storage';
import { computeStats, getPeriodRange } from '../lib/score';
import { Bias } from '../lib/types';

// --- Badge colors mapped to dominant bias ---
const BIAS_COLORS: Record<Bias, string> = {
  [Bias.L]: '#3B82F6',   // blue
  [Bias.LC]: '#60A5FA',  // light blue
  [Bias.C]: '#A855F7',   // purple
  [Bias.RC]: '#F97316',  // orange
  [Bias.R]: '#EF4444',   // red
};

// --- Track completed page loads ---

// Debounce: only process a tab once it's fully loaded
const pendingTabs = new Set<number>();

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status === 'loading') {
    pendingTabs.add(tabId);
  }

  if (info.status === 'complete' && pendingTabs.has(tabId)) {
    pendingTabs.delete(tabId);
    if (tab.url) handlePageVisit(tabId, tab.url, tab.title || '');
  }
});

// Clean up pendingTabs when tabs are closed to prevent memory leaks
chrome.tabs.onRemoved.addListener((tabId) => {
  pendingTabs.delete(tabId);
});

async function handlePageVisit(tabId: number, url: string, title: string) {
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return; // invalid URL (chrome://, etc.)
  }

  const source = lookupSource(hostname);
  if (!source) {
    // Not a tracked news source -- set neutral badge
    chrome.action.setBadgeText({ tabId, text: '' }).catch(() => {});
    return;
  }

  // Store the reading
  const stored = await storeReading({
    url,
    domain: source.domain,
    title,
    timestamp: Date.now(),
    bias: source.bias,
    credibility: source.credibility,
    sourceName: source.name,
  });

  // Update badge to show source bias
  const biasLetter = ['L', 'LC', 'C', 'RC', 'R'][source.bias];
  chrome.action.setBadgeText({ tabId, text: biasLetter }).catch(() => {});
  chrome.action.setBadgeBackgroundColor({
    tabId,
    color: BIAS_COLORS[source.bias],
  }).catch(() => {});
}

// --- Message handling ---

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const handler = messageHandlers[message.type as string];
  if (handler) {
    handler(message).then(sendResponse).catch(() => sendResponse(null));
    return true;
  }
});

const messageHandlers: Record<string, (msg: any) => Promise<any>> = {
  'get-stats': async (msg) => {
    const period = msg.period || 'week';
    const { start, end } = getPeriodRange(period);
    const records = await getReadings(start, end);
    return computeStats(records, start, end);
  },

  'get-current-page': async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return null;

    try {
      const hostname = new URL(tab.url).hostname;
      return lookupSource(hostname);
    } catch {
      return null;
    }
  },

  'get-settings': async () => getSettings(),

  'set-settings': async (msg) => {
    await saveSettings(msg.settings);
  },

  'clear-all': async () => {
    await clearAllData();
  },

  'get-sources-for-bias': async (msg) => {
    return getSourcesForBias(msg.bias, 5);
  },
};

// --- Weekly cleanup & notification ---

chrome.alarms.create('weekly-report', { periodInMinutes: 60 * 24 }); // check daily
chrome.alarms.create('prune-old', { periodInMinutes: 60 * 24 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'prune-old') {
    // Prune readings older than 90 days
    const cutoff = Date.now() - (90 * 24 * 60 * 60 * 1000);
    const pruned = await pruneOldReadings(cutoff);
    if (pruned > 0) console.log(`[Prism] Pruned ${pruned} old readings`);
  }

  if (alarm.name === 'weekly-report') {
    const settings = await getSettings();
    if (!settings.notifications) return;

    // Only notify on Sundays
    if (new Date().getDay() !== 0) return;

    const { start, end } = getPeriodRange('week');
    const records = await getReadings(start, end);
    const stats = computeStats(records, start, end);

    if (stats.totalArticles < 10) return;

    chrome.notifications.create('weekly-report', {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Your weekly media report is ready',
      message: `Score: ${stats.score}/100 | ${stats.totalArticles} articles from ${stats.uniqueSources} sources`,
    });
  }
});

// Open side panel when notification is clicked
chrome.notifications.onClicked.addListener((id) => {
  if (id === 'weekly-report') {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.id) {
        chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
      }
    });
  }
});
