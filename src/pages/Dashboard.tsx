import { Link } from 'react-router-dom';
import { useData } from '../data/store';
import PageHeader from '../components/PageHeader';
import PurchaseCard from '../components/PurchaseCard';
import EmptyState from '../components/EmptyState';
import { formatCurrency, todayIso } from '../utils/format';
import { monthlyEquivalent } from '../data/types';

export default function Dashboard() {
  const { purchases, subscriptions, settings, markDelivered } = useData();
  const base = settings.baseCurrency;
  const baseAmount = (p: (typeof purchases)[number]) =>
    p.baseTotalCost ?? p.totalCost;

  const upcoming = purchases
    .filter((p) => p.status === 'ordered')
    .sort((a, b) =>
      (a.expectedDelivery || '9999').localeCompare(
        b.expectedDelivery || '9999',
      ),
    );

  const now = new Date();
  const monthPrefix = now.toISOString().slice(0, 7);
  const spentThisMonth = purchases
    .filter((p) => p.dateOfPurchase.startsWith(monthPrefix))
    .reduce((sum, p) => sum + baseAmount(p), 0);
  const spentTotal = purchases.reduce((sum, p) => sum + baseAmount(p), 0);
  const monthlySubs = subscriptions
    .filter((s) => s.active)
    .reduce((sum, s) => sum + monthlyEquivalent(s), 0);

  return (
    <div className="page">
      <PageHeader
        title="Anna's Pages"
        subtitle="Your book purchases at a glance"
      />

      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Spent this month</span>
          <span className="stat-value">
            {formatCurrency(spentThisMonth, base)}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Spent all time</span>
          <span className="stat-value">
            {formatCurrency(spentTotal, base)}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active subscriptions</span>
          <span className="stat-value">
            {formatCurrency(monthlySubs, base)}
            <small> / mo</small>
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">On the way</span>
          <span className="stat-value">{upcoming.length}</span>
        </div>
      </section>

      <Link to="/purchases/new" className="btn btn-primary btn-block">
        + Add a purchase
      </Link>

      <section>
        <h2 className="section-title">Upcoming deliveries</h2>
        {upcoming.length === 0 ? (
          <EmptyState
            icon="📦"
            title="Nothing on the way"
            message="Add a purchase to see expected deliveries here."
          />
        ) : (
          <div className="card-list">
            {upcoming.map((p) => (
              <PurchaseCard
                key={p.id}
                purchase={p}
                onMarkDelivered={(id) => markDelivered(id, todayIso())}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
