import mongoose from 'mongoose';

const watchlistEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  },
  { timestamps: true }
);

watchlistEntrySchema.index({ user: 1, movie: 1 }, { unique: true });

export const WatchlistEntry = mongoose.model('WatchlistEntry', watchlistEntrySchema);
