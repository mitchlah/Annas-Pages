import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../data/store';
import PageHeader from '../components/PageHeader';
import PurchaseCard from '../components/PurchaseCard';
import EmptyState from '../components/EmptyState';
import { todayIso } from '../utils/format';

type Filter = 'all' | 'ordered' | 'delivered';

export default function Purchases() {
  const { purchases, markDelivered } = useData();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const filtered = purchases
    .filter((p) => filter === 'all' || p.status === filter)
    .filter((p) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.store.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => b.dateOfPurchase.localeCompare(a.dateOfPurchase));

  return (
    <div className="page">
      <PageHeader
        title="Purchases"
        subtitle={`${purchases.length} recorded`}
        action={
          <Link to="/purchases/new" className="btn btn-primary btn-small">
            + Add
          </Link>
        }
      />

      <input
        className="input search-input"
        placeholder="Search title, author or store"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="segmented">
        {(['all', 'ordered', 'delivered'] as Filter[]).map((f) => (
          <button
            key={f}
            className={'segment' + (filter === f ? ' active' : '')}
            onClick={() => setFilter(f)}
          >
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="🧾"
          title="No purchases"
          message="Tap Add to record your first book purchase."
        />
      ) : (
        <div className="card-list">
          {filtered.map((p) => (
            <PurchaseCard
              key={p.id}
              purchase={p}
              onMarkDelivered={(id) => markDelivered(id, todayIso())}
            />
          ))}
        </div>
      )}
    </div>
  );
}
