import { Review } from '../models/Review.js';

export async function ratingSummary(movieId) {
  const [summary] = await Review.aggregate([
    { $match: { movie: movieId } },
    { $group: { _id: '$movie', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  return summary ? { avgRating: summary.avgRating, count: summary.count } : { avgRating: null, count: 0 };
}
