import { useNavigate } from 'react-router-dom';

export default function MovieCard({ movie }) {
  const navigate = useNavigate();

  return (
    <div className="movie-card" onClick={() => navigate(`/movies/${movie._id}`)} data-testid={`movie-card-${movie._id}`}>
      {movie.imageUrl ? (
        <img className="movie-card-image" src={movie.imageUrl} alt={movie.title} loading="lazy" />
      ) : (
        <div className="movie-card-noimage">{movie.title}</div>
      )}
      <div className="movie-card-title">{movie.title}</div>
    </div>
  );
}
