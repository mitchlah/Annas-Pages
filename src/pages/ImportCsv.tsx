import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../data/store';
import type { Purchase, PurchaseType } from '../data/types';
import PageHeader from '../components/PageHeader';
import { todayIso } from '../utils/format';
import {
  normalizeDate,
  parseCsv,
  parseNumber,
  type DateOrder,
  type ParsedCsv,
} from '../utils/csv';

interface Field {
  key: keyof Purchase;
  label: string;
  match: string[];
}

const FIELDS: Field[] = [
  { key: 'dateOfPurchase', label: 'Date of Purchase', match: ['date', 'purchasedate', 'dateofpurchase', 'orderdate'] },
  { key: 'title', label: 'Title', match: ['title', 'book', 'bookname', 'name'] },
  { key: 'edition', label: 'Edition', match: ['edition'] },
  { key: 'author', label: 'Author', match: ['author', 'writer'] },
  { key: 'genre', label: 'Genre', match: ['genre', 'category'] },
  { key: 'store', label: 'Store', match: ['store', 'shop', 'seller', 'retailer', 'vendor'] },
  { key: 'orderNumber', label: 'Order #', match: ['order', 'ordernumber', 'orderno', 'ordernum', 'orderid'] },
  { key: 'price', label: 'Price', match: ['price', 'itemprice', 'cost'] },
  { key: 'shipping', label: 'Shipping', match: ['shipping', 'postage', 'shippingcost'] },
  { key: 'totalCost', label: 'Total Cost', match: ['total', 'totalcost', 'totalprice', 'amount'] },
  { key: 'currency', label: 'Currency', match: ['currency', 'curr'] },
  { key: 'expectedDelivery', label: 'Expected Delivery', match: ['expecteddelivery', 'expected', 'eta', 'deliverydate'] },
  { key: 'paymentMethod', label: 'Payment Method', match: ['payment', 'paymentmethod', 'paidwith', 'paidby'] },
  { key: 'notes', label: 'Notes', match: ['notes', 'note', 'comment', 'comments'] },
  { key: 'purchaseType', label: 'Purchase Type', match: ['type', 'purchasetype'] },
  { key: 'status', label: 'Status', match: ['status'] },
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

function guessMapping(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  const normd = headers.map(norm);
  for (const f of FIELDS) {
    map[f.key] = normd.findIndex(
      (h) => h && f.match.some((m) => h === m || h.includes(m)),
    );
  }
  return map;
}

function parseType(value: string): PurchaseType {
  const v = value.toLowerCase();
  if (v.includes('sub')) return 'subscription';
  if (v.includes('third') || v.includes('3rd') || v.includes('party'))
    return 'thirdParty';
  return 'store';
}

export default function ImportCsv() {
  const { settings, importPurchases } = useData();
  const navigate = useNavigate();

  const [csv, setCsv] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<Record<string, number>>({});
  const [dateOrder, setDateOrder] = useState<DateOrder>('dmy');
  const [error, setError] = useState('');
  const [imported, setImported] = useState<number | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError('');
    setImported(null);
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        setError('That file has no readable rows.');
        setCsv(null);
        return;
      }
      setCsv(parsed);
      setMapping(guessMapping(parsed.headers));
    } catch {
      setError('Could not read that file.');
    }
  }

  function cell(row: string[], key: keyof Purchase): string {
    const idx = mapping[key];
    return idx >= 0 ? (row[idx] ?? '').trim() : '';
  }

  function buildPurchase(row: string[]): Omit<Purchase, 'id'> {
    const price = parseNumber(cell(row, 'price'));
    const shipping = parseNumber(cell(row, 'shipping'));
    const mappedTotal = parseNumber(cell(row, 'totalCost'));
    const total = mappedTotal || price + shipping;
    const date = normalizeDate(cell(row, 'dateOfPurchase'), dateOrder);
    const statusRaw = cell(row, 'status').toLowerCase();
    const delivered = statusRaw.includes('deliver') || statusRaw === 'done';
    const currency =
      cell(row, 'currency').toUpperCase() || settings.baseCurrency;

    return {
      dateOfPurchase: date,
      title: cell(row, 'title'),
      edition: cell(row, 'edition'),
      author: cell(row, 'author'),
      genre: cell(row, 'genre'),
      store: cell(row, 'store'),
      orderNumber: cell(row, 'orderNumber'),
      price,
      shipping,
      totalCost: total,
      currency,
      expectedDelivery: normalizeDate(
        cell(row, 'expectedDelivery'),
        dateOrder,
      ),
      paymentMethod: cell(row, 'paymentMethod'),
      notes: cell(row, 'notes'),
      purchaseType: parseType(cell(row, 'purchaseType')),
      status: delivered ? 'delivered' : 'ordered',
      deliveredDate: delivered ? date || todayIso() : undefined,
    };
  }

  function handleImport() {
    if (!csv) return;
    const list = csv.rows
      .map(buildPurchase)
      .filter((p) => p.title || p.author || p.store);
    if (list.length === 0) {
      setError('No rows with a title, author or store to import.');
      return;
    }
    importPurchases(list);
    setImported(list.length);
  }

  return (
    <div className="page">
      <PageHeader
        title="Import from CSV"
        subtitle="Bulk-load purchases from a spreadsheet"
      />

      <section className="card">
        <p className="hint">
          Export your spreadsheet as a <strong>.csv</strong> file (the first
          row must be column headers), then choose it below.
        </p>
        <label className="btn btn-primary btn-block cover-upload">
          Choose CSV file
          <input
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
        {error && <p className="hint import-error">{error}</p>}
      </section>

      {imported !== null && (
        <section className="card">
          <h2 className="section-title">Done</h2>
          <p className="hint">
            Imported {imported} purchase{imported === 1 ? '' : 's'}.
          </p>
          <button
            className="btn btn-primary btn-block"
            onClick={() => navigate('/purchases')}
          >
            View purchases
          </button>
        </section>
      )}

      {csv && imported === null && (
        <>
          <section className="card">
            <h2 className="section-title">Date format</h2>
            <p className="hint">
              How dates are written in your file, e.g. 03/06/2026.
            </p>
            <select
              className="input"
              value={dateOrder}
              onChange={(e) => setDateOrder(e.target.value as DateOrder)}
            >
              <option value="dmy">Day / Month / Year</option>
              <option value="mdy">Month / Day / Year</option>
            </select>
          </section>

          <section className="card">
            <h2 className="section-title">Match columns</h2>
            <p className="hint">
              {csv.rows.length} row{csv.rows.length === 1 ? '' : 's'} found.
              Pick which CSV column fills each field.
            </p>
            <div className="map-list">
              {FIELDS.map((f) => (
                <div key={f.key} className="map-row">
                  <span className="map-label">{f.label}</span>
                  <select
                    className="input"
                    value={mapping[f.key] ?? -1}
                    onChange={(e) =>
                      setMapping((m) => ({
                        ...m,
                        [f.key]: Number(e.target.value),
                      }))
                    }
                  >
                    <option value={-1}>— Skip —</option>
                    {csv.headers.map((h, i) => (
                      <option key={i} value={i}>
                        {h || `Column ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </section>

          <button
            className="btn btn-primary btn-block"
            onClick={handleImport}
          >
            Import {csv.rows.length} row
            {csv.rows.length === 1 ? '' : 's'}
          </button>
        </>
      )}
    </div>
  );
}
