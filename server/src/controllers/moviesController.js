import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { Movie } from '../models/Movie.js';
import { Review } from '../models/Review.js';
import { WatchlistEntry } from '../models/WatchlistEntry.js';
import { searchMovies, listGenres, genreRows, similarMovies } from '../services/movieService.js';
import { ratingSummary } from '../services/reviewService.js';

export const search = asyncHandler(async (req, res) => {
  const { q, genre, cursor, limit } = req.query;
  const result = await searchMovies({ q, genre, cursor, limit: limit ? Number(limit) : undefined });
  res.json(result);
});

export const genres = asyncHandler(async (req, res) => {
  res.json({ genres: await listGenres() });
});

export const home = asyncHandler(async (req, res) => {
  const rows = await genreRows();
  const hero = await Movie.find({ imageUrl: { $ne: null } })
    .sort({ releaseDate: -1 })
    .limit(5)
    .lean();
  res.json({ hero, rows });
});

export const getMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id).lean();
  if (!movie) throw ApiError.notFound('Movie not found');

  const [reviews, similar, rating, myWatchlistEntry] = await Promise.all([
    Review.find({ movie: movie._id }).populate('user', 'name').sort({ createdAt: -1 }).lean(),
    similarMovies(movie),
    ratingSummary(movie._id),
    WatchlistEntry.findOne({ user: req.user._id, movie: movie._id }).lean(),
  ]);

  res.json({
    movie: { ...movie, onMyList: Boolean(myWatchlistEntry) },
    reviews,
    similar,
    rating,
  });
});
