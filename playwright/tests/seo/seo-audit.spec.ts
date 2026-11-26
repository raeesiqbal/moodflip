import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const expected = JSON.parse(readFileSync(new URL('./fixtures/expected-seo-content.json', import.meta.url), 'utf8')) as typeof import('./fixtures/expected-seo-content.json');

const origin = new URL(process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3005').origin;
const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();
const pathOf = (url: string) => new URL(url).pathname;

function watchPage(page: import('@playwright/test').Page) {
  const failed: string[] = [];
  const api: string[] = [];
  const thirdParty: string[] = [];
  const errors: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.origin === origin && url.pathname.startsWith('/api/')) api.push(`${request.method()} ${url.pathname}`);
    if (url.origin !== origin) thirdParty.push(`${request.method()} ${url.host}${url.pathname}`);
  });
  page.on('requestfailed', (request) => failed.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  return { failed, api, thirdParty, errors };
}

async function commonMetadata(page: import('@playwright/test').Page, item: {
  url: string; title: string; description: string; heading?: string;
}) {
  await expect(page).toHaveTitle(item.title);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', item.description);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', item.url);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', item.title);
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', item.description);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', item.url);
  const robots = await page.evaluate(() => document.querySelector('meta[name="robots"]')?.getAttribute('content'));
  expect(robots || '').not.toMatch(/noindex/i);
  await expect(page.locator('main h1')).toHaveCount(1);
}

