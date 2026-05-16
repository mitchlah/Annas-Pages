import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../data/store';
import type { Purchase, PurchaseType } from '../data/types';
import PageHeader from '../components/PageHeader';
import { todayIso } from '../utils/format';

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
  expectedDelivery: '',
  paymentMethod: '',
  notes: '',
  purchaseType: 'store',
  subscriptionId: undefined,
  status: 'ordered',
  deliveredDate: undefined,
};

export default function AddEditPurchase() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    purchases,
    subscriptions,
    addPurchase,
    updatePurchase,
    deletePurchase,
  } = useData();

  const existing = useMemo(
    () => purchases.find((p) => p.id === id),
    [purchases, id],
  );

  const [form, setForm] = useState<Omit<Purchase, 'id'>>(
    existing ? { ...existing } : { ...emptyForm },
  );
  const [touchedTotal, setTouchedTotal] = useState(false);

  const computedTotal = form.price + form.shipping;
  const total = touchedTotal ? form.totalCost : computedTotal;

  function set<K extends keyof Purchase>(key: K, value: Purchase[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function num(value: string): number {
    const n = parseFloat(value);
    return isNaN(n) ? 0 : n;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, totalCost: total };
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

        {form.purchaseType === 'subscription' && (
          <label className="field">
            <span>Subscription</span>
            <select
              className="input"
              value={form.subscriptionId ?? ''}
              onChange={(e) =>
                set('subscriptionId', e.target.value || undefined)
              }
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

        <label className="field">
          <span>Title</span>
          <input
            className="input"
            required
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Author</span>
            <input
              className="input"
              value={form.author}
              onChange={(e) => set('author', e.target.value)}
            />
          </label>
          <label className="field">
            <span>Edition</span>
            <input
              className="input"
              value={form.edition}
              onChange={(e) => set('edition', e.target.value)}
            />
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            <span>Genre</span>
            <input
              className="input"
              value={form.genre}
              onChange={(e) => set('genre', e.target.value)}
            />
          </label>
          <label className="field">
            <span>Store</span>
            <input
              className="input"
              value={form.store}
              onChange={(e) => set('store', e.target.value)}
            />
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
          <span>Total cost</span>
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

        <div className="field-row">
          <label className="field">
            <span>Expected delivery</span>
            <input
              className="input"
              type="date"
              value={form.expectedDelivery}
              onChange={(e) => set('expectedDelivery', e.target.value)}
            />
          </label>
          <label className="field">
            <span>Payment method</span>
            <input
              className="input"
              value={form.paymentMethod}
              onChange={(e) => set('paymentMethod', e.target.value)}
            />
          </label>
        </div>

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
