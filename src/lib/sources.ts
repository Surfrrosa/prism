import { Bias, Credibility } from './types';

// These are loaded at build time via esbuild's JSON import
import sourcesData from '../../static/sources.json';
import namesData from '../../static/source-names.json';

const sources = sourcesData as unknown as Record<string, [number, number]>;
const names = namesData as unknown as Record<string, string>;

/**
 * Supplementary sources not in MBFC: aggregators, newer outlets, international.
 * Format: [bias, credibility]
 */
const SUPPLEMENTARY: Record<string, { name: string; bias: Bias; cred: Credibility }> = {
  // Aggregators (rated Center — they show all sides)
  'ground.news':       { name: 'Ground News',       bias: Bias.C,  cred: Credibility.H },
  'news.google.com':   { name: 'Google News',       bias: Bias.C,  cred: Credibility.H },
  'apple.news':        { name: 'Apple News',        bias: Bias.C,  cred: Credibility.H },
  'flipboard.com':     { name: 'Flipboard',         bias: Bias.C,  cred: Credibility.MF },
  'news.yahoo.com':    { name: 'Yahoo News',        bias: Bias.LC, cred: Credibility.H },
  'substack.com':      { name: 'Substack',          bias: Bias.C,  cred: Credibility.MF },
  // International outlets not in MBFC
  'bbc.co.uk':         { name: 'BBC News',          bias: Bias.LC, cred: Credibility.H },
  'sky.com':           { name: 'Sky News',           bias: Bias.RC, cred: Credibility.H },
  'lemonde.fr':        { name: 'Le Monde',          bias: Bias.LC, cred: Credibility.H },
  'middleeasteye.net': { name: 'Middle East Eye',   bias: Bias.LC, cred: Credibility.MF },
  'allafrica.com':     { name: 'AllAfrica',          bias: Bias.C,  cred: Credibility.H },
  'nikkei.com':        { name: 'Nikkei Asia',       bias: Bias.C,  cred: Credibility.H },
  'kyodonews.net':     { name: 'Kyodo News',        bias: Bias.C,  cred: Credibility.H },
  'yna.co.kr':         { name: 'Yonhap News',       bias: Bias.C,  cred: Credibility.H },
  'batimes.com.ar':    { name: 'Buenos Aires Times', bias: Bias.C,  cred: Credibility.MF },
  'elpais.com':        { name: 'El Pais',           bias: Bias.LC, cred: Credibility.H },
  'bangkokpost.com':   { name: 'Bangkok Post',      bias: Bias.C,  cred: Credibility.H },
  'japantimes.co.jp':  { name: 'Japan Times',       bias: Bias.C,  cred: Credibility.H },
  'irishtimes.com':    { name: 'The Irish Times',   bias: Bias.LC, cred: Credibility.H },
  'rte.ie':            { name: 'RTE News',           bias: Bias.C,  cred: Credibility.H },
  'stuff.co.nz':       { name: 'Stuff (NZ)',        bias: Bias.LC, cred: Credibility.H },
  'rnz.co.nz':         { name: 'Radio NZ',          bias: Bias.C,  cred: Credibility.H },
  'tempo.co':          { name: 'Tempo (Indonesia)', bias: Bias.C,  cred: Credibility.MF },
  'dawn.com':          { name: 'Dawn (Pakistan)',   bias: Bias.C,  cred: Credibility.H },
  'thenation.com.pk':  { name: 'The Nation (PK)',   bias: Bias.RC, cred: Credibility.MF },
};

export interface SourceInfo {
  domain: string;
  name: string;
  bias: Bias;
  credibility: Credibility;
}

/**
 * Look up a domain in the MBFC database + supplementary list + heuristics.
 * Tries exact match first, then strips subdomains progressively,
 * then falls back to news-site heuristics for local/unrated outlets.
 */
export function lookupSource(hostname: string): SourceInfo | null {
  return lookupMBFC(hostname) || lookupSupplementary(hostname) || detectNewsSite(hostname);
}

function lookupMBFC(hostname: string): SourceInfo | null {
  // Try exact match
  let entry = sources[hostname];
  if (entry) {
    return {
      domain: hostname,
      name: names[hostname] || hostname,
      bias: entry[0] as Bias,
      credibility: entry[1] as Credibility,
    };
  }

  // Strip www.
  if (hostname.startsWith('www.')) {
    const bare = hostname.slice(4);
    entry = sources[bare];
    if (entry) {
      return {
        domain: bare,
        name: names[bare] || bare,
        bias: entry[0] as Bias,
        credibility: entry[1] as Credibility,
      };
    }
  }

  // Try parent domains (e.g., politics.nytimes.com -> nytimes.com)
  for (const parent of getParentDomains(hostname)) {
    entry = sources[parent];
    if (entry) {
      return {
        domain: parent,
        name: names[parent] || parent,
        bias: entry[0] as Bias,
        credibility: entry[1] as Credibility,
      };
    }
  }

  return null;
}

