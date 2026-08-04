# Design decisions

**Wikidata instead of TMDB.** TMDB is the conventional choice for a movie app and would have given
richer official poster art, but it requires an API key the person requesting this project didn't
have on hand. Wikidata's SPARQL endpoint (`query.wikidata.org/sparql`) is keyless, public, and has
genuinely enough film data — title, release date, genres, directors, cast, an IMDb id, and an
image — to build a real browse/search/detail experience. The tradeoff is real and worth stating
plainly: Wikidata's `image` property is often a promotional photo, theater signage, or a title
logo rather than official poster art, and coverage/quality varies by film. This repo takes that
tradeoff deliberately rather than faking a richer dataset.

**Posters are downloaded once at seed time, not hotlinked at runtime.** This was not the original
plan — the first version rendered `commons.wikimedia.org/wiki/Special:FilePath/...` directly in
every `<img src>`. Loading the home page (hero + 8 genre rows × ~12 posters, all firing at once)
tripped Wikimedia Commons' rate limiter within seconds of the first real browser test; a bare
`curl` against the same URL during debugging reproduced a `429 Too Many Requests` on its own,
confirming the cause. The fix: `server/src/seed/downloadPosters.js` downloads each poster exactly
once during `npm run seed` (3s apart, with retry-and-backoff on a 429), saves it to
`server/public/posters/`, and rewrites the movie's `imageUrl` to a local `/posters/<file>` path
before the app ever serves a page. The running app never talks to Commons again after seeding —
which also means the app works fully offline post-seed, and a movie whose download failed or had
no image at all just falls back to the existing "no cover" placeholder card, not a broken image
icon. Re-running the seed skips files that already exist on disk (matched by Wikidata id), so a
partial run that got rate-limited resumes instead of re-fetching everything and getting rate-limited
again — this was needed in practice, not theoretical, while building this repo.

**Honest result: 13/114 posters (11%).** Commons rate-limited two full seed runs back-to-back —
almost every request after the first ~10 got a 429, even at 3s spacing and with retry/backoff. This
is the real, reproducible behavior of a shared public image host under sustained sequential
requests, not a bug in this repo's downloader. Rather than hide it, the UI is built to make partial
coverage a non-issue: `MovieCard` falls back to a text-only card with the title, so a low hit rate
degrades the browse experience gracefully instead of breaking it. Re-running `npm run seed` later,
whenever Commons' limiter has cooled off, will pick up more posters for free — the downloader is
unchanged and already resumable.

**"Similar movies" is a genre-overlap aggregation pipeline, not a precomputed table.** Same
philosophy as openshelf's "readers also shelved": `$setIntersection` between a movie's genre array
and every other movie's, ranked by the size of the overlap, computed live on every detail-page
request. Real, explainable, and fast at this data size — the honest alternative to claiming an "ML
recommender" without one.

**Cursor pagination on `/api/movies`, same shape as openshelf's `/api/books`.** Sort by `_id`
descending, `$text` used as a filter rather than a relevance-ranked sort, so the cursor stays a
simple `{ _id: { $lt: cursor } }`. See openshelf's `DECISIONS.md` for the full reasoning — repeating
a working pattern across repos is itself a decision worth stating, not just an accident of reusing
code.

**No admin panel, no Socket.IO, no separate worker.** Movies don't change in real time the way
pulseboard's crypto prices do, so there's nothing here that benefits from a live push channel or a
background poller. Adding either would be complexity performing for an audience rather than solving
a real need in this specific app.
