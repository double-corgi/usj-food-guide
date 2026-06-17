/**
 * Static reference exchange rates.
 * Updated: 2026-06-17
 * These are display-only estimates and should be reviewed periodically.
 */
export const CURRENCY_RATES = {
  KRW_PER_JPY: 9.2,
  TWD_PER_JPY: 0.21,
  updatedAt: "2026-06-17"
} as const;

export function convertToKRW(jpy: number): number {
  return Math.round((jpy * CURRENCY_RATES.KRW_PER_JPY) / 100) * 100;
}

export function convertToTWD(jpy: number): number {
  return Math.round(jpy * CURRENCY_RATES.TWD_PER_JPY);
}
