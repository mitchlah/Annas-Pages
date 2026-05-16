export function formatCurrency(amount: number, currency = 'USD'): string {
  const value = isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function isMonthOnly(iso: string): boolean {
  return /^\d{4}-\d{2}$/.test(iso);
}

export function formatDate(iso: string): string {
  if (!iso) return '—';
  if (isMonthOnly(iso)) {
    const d = new Date(iso + '-01T00:00:00');
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  }
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

// e.g. "May 20th" — month and ordinal day, no year.
export function formatDayMonth(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return '—';
  const month = d.toLocaleDateString(undefined, { month: 'long' });
  return `${month} ${ordinal(d.getDate())}`;
}

// Short relative label, e.g. "4d", "today", "3d ago".
export function daysRemainingLabel(iso: string): string {
  const days = daysUntil(iso);
  if (days === null) return '';
  if (days === 0) return 'today';
  if (days > 0) return `${days}d`;
  return `${Math.abs(days)}d ago`;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// Whole days until the date. Returns null for empty or month-only values
// (a month-only expected delivery has no precise day to count down to).
export function daysUntil(iso: string): number | null {
  if (!iso || isMonthOnly(iso)) return null;
  const target = new Date(iso + 'T00:00:00');
  if (isNaN(target.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}
