import { test as setup, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

setup('sign in test customer', async ({ page }) => {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL;
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD;
  if (!email || !password) throw new Error('Set PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD for authenticated tests.');
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /sign in/i }).last().click();
  await expect(page).toHaveURL(/\/(profile|admin)(?:\?|$)/);
  await mkdir('playwright/.auth', { recursive: true });
  await page.context().storageState({ path: 'playwright/.auth/customer.json' });
});
