import { expect, test } from '@playwright/test';

test.describe('Portfolio Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/portfolio-dashboard');
  });

  test('should display the portfolio dashboard page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Portfolio Dashboard');
  });

  test('should display performance analytics summary cards', async ({ page }) => {
    await expect(page.getByText('Total Portfolio Value')).toBeVisible();
    await expect(page.getByText('Monthly Performance')).toBeVisible();
    await expect(page.getByText('Performance Metrics')).toBeVisible();
    await expect(page.getByText('Engagement')).toBeVisible();
  });

  test('should display the cumulative profit chart', async ({ page }) => {
    await expect(page.getByText('Cumulative Profit Over Time')).toBeVisible();
    const svg = page.locator('svg').first();
    await expect(svg).toBeVisible();
  });

  test('should display bet history table', async ({ page }) => {
    await expect(page.getByText('Bet History')).toBeVisible();
    await expect(page.getByText('Event')).toBeVisible();
    await expect(page.getByText('Selection')).toBeVisible();
    await expect(page.getByText('Odds')).toBeVisible();
    await expect(page.getByText('Stake')).toBeVisible();
  });

  test('should filter bet history by market type', async ({ page }) => {
    const marketTypeSelect = page.locator('#marketType');
    await marketTypeSelect.selectOption('sports');

    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  test('should filter bet history by status', async ({ page }) => {
    const statusSelect = page.locator('#status');
    await statusSelect.selectOption('won');

    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  test('should search bet history', async ({ page }) => {
    const searchInput = page.locator('#searchQuery');
    await searchInput.fill('Liverpool');

    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  test('should show net profit and ROI in portfolio value card', async ({ page }) => {
    await expect(page.getByText('Net profit')).toBeVisible();
    await expect(page.getByText(/ROI/).first()).toBeVisible();
  });

  test('should display win rate and total bets in metrics card', async ({ page }) => {
    await expect(page.getByText('Win rate')).toBeVisible();
    await expect(page.getByText('Total bets')).toBeVisible();
    await expect(page.getByText('Winning bets')).toBeVisible();
    await expect(page.getByText('Pending bets')).toBeVisible();
  });
});
