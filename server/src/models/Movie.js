import mongoose from 'mongoose';

/**
 * A local cache of a Wikidata film entity — imported once at seed time (see
 * docs/DECISIONS.md for why, mirroring openshelf's Open Library import).
 */
const movieSchema = new mongoose.Schema(
  {
    wikidataId: { type: String, required: true, unique: true }, // e.g. "Q2579741"
    title: { type: String, required: true },
    description: { type: String, default: '' },
    releaseDate: { type: Date },
    imageUrl: { type: String, default: null },
    imdbId: { type: String, default: null },
    genres: { type: [String], default: [] },
    directors: { type: [String], default: [] },
    cast: { type: [String], default: [] },
  },
  { timestamps: true }
);

movieSchema.index({ title: 'text', directors: 'text', cast: 'text' });
movieSchema.index({ genres: 1 });
movieSchema.index({ releaseDate: -1 });

export const Movie = mongoose.model('Movie', movieSchema);
