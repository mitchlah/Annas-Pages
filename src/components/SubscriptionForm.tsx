import { useState } from 'react';
import type { Subscription, SubscriptionFrequency } from '../data/types';
import { FREQUENCY_LABELS } from '../data/types';
import { todayIso } from '../utils/format';
import { toTitleCase } from '../utils/text';

interface Props {
  initial?: Subscription;
  baseCurrency: string;
  names: string[];
  providers: string[];
  onSubmit: (data: Omit<Subscription, 'id'>) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export default function SubscriptionForm({
  initial,
  baseCurrency,
  names,
  providers,
  onSubmit,
  onCancel,
  onDelete,
}: Props) {
  const [form, setForm] = useState<Omit<Subscription, 'id'>>(
    initial
      ? { ...initial }
      : {
          name: '',
          provider: '',
          cost: 0,
          frequency: 'monthly',
          renewalDate: todayIso(),
          skippedRenewals: [],
          paymentMethod: '',
          startDate: todayIso(),
          active: true,
          notes: '',
        },
  );

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

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
    >
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
          onChange={(e) => set('provider', toTitleCase(e.target.value))}
        />
        <datalist id="dl-sub-providers">
          {providers.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </label>

      <div className="field-row">
        <label className="field">
          <span>Cost per cycle ({baseCurrency})</span>
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
              set('frequency', e.target.value as SubscriptionFrequency)
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
          <span>Next renewal date</span>
          <input
            className="input"
            type="date"
            value={form.renewalDate}
            onChange={(e) => set('renewalDate', e.target.value)}
          />
        </label>
        <label className="field">
          <span>Start date</span>
          <input
            className="input"
            type="date"
            value={form.startDate}
            onChange={(e) => set('startDate', e.target.value)}
          />
        </label>
      </div>

      <label className="field">
        <span>Payment method</span>
        <input
          className="input"
          value={form.paymentMethod}
          onChange={(e) => set('paymentMethod', e.target.value)}
        />
      </label>

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
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Save
        </button>
      </div>

      {onDelete && (
        <button
          type="button"
          className="btn btn-danger btn-block"
          onClick={onDelete}
        >
          Delete subscription
        </button>
      )}
    </form>
  );
}
