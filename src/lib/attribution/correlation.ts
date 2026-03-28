import type { CorrelationResult } from "./types";

/**
 * Compute Pearson correlation coefficient between two numeric series.
 * Returns 0 if insufficient data.
 */
export function computePearsonCorrelation(
  seriesA: number[],
  seriesB: number[]
): number {
  const n = Math.min(seriesA.length, seriesB.length);
  if (n < 3) return 0;

  const a = seriesA.slice(0, n);
  const b = seriesB.slice(0, n);

  const meanA = a.reduce((s, v) => s + v, 0) / n;
  const meanB = b.reduce((s, v) => s + v, 0) / n;

  let numerator = 0;
  let denomA = 0;
  let denomB = 0;

  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    numerator += da * db;
    denomA += da * da;
    denomB += db * db;
  }

  const denom = Math.sqrt(denomA * denomB);
  if (denom === 0) return 0;

  return numerator / denom;
}

/**
 * Test time-lagged correlations (0 to maxLag days) and return the best.
 */
export function computeTimelagCorrelation(
  seriesA: number[],
  seriesB: number[],
  maxLag = 14
): { coefficient: number; lag: number } {
  let bestR = 0;
  let bestLag = 0;

  for (let lag = 0; lag <= maxLag; lag++) {
    const shifted = seriesB.slice(lag);
    const trimmed = seriesA.slice(0, shifted.length);
    const r = computePearsonCorrelation(trimmed, shifted);

    if (Math.abs(r) > Math.abs(bestR)) {
      bestR = r;
      bestLag = lag;
    }
  }

  return { coefficient: bestR, lag: bestLag };
}

/**
 * Assess correlation significance based on r value and sample size.
 */
export function assessSignificance(
  r: number,
  n: number
): CorrelationResult["significance"] {
  if (n < 7) return "insufficient_data";
  const absR = Math.abs(r);
  if (absR >= 0.7) return "strong";
  if (absR >= 0.4) return "moderate";
  return "weak";
}
