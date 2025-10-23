import { expect, test } from '@playwright/test';

test.describe('Bet Scanner', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bet-scanner');
  });

  test('should display the bet scanner page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Bet Scanner');
  });

  test('should show filters and allow search', async ({ page }) => {
    const searchInput = page.locator('#searchQuery');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('Chiefs');
    await searchInput.press('Enter');

    const marketCards = page.getByTestId('market-card');
    await expect(marketCards.first()).toBeVisible();
  });

  test('should filter by market type', async ({ page }) => {
    const marketTypeSelect = page.locator('#marketType');
    await marketTypeSelect.selectOption('esports');

    const marketCards = page.getByTestId('market-card');
    await expect(marketCards.first()).toBeVisible();
  });

  test('should filter by popular markets', async ({ page }) => {
    const popularCheckbox = page.locator('#popularOnly');
    await popularCheckbox.check();

    const marketCards = page.getByTestId('market-card');
    await expect(marketCards.first()).toBeVisible();
  });

  test('should navigate to order placement from market card', async ({ page }) => {
    const marketCards = page.getByTestId('market-card');
    await marketCards.first().getByRole('link', { name: 'Place Order' }).click();

    await expect(page).toHaveURL(/\/orders\/new\//);
    await expect(page.getByText('Place Order')).toBeVisible();
  });
});
