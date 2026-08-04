import mongoose from 'mongoose';
import { connectDb, disconnectDb } from '../config/db.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Movie } from '../models/Movie.js';
import { WatchlistEntry } from '../models/WatchlistEntry.js';
import { Review } from '../models/Review.js';
import { loadMoviesFromFixtures } from './importMovies.js';
import { downloadPosters } from './downloadPosters.js';
import { logger } from '../utils/logger.js';

const REVIEW_TEXTS = [
  'Absolutely loved this one — watched it twice already.',
  'Solid, but a bit predictable in the third act.',
  'The performances carried a fairly thin plot.',
  'One of the best in its genre this decade.',
  'Good popcorn watch, nothing more, nothing less.',
];

async function seed() {
  await connectDb();

  logger.info('Clearing existing collections');
  await Promise.all([
    User.deleteMany({}),
    Movie.deleteMany({}),
    WatchlistEntry.deleteMany({}),
    Review.deleteMany({}),
  ]);

  logger.info('Importing movies from committed Wikidata fixtures');
  const movieDocs = await loadMoviesFromFixtures();

  logger.info(`Downloading ${movieDocs.length} posters (one-time, ~3s apart to respect Commons' rate limit)`);
  const localImageByWikidataId = await downloadPosters(movieDocs);
  for (const doc of movieDocs) {
    doc.imageUrl = localImageByWikidataId.get(doc.wikidataId) ?? null;
  }

  const movies = await Movie.insertMany(movieDocs);
  logger.info(`Imported ${movies.length} movies`);

  logger.info('Creating admin and demo users');
  await User.create({
    email: env.seedAdmin.email,
    passwordHash: await User.hashPassword(env.seedAdmin.password),
    name: 'Portfolio Admin',
    role: 'admin',
  });

  const [demoUser, alex, priya] = await User.insertMany([
    { email: 'demo@movieverse.dev', passwordHash: await User.hashPassword('Demo1234!'), name: 'Demo Viewer' },
    { email: 'alex@movieverse.dev', passwordHash: await User.hashPassword('Demo1234!'), name: 'Alex Rivera' },
    { email: 'priya@movieverse.dev', passwordHash: await User.hashPassword('Demo1234!'), name: 'Priya Nair' },
  ]);

  logger.info('Building watchlists and reviews for demo richness');
  const usersWithMovies = [
    { user: demoUser, movies: movies.slice(0, 14) },
    { user: alex, movies: movies.slice(10, 24) },
    { user: priya, movies: movies.slice(20, 34) },
  ];

  const watchlistEntries = [];
  const reviews = [];
  for (const { user, movies: userMovies } of usersWithMovies) {
    userMovies.forEach((movie, i) => {
      watchlistEntries.push({ user: user._id, movie: movie._id });
      if (i % 2 === 0) {
        reviews.push({
          user: user._id,
          movie: movie._id,
          rating: 3 + (i % 3),
          text: REVIEW_TEXTS[i % REVIEW_TEXTS.length],
        });
      }
    });
  }

  await WatchlistEntry.insertMany(watchlistEntries, { ordered: false }).catch(() => {});
  await Review.insertMany(reviews, { ordered: false }).catch(() => {});

  logger.info('Seed complete', {
    admin: env.seedAdmin.email,
    demoUsers: usersWithMovies.map((u) => u.user.email),
    movies: movies.length,
    watchlistEntries: watchlistEntries.length,
    reviews: reviews.length,
  });

  await disconnectDb();
  await mongoose.connection.close().catch(() => {});
  process.exit(0);
}

seed().catch((err) => {
  logger.error('Seed failed', { message: err.message, stack: err.stack });
  process.exit(1);
});
