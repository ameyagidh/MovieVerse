import MovieCard from './MovieCard.jsx';

export default function MovieRow({ title, movies }) {
  if (!movies?.length) return null;

  return (
    <section>
      <h2 className="row-title">{title}</h2>
      <div className="row-track" data-testid={`row-${title}`}>
        {movies.map((movie) => (
          <MovieCard key={movie._id} movie={movie} />
        ))}
      </div>
    </section>
  );
}
