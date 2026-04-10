/** Bias categories on the political spectrum */
export enum Bias {
  L = 0,    // Left
  LC = 1,   // Left-Center
  C = 2,    // Center
  RC = 3,   // Right-Center
  R = 4,    // Right
}

/** Factual reporting credibility */
export enum Credibility {
  VL = 0,   // Very Low
  L = 1,    // Low
  M = 2,    // Mixed
  MF = 3,   // Mostly Factual
  H = 4,    // High
  VH = 5,   // Very High
}

export const BIAS_LABELS: Record<Bias, string> = {
  [Bias.L]: 'Left',
  [Bias.LC]: 'Left-Center',
  [Bias.C]: 'Center',
  [Bias.RC]: 'Right-Center',
  [Bias.R]: 'Right',
};

export const BIAS_SHORT: Record<Bias, string> = {
  [Bias.L]: 'L',
  [Bias.LC]: 'LC',
  [Bias.C]: 'C',
  [Bias.RC]: 'RC',
  [Bias.R]: 'R',
};

export const BIAS_KEYS: Bias[] = [Bias.L, Bias.LC, Bias.C, Bias.RC, Bias.R];

export const BIAS_COLORS: Record<Bias, string> = {
  [Bias.L]: '#3b82f6',
  [Bias.LC]: '#60a5fa',
  [Bias.C]: '#a855f7',
  [Bias.RC]: '#f97316',
  [Bias.R]: '#ef4444',
};

/** A single reading record stored in IndexedDB */
export interface ReadingRecord {
  id?: number;
  url: string;
  domain: string;
  title: string;
  timestamp: number;
  bias: Bias;
  credibility: Credibility;
  sourceName: string;
}

/** Aggregated stats for a time window */
export interface DietStats {
  totalArticles: number;
  uniqueSources: number;
  biasDistribution: Record<Bias, number>;  // count per category
  biasPercentages: Record<Bias, number>;   // 0-100 per category
  avgCredibility: number;                   // 0-5 scale
  score: number;                            // 0-100 diversity score
  topSources: Array<{ domain: string; name: string; count: number; bias: Bias }>;
  blindSpots: BlindSpot[];
  periodStart: number;
  periodEnd: number;
}

export interface BlindSpot {
  topic: string;
  biasRead: Bias[];       // which bias categories you read this topic from
  biasMissing: Bias[];    // which you didn't
  articleCount: number;
}

export interface Settings {
  period: 'week' | 'month';
  notifications: boolean;
}

/** Messages between popup/sidepanel and background */
export type Message =
  | { type: 'get-stats'; period: 'week' | 'month' }
  | { type: 'get-current-page' }
  | { type: 'get-settings' }
  | { type: 'set-settings'; settings: Partial<Settings> }
  | { type: 'clear-all' }
  | { type: 'get-sources-for-bias'; bias: Bias };
