import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import MovieCard from '../components/MovieCard.jsx';

export default function WatchlistPage() {
  const [entries, setEntries] = useState(null);

  useEffect(() => {
    api.get('/watchlist').then(({ data }) => setEntries(data.watchlist));
  }, []);

  if (!entries) return <div style={{ padding: '2rem' }}>Loading…</div>;

  return (
    <div className="page">
      <h1 className="row-title" style={{ fontSize: '1.5rem' }} data-testid="watchlist-heading">
        My List ({entries.length})
      </h1>
      {entries.length === 0 ? (
        <p className="empty-state">Nothing on your list yet — browse and hit &quot;Add to My List&quot;.</p>
      ) : (
        <div className="movie-grid">
          {entries.map((entry) => (
            <MovieCard key={entry._id} movie={entry.movie} />
          ))}
        </div>
      )}
    </div>
  );
}
