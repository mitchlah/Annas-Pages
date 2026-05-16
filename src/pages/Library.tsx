import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../data/store';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';

type Sort = 'title' | 'author' | 'added';

const SORTS: { key: Sort; label: string }[] = [
  { key: 'title', label: 'Title' },
  { key: 'author', label: 'Author' },
  { key: 'added', label: 'Date added' },
];

export default function Library() {
  const { purchases } = useData();
  const navigate = useNavigate();
  const [sort, setSort] = useState<Sort>('added');

  const books = purchases
    .filter((p) => p.status === 'delivered')
    .sort((a, b) => {
      if (sort === 'title')
        return (a.title || '').localeCompare(b.title || '');
      if (sort === 'author')
        return (a.author || '').localeCompare(b.author || '');
      return (b.deliveredDate || '').localeCompare(a.deliveredDate || '');
    });

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
        <>
          <div className="segmented">
            {SORTS.map((s) => (
              <button
                key={s.key}
                className={'segment' + (sort === s.key ? ' active' : '')}
                onClick={() => setSort(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="book-list">
            {books.map((b) => (
              <button
                key={b.id}
                className="book-tile"
                onClick={() => navigate(`/purchases/${b.id}/edit`)}
              >
                {b.coverUrl ? (
                  <img className="book-cover" src={b.coverUrl} alt="" />
                ) : (
                  <div
                    className="book-cover book-cover-empty"
                    aria-hidden
                  >
                    📖
                  </div>
                )}
                <span className="book-info">
                  <span className="book-title">
                    {b.title || 'Untitled'}
                  </span>
                  <span className="book-line">{b.author || '—'}</span>
                  <span className="book-line">{b.edition || '—'}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
