import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../data/store';
import PageHeader from '../components/PageHeader';
import { formatCurrency } from '../utils/format';
import { CURRENCIES } from '../utils/currency';
import { THEME_PRESETS } from '../utils/theme';
import { parseBackup } from '../data/repository';

export default function Settings() {
  const {
    purchases,
    subscriptions,
    settings,
    updateSettings,
    exportAll,
    restoreData,
  } = useData();

  const [restoreMsg, setRestoreMsg] = useState('');
  const [restoreError, setRestoreError] = useState(false);

  const base = settings.baseCurrency;

  async function handleRestore(file: File | undefined) {
    if (!file) return;
    setRestoreMsg('');
    try {
      const data = parseBackup(await file.text());
      const ok = confirm(
        `Restore ${data.purchases.length} purchases and ` +
          `${data.subscriptions.length} subscriptions? ` +
          'This replaces all current data.',
      );
      if (!ok) return;
      restoreData(data);
      setRestoreError(false);
      setRestoreMsg(
        `Restored ${data.purchases.length} purchases and ` +
          `${data.subscriptions.length} subscriptions.`,
      );
    } catch {
      setRestoreError(true);
      setRestoreMsg('That file is not a valid Anna’s Pages backup.');
    }
  }
  const totalSpent = purchases.reduce(
    (sum, p) => sum + (p.baseTotalCost ?? p.totalCost),
    0,
  );

  return (
    <div className="page">
      <PageHeader title="Settings" subtitle="Manage your data" />

      <section className="card">
        <h2 className="section-title">Currency</h2>
        <p className="hint">
          Your base currency. All dashboard totals are shown in it; foreign
          purchases are converted using live exchange rates.
        </p>
        <label className="field">
          <span>Base currency</span>
          <select
            className="input"
            value={base}
            onChange={(e) => updateSettings({ baseCurrency: e.target.value })}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="card">
        <h2 className="section-title">Theme</h2>
        <p className="hint">Pick the accent colour used across the app.</p>
        <div className="swatch-row">
          {THEME_PRESETS.map((p) => (
            <button
              key={p.color}
              type="button"
              className={
                'swatch' +
                (settings.themeColor.toLowerCase() === p.color.toLowerCase()
                  ? ' active'
                  : '')
              }
              style={{ background: p.color }}
              title={p.name}
              aria-label={p.name}
              onClick={() => updateSettings({ themeColor: p.color })}
            />
          ))}
        </div>
        <label className="field">
          <span>Custom colour</span>
          <input
            className="input color-input"
            type="color"
            value={settings.themeColor}
            onChange={(e) => updateSettings({ themeColor: e.target.value })}
          />
        </label>
      </section>

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
          <strong>{formatCurrency(totalSpent, base)}</strong>
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
        <p className="hint">
          Restore replaces all current data with the contents of a backup
          file you previously exported.
        </p>
        <label className="btn btn-block cover-upload">
          Restore from backup
          <input
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              handleRestore(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </label>
        {restoreMsg && (
          <p className={'hint' + (restoreError ? ' import-error' : '')}>
            {restoreMsg}
          </p>
        )}
      </section>

      <section className="card">
        <h2 className="section-title">Import</h2>
        <p className="hint">
          Bring in existing purchases from a spreadsheet exported as CSV.
        </p>
        <Link to="/import" className="btn btn-primary btn-block">
          Import from CSV
        </Link>
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
