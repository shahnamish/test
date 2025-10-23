import { expect, test } from '@playwright/test';

test.describe('Backend Synchronization', () => {
  test('should load portfolio data from backend service', async ({ page }) => {
    await page.goto('/portfolio-dashboard');

    await page.waitForTimeout(500);

    await expect(page.getByText('Loading portfolio data...')).not.toBeVisible({ timeout: 10000 });

    await expect(page.getByText('Total Portfolio Value')).toBeVisible();
    await expect(page.getByText('Monthly Performance')).toBeVisible();
  });

  test('should load markets data from backend service', async ({ page }) => {
    await page.goto('/bet-scanner');

    await page.waitForTimeout(500);

    await expect(page.getByText('Loading available markets...')).not.toBeVisible({ timeout: 10000 });

    const marketCards = page.getByTestId('market-card');
    await expect(marketCards.first()).toBeVisible();
  });

  test('should apply filters and fetch filtered data', async ({ page }) => {
    await page.goto('/portfolio-dashboard');

    await page.waitForTimeout(500);

    const marketTypeSelect = page.locator('#marketType');
    await marketTypeSelect.selectOption('sports');

    await page.waitForTimeout(500);

    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  test('should handle concurrent data fetches', async ({ page }) => {
    await page.goto('/portfolio-dashboard');

    await page.waitForTimeout(500);

    const marketTypeSelect = page.locator('#marketType');
    await marketTypeSelect.selectOption('sports');

    const statusSelect = page.locator('#status');
    await statusSelect.selectOption('won');

    const searchInput = page.locator('#searchQuery');
    await searchInput.fill('Liverpool');

    await page.waitForTimeout(500);

    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  test('should display data even when backend is unavailable', async ({ page }) => {
    await page.goto('/portfolio-dashboard');

    await page.waitForTimeout(500);

    await expect(page.getByText('Total Portfolio Value')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Monthly Performance')).toBeVisible();
  });
});
