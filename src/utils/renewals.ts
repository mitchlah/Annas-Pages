import type { Subscription } from '../data/types';
import { CYCLE_MONTHS } from '../data/types';
import { todayIso } from './format';

// Adds n calendar months to an ISO date, clamping the day to the
// target month's length (e.g. Jan 31 + 1 month -> Feb 28).
export function addMonths(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1 + n, 1);
  const lastDay = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
  ).getDate();
  date.setDate(Math.min(d, lastDay));
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
}

export interface RenewalView {
  past: string[];
  pastTotal: number;
  hasMorePast: boolean;
  future: string[];
  hasMoreFuture: boolean;
  next: string | null;
}

// Renewals occur at renewalDate, then every cycle thereafter.
export function computeRenewals(
  sub: Subscription,
  futureWanted: number,
  pastWanted: number,
): RenewalView {
  const cycle = CYCLE_MONTHS[sub.frequency];
  const today = todayIso();
  const empty: RenewalView = {
    past: [],
    pastTotal: 0,
    hasMorePast: false,
    future: [],
    hasMoreFuture: false,
    next: null,
  };
  if (!sub.renewalDate || !cycle) return empty;

  const all: string[] = [];
  for (let k = 0; k < 5000; k++) {
    const date = addMonths(sub.renewalDate, k * cycle);
    all.push(date);
    if (all.filter((d) => d >= today).length > futureWanted) break;
  }
  const past = all.filter((d) => d < today);
  const future = all.filter((d) => d >= today);
  return {
    past: past.slice(-pastWanted).reverse(),
    pastTotal: past.length,
    hasMorePast: past.length > pastWanted,
    future: future.slice(0, futureWanted),
    hasMoreFuture: future.length > futureWanted,
    next: future[0] ?? null,
  };
}

export function isSkipped(sub: Subscription, date: string): boolean {
  return sub.skippedRenewals.includes(date);
}
