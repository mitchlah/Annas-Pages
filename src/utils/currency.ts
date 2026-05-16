export const CURRENCIES: { code: string; label: string }[] = [
  { code: 'USD', label: 'USD — US Dollar' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'GBP', label: 'GBP — British Pound' },
  { code: 'AUD', label: 'AUD — Australian Dollar' },
  { code: 'CAD', label: 'CAD — Canadian Dollar' },
  { code: 'NZD', label: 'NZD — New Zealand Dollar' },
  { code: 'JPY', label: 'JPY — Japanese Yen' },
  { code: 'CNY', label: 'CNY — Chinese Yuan' },
  { code: 'INR', label: 'INR — Indian Rupee' },
  { code: 'CHF', label: 'CHF — Swiss Franc' },
  { code: 'SEK', label: 'SEK — Swedish Krona' },
  { code: 'ZAR', label: 'ZAR — South African Rand' },
];

const RATES_KEY = 'annas-pages-rates';

interface RateCache {
  base: string;
  date: string;
  rates: Record<string, number>;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function readCache(base: string): RateCache | null {
  try {
    const raw = localStorage.getItem(RATES_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw) as RateCache;
    if (cache.base === base && cache.date === today()) return cache;
    return null;
  } catch {
    return null;
  }
}

// Returns how many units of `to` equal one unit of `from`.
export async function fetchRate(
  from: string,
  to: string,
): Promise<number | null> {
  if (from === to) return 1;

  const cached = readCache(from);
  if (cached && cached.rates[to]) return cached.rates[to];

  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${from}`);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      result?: string;
      rates?: Record<string, number>;
    };
    if (data.result !== 'success' || !data.rates) return null;
    localStorage.setItem(
      RATES_KEY,
      JSON.stringify({ base: from, date: today(), rates: data.rates }),
    );
    return data.rates[to] ?? null;
  } catch {
    return null;
  }
}
