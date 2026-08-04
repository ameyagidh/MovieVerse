import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import MovieRow from '../components/MovieRow.jsx';

export default function MovieDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [myReview, setMyReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const [movieRes, myReviewRes] = await Promise.all([
      api.get(`/movies/${id}`),
      api.get(`/reviews/mine/${id}`).catch(() => ({ data: { review: null } })),
    ]);
    setData(movieRes.data);
    setMyReview(myReviewRes.data.review);
    if (myReviewRes.data.review) {
      setRating(myReviewRes.data.review.rating);
      setText(myReviewRes.data.review.text);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function toggleWatchlist() {
    if (data.movie.onMyList) await api.delete(`/watchlist/${id}`);
    else await api.post('/watchlist', { movieId: id });
    load();
  }

  async function submitReview(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/reviews', { movieId: id, rating: Number(rating), text });
      load();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not save review');
    }
  }

  async function deleteReview() {
    if (!myReview) return;
    await api.delete(`/reviews/${myReview._id}`);
    setMyReview(null);
    setText('');
    load();
  }

  if (!data) return <div style={{ padding: '2rem' }}>Loading…</div>;

  const { movie, reviews, similar, rating: ratingSummary } = data;

  return (
    <div>
      <div className="detail-hero" style={{ backgroundImage: movie.imageUrl ? `url(${movie.imageUrl})` : 'none' }}>
        <div className="detail-content">
          <h1 className="detail-title" data-testid="movie-title">
            {movie.title}
          </h1>
          <p className="detail-meta">
            {movie.releaseDate && new Date(movie.releaseDate).getFullYear()}
            {movie.directors?.length > 0 && ` · Directed by ${movie.directors.join(', ')}`}
            {ratingSummary.count > 0 && ` · ${'★'.repeat(Math.round(ratingSummary.avgRating))} (${ratingSummary.count})`}
          </p>
          {movie.description && <p className="detail-desc">{movie.description}</p>}
          {movie.cast?.length > 0 && <p className="detail-meta">Starring {movie.cast.slice(0, 5).join(', ')}</p>}
          <div className="detail-actions">
            <button className="btn-hero btn-hero-secondary" onClick={toggleWatchlist} data-testid="watchlist-toggle">
              {movie.onMyList ? '✓ On My List' : '+ Add to My List'}
            </button>
            {movie.imdbId && (
              <a
                className="btn-hero btn-hero-secondary"
                href={`https://www.imdb.com/title/${movie.imdbId}/`}
                target="_blank"
                rel="noreferrer"
              >
                IMDb ↗
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="review-form">
        <h2 className="row-title">{myReview ? 'Update your review' : 'Write a review'}</h2>
        <form onSubmit={submitReview}>
          <label htmlFor="rating">
            Rating{' '}
            <select id="rating" className="input" style={{ width: 90, display: 'inline-block' }} value={rating} onChange={(e) => setRating(e.target.value)}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} ★
                </option>
              ))}
            </select>
          </label>
          <textarea rows={3} placeholder="What did you think?" value={text} onChange={(e) => setText(e.target.value)} />
          {error && <p className="error-text">{error}</p>}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button className="btn-primary" type="submit" style={{ width: 'auto' }}>
              {myReview ? 'Update review' : 'Post review'}
            </button>
            {myReview && (
              <button type="button" className="btn-secondary" onClick={deleteReview}>
                Delete
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="review-list">
        <h2 className="row-title">Reviews ({reviews.length})</h2>
        {reviews.map((r) => (
          <div key={r._id} className="review-item">
            <strong>{r.user?.name}</strong> <span className="stars">{'★'.repeat(r.rating)}</span>
            {r.text && <p style={{ margin: '0.25rem 0 0' }}>{r.text}</p>}
          </div>
        ))}
      </div>

      <div className="rows-wrap">
        <MovieRow title="More like this" movies={similar} />
      </div>
    </div>
  );
}
