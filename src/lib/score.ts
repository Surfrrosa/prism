import { Bias, Credibility, type ReadingRecord, type DietStats, type BlindSpot, BIAS_LABELS } from './types';

const ALL_BIASES = [Bias.L, Bias.LC, Bias.C, Bias.RC, Bias.R];

/**
 * Compute a Perspective Diversity Score (0-100) from reading records.
 *
 * The score rewards:
 *   1. Bias entropy (40 pts) — reading across all 5 bias categories
 *   2. Source variety (25 pts) — unique sources relative to total reads
 *   3. Factual quality (20 pts) — higher credibility average = better
 *   4. Coverage breadth (15 pts) — having at least some reads in each category
 *
 * Minimum 10 articles before score is meaningful (returns -1 below that).
 */
export function computeStats(records: ReadingRecord[], periodStart: number, periodEnd: number): DietStats {
  const biasDistribution: Record<Bias, number> = {
    [Bias.L]: 0, [Bias.LC]: 0, [Bias.C]: 0, [Bias.RC]: 0, [Bias.R]: 0,
  };
  const biasPercentages: Record<Bias, number> = {
    [Bias.L]: 0, [Bias.LC]: 0, [Bias.C]: 0, [Bias.RC]: 0, [Bias.R]: 0,
  };

  const sourceCounts = new Map<string, { name: string; count: number; bias: Bias }>();
  let credSum = 0;

  for (const r of records) {
    biasDistribution[r.bias]++;
    credSum += r.credibility;

    const existing = sourceCounts.get(r.domain);
    if (existing) {
      existing.count++;
    } else {
      sourceCounts.set(r.domain, { name: r.sourceName, count: 1, bias: r.bias });
    }
  }

  const total = records.length;
  const uniqueSources = sourceCounts.size;

  // Percentages
  for (const b of ALL_BIASES) {
    biasPercentages[b] = total > 0 ? Math.round((biasDistribution[b] / total) * 100) : 0;
  }

  // Average credibility (0-5 scale)
  const avgCredibility = total > 0 ? credSum / total : 0;

  // Top sources
  const topSources = [...sourceCounts.entries()]
    .map(([domain, info]) => ({ domain, ...info }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Blind spots (simple: bias categories with 0 reads)
  const blindSpots: BlindSpot[] = [];
  for (const b of ALL_BIASES) {
    if (biasDistribution[b] === 0 && total >= 10) {
      blindSpots.push({
        topic: BIAS_LABELS[b] + ' perspectives',
        biasRead: ALL_BIASES.filter(x => biasDistribution[x] > 0),
        biasMissing: [b],
        articleCount: 0,
      });
    }
  }

  // Compute the score
  const score = total >= 10 ? calculateScore(biasDistribution, total, uniqueSources, avgCredibility) : -1;

  return {
    totalArticles: total,
    uniqueSources,
    biasDistribution,
    biasPercentages,
    avgCredibility,
    score,
    topSources,
    blindSpots,
    periodStart,
    periodEnd,
  };
}

function calculateScore(
  dist: Record<Bias, number>,
  total: number,
  uniqueSources: number,
  avgCred: number
): number {
  // 1. Bias entropy (0-40 points)
  //    Shannon entropy normalized to max entropy (log2(5) for 5 categories)
  const maxEntropy = Math.log2(5);
  let entropy = 0;
  for (const b of ALL_BIASES) {
    const p = dist[b] / total;
    if (p > 0) entropy -= p * Math.log2(p);
  }
  const entropyScore = (entropy / maxEntropy) * 40;

  // 2. Source variety (0-25 points)
  //    Ratio of unique sources to total, capped at reasonable thresholds
  //    10 unique sources across 50 reads = excellent variety
  const varietyRatio = Math.min(uniqueSources / Math.max(total * 0.5, 1), 1);
  const varietyScore = varietyRatio * 25;

  // 3. Factual quality (0-20 points)
  //    avgCred is 0-5, map to 0-20
  const qualityScore = (avgCred / 5) * 20;

  // 4. Coverage breadth (0-15 points)
  //    3 points per bias category with at least 1 read
  const categoriesHit = ALL_BIASES.filter(b => dist[b] > 0).length;
  const breadthScore = categoriesHit * 3;

  return Math.round(entropyScore + varietyScore + qualityScore + breadthScore);
}

/** Get the time range for a given period. */
export function getPeriodRange(period: 'week' | 'month'): { start: number; end: number } {
  const now = new Date();
  const end = now.getTime();

  if (period === 'week') {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    return { start: start.getTime(), end };
  }

  const start = new Date(now);
  start.setMonth(start.getMonth() - 1);
  start.setHours(0, 0, 0, 0);
  return { start: start.getTime(), end };
}
