import { test, expect } from '@playwright/test';
import { monitorPage } from '../network-monitor';

test('profile tabs and report loading are read-only', async ({ page }) => {
  const monitor = monitorPage(page);
  await page.goto('/profile?tab=My%207-Day%20Report');
  await expect(page.getByRole('heading', { name: 'My Profile' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'My 7-Day Report' })).toBeVisible();
  const loadingWasVisible = await page.getByRole('status', { name: /loading report progress/i }).isVisible().catch(() => false);
  await expect(page.getByLabel(/seven-day report progress/i)).toBeVisible({ timeout: 20_000 });
  for (const tab of ['My Mood Lifts', 'Downloads', 'Account Settings', 'My 7-Day Report']) {
    await page.getByRole('button', { name: tab, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`tab=${encodeURIComponent(tab).replace(/%20/g, '(?:%20|\\+)')}`));
    if (tab === 'Account Settings') await expect(page.getByRole('heading', { name: 'Change Password' })).toBeVisible();
    if (tab === 'Downloads') await expect(page.getByRole('heading', { name: 'Your Purchased Reports & Downloads' })).toBeVisible();
  }
  await expect(page.getByLabel(/seven-day report progress/i)).toBeVisible({ timeout: 20_000 });
  const result = await monitor.snapshot();
  console.log('PROFILE_AUDIT', JSON.stringify({ loadingWasVisible,
    api: result.requests.filter((r) => r.url.includes('/api/')),
    repeated: result.repeatedApiRequests, timing: result.timing,
    consoleErrorCount: result.consoleErrors.length, pageErrorCount: result.pageErrors.length }));
});
