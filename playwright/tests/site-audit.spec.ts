import { test, expect } from '@playwright/test';
import { monitorPage } from '../network-monitor';

const publicPages = ['/', '/about', '/privacy', '/contact', '/login', '/register', '/forgot-password',
  '/blog', '/resources', '/pricing', '/terms', '/refund', '/disclaimer', '/moods', '/signup'];

test('public pages render without submitting forms', async ({ page }) => {
  const monitor = monitorPage(page);
  for (const path of publicPages) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBeLessThan(400);
    await expect(page.locator('main')).toBeVisible();
  }
  const result = await monitor.snapshot();
  console.log('PUBLIC_AUDIT', JSON.stringify({ api: result.requests.filter((r) => r.url.includes('/api/')),
    repeated: result.repeatedApiRequests, timing: result.timing,
    consoleErrorCount: result.consoleErrors.length, pageErrorCount: result.pageErrors.length }));
});

test('guest cannot view profile', async ({ page }) => {
  await page.goto('/profile');
  await expect(page).toHaveURL(/\/login/);
});

test('mobile public pages render', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/', '/login', '/register', '/contact']) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBeLessThan(400);
    await expect(page.locator('main')).toBeVisible();
  }
});

test('account entry forms render without changing an account', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  await page.goto('/register');
  await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
  await page.goto('/forgot-password');
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await page.goto('/reset-password');
  await expect(page.getByRole('heading', { name: /reset link unavailable/i })).toBeVisible();
});
