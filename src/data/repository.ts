import type { AppData, Purchase, Subscription } from './types';

// All persistence goes through this module so the storage backend can be
// swapped (e.g. for a cloud database) without touching the rest of the app.

const STORAGE_KEY = 'annas-pages-data-v1';

const emptyData: AppData = { purchases: [], subscriptions: [] };

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...emptyData };
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      purchases: parsed.purchases ?? [],
      subscriptions: parsed.subscriptions ?? [],
    };
  } catch {
    return { ...emptyData };
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
