import { useNavigate } from 'react-router-dom';
import { useData } from '../data/store';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { formatDate } from '../utils/format';

export default function Library() {
  const { purchases } = useData();
  const navigate = useNavigate();

  const books = purchases
    .filter((p) => p.status === 'delivered')
    .sort((a, b) =>
      (b.deliveredDate || '').localeCompare(a.deliveredDate || ''),
    );

  return (
    <div className="page">
      <PageHeader
        title="Library"
        subtitle={`${books.length} book${books.length === 1 ? '' : 's'} delivered`}
      />

      {books.length === 0 ? (
        <EmptyState
          icon="📚"
          title="Your library is empty"
          message="Mark a purchase as delivered and it will appear here."
        />
      ) : (
        <div className="book-grid">
          {books.map((b) => (
            <button
              key={b.id}
              className="book-tile"
              onClick={() => navigate(`/purchases/${b.id}/edit`)}
            >
              <div className="book-spine" aria-hidden>
                📖
              </div>
              <span className="book-title">{b.title || 'Untitled'}</span>
              <span className="book-author">{b.author || '—'}</span>
              <span className="book-date">
                {formatDate(b.deliveredDate || '')}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
