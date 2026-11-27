import { test, expect } from '@playwright/test';

test.describe('GA4 consent and safe page tracking', () => {
  test.skip(process.env.NEXT_PUBLIC_GA_TEST_MODE !== 'true' || !process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    'Run against a local server with NEXT_PUBLIC_GA_TEST_MODE=true and an intercepted GA4 ID.');

  test('does not load the tag before consent or after Essential only', async ({ page }) => {
    const tagRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/gtag/js')) tagRequests.push(request.url());
    });
    await page.goto('/');
    await expect(page.getByRole('dialog', { name: 'Analytics choices' })).toBeVisible();
    expect(tagRequests).toHaveLength(0);
    await page.getByRole('button', { name: 'Essential only' }).click();
    await page.getByRole('link', { name: 'About' }).first().click();
    await expect(page).toHaveURL(/\/about$/);
    expect(tagRequests).toHaveLength(0);
  });

  test('loads only the new tag and queues one safe page view per public navigation', async ({ page }) => {
    const tagRequests: string[] = [];
    const collectRequests: string[] = [];
    await page.route(/google-analytics\.com|doubleclick\.net/, async (route) => {
      collectRequests.push(route.request().url());
      await route.abort(); // Never send test events to the production GA4 property.
    });
    await page.route(/googletagmanager\.com\/gtag\/js/, async (route) => {
      tagRequests.push(route.request().url());
      await route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* intercepted GA tag */' });
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Allow analytics' }).click();
    await expect.poll(() => tagRequests.length).toBe(1);
    await page.getByRole('link', { name: 'About' }).first().click();
    await expect(page).toHaveURL(/\/about$/);
    const events = await page.evaluate(() => (window.dataLayer || []).filter((entry) =>
      typeof entry === 'object' && entry !== null && (entry as IArguments)[0] === 'event' && (entry as IArguments)[1] === 'page_view'));
    expect(events).toHaveLength(2);
    expect(events.map((entry) => (entry as unknown[])[2])).toEqual([
      expect.objectContaining({ page_location: 'https://moodflip.coach/', page_title: 'MoodFlip', page_referrer: '' }),
      expect.objectContaining({ page_location: 'https://moodflip.coach/about', page_title: 'MoodFlip', page_referrer: '' }),
    ]);
    expect(tagRequests[0]).toContain('G-WNF04STFYD');
    expect(tagRequests[0]).not.toContain('G-W982KSL9X8');
    expect(collectRequests).toHaveLength(0);
    await page.getByRole('link', { name: 'Mood Guides' }).first().click();
    await expect(page).toHaveURL(/\/moods$/);
    const countBeforeArticle = await page.evaluate(() => (window.dataLayer || []).filter((entry) =>
      typeof entry === 'object' && entry !== null && (entry as IArguments)[0] === 'event' && (entry as IArguments)[1] === 'page_view').length);
    await page.locator('a[href^="/moods/"]').first().click();
    const countAfterArticle = await page.evaluate(() => (window.dataLayer || []).filter((entry) =>
      typeof entry === 'object' && entry !== null && (entry as IArguments)[0] === 'event' && (entry as IArguments)[1] === 'page_view').length);
    expect(countAfterArticle).toBe(countBeforeArticle);
  });

  test('never includes sensitive query strings in manual page views', async ({ page }) => {
    await page.route(/google-analytics\.com|doubleclick\.net/, (route) => route.abort());
    await page.route(/googletagmanager\.com\/gtag\/js/, (route) =>
      route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* intercepted GA tag */' }));
    await page.goto('/about?email=private@example.com&order=secret');
    await page.getByRole('button', { name: 'Allow analytics' }).click();
    const payload = await page.evaluate(() => JSON.stringify(window.dataLayer || []));
    expect(payload).toContain('https://moodflip.coach/about');
    expect(payload).not.toContain('private@example.com');
    expect(payload).not.toContain('secret');
  });

  test('tracks free Mood Lift use without mood details', async ({ page }) => {
    await page.route(/google-analytics\.com|doubleclick\.net/, (route) => route.abort());
    await page.route(/googletagmanager\.com\/gtag\/js/, (route) =>
      route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* intercepted GA tag */' }));
    await page.goto('/');
    await page.getByRole('button', { name: 'Allow analytics' }).click();
    await page.getByRole('button', { name: 'LIFT my MOOD' }).click();
    const events = await page.evaluate(() => (window.dataLayer || []).filter((entry) =>
      typeof entry === 'object' && entry !== null && (entry as IArguments)[0] === 'event' && (entry as IArguments)[1] === 'mood_lift'));
    expect(events).toHaveLength(1);
    expect(Object.keys((events[0] as unknown[])[2] as object).sort()).toEqual([
      'page_location', 'page_referrer', 'page_title', 'send_to',
    ]);
  });

  test('real Google tag collection request is intercepted before reaching GA4', async ({ page }) => {
    test.skip(process.env.PLAYWRIGHT_GA_REAL_TAG !== '1', 'Opt-in network test; all collection requests are intercepted.');
    const collections: URL[] = [];
    const tagResponses: string[] = [];
    const tagRequests: string[] = [];
    const failedRequests: string[] = [];
    page.on('response', (response) => {
      if (response.url().includes('/gtag/js')) tagResponses.push(`${response.status()} ${response.url()}`);
    });
    page.on('request', (request) => {
      if (request.url().includes('/gtag/js')) tagRequests.push(request.url());
    });
    page.on('requestfailed', (request) => {
      if (/google-analytics\.com|googletagmanager\.com/.test(request.url())) failedRequests.push(`${request.url()} ${request.failure()?.errorText}`);
    });
    await page.route(/google-analytics\.com|doubleclick\.net/, async (route) => {
      collections.push(new URL(route.request().url()));
      await route.abort();
    });
    await page.goto('/about?email=private@example.com&order=secret');
    await page.getByRole('button', { name: 'Allow analytics' }).click();
    await expect.poll(() => collections.length, { timeout: 15_000,
      message: `Tag requests: ${tagRequests.join('; ')}; responses: ${tagResponses.join('; ')}; failures: ${failedRequests.join('; ')}`,
    }).toBeGreaterThan(0);
    const serialized = collections.map((url) => url.toString()).join('\n');
    expect(serialized).toContain('G-WNF04STFYD');
    expect(serialized).not.toContain('G-W982KSL9X8');
    expect(serialized).not.toContain('private%40example.com');
    expect(serialized).not.toContain('secret');
    expect(collections.filter((url) => url.searchParams.get('en') === 'page_view')).toHaveLength(1);
    await page.getByRole('link', { name: 'Mood Guides' }).first().click();
    await expect(page).toHaveURL(/\/moods$/);
    await page.locator('a[href^="/moods/"]').first().click();
    await expect(page).toHaveURL(/\/moods\/[^/]+$/);
    const articlePath = new URL(page.url()).pathname;
    await page.waitForTimeout(2500);
    expect(collections.map((url) => url.searchParams.get('dl') || '').join('\n')).not.toContain(articlePath);
    const moodListViews = collections.filter((url) => url.searchParams.get('en') === 'page_view' &&
      (url.searchParams.get('dl') || '').endsWith('/moods'));
    expect(moodListViews, 'Disable GA4 automatic browser-history page views in the web stream.').toHaveLength(1);
  });
});
