import { useNavigate } from 'react-router-dom';
import type { Purchase } from '../data/types';
import { PURCHASE_TYPE_LABELS } from '../data/types';
import { daysUntil, formatCurrency, formatDate } from '../utils/format';

interface Props {
  purchase: Purchase;
  onMarkDelivered?: (id: string) => void;
}

export default function PurchaseCard({ purchase, onMarkDelivered }: Props) {
  const navigate = useNavigate();
  const days =
    purchase.status === 'ordered'
      ? daysUntil(purchase.expectedDelivery)
      : null;

  let deliveryNote = '';
  let deliveryClass = 'pill';
  if (days !== null) {
    if (days < 0) {
      deliveryNote = `Overdue by ${Math.abs(days)}d`;
      deliveryClass = 'pill pill-warn';
    } else if (days === 0) {
      deliveryNote = 'Arriving today';
      deliveryClass = 'pill pill-soon';
    } else {
      deliveryNote = `In ${days}d`;
      deliveryClass = 'pill pill-soon';
    }
  }

  return (
    <article className="card purchase-card">
      <div
        className="purchase-main"
        onClick={() => navigate(`/purchases/${purchase.id}/edit`)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter')
            navigate(`/purchases/${purchase.id}/edit`);
        }}
      >
        <div className="purchase-top">
          <h3 className="purchase-title">{purchase.title || 'Untitled'}</h3>
          <span className="purchase-cost">
            {formatCurrency(purchase.totalCost)}
          </span>
        </div>
        <p className="purchase-meta">
          {[purchase.author, purchase.edition].filter(Boolean).join(' · ') ||
            'No author'}
        </p>
        <div className="purchase-tags">
          <span className="tag">{PURCHASE_TYPE_LABELS[purchase.purchaseType]}</span>
          {purchase.store && <span className="tag">{purchase.store}</span>}
          {purchase.status === 'ordered' ? (
            <span className={deliveryClass}>
              {deliveryNote ||
                `Expected ${formatDate(purchase.expectedDelivery)}`}
            </span>
          ) : (
            <span className="pill pill-done">
              Delivered {formatDate(purchase.deliveredDate || '')}
            </span>
          )}
        </div>
      </div>
      {purchase.status === 'ordered' && onMarkDelivered && (
        <button
          className="btn btn-small"
          onClick={() => onMarkDelivered(purchase.id)}
        >
          Mark delivered
        </button>
      )}
    </article>
  );
}