test.describe('Word document SEO regression', () => {
  test('fixture has unique routes, titles and descriptions', () => {
    expect(expected.articles).toHaveLength(31);
    for (const key of ['url', 'title', 'description'] as const) {
      const values = expected.articles.map((article) => article[key]);
      expect(new Set(values).size, key).toBe(31);
    }
  });

  for (const article of expected.articles) {
    test(`${String(article.number).padStart(2, '0')} ${article.slug}: exact content and technical SEO`, async ({ page }) => {
      const network = watchPage(page);
      const path = pathOf(article.url);
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), path).toBe(200);
      expect(new URL(response!.url()).pathname, 'unexpected redirect').toBe(path);
      expect(response!.request().redirectedFrom(), 'unexpected redirect chain').toBeNull();
      await expect(page.locator('article h1')).toHaveText(article.body[0].text);
      await commonMetadata(page, article);

      const actual = await page.locator('article h1, article h2, article p, article li').evaluateAll((nodes) =>
        nodes.map((node) => ({ kind: node.tagName.toLowerCase(), text: (node.textContent || '').replace(/\s+/g, ' ').trim() })));
      const body = article.body.map((line) => ({ ...line, text: normalize(line.text) }));
      expect(actual.slice(0, body.length), 'article wording and order').toEqual(body);
      const remainder = [
        { kind: 'h2', text: 'Related Guides' },
        ...(article.furtherLabel ? [{ kind: 'p', text: `Further reading: ${article.furtherLabel}` }] : []),
        { kind: 'p', text: article.disclaimer },
      ];
      expect(actual.slice(body.length), 'unapproved or missing article text').toEqual(remainder);

      const lift = page.locator('article').getByRole('link', { name: article.liftLabel, exact: true });
      await expect(lift).toHaveAttribute('href', '/#hero-section');
      const related = page.locator('article').getByRole('heading', { name: 'Related Guides' }).locator('..');
      const relatedLinks = await related.locator('a').evaluateAll((links) => links.map((link) => ({
        label: (link.textContent || '').trim(), href: (link as HTMLAnchorElement).href,
      })));
      expect(relatedLinks.map((link) => link.label)).toEqual(article.relatedLabels);
      expect(relatedLinks.map((link) => link.href)).toEqual(article.relatedUrls.map((url) => new URL(pathOf(url), origin).href));
      if (article.furtherUrl) {
        await expect(page.locator('article').getByRole('link', { name: article.furtherLabel!, exact: true }))
          .toHaveAttribute('href', article.furtherUrl);
      }

      const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
      const schema = schemas.map((value) => JSON.parse(value)).find((value) => value['@type'] === 'Article');
      expect(schema).toBeTruthy();
      expect(schema.headline).toBe(article.body[0].text);
      expect(schema.description).toBe(article.description);
      expect(schema.mainEntityOfPage).toBe(article.url);

      const raw = await response!.text();
      expect(raw).toContain('<h1');
      expect(raw).toContain('<title>');
      expect(raw).toContain(article.description.replaceAll('&', '&amp;'));
      expect(raw).toContain(article.body[1].text.slice(0, 30));
      await page.waitForLoadState('load');
      await page.waitForTimeout(750);
      const timing = await page.evaluate(() => {
        const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
        return entry ? { responseEnd: entry.responseEnd, domContentLoaded: entry.domContentLoadedEventEnd,
          load: entry.loadEventEnd, transferSize: entry.transferSize,
          resourceCount: performance.getEntriesByType('resource').length } : null;
      });
      await test.info().attach('network-and-timing.json', {
        body: JSON.stringify({ path, timing, ...network }, null, 2), contentType: 'application/json',
      });
    });
  }

  test('/moods index content, groupings and metadata', async ({ page }) => {
    const index = expected.index;
    const network = watchPage(page);
    const response = await page.goto('/moods');
    expect(response?.status()).toBe(200);
    expect(new URL(response!.url()).pathname).toBe('/moods');
    expect(response!.request().redirectedFrom(), 'unexpected redirect chain').toBeNull();
    await commonMetadata(page, index);
    await expect(page.locator('main h1')).toHaveText(index.heading);
    await expect(page.locator('main > div').first().locator('p')).toHaveText(index.intro);
    const sections = page.locator('main section');
    await expect(sections).toHaveCount(5);
    for (let i = 0; i < 5; i++) {
      const section = sections.nth(i);
      const group = index.categories[i];
      await expect(section.locator('h2')).toHaveText(group.heading);
      await expect(section.locator('p')).toHaveText(group.description);
      const links = await section.locator('a').evaluateAll((nodes) => nodes.map((node) => ({
        label: (node.textContent || '').trim(), href: (node as HTMLAnchorElement).href,
      })));
      expect(links.map((link) => link.label)).toEqual(group.labels);
      expect(links.map((link) => link.href)).toEqual(group.urls.map((url) => new URL(pathOf(url), origin).href));
    }
    await expect(page.locator('main').getByText(index.disclaimer, { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Mood Guides', exact: true })).toHaveAttribute('href', '/moods');
    const raw = await response!.text();
    expect(raw).toContain('<h1');
    expect(raw).toContain(index.intro.slice(0, 30));
    const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
    const schema = schemas.map((value) => JSON.parse(value)).find((value) => value['@type'] === 'CollectionPage');
    expect(schema?.url).toBe(index.url);
    await page.waitForLoadState('load');
    await page.waitForTimeout(750);
    await test.info().attach('network-and-timing.json', {
      body: JSON.stringify({ path: '/moods', ...network }, null, 2), contentType: 'application/json',
    });
  });

  test('sitemap and robots cover public guides', async ({ request }) => {
    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.status()).toBe(200);
    const xml = await sitemap.text();
    const urls = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1].replaceAll('&amp;', '&'));
    expect(new Set(urls).size).toBe(urls.length);
    for (const url of [expected.index.url, ...expected.articles.map((item) => item.url)]) {
      expect(urls).toContain(url);
    }
    for (const url of urls) {
      expect(new URL(url).origin).toBe('https://moodflip.coach');
      expect(new URL(url).pathname).not.toMatch(/^\/(api|admin|profile|checkout)(\/|$)/);
      const result = await request.get(new URL(url).pathname, { maxRedirects: 0 });
      expect(result.status(), url).toBe(200);
    }
    const robots = await request.get('/robots.txt');
    expect(robots.status()).toBe(200);
    const robotsText = await robots.text();
    expect(robotsText).not.toMatch(/Disallow:\s*\/moods/i);
    expect(robotsText).toContain('https://moodflip.coach/sitemap.xml');
  });

  test('Lift My Mood destination exists on the homepage', async ({ page }) => {
    const response = await page.goto('/#hero-section');
    expect(response?.status()).toBe(200);
    await expect(page.locator('#hero-section')).toHaveCount(1);
  });

  test('further-reading destinations respond or are reported as inconclusive', async ({ request }) => {
    const urls = Array.from(new Set(expected.articles.map((article) => article.furtherUrl).filter(Boolean))) as string[];
    const results = [];
    for (const url of urls) {
      try {
        const response = await request.get(url, { timeout: 15_000, maxRedirects: 5 });
        results.push({ url, status: response.status(), finalUrl: response.url(),
          outcome: response.status() === 404 || response.status() === 410 ? 'confirmed broken' :
            response.ok() ? 'available' : 'inconclusive (may be bot blocking)' });
      } catch (error) {
        results.push({ url, outcome: 'inconclusive network error', error: String(error) });
      }
    }
    await test.info().attach('external-links.json', { body: JSON.stringify(results, null, 2), contentType: 'application/json' });
    expect(results.filter((result) => result.outcome === 'confirmed broken')).toEqual([]);
  });
});
