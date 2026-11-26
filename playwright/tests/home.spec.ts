import { test, expect } from '@playwright/test';
import { monitorPage } from '../network-monitor';

test('homepage loads and navigation works', async ({ page }) => {
  const monitor = monitorPage(page);
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'About' }).first()).toBeVisible();
  await page.getByRole('link', { name: 'About' }).first().click();
  await expect(page).toHaveURL(/\/about(?:\/|$)/);
  const result = await monitor.snapshot();
  expect(result.requestCount).toBeGreaterThan(0);
  expect(Array.isArray(result.consoleErrors)).toBe(true);
});
