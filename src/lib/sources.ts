import type { Bias, Credibility } from './types';

// These are loaded at build time via esbuild's JSON import
import sourcesData from '../../static/sources.json';
import namesData from '../../static/source-names.json';

const sources = sourcesData as unknown as Record<string, [number, number]>;
const names = namesData as unknown as Record<string, string>;

export interface SourceInfo {
  domain: string;
  name: string;
  bias: Bias;
  credibility: Credibility;
}

/**
 * Look up a domain in the MBFC database.
 * Tries exact match first, then strips subdomains progressively.
 */
export function lookupSource(hostname: string): SourceInfo | null {
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

  // Try parent domain (e.g., politics.nytimes.com -> nytimes.com)
  const parts = hostname.split('.');
  if (parts.length > 2) {
    const parent = parts.slice(-2).join('.');
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
