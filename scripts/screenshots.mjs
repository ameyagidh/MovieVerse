import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');
const BASE_URL = 'http://localhost:5176';
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

async function shoot(page, name) {
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`) });
  console.log(`saved ${name}.png`);
}

async function run() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();

  const ctx = await browser.newContext({ viewport: DESKTOP });
  const page = await ctx.newPage();

  await page.goto(`${BASE_URL}/login`);
  await shoot(page, '01-login');

  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(`${BASE_URL}/`);
  await page.waitForSelector('[data-testid="hero"]');
  await page.waitForTimeout(400);
  await shoot(page, '02-home');

  await page.getByRole('link', { name: 'Browse' }).click();
  await page.waitForURL(/\/browse/);
  await page.waitForSelector('[data-testid^="movie-card-"]');
  await page.waitForTimeout(300);
  await shoot(page, '03-browse');

  // "F1" has both a downloaded poster and a seeded review, so this shot
  // actually shows the poster art and the reviews/similar-movies features
  // working, rather than a text-only fallback card.
  await page.getByPlaceholder('Search titles, directors, cast…').fill('F1');
  await page.getByPlaceholder('Search titles, directors, cast…').press('Enter');
  await page.waitForSelector('[data-testid^="movie-card-"]');
  await page.locator('[data-testid^="movie-card-"]').first().click();
  await page.waitForURL(/\/movies\//);
  await page.waitForTimeout(300);
  await shoot(page, '04-movie-detail');

  await page.getByRole('link', { name: 'My List' }).click();
  await page.waitForURL(/\/watchlist/);
  await page.waitForTimeout(300);
  await shoot(page, '05-watchlist');

  await ctx.close();

  const mobileCtx = await browser.newContext({ viewport: MOBILE });
  const mobilePage = await mobileCtx.newPage();
  await mobilePage.goto(`${BASE_URL}/login`);
  await mobilePage.getByRole('button', { name: /sign in/i }).click();
  await mobilePage.waitForURL(`${BASE_URL}/`);
  await mobilePage.waitForSelector('[data-testid="hero"]');
  await mobilePage.waitForTimeout(400);
  await shoot(mobilePage, '06-home-mobile');
  await mobileCtx.close();

  await browser.close();
  console.log('Done. Screenshots in', OUT_DIR);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
