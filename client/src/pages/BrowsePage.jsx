import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import MovieCard from '../components/MovieCard.jsx';

export default function BrowsePage() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [activeGenre, setActiveGenre] = useState(null);
  const [genres, setGenres] = useState([]);
  const [movies, setMovies] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/movies/genres').then(({ data }) => setGenres(data.genres));
  }, []);

  async function runSearch(reset = true) {
    if (reset) setLoading(true);
    const params = {};
    if (query) params.q = query;
    if (activeGenre) params.genre = activeGenre;
    if (!reset && cursor) params.cursor = cursor;

    const { data } = await api.get('/movies', { params });
    setMovies((prev) => (reset ? data.movies : [...prev, ...data.movies]));
    setCursor(data.nextCursor);
    setLoading(false);
  }

  useEffect(() => {
    runSearch(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGenre]);

  useEffect(() => {
    setQuery(initialQuery);
    api.get('/movies', { params: initialQuery ? { q: initialQuery } : {} }).then(({ data }) => {
      setMovies(data.movies);
      setCursor(data.nextCursor);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  return (
    <div className="page">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(true);
        }}
      >
        <input
          className="input"
          placeholder="Search titles, directors, cast…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ maxWidth: 420, marginBottom: '1rem' }}
        />
      </form>

      <div className="genre-filters">
        <button className={activeGenre === null ? 'chip active' : 'chip'} onClick={() => setActiveGenre(null)}>
          All
        </button>
        {genres.map((g) => (
          <button
            key={g.genre}
            className={activeGenre === g.genre ? 'chip active' : 'chip'}
            onClick={() => setActiveGenre(g.genre)}
          >
            {g.genre.replace(' film', '')} ({g.count})
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : movies.length === 0 ? (
        <p className="empty-state">No movies match that search.</p>
      ) : (
        <>
          <div className="movie-grid">
            {movies.map((movie) => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>
          {cursor && (
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button className="btn-secondary" onClick={() => runSearch(false)}>
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
