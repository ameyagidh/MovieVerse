import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

function wikidataIdFromUri(uri) {
  return uri.split('/').pop(); // ".../entity/Q2579741" -> "Q2579741"
}

/**
 * Reads every committed `wikidata_*.json` fixture (real SPARQL query results
 * against query.wikidata.org, captured at build time — see
 * docs/DECISIONS.md) and normalizes the bindings into Movie-shaped objects,
 * deduped by Wikidata entity id.
 *
 * A single film can appear in the raw SPARQL results more than once per
 * fixture file — Wikidata's GROUP_CONCAT still yields one row per distinct
 * combination of the non-aggregated columns (image/imdbId/description), and
 * some films have more than one statement for those. Deduping by
 * `wikidataId` here, keeping the first occurrence, is the fix.
 */
export async function loadMoviesFromFixtures() {
  const files = (await readdir(FIXTURES_DIR)).filter((f) => f.startsWith('wikidata_') && f.endsWith('.json'));
  const byId = new Map();

  for (const file of files) {
    const raw = await readFile(path.join(FIXTURES_DIR, file), 'utf-8');
    const { results } = JSON.parse(raw);

    for (const b of results.bindings) {
      const wikidataId = wikidataIdFromUri(b.film.value);
      if (byId.has(wikidataId)) continue;
      if (!b.filmLabel?.value) continue;

      byId.set(wikidataId, {
        wikidataId,
        title: b.filmLabel.value,
        description: b.description?.value ?? '',
        releaseDate: b.releaseDate?.value ? new Date(b.releaseDate.value) : null,
        imageUrl: b.image?.value ?? null,
        imdbId: b.imdbId?.value ?? null,
        genres: b.genres?.value ? b.genres.value.split(', ').filter(Boolean) : [],
        directors: b.directors?.value ? b.directors.value.split(', ').filter(Boolean) : [],
        cast: b.cast?.value ? b.cast.value.split(', ').slice(0, 8) : [],
      });
    }
  }

  return [...byId.values()];
}
