import type {
  AppData,
  Purchase,
  Subscription,
  SubscriptionFrequency,
} from './types';
import { DEFAULT_SETTINGS } from './types';

// All persistence goes through this module so the storage backend can be
// swapped (e.g. for a cloud database) without touching the rest of the app.

const STORAGE_KEY = 'annas-pages-data-v1';

function emptyData(): AppData {
  return { purchases: [], subscriptions: [], settings: { ...DEFAULT_SETTINGS } };
}

function migrateSubscription(raw: Record<string, unknown>): Subscription {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    provider: String(raw.provider ?? ''),
    cost: Number(raw.cost ?? raw.monthlyCost ?? 0),
    frequency: (raw.frequency as SubscriptionFrequency) ?? 'monthly',
    renewalDate: String(raw.renewalDate ?? raw.startDate ?? ''),
    skippedRenewals: Array.isArray(raw.skippedRenewals)
      ? (raw.skippedRenewals as unknown[]).map(String)
      : [],
    paymentMethod: String(raw.paymentMethod ?? ''),
    startDate: String(raw.startDate ?? ''),
    active: raw.active !== false,
    notes: String(raw.notes ?? ''),
  };
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      purchases: (parsed.purchases ?? []) as Purchase[],
      subscriptions: (parsed.subscriptions ?? []).map((s) =>
        migrateSubscription(s as unknown as Record<string, unknown>),
      ),
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
    };
  } catch {
    return emptyData();
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function createId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

export function exportData(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `annas-pages-export-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export type { AppData, Purchase, Subscription };
