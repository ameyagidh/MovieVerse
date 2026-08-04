import { z } from 'zod';
import { Review } from '../models/Review.js';
import { Movie } from '../models/Movie.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

const upsertSchema = z.object({
  movieId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  text: z.string().max(2000).optional().default(''),
});

export const upsertReview = asyncHandler(async (req, res) => {
  const { movieId, rating, text } = upsertSchema.parse(req.body);

  const movie = await Movie.findById(movieId);
  if (!movie) throw ApiError.notFound('Movie not found');

  const review = await Review.findOneAndUpdate(
    { user: req.user._id, movie: movieId },
    { rating, text },
    { new: true, upsert: true }
  ).populate('user', 'name');

  res.status(201).json({ review });
});

export const deleteReview = asyncHandler(async (req, res) => {
  // Ownership enforced at the query level, same pattern as openshelf: a
  // review id that belongs to another user simply matches nothing.
  const review = await Review.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!review) throw ApiError.notFound('Review not found');
  res.status(204).send();
});

export const myReviewForMovie = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ user: req.user._id, movie: req.params.movieId });
  res.json({ review });
});
