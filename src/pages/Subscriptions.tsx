import { useState } from 'react';
import { useData } from '../data/store';
import type { Subscription, SubscriptionFrequency } from '../data/types';
import { FREQUENCY_LABELS, monthlyEquivalent } from '../data/types';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { formatCurrency, todayIso } from '../utils/format';
import { toTitleCase, uniqueValues } from '../utils/text';

const emptyForm: Omit<Subscription, 'id'> = {
  name: '',
  provider: '',
  cost: 0,
  frequency: 'monthly',
  billingDay: 1,
  paymentMethod: '',
  startDate: todayIso(),
  active: true,
  notes: '',
};

export default function Subscriptions() {
  const {
    subscriptions,
    purchases,
    settings,
    addSubscription,
    updateSubscription,
    deleteSubscription,
  } = useData();
  const base = settings.baseCurrency;
  const [editing, setEditing] = useState<Subscription | 'new' | null>(null);
  const [form, setForm] = useState<Omit<Subscription, 'id'>>({
    ...emptyForm,
  });

  function openNew() {
    setForm({ ...emptyForm });
    setEditing('new');
  }

  function openEdit(s: Subscription) {
    setForm({ ...s });
    setEditing(s);
  }

  function set<K extends keyof Subscription>(
    key: K,
    value: Subscription[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function num(value: string): number {
    const n = parseFloat(value);
    return isNaN(n) ? 0 : n;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing === 'new') {
      addSubscription(form);
    } else if (editing) {
      updateSubscription({ ...form, id: editing.id });
    }
    setEditing(null);
  }

  function handleDelete() {
    if (
      editing &&
      editing !== 'new' &&
      confirm('Delete this subscription?')
    ) {
      deleteSubscription(editing.id);
      setEditing(null);
    }
  }

  function bookCount(subId: string): number {
    return purchases.filter((p) => p.subscriptionId === subId).length;
  }

  const activeMonthly = subscriptions
    .filter((s) => s.active)
    .reduce((sum, s) => sum + monthlyEquivalent(s), 0);

  const names = uniqueValues(subscriptions.map((s) => s.name));
  const providers = uniqueValues(subscriptions.map((s) => s.provider));

  return (
    <div className="page">
      <PageHeader
        title="Subscriptions"
        subtitle={`${formatCurrency(activeMonthly, base)} / month active`}
        action={
          <button className="btn btn-primary btn-small" onClick={openNew}>
            + Add
          </button>
        }
      />

      {subscriptions.length === 0 ? (
        <EmptyState
          icon="🔁"
          title="No subscriptions"
          message="Add a book box or subscription to track recurring costs."
        />
      ) : (
        <div className="card-list">
          {subscriptions.map((s) => (
            <article
              key={s.id}
              className="card sub-card"
              onClick={() => openEdit(s)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && openEdit(s)}
            >
              <div className="purchase-top">
                <h3 className="purchase-title">{s.name || 'Untitled'}</h3>
                <span className="purchase-cost">
                  {formatCurrency(s.cost, base)}
                  <small> /{FREQUENCY_LABELS[s.frequency].toLowerCase()}</small>
                </span>
              </div>
              <p className="purchase-meta">{s.provider || 'No provider'}</p>
              <div className="purchase-tags">
                <span className={'pill ' + (s.active ? 'pill-soon' : '')}>
                  {s.active ? 'Active' : 'Inactive'}
                </span>
                <span className="tag">{FREQUENCY_LABELS[s.frequency]}</span>
                <span className="tag">
                  {formatCurrency(monthlyEquivalent(s), base)} /mo
                </span>
                <span className="tag">Bills day {s.billingDay}</span>
                <span className="tag">{bookCount(s.id)} books linked</span>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <div
          className="modal-backdrop"
          onClick={() => setEditing(null)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="section-title">
              {editing === 'new' ? 'Add subscription' : 'Edit subscription'}
            </h2>
            <form className="form" onSubmit={handleSubmit}>
              <label className="field">
                <span>Name</span>
                <input
                  className="input"
                  required
                  list="dl-sub-names"
                  value={form.name}
                  onChange={(e) => set('name', toTitleCase(e.target.value))}
                />
                <datalist id="dl-sub-names">
                  {names.map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
              </label>
              <label className="field">
                <span>Provider</span>
                <input
                  className="input"
                  list="dl-sub-providers"
                  value={form.provider}
                  onChange={(e) =>
                    set('provider', toTitleCase(e.target.value))
                  }
                />
                <datalist id="dl-sub-providers">
                  {providers.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </label>
              <div className="field-row">
                <label className="field">
                  <span>Cost per cycle ({base})</span>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.cost || ''}
                    onChange={(e) => set('cost', num(e.target.value))}
                  />
                </label>
                <label className="field">
                  <span>Frequency</span>
                  <select
                    className="input"
                    value={form.frequency}
                    onChange={(e) =>
                      set(
                        'frequency',
                        e.target.value as SubscriptionFrequency,
                      )
                    }
                  >
                    {Object.entries(FREQUENCY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="field-row">
                <label className="field">
                  <span>Billing day</span>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    max="31"
                    value={form.billingDay || ''}
                    onChange={(e) =>
                      set(
                        'billingDay',
                        Math.min(31, Math.max(1, num(e.target.value))),
                      )
                    }
                  />
                </label>
              </div>
              <div className="field-row">
                <label className="field">
                  <span>Start date</span>
                  <input
                    className="input"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => set('startDate', e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Payment method</span>
                  <input
                    className="input"
                    value={form.paymentMethod}
                    onChange={(e) =>
                      set('paymentMethod', e.target.value)
                    }
                  />
                </label>
              </div>
              <label className="field-check">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => set('active', e.target.checked)}
                />
                <span>Subscription is active</span>
              </label>
              <label className="field">
                <span>Notes</span>
                <textarea
                  className="input"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                />
              </label>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
              {editing !== 'new' && (
                <button
                  type="button"
                  className="btn btn-danger btn-block"
                  onClick={handleDelete}
                >
                  Delete subscription
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
