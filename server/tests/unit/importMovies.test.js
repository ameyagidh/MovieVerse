import { loadMoviesFromFixtures } from '../../src/seed/importMovies.js';

describe('loadMoviesFromFixtures', () => {
  it('loads a non-trivial number of real, deduped movies from the committed fixtures', async () => {
    const movies = await loadMoviesFromFixtures();
    expect(movies.length).toBeGreaterThan(50);

    const ids = movies.map((m) => m.wikidataId);
    expect(new Set(ids).size).toBe(ids.length); // deduped across genre fixture files

    for (const movie of movies) {
      expect(movie.wikidataId).toMatch(/^Q\d+$/);
      expect(typeof movie.title).toBe('string');
      expect(movie.title.length).toBeGreaterThan(0);
      expect(Array.isArray(movie.genres)).toBe(true);
    }
  });

  it('parses genres, directors, and cast as arrays, not raw comma strings', async () => {
    const movies = await loadMoviesFromFixtures();
    const withGenres = movies.find((m) => m.genres.length > 1);
    expect(withGenres).toBeDefined();
    expect(withGenres.genres.every((g) => !g.includes(','))).toBe(true);
  });
});
