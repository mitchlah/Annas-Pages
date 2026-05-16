export interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

// RFC-4180-ish parser: handles quoted fields, escaped quotes and
// newlines inside quotes.
export function parseCsv(text: string): ParsedCsv {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  const t = text.replace(/\r\n?/g, '\n');

  const endField = () => {
    row.push(field);
    field = '';
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inQuotes) {
      if (c === '"') {
        if (t[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      endField();
    } else if (c === '\n') {
      endRow();
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length > 0) endRow();

  const nonEmpty = rows.filter((r) => r.some((x) => x.trim() !== ''));
  const headers = (nonEmpty.shift() ?? []).map((h) => h.trim());
  return { headers, rows: nonEmpty };
}

export function parseNumber(value: string): number {
  const n = parseFloat(value.replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? 0 : n;
}

export type DateOrder = 'dmy' | 'mdy';

// Normalises a spreadsheet date to ISO YYYY-MM-DD where possible.
export function normalizeDate(value: string, order: DateOrder): string {
  const v = value.trim();
  if (!v) return '';
  if (/^\d{4}-\d{2}(-\d{2})?$/.test(v)) return v;

  const m = v.match(/^(\d{1,4})[/.\-](\d{1,2})[/.\-](\d{1,4})$/);
  if (m) {
    const [, a, b, c] = m;
    if (a.length === 4) {
      return `${a}-${b.padStart(2, '0')}-${c.padStart(2, '0')}`;
    }
    const year = c.length === 2 ? `20${c}` : c.padStart(4, '0');
    const day = order === 'dmy' ? a : b;
    const month = order === 'dmy' ? b : a;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const d = new Date(v);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return v;
}
