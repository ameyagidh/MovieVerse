import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import Hero from '../components/Hero.jsx';
import MovieRow from '../components/MovieRow.jsx';

export default function HomePage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/movies/home').then(({ data }) => setData(data));
  }, []);

  if (!data) return <div style={{ padding: '2rem' }}>Loading…</div>;

  return (
    <div>
      <Hero movies={data.hero} />
      <div className="rows-wrap">
        {data.rows.map((row) => (
          <MovieRow key={row.genre} title={row.genre.replace(' film', '')} movies={row.movies} />
        ))}
      </div>
    </div>
  );
}
