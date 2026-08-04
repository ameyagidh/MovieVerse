import { z } from 'zod';
import { WatchlistEntry } from '../models/WatchlistEntry.js';
import { Movie } from '../models/Movie.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

const addSchema = z.object({ movieId: z.string().min(1) });

export const myWatchlist = asyncHandler(async (req, res) => {
  const entries = await WatchlistEntry.find({ user: req.user._id }).populate('movie').sort({ createdAt: -1 }).lean();
  res.json({ watchlist: entries });
});

export const addToWatchlist = asyncHandler(async (req, res) => {
  const { movieId } = addSchema.parse(req.body);

  const movie = await Movie.findById(movieId);
  if (!movie) throw ApiError.notFound('Movie not found');

  const existing = await WatchlistEntry.findOne({ user: req.user._id, movie: movieId });
  if (existing) throw ApiError.conflict('Already on your list');

  const entry = await WatchlistEntry.create({ user: req.user._id, movie: movieId });
  res.status(201).json({ entry });
});

export const removeFromWatchlist = asyncHandler(async (req, res) => {
  const entry = await WatchlistEntry.findOneAndDelete({ user: req.user._id, movie: req.params.movieId });
  if (!entry) throw ApiError.notFound('Not on your list');
  res.status(204).send();
});
