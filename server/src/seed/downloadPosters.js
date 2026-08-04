import { mkdir, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const POSTERS_DIR = path.join(__dirname, '..', '..', 'public', 'posters');

function extensionFor(contentType) {
  if (contentType?.includes('png')) return '.png';
  if (contentType?.includes('webp')) return '.webp';
  if (contentType?.includes('gif')) return '.gif';
  return '.jpg';
}

const DELAY_MS = 3000;
const MAX_ATTEMPTS = 2;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadOne(movie) {
  const httpsUrl = movie.imageUrl.replace(/^http:/, 'https:');

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    // A hung TCP connection (seen in practice while building this) would
    // otherwise stall the whole seed indefinitely — fetch() has no default
    // timeout, so one is set explicitly.
    const res = await fetch(httpsUrl, {
      headers: { 'User-Agent': 'movieverse-portfolio-demo/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer());
      const ext = extensionFor(res.headers.get('content-type'));
      const filename = `${movie.wikidataId}${ext}`;
      await writeFile(path.join(POSTERS_DIR, filename), buffer);
      return `/posters/${filename}`;
    }
    if (res.status === 429 && attempt < MAX_ATTEMPTS) {
      await sleep(DELAY_MS * attempt * 3); // backoff: 9s at DELAY_MS=3000
      continue;
    }
    throw new Error(`HTTP ${res.status}`);
  }
  throw new Error('exhausted retries');
}

/**
 * Downloads each movie's Wikidata/Commons image exactly once and saves it
 * under server/public/posters/, then rewrites the movie's imageUrl to the
 * local `/posters/<file>` path. Runtime hotlinking Commons directly (the
 * first version of this seed did that) tripped Commons' rate limiter after
 * only ~40 concurrent image loads — real 429s, reproduced and confirmed
 * with curl, not a hypothetical.
 *
 * Already-downloaded files are skipped by wikidataId prefix, so re-running
 * this after a partial run (e.g. hit the rate limit and stopped) resumes
 * instead of re-fetching everything and tripping the limiter again.
 */
export async function downloadPosters(movies) {
  await mkdir(POSTERS_DIR, { recursive: true });
  const existing = await readdir(POSTERS_DIR);

  const results = new Map();
  for (const movie of movies) {
    if (!movie.imageUrl) {
      results.set(movie.wikidataId, null);
      continue;
    }

    const already = existing.find((f) => f.startsWith(movie.wikidataId + '.'));
    if (already) {
      results.set(movie.wikidataId, `/posters/${already}`);
      continue;
    }

    try {
      const localPath = await downloadOne(movie);
      results.set(movie.wikidataId, localPath);
    } catch (err) {
      logger.warn(`Poster download failed for ${movie.wikidataId}`, { message: err.message });
      results.set(movie.wikidataId, null);
    }

    if (results.size % 10 === 0) {
      logger.info(`Poster download progress: ${results.size}/${movies.length}`);
    }

    await sleep(DELAY_MS);
  }

  return results;
}