function lookupSupplementary(hostname: string): SourceInfo | null {
  // Try exact
  let sup = SUPPLEMENTARY[hostname];
  if (sup) return { domain: hostname, ...sup, credibility: sup.cred };

  // Strip www.
  if (hostname.startsWith('www.')) {
    const bare = hostname.slice(4);
    sup = SUPPLEMENTARY[bare];
    if (sup) return { domain: bare, ...sup, credibility: sup.cred };
  }

  // Try parent domains
  for (const parent of getParentDomains(hostname)) {
    sup = SUPPLEMENTARY[parent];
    if (sup) return { domain: parent, ...sup, credibility: sup.cred };
  }

  return null;
}

/** Two-letter country code TLDs that use second-level domains (co.uk, com.au, etc.) */
const COMPOUND_TLDS = new Set([
  'co.uk', 'co.kr', 'co.jp', 'co.nz', 'co.za', 'co.in', 'co.id',
  'com.au', 'com.br', 'com.ar', 'com.mx', 'com.pk', 'com.ng', 'com.sg',
  'org.uk', 'net.au', 'ac.uk',
]);

/**
 * Get possible parent domains for a hostname.
 * Handles compound TLDs: news.bbc.co.uk -> bbc.co.uk (not co.uk)
 */
function getParentDomains(hostname: string): string[] {
  const parts = hostname.replace(/^www\./, '').split('.');
  if (parts.length <= 2) return [];

  const results: string[] = [];

  // Check if this has a compound TLD
  const lastTwo = parts.slice(-2).join('.');
  if (COMPOUND_TLDS.has(lastTwo) && parts.length > 3) {
    // e.g., news.bbc.co.uk -> bbc.co.uk
    results.push(parts.slice(-3).join('.'));
  }

  // Standard parent: drop first subdomain
  if (parts.length > 2) {
    results.push(parts.slice(-2).join('.'));
  }

  return results;
}

/**
 * Heuristic detection for news sites not in any database.
 * Catches local TV stations, smaller newspapers, regional outlets.
 * These get tracked as Center/unrated so they still count toward the diet.
 */
function detectNewsSite(hostname: string): SourceInfo | null {
  const bare = hostname.startsWith('www.') ? hostname.slice(4) : hostname;
  const lower = bare.toLowerCase();

  // Local TV station call signs (KABC, WGBH, KIRO, etc.)
  if (/^[kw][a-z]{2,4}\d*\.com$/.test(lower)) {
    return {
      domain: bare,
      name: formatDomainName(bare),
      bias: Bias.C,
      credibility: Credibility.MF,
    };
  }

  // Domains containing common news keywords
  const newsWords = [
    'news', 'tribune', 'times', 'herald', 'gazette', 'journal',
    'post', 'press', 'daily', 'observer', 'chronicle', 'dispatch',
    'sentinel', 'courier', 'register', 'examiner', 'inquirer',
    'reporter', 'monitor', 'beacon', 'patch',
  ];

  if (newsWords.some(w => lower.includes(w))) {
    // Exclude obvious non-news (hackernews, goodnewsnetwork type things are fine)
    const excludePatterns = ['technews', 'gamenews', 'sportnews'];
    if (excludePatterns.some(p => lower.includes(p))) return null;

    return {
      domain: bare,
      name: formatDomainName(bare),
      bias: Bias.C,          // Unknown lean — default center
      credibility: Credibility.MF,  // Unverified — default mostly factual
    };
  }

  return null;
}

/** Convert a domain like "seattletimes.com" into "Seattle Times" */
function formatDomainName(domain: string): string {
  const name = domain.replace(/\.(com|org|net|co|io|us|uk)$/i, '');
  return name
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Get a list of high-credibility sources from a given bias category.
 * Used for "See other perspectives" links.
 */
export function getSourcesForBias(bias: Bias, limit = 5): Array<{ domain: string; name: string }> {
  const results: Array<{ domain: string; name: string; cred: number }> = [];

  for (const [domain, [b, c]] of Object.entries(sources)) {
    if (b === bias && c >= 4) { // High or Very High credibility only
      results.push({ domain, name: names[domain] || domain, cred: c });
    }
  }

  // Sort by credibility descending, take top N
  return results
    .sort((a, b) => b.cred - a.cred)
    .slice(0, limit)
    .map(({ domain, name }) => ({ domain, name }));
}
