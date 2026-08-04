import { test, expect } from '@playwright/test';

test.describe('movieverse end-to-end', () => {
  test('redirects an unauthenticated visitor to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /movieverse/i })).toBeVisible();
  });

  test('logs in with the seeded demo user and sees the hero + genre rows', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('http://localhost:5176/');
    await expect(page.getByTestId('hero')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid^="row-"]').first()).toBeVisible();
  });

  test('searches for a real seeded title', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('http://localhost:5176/');
    await page.getByPlaceholder('Search titles…').fill('Avatar');
    await page.getByPlaceholder('Search titles…').press('Enter');
    await expect(page).toHaveURL(/\/browse\?q=Avatar/);
    await expect(page.locator('[data-testid^="movie-card-"]').first()).toBeVisible();
  });

  test('filters browse by genre', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('http://localhost:5176/');
    await page.getByRole('link', { name: 'Browse' }).click();
    await page.waitForURL(/\/browse/);
    await page.getByRole('button', { name: /^drama \(\d+\)$/i }).click();
    await expect(page.locator('[data-testid^="movie-card-"]').first()).toBeVisible();
  });

  test('opens a movie, adds it to My List, and it appears on the watchlist page', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('http://localhost:5176/');

    await page.locator('[data-testid^="movie-card-"]').first().click();
    await page.waitForURL(/\/movies\//);
    const title = await page.getByTestId('movie-title').textContent();

    // The seeded demo user already has some movies on their watchlist, so the
    // first card on the page may start there too — toggle again if the click
    // removed it instead of adding it, so the test is independent of seed state.
    // Each toggle click triggers an async reload, so wait for the text to
    // actually change (not just re-read immediately) before deciding.
    const toggle = page.getByTestId('watchlist-toggle');
    const before = await toggle.textContent();
    await toggle.click();
    await expect(toggle).not.toHaveText(before);
    if (!(await toggle.textContent()).includes('On My List')) {
      await toggle.click();
      await expect(toggle).toContainText('On My List');
    }

    await page.getByRole('link', { name: 'My List' }).click();
    await expect(page.getByTestId('watchlist-heading')).toBeVisible();
    await expect(page.getByText(title, { exact: false }).first()).toBeVisible();
  });

  test('writes a review on a movie', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('http://localhost:5176/');

    await page.locator('[data-testid^="movie-card-"]').nth(1).click();
    await page.waitForURL(/\/movies\//);

    await page.locator('textarea').fill('E2E-authored review text.');
    await page.getByRole('button', { name: /post review|update review/i }).click();
    await expect(page.locator('.review-item').getByText('E2E-authored review text.')).toBeVisible();
  });

  test('logs out and returns to login', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('http://localhost:5176/');
    await page.getByRole('button', { name: /log out/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
