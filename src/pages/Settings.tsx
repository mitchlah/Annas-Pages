import { useData } from '../data/store';
import PageHeader from '../components/PageHeader';
import { formatCurrency } from '../utils/format';

export default function Settings() {
  const { purchases, subscriptions, exportAll } = useData();

  const totalSpent = purchases.reduce((sum, p) => sum + p.totalCost, 0);

  return (
    <div className="page">
      <PageHeader title="Settings" subtitle="Manage your data" />

      <section className="card">
        <h2 className="section-title">Summary</h2>
        <div className="kv">
          <span>Purchases</span>
          <strong>{purchases.length}</strong>
        </div>
        <div className="kv">
          <span>Subscriptions</span>
          <strong>{subscriptions.length}</strong>
        </div>
        <div className="kv">
          <span>Total spent</span>
          <strong>{formatCurrency(totalSpent)}</strong>
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">Backup</h2>
        <p className="hint">
          Your data is stored on this device only. Export a copy regularly
          so you don't lose it.
        </p>
        <button className="btn btn-primary btn-block" onClick={exportAll}>
          Export data (JSON)
        </button>
      </section>

      <section className="card">
        <h2 className="section-title">About</h2>
        <p className="hint">
          Anna's Pages — a personal book purchase tracker. Cloud sync and
          login are planned for a future update.
        </p>
      </section>
    </div>
  );
}
