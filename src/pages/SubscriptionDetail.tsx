import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../data/store';
import { FREQUENCY_LABELS, monthlyEquivalent } from '../data/types';
import PageHeader from '../components/PageHeader';
import SubscriptionForm from '../components/SubscriptionForm';
import { formatCurrency, formatDate } from '../utils/format';
import { uniqueValues } from '../utils/text';
import { computeRenewals, isSkipped } from '../utils/renewals';

const STEP = 3;

export default function SubscriptionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    subscriptions,
    purchases,
    settings,
    updateSubscription,
    deleteSubscription,
  } = useData();

  const sub = subscriptions.find((s) => s.id === id);
  const base = settings.baseCurrency;

  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [futureShown, setFutureShown] = useState(STEP);
  const [pastShown, setPastShown] = useState(STEP);
  const [editing, setEditing] = useState(false);

  if (!sub) {
    return (
      <div className="page">
        <PageHeader title="Subscription" />
        <p className="hint">This subscription no longer exists.</p>
        <button
          className="btn btn-primary btn-block"
          onClick={() => navigate('/subscriptions')}
        >
          Back to subscriptions
        </button>
      </div>
    );
  }

  const renewals = computeRenewals(sub, futureShown, pastShown);
  const linkedBooks = purchases.filter((p) => p.subscriptionId === sub.id);

  function toggleSkip(date: string) {
    if (!sub) return;
    const set = new Set(sub.skippedRenewals);
    if (set.has(date)) set.delete(date);
    else set.add(date);
    updateSubscription({ ...sub, skippedRenewals: [...set] });
  }

  function handleDelete() {
    if (sub && confirm('Delete this subscription?')) {
      deleteSubscription(sub.id);
      navigate('/subscriptions');
    }
  }

  const rows = tab === 'upcoming' ? renewals.future : renewals.past;

  return (
    <div className="page">
      <PageHeader
        title={sub.name || 'Subscription'}
        subtitle={sub.provider || undefined}
        action={
          <button
            className="btn btn-small"
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
        }
      />

      <section className="card">
        <h2 className="section-title">Details</h2>
        <div className="kv">
          <span>Status</span>
          <strong>{sub.active ? 'Active' : 'Inactive'}</strong>
        </div>
        <div className="kv">
          <span>Cost per cycle</span>
          <strong>{formatCurrency(sub.cost, base)}</strong>
        </div>
        <div className="kv">
          <span>Frequency</span>
          <strong>{FREQUENCY_LABELS[sub.frequency]}</strong>
        </div>
        <div className="kv">
          <span>Monthly equivalent</span>
          <strong>{formatCurrency(monthlyEquivalent(sub), base)}</strong>
        </div>
        <div className="kv">
          <span>Next renewal</span>
          <strong>
            {renewals.next ? formatDate(renewals.next) : '—'}
          </strong>
        </div>
        <div className="kv">
          <span>Payment method</span>
          <strong>{sub.paymentMethod || '—'}</strong>
        </div>
        <div className="kv">
          <span>Started</span>
          <strong>{formatDate(sub.startDate)}</strong>
        </div>
        <div className="kv">
          <span>Books linked</span>
          <strong>{linkedBooks.length}</strong>
        </div>
        {sub.notes && (
          <div className="kv">
            <span>Notes</span>
            <strong>{sub.notes}</strong>
          </div>
        )}
      </section>

      <section className="card">
        <h2 className="section-title">Renewals</h2>
        <div className="segmented">
          <button
            className={'segment' + (tab === 'upcoming' ? ' active' : '')}
            onClick={() => setTab('upcoming')}
          >
            Upcoming
          </button>
          <button
            className={'segment' + (tab === 'past' ? ' active' : '')}
            onClick={() => setTab('past')}
          >
            Past
          </button>
        </div>

        {rows.length === 0 ? (
          <p className="hint">
            No {tab} renewals
            {tab === 'past' ? ' yet.' : '.'}
          </p>
        ) : (
          <div className="renewal-list">
            {rows.map((date) => {
              const skipped = isSkipped(sub, date);
              return (
                <div key={date} className="renewal-row">
                  <span className="renewal-date">{formatDate(date)}</span>
                  <span
                    className={
                      'pill ' + (skipped ? 'pill-done' : 'pill-soon')
                    }
                  >
                    {skipped ? 'Skipped' : 'Active'}
                  </span>
                  <button
                    className="btn btn-small"
                    onClick={() => toggleSkip(date)}
                  >
                    {skipped ? 'Restore' : 'Skip'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'upcoming' && rows.length > 0 && renewals.hasMoreFuture && (
          <button
            className="btn btn-block"
            onClick={() => setFutureShown((n) => n + STEP)}
          >
            Show more
          </button>
        )}
        {tab === 'past' && rows.length > 0 && renewals.hasMorePast && (
          <button
            className="btn btn-block"
            onClick={() => setPastShown((n) => n + STEP)}
          >
            Show more
          </button>
        )}
      </section>

      <button
        className="btn btn-danger btn-block"
        onClick={handleDelete}
      >
        Delete subscription
      </button>

      {editing && (
        <div className="modal-backdrop" onClick={() => setEditing(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="section-title">Edit subscription</h2>
            <SubscriptionForm
              initial={sub}
              baseCurrency={base}
              names={uniqueValues(subscriptions.map((s) => s.name))}
              providers={uniqueValues(
                subscriptions.map((s) => s.provider),
              )}
              onSubmit={(data) => {
                updateSubscription({ ...data, id: sub.id });
                setEditing(false);
              }}
              onCancel={() => setEditing(false)}
              onDelete={handleDelete}
            />
          </div>
        </div>
      )}
    </div>
  );
}
