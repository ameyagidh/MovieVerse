import { Movie } from '../models/Movie.js';

const PAGE_SIZE = 20;

/** Cursor-paginated browse/search, same pattern as openshelf's book search:
 * sort by `_id` descending, `$text` used as a filter (not relevance-ranked),
 * so the cursor stays a simple `{ _id: { $lt: cursor } }`. */
export async function searchMovies({ q, genre, cursor, limit = PAGE_SIZE }) {
  const filter = {};
  if (q) filter.$text = { $search: q };
  if (genre) filter.genres = genre;
  if (cursor) filter._id = { $lt: cursor };

  const docs = await Movie.find(filter)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = docs.length > limit;
  const page = hasMore ? docs.slice(0, limit) : docs;

  return { movies: page, nextCursor: hasMore ? page[page.length - 1]._id.toString() : null };
}

export async function listGenres() {
  const results = await Movie.aggregate([
    { $unwind: '$genres' },
    { $group: { _id: '$genres', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  return results.map((r) => ({ genre: r._id, count: r.count }));
}

/** One row of movies per genre, for the Netflix-style genre-row layout. */
export async function genreRows(rowLimit = 8, moviesPerRow = 12) {
  const genres = (await listGenres()).slice(0, rowLimit);
  const rows = await Promise.all(
    genres.map(async ({ genre }) => ({
      genre,
      movies: await Movie.find({ genres: genre }).sort({ releaseDate: -1 }).limit(moviesPerRow).lean(),
    }))
  );
  return rows;
}

/** "Similar movies" via genre overlap: aggregate every other movie's shared
 * genre count against this one, ranked descending — a real pipeline, not a
 * precomputed table (same tradeoff discussion as openshelf's recommender). */
export async function similarMovies(movie, limit = 8) {
  if (!movie.genres?.length) return [];

  return Movie.aggregate([
    { $match: { _id: { $ne: movie._id }, genres: { $in: movie.genres } } },
    {
      $addFields: {
        sharedGenreCount: {
          $size: { $setIntersection: ['$genres', movie.genres] },
        },
      },
    },
    { $sort: { sharedGenreCount: -1, releaseDate: -1 } },
    { $limit: limit },
  ]);
}
