import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../data/store';
import type { Purchase, PurchaseType } from '../data/types';
import PageHeader from '../components/PageHeader';
import { todayIso } from '../utils/format';
import { toTitleCase, uniqueValues } from '../utils/text';
import { CURRENCIES, fetchRate } from '../utils/currency';
import { readImageAsDataUrl, searchCover } from '../utils/covers';
import { computeRenewals } from '../utils/renewals';
import { formatDate } from '../utils/format';

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

function splitDelivery(value: string): { month: string; day: string } {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { month: value.slice(0, 7), day: value.slice(8, 10) };
  }
  if (/^\d{4}-\d{2}$/.test(value)) return { month: value, day: '' };
  return { month: '', day: '' };
}

function joinDelivery(month: string, day: string): string {
  if (!month) return '';
  if (!day) return month;
  return `${month}-${day.padStart(2, '0')}`;
}

export default function AddEditPurchase() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    purchases,
    subscriptions,
    settings,
    addPurchase,
    updatePurchase,
    deletePurchase,
  } = useData();

  const existing = useMemo(
    () => purchases.find((p) => p.id === id),
    [purchases, id],
  );

  const emptyForm: Omit<Purchase, 'id'> = {
    dateOfPurchase: todayIso(),
    title: '',
    edition: '',
    author: '',
    genre: '',
    store: '',
    orderNumber: '',
    price: 0,
    shipping: 0,
    totalCost: 0,
    currency: settings.baseCurrency,
    baseTotalCost: undefined,
    coverUrl: undefined,
    expectedDelivery: '',
    paymentMethod: '',
    notes: '',
    purchaseType: 'store',
    subscriptionId: undefined,
    subscriptionRenewalDate: undefined,
    status: 'ordered',
    deliveredDate: undefined,
  };

  const [form, setForm] = useState<Omit<Purchase, 'id'>>(
    existing
      ? { ...existing, currency: existing.currency ?? settings.baseCurrency }
      : emptyForm,
  );
  const [touchedTotal, setTouchedTotal] = useState(false);
  const [touchedBase, setTouchedBase] = useState(false);
  const [rate, setRate] = useState<number | null>(null);
  const [rateError, setRateError] = useState(false);
  const [coverStatus, setCoverStatus] = useState<string>('');

  const initial = splitDelivery(form.expectedDelivery);
  const [month, setMonth] = useState(initial.month);
  const [day, setDay] = useState(initial.day);

  const baseCurrency = settings.baseCurrency;
  const currency = form.currency || baseCurrency;
  const isSub = form.purchaseType === 'subscription';
  const needsConversion = !isSub && currency !== baseCurrency;

  const selectedSub = subscriptions.find(
    (s) => s.id === form.subscriptionId,
  );
  const renewalOptions = selectedSub
    ? (() => {
        const r = computeRenewals(selectedSub, 6, 12);
        return [...[...r.past].reverse(), ...r.future];
      })()
    : [];

  const computedTotal = form.price + form.shipping;
  const total = touchedTotal ? form.totalCost : computedTotal;

  useEffect(() => {
    if (!needsConversion) {
      setRate(null);
      setRateError(false);
      return;
    }
    let cancelled = false;
    setRateError(false);
    fetchRate(currency, baseCurrency).then((r) => {
      if (cancelled) return;
      if (r == null) setRateError(true);
      setRate(r);
    });
    return () => {
      cancelled = true;
    };
  }, [currency, baseCurrency, needsConversion]);

  const computedBase = rate != null ? total * rate : null;
  const baseTotal = touchedBase
    ? form.baseTotalCost ?? 0
    : computedBase ?? form.baseTotalCost ?? 0;

  function set<K extends keyof Purchase>(key: K, value: Purchase[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function num(value: string): number {
    const n = parseFloat(value);
    return isNaN(n) ? 0 : n;
  }

  async function findCover() {
    if (!form.title.trim()) return;
    setCoverStatus('Searching…');
    const url = await searchCover(form.title, form.author);
    if (url) {
      set('coverUrl', url);
      setCoverStatus('');
    } else {
      setCoverStatus('No cover found — you can upload one.');
    }
  }

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    const dataUrl = await readImageAsDataUrl(file);
    set('coverUrl', dataUrl);
    setCoverStatus('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Omit<Purchase, 'id'> = {
      ...form,
      price: isSub ? 0 : form.price,
      shipping: isSub ? 0 : form.shipping,
      totalCost: isSub ? 0 : total,
      currency: isSub ? baseCurrency : currency,
      baseTotalCost: needsConversion ? baseTotal : undefined,
      subscriptionRenewalDate: isSub
        ? form.subscriptionRenewalDate
        : undefined,
      expectedDelivery: joinDelivery(month, day),
    };
    if (existing) {
      updatePurchase({ ...payload, id: existing.id });
    } else {
      addPurchase(payload);
    }
    navigate(-1);
  }

  function handleDelete() {
    if (existing && confirm('Delete this purchase?')) {
      deletePurchase(existing.id);
      navigate('/purchases');
    }
  }

  const titles = uniqueValues(purchases.map((p) => p.title));
  const authors = uniqueValues(purchases.map((p) => p.author));
  const editions = uniqueValues(purchases.map((p) => p.edition));
  const stores = uniqueValues(purchases.map((p) => p.store));
  const genres = uniqueValues(purchases.map((p) => p.genre));
  const payments = uniqueValues(purchases.map((p) => p.paymentMethod));

  return (
    <div className="page">
      <PageHeader title={existing ? 'Edit purchase' : 'Add purchase'} />

      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Purchase type</span>
          <select
            className="input"
            value={form.purchaseType}
            onChange={(e) =>
              set('purchaseType', e.target.value as PurchaseType)
            }
          >
            <option value="store">Direct from store</option>
            <option value="thirdParty">Direct from 3rd party</option>
            <option value="subscription">Part of a subscription</option>
          </select>
        </label>

        {isSub && (
          <label className="field">
            <span>Subscription</span>
            <select
              className="input"
              value={form.subscriptionId ?? ''}
              onChange={(e) => {
                const subId = e.target.value || undefined;
                const sub = subscriptions.find((s) => s.id === subId);
                const next = sub
                  ? computeRenewals(sub, 1, 0).next ?? undefined
                  : undefined;
                setForm((f) => ({
                  ...f,
                  subscriptionId: subId,
                  subscriptionRenewalDate: next,
                }));
              }}
            >
              <option value="">— Select subscription —</option>
              {subscriptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {isSub && form.subscriptionId && (
          <label className="field">
            <span>Renewal this book belongs to</span>
            <select
              className="input"
              value={form.subscriptionRenewalDate ?? ''}
              onChange={(e) =>
                set('subscriptionRenewalDate', e.target.value || undefined)
              }
            >
              <option value="">— Select renewal —</option>
              {renewalOptions.map((d) => (
                <option key={d} value={d}>
                  {formatDate(d)}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="field">
          <span>Title</span>
          <input
            className="input"
            required
            list="dl-titles"
            value={form.title}
            onChange={(e) => set('title', toTitleCase(e.target.value))}
            onBlur={() => {
              if (form.title.trim() && !form.coverUrl) findCover();
            }}
          />
          <datalist id="dl-titles">
            {titles.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </label>

        <div className="cover-section">
          {form.coverUrl ? (
            <img
              className="cover-preview"
              src={form.coverUrl}
              alt="Book cover"
            />
          ) : (
            <div className="cover-preview cover-placeholder" aria-hidden>
              📖
            </div>
          )}
          <div className="cover-actions">
            <button
              type="button"
              className="btn btn-small"
              onClick={findCover}
            >
              Find cover
            </button>
            <label className="btn btn-small cover-upload">
              Upload
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => handleUpload(e.target.files?.[0])}
              />
            </label>
            {form.coverUrl && (
              <button
                type="button"
                className="btn btn-small"
                onClick={() => set('coverUrl', undefined)}
              >
                Remove
              </button>
            )}
            {coverStatus && <small className="hint">{coverStatus}</small>}
          </div>
        </div>

        <div className="field-row">
          <label className="field">
            <span>Author</span>
            <input
              className="input"
              list="dl-authors"
              value={form.author}
              onChange={(e) => set('author', toTitleCase(e.target.value))}
            />
            <datalist id="dl-authors">
              {authors.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
          </label>
          <label className="field">
            <span>Edition</span>
            <input
              className="input"
              list="dl-editions"
              value={form.edition}
              onChange={(e) => set('edition', toTitleCase(e.target.value))}
            />
            <datalist id="dl-editions">
              {editions.map((x) => (
                <option key={x} value={x} />
              ))}
            </datalist>
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            <span>Genre</span>
            <input
              className="input"
              list="dl-genres"
              value={form.genre}
              onChange={(e) => set('genre', toTitleCase(e.target.value))}
            />
            <datalist id="dl-genres">
              {genres.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </label>
          <label className="field">
            <span>Store</span>
            <input
              className="input"
              list="dl-stores"
              value={form.store}
              onChange={(e) => set('store', toTitleCase(e.target.value))}
            />
            <datalist id="dl-stores">
              {stores.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            <span>Date of purchase</span>
            <input
              className="input"
              type="date"
              value={form.dateOfPurchase}
              onChange={(e) => set('dateOfPurchase', e.target.value)}
            />
          </label>
          <label className="field">
            <span>Order #</span>
            <input
              className="input"
              value={form.orderNumber}
              onChange={(e) => set('orderNumber', e.target.value)}
            />
          </label>
        </div>

        {!isSub && (
          <>
        <label className="field">
          <span>Currency</span>
          <select
            className="input"
            value={currency}
            onChange={(e) => {
              set('currency', e.target.value);
              setTouchedBase(false);
            }}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <div className="field-row">
          <label className="field">
            <span>Price</span>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0"
              value={form.price || ''}
              onChange={(e) => set('price', num(e.target.value))}
            />
          </label>
          <label className="field">
            <span>Shipping</span>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0"
              value={form.shipping || ''}
              onChange={(e) => set('shipping', num(e.target.value))}
            />
          </label>
        </div>

        <label className="field">
          <span>Total cost ({currency})</span>
          <input
            className="input"
            type="number"
            step="0.01"
            min="0"
            value={total || ''}
            onChange={(e) => {
              setTouchedTotal(true);
              set('totalCost', num(e.target.value));
            }}
          />
          <small className="hint">
            Auto-calculated from price + shipping; edit to override.
          </small>
        </label>
          </>
        )}

        {needsConversion && (
          <label className="field">
            <span>Total in {baseCurrency}</span>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0"
              value={baseTotal || ''}
              onChange={(e) => {
                setTouchedBase(true);
                set('baseTotalCost', num(e.target.value));
              }}
            />
            <small className="hint">
              {rateError
                ? 'Could not fetch a live rate — enter the converted total manually.'
                : rate != null
                  ? `Live rate: 1 ${currency} = ${rate.toFixed(4)} ${baseCurrency}. Edit to override.`
                  : 'Fetching live exchange rate…'}
            </small>
          </label>
        )}

        <div className="field-row">
          <label className="field">
            <span>Expected delivery (month)</span>
            <input
              className="input"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Day (optional)</span>
            <select
              className="input"
              value={day}
              onChange={(e) => setDay(e.target.value)}
            >
              <option value="">Any day</option>
              {DAYS.map((d) => (
                <option key={d} value={String(d)}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="field">
          <span>Payment method</span>
          <input
            className="input"
            list="dl-payments"
            value={form.paymentMethod}
            onChange={(e) => set('paymentMethod', e.target.value)}
          />
          <datalist id="dl-payments">
            {payments.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </label>

        <label className="field">
          <span>Status</span>
          <select
            className="input"
            value={form.status}
            onChange={(e) => {
              const status = e.target.value as Purchase['status'];
              set('status', status);
              if (status === 'delivered' && !form.deliveredDate) {
                set('deliveredDate', todayIso());
              }
            }}
          >
            <option value="ordered">Ordered</option>
            <option value="delivered">Delivered</option>
          </select>
        </label>

        {form.status === 'delivered' && (
          <label className="field">
            <span>Delivered date</span>
            <input
              className="input"
              type="date"
              value={form.deliveredDate ?? todayIso()}
              onChange={(e) => set('deliveredDate', e.target.value)}
            />
          </label>
        )}

        <label className="field">
          <span>Notes</span>
          <textarea
            className="input"
            rows={3}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </label>

        <div className="form-actions">
          <button
            type="button"
            className="btn"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {existing ? 'Save changes' : 'Add purchase'}
          </button>
        </div>

        {existing && (
          <button
            type="button"
            className="btn btn-danger btn-block"
            onClick={handleDelete}
          >
            Delete purchase
          </button>
        )}
      </form>
    </div>
  );
}
