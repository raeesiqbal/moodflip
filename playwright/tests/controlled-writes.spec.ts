import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';

test('disposable account write flows and cleanup', async ({ page, request }) => {
  if (process.env.PLAYWRIGHT_ALLOW_WRITES !== '1') throw new Error('Set PLAYWRIGHT_ALLOW_WRITES=1 to run database write tests.');
  test.setTimeout(180_000);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const testEmail = process.env.PLAYWRIGHT_TEST_EMAIL;
  if (!url || !anonKey || !serviceKey || !testEmail || !testEmail.endsWith('@gmail.com')) {
    throw new Error('Supabase keys and a Gmail Playwright test inbox are required.');
  }
  const marker = `mf-e2e-${Date.now()}-${randomBytes(3).toString('hex')}`;
  const email = testEmail.replace('@gmail.com', `+${marker}@gmail.com`);
  const password = `Mf!${randomBytes(18).toString('hex')}`;
  const newPassword = `Mf!${randomBytes(18).toString('hex')}`;
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const customer = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  let userId: string | undefined;
  try {
    await test.step('register and confirm disposable account', async () => {
      await page.goto('/register');
      await page.locator('input[type="text"]').first().fill('MoodFlip Test');
      await page.locator('input[type="email"]').fill(email);
      await page.locator('input[type="password"]').first().fill(password);
      await page.locator('input[type="password"]').last().fill(password);
      await page.locator('input[type="checkbox"]').check();
      await page.getByRole('button', { name: /create free account/i }).click();
      await expect(page).toHaveURL(/verify-email/, { timeout: 20_000 });
      const { data: profile, error } = await admin.from('profiles').select('id').eq('email', email).single();
      if (error || !profile) throw error || new Error('Registration did not create a profile');
      userId = profile.id;
      const confirmed = await admin.auth.admin.updateUserById(profile.id, { email_confirm: true });
      if (confirmed.error) throw confirmed.error;
    });

    await test.step('login and save three Mood Lifts', async () => {
      await page.goto('/login');
      await page.locator('input[type="email"]').fill(email);
      await page.locator('input[type="password"]').fill(password);
      await page.getByRole('button', { name: /sign in/i }).last().click();
      await expect(page).toHaveURL(/\/profile/, { timeout: 20_000 });
      const signedIn = await customer.auth.signInWithPassword({ email, password });
      if (signedIn.error || !signedIn.data.session) throw signedIn.error || new Error('Test login failed');
      const token = signedIn.data.session.access_token;
      const headers = { Authorization: `Bearer ${token}` };
      for (let index = 0; index < 3; index++) {
        const response = await request.post('http://localhost:3005/api/user/activity', {
          headers,
          data: { checkin: { mood: 'Sad', feeling: `E2E feeling ${index}`, target_mood: 'Hopeful',
            action_title: `E2E action ${index}`, action_desc: `Controlled test action ${index}` } },
        });
        expect(response.status()).toBe(200);
      }
      const fourth = await request.post('http://localhost:3005/api/user/activity', {
        headers, data: { checkin: { mood: 'Sad', feeling: 'E2E fourth', target_mood: 'Hopeful',
          action_title: 'E2E fourth', action_desc: 'Controlled fourth test action' } },
      });
      expect(fourth.status()).toBe(409);
      const activity = await request.get('http://localhost:3005/api/user/activity', { headers });
      const body = await activity.json();
      expect(body.reportProgress.dailyCount).toBe(3);
      expect(body.checkins.length).toBe(3);
      await page.goto('/profile?tab=My%20Mood%20Lifts');
      await expect(page.getByText('E2E feeling 0', { exact: false })).toBeVisible();

      const deleted = await request.delete(`http://localhost:3005/api/user/activity?id=${encodeURIComponent(body.checkins[0].id)}`, { headers });
      expect(deleted.status()).toBe(200);
      const afterDelete = await request.get('http://localhost:3005/api/user/activity', { headers });
      expect((await afterDelete.json()).reportProgress.dailyCount).toBe(2);

      const today = new Date().toISOString().slice(0, 10);
      const dates = Array.from({ length: 6 }, (_, index) => new Date(Date.now() - (index + 1) * 86_400_000).toISOString().slice(0, 10));
      const { error: insertError } = await admin.from('checkins').insert(dates.map((saved_at, index) => ({
        user_id: userId!, email, mood: 'Sad', feeling: `E2E backdated ${index}`,
        target_mood: 'Hopeful', action_title: `E2E historic ${index}`,
        action_desc: `Controlled historic action ${index}`, saved_at,
      })));
      if (insertError) throw insertError;
      expect(dates.every((date) => date < today)).toBe(true);
      const eligible = await request.get('http://localhost:3005/api/user/activity', { headers });
      expect((await eligible.json()).reportProgress.eligible).toBe(true);
      await page.goto('/profile?tab=My%207-Day%20Report');
      await expect(page.getByText('Report eligible')).toBeVisible({ timeout: 20_000 });

      const changed = await request.post('http://localhost:3005/api/profile/update-password', {
        headers, data: { currentPassword: password, newPassword, confirmPassword: newPassword },
      });
      expect(changed.status()).toBe(200);
      const newLogin = await customer.auth.signInWithPassword({ email, password: newPassword });
      expect(newLogin.error).toBeNull();

      const recovery = await admin.auth.admin.generateLink({ type: 'recovery', email,
        options: { redirectTo: 'http://localhost:3005/reset-password' } });
      if (recovery.error || !recovery.data.properties?.action_link) throw recovery.error || new Error('Recovery link unavailable');
      await page.goto(recovery.data.properties.action_link);
      await expect(page.getByRole('heading', { name: 'Choose a new password' })).toBeVisible({ timeout: 20_000 });
      const recoveredPassword = `Mf!${randomBytes(18).toString('hex')}`;
      await page.locator('input[type="password"]').first().fill(recoveredPassword);
      await page.locator('input[type="password"]').last().fill(recoveredPassword);
      await page.getByRole('button', { name: 'Update Password' }).click();
      await expect(page.getByRole('heading', { name: 'Password updated' })).toBeVisible({ timeout: 20_000 });
      const recoveredLogin = await customer.auth.signInWithPassword({ email, password: recoveredPassword });
      expect(recoveredLogin.error).toBeNull();
    });
  } finally {
    if (!userId) {
      const { data } = await admin.from('profiles').select('id').eq('email', email).maybeSingle();
      userId = data?.id;
    }
    if (userId) {
      const deletion = await admin.auth.admin.deleteUser(userId);
      if (deletion.error) throw new Error(`Test account cleanup failed: ${deletion.error.message}`);
      const { data: remaining } = await admin.from('profiles').select('id').eq('id', userId).maybeSingle();
      if (remaining) throw new Error('Test profile remained after auth deletion');
    }
  }
});
