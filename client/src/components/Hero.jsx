import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Hero({ movies }) {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (movies.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % movies.length), 6000);
    return () => clearInterval(timer);
  }, [movies.length]);

  if (!movies.length) return null;
  const movie = movies[index];

  return (
    <div className="hero" style={{ backgroundImage: `url(${movie.imageUrl})` }} data-testid="hero">
      <div className="hero-content">
        <h1 className="hero-title">{movie.title}</h1>
        {movie.description && <p className="hero-desc">{movie.description}</p>}
        <div className="hero-actions">
          <button className="btn-hero btn-hero-primary" onClick={() => navigate(`/movies/${movie._id}`)}>
            ▶ View details
          </button>
        </div>
      </div>
    </div>
  );
}
