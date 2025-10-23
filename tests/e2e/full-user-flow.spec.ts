import { expect, test } from '@playwright/test';

test.describe('Complete User Flow', () => {
  test('should complete full betting workflow: portfolio view -> bet scanner -> order -> portfolio', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Portfolio/);

    await page.getByRole('link', { name: 'Portfolio' }).click();
    await expect(page).toHaveURL('/portfolio-dashboard');
    await expect(page.locator('h1')).toContainText('Portfolio Dashboard');

    await expect(page.getByText('Total Portfolio Value')).toBeVisible();
    await expect(page.getByText('Monthly Performance')).toBeVisible();
    await expect(page.getByText('Cumulative Profit Over Time')).toBeVisible();

    await page.getByRole('link', { name: 'Bet Scanner' }).click();
    await expect(page).toHaveURL('/bet-scanner');
    await expect(page.locator('h1')).toContainText('Bet Scanner');

    const searchInput = page.locator('#searchQuery');
    await searchInput.fill('Chiefs');

    await page.waitForTimeout(500);

    const marketCard = page.getByTestId('market-card').first();
    await expect(marketCard).toBeVisible();

    await marketCard.getByRole('link', { name: 'Place Order' }).click();
    await expect(page).toHaveURL(/\/orders\/new\//);

    const stakeInput = page.locator('#stake');
    await stakeInput.fill('200');

    await expect(page.getByText('Potential Return')).toBeVisible();
    await expect(page.getByText('Potential Profit')).toBeVisible();

    const placeOrderButton = page.getByRole('button', { name: 'Place Order' });
    await placeOrderButton.click();

    await expect(page.getByText('Order Placed Successfully!')).toBeVisible();

    await page.waitForTimeout(2500);
    await expect(page).toHaveURL('/portfolio-dashboard');
  });

  test('should navigate between all pages using nav links', async ({ page }) => {
    await page.goto('/');

    const portfolioLink = page.getByRole('link', { name: 'Portfolio' });
    await portfolioLink.click();
    await expect(page).toHaveURL('/portfolio-dashboard');

    const betScannerLink = page.getByRole('link', { name: 'Bet Scanner' });
    await betScannerLink.click();
    await expect(page).toHaveURL('/bet-scanner');

    const homeLink = page.getByRole('link', { name: 'Home' });
    await homeLink.click();
    await expect(page).toHaveURL('/');
  });

  test('should handle popular market highlighting', async ({ page }) => {
    await page.goto('/bet-scanner');

    const popularBadge = page.getByText('Popular').first();
    await expect(popularBadge).toBeVisible();

    const popularCheckbox = page.locator('#popularOnly');
    await popularCheckbox.check();

    await page.waitForTimeout(500);

    const marketCards = page.getByTestId('market-card');
    const count = await marketCards.count();
    expect(count).toBeGreaterThan(0);
  });
});
