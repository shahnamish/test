import { expect, test } from '@playwright/test';

test.describe('Order Placement', () => {
  test('should complete full order placement flow from bet scanner', async ({ page }) => {
    await page.goto('/bet-scanner');

    const marketCard = page.getByTestId('market-card').first();
    await expect(marketCard).toBeVisible();

    await marketCard.getByRole('link', { name: 'Place Order' }).click();

    await expect(page).toHaveURL(/\/orders\/new\//);
    await expect(page.locator('h1')).toContainText('Place Order');

    const selectionSelect = page.locator('#selection');
    await expect(selectionSelect).toBeVisible();

    const stakeInput = page.locator('#stake');
    await stakeInput.fill('100');

    await expect(page.getByText('Potential Return')).toBeVisible();
    await expect(page.getByText('Potential Profit')).toBeVisible();

    const placeOrderButton = page.getByRole('button', { name: 'Place Order' });
    await placeOrderButton.click();

    await expect(page.getByText('Order Placed Successfully!')).toBeVisible();
  });

  test('should show summary calculations when stake is entered', async ({ page }) => {
    await page.goto('/bet-scanner');

    const marketCard = page.getByTestId('market-card').first();
    await marketCard.getByRole('link', { name: 'Place Order' }).click();

    const stakeInput = page.locator('#stake');
    await stakeInput.fill('250');

    await expect(page.getByText('Stake')).toBeVisible();
    await expect(page.getByText('Odds')).toBeVisible();
    await expect(page.getByText('Potential Return')).toBeVisible();
    await expect(page.getByText('Potential Profit')).toBeVisible();
  });

  test('should disable submit button without stake', async ({ page }) => {
    await page.goto('/bet-scanner');

    const marketCard = page.getByTestId('market-card').first();
    await marketCard.getByRole('link', { name: 'Place Order' }).click();

    const placeOrderButton = page.getByRole('button', { name: 'Place Order' });
    await expect(placeOrderButton).toBeDisabled();
  });

  test('should allow canceling the order', async ({ page }) => {
    await page.goto('/bet-scanner');

    const marketCard = page.getByTestId('market-card').first();
    await marketCard.getByRole('link', { name: 'Place Order' }).click();

    const cancelButton = page.getByRole('button', { name: 'Cancel' });
    await cancelButton.click();

    await expect(page).toHaveURL('/bet-scanner');
  });
});
