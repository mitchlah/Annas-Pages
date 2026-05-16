import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../data/store';
import { FREQUENCY_LABELS, monthlyEquivalent } from '../data/types';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import SubscriptionForm from '../components/SubscriptionForm';
import { formatCurrency, formatDate } from '../utils/format';
import { uniqueValues } from '../utils/text';
import { computeRenewals } from '../utils/renewals';

export default function Subscriptions() {
  const { subscriptions, purchases, settings, addSubscription } = useData();
  const navigate = useNavigate();
  const base = settings.baseCurrency;
  const [adding, setAdding] = useState(false);

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
          <button
            className="btn btn-primary btn-small"
            onClick={() => setAdding(true)}
          >
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
          {subscriptions.map((s) => {
            const next = computeRenewals(s, 1, 0).next;
            return (
              <article
                key={s.id}
                className="card sub-card"
                onClick={() => navigate(`/subscriptions/${s.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === 'Enter' && navigate(`/subscriptions/${s.id}`)
                }
              >
                <div className="purchase-top">
                  <h3 className="purchase-title">{s.name || 'Untitled'}</h3>
                  <span className="purchase-cost">
                    {formatCurrency(s.cost, base)}
                    <small>
                      {' '}
                      /{FREQUENCY_LABELS[s.frequency].toLowerCase()}
                    </small>
                  </span>
                </div>
                <p className="purchase-meta">
                  {s.provider || 'No provider'}
                </p>
                <div className="purchase-tags">
                  <span
                    className={'pill ' + (s.active ? 'pill-soon' : '')}
                  >
                    {s.active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="tag">
                    {FREQUENCY_LABELS[s.frequency]}
                  </span>
                  {next && (
                    <span className="tag">
                      Renews {formatDate(next)}
                    </span>
                  )}
                  <span className="tag">
                    {bookCount(s.id)} books linked
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {adding && (
        <div className="modal-backdrop" onClick={() => setAdding(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="section-title">Add subscription</h2>
            <SubscriptionForm
              baseCurrency={base}
              names={names}
              providers={providers}
              onSubmit={(data) => {
                addSubscription(data);
                setAdding(false);
              }}
              onCancel={() => setAdding(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
