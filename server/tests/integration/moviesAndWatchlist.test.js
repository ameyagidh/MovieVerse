import request from 'supertest';
import { createApp } from '../../src/app.js';
import { connectTestDb, dropAndDisconnectTestDb } from '../helpers/testDb.js';
import { Movie } from '../../src/models/Movie.js';

let app;
let tokenA;
let tokenB;
let movie1;
let movie2;

beforeAll(async () => {
  await connectTestDb('movies');
  app = createApp();

  [movie1, movie2] = await Movie.insertMany([
    { wikidataId: 'Q1', title: 'Test Feature', genres: ['drama film', 'thriller film'], releaseDate: new Date('2020-01-01') },
    { wikidataId: 'Q2', title: 'Another Reel', genres: ['drama film'], releaseDate: new Date('2021-01-01') },
  ]);

  const regA = await request(app)
    .post('/api/auth/register')
    .send({ email: 'a@example.com', password: 'SuperSecret1', name: 'A' });
  tokenA = regA.body.accessToken;

  const regB = await request(app)
    .post('/api/auth/register')
    .send({ email: 'b@example.com', password: 'SuperSecret1', name: 'B' });
  tokenB = regB.body.accessToken;
});

afterAll(async () => {
  await dropAndDisconnectTestDb();
});

function auth(req, token) {
  return req.set('Authorization', `Bearer ${token}`);
}

describe('movies', () => {
  it('searches by title text', async () => {
    const res = await auth(request(app).get('/api/movies?q=Feature'), tokenA);
    expect(res.status).toBe(200);
    expect(res.body.movies.some((m) => m.title === 'Test Feature')).toBe(true);
  });

  it('filters by genre', async () => {
    const res = await auth(request(app).get('/api/movies?genre=thriller film'), tokenA);
    expect(res.body.movies).toHaveLength(1);
  });

  it('returns detail with similar-movies via genre overlap', async () => {
    const res = await auth(request(app).get(`/api/movies/${movie1._id}`), tokenA);
    expect(res.status).toBe(200);
    expect(res.body.similar.some((m) => m._id === movie2._id.toString())).toBe(true);
  });

  it('builds home rows grouped by genre', async () => {
    const res = await auth(request(app).get('/api/movies/home'), tokenA);
    expect(res.status).toBe(200);
    expect(res.body.rows.some((r) => r.genre === 'drama film')).toBe(true);
  });
});

describe('watchlist', () => {
  it('adds a movie, rejects a duplicate add, then removes it', async () => {
    const add = await auth(request(app).post('/api/watchlist'), tokenA).send({ movieId: movie1._id });
    expect(add.status).toBe(201);

    const dup = await auth(request(app).post('/api/watchlist'), tokenA).send({ movieId: movie1._id });
    expect(dup.status).toBe(409);

    const list = await auth(request(app).get('/api/watchlist'), tokenA);
    expect(list.body.watchlist).toHaveLength(1);

    const remove = await auth(request(app).delete(`/api/watchlist/${movie1._id}`), tokenA);
    expect(remove.status).toBe(204);
  });

  it('keeps watchlists scoped per user', async () => {
    await auth(request(app).post('/api/watchlist'), tokenB).send({ movieId: movie2._id });
    const listA = await auth(request(app).get('/api/watchlist'), tokenA);
    const listB = await auth(request(app).get('/api/watchlist'), tokenB);
    expect(listA.body.watchlist).toHaveLength(0);
    expect(listB.body.watchlist).toHaveLength(1);
  });
});

describe('reviews and ownership', () => {
  it('creates a review and rejects deleting someone else’s review', async () => {
    const created = await auth(request(app).post('/api/reviews'), tokenA).send({
      movieId: movie2._id,
      rating: 4,
      text: 'Pretty good',
    });
    expect(created.status).toBe(201);
    const reviewId = created.body.review._id;

    const deleteAsB = await auth(request(app).delete(`/api/reviews/${reviewId}`), tokenB);
    expect(deleteAsB.status).toBe(404);

    const deleteAsA = await auth(request(app).delete(`/api/reviews/${reviewId}`), tokenA);
    expect(deleteAsA.status).toBe(204);
  });
});
