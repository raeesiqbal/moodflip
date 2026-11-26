import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const expected = JSON.parse(readFileSync(new URL('./fixtures/expected-seo-content.json', import.meta.url), 'utf8')) as typeof import('./fixtures/expected-seo-content.json');

const viewports = [
  { name: 'desktop', width: 1366, height: 768 },
  { name: 'laptop', width: 1280, height: 720 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'mobile-portrait', width: 390, height: 844 },
  { name: 'mobile-landscape', width: 844, height: 390 },
];

for (const viewport of viewports) {
  test(`${viewport.name}: all 31 articles and index are readable and scrollable`, async ({ page }) => {
    test.setTimeout(5 * 60_000);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const issues: Array<{ path: string; issue: string }> = [];
    for (const path of ['/moods', ...expected.articles.map((article) => new URL(article.url).pathname)]) {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      if (response?.status() !== 200) {
        issues.push({ path, issue: `HTTP ${response?.status() ?? 'no response'}` });
        continue;
      }
      const main = page.locator('main');
      await expect(main).toBeVisible();
      await page.waitForLoadState('load');
      await page.waitForTimeout(950);
      await expect(page.getByText('Preparing your mindset shift')).toBeHidden({ timeout: 3_000 });
      const measurements = await page.evaluate(() => {
        const root = document.documentElement;
        const main = document.querySelector('main')!;
        const rect = main.getBoundingClientRect();
        const links = Array.from(main.querySelectorAll('a'));
        const offscreenLinks = links.filter((link) => {
          const box = link.getBoundingClientRect();
          return box.width === 0 || box.height === 0 || box.left < -1 || box.right > innerWidth + 1;
        }).length;
        return { horizontalOverflow: root.scrollWidth - innerWidth, mainWidth: rect.width,
          mainHeight: rect.height, documentHeight: root.scrollHeight, offscreenLinks,
          landscapeDialog: Boolean(document.querySelector('[role="dialog"][aria-label*="rotate"]')),
          scrollLocked: getComputedStyle(root).overflow === 'hidden' || getComputedStyle(document.body).overflow === 'hidden' };
      });
      if (measurements.horizontalOverflow > 1) issues.push({ path, issue: `horizontal overflow ${measurements.horizontalOverflow}px` });
      if (measurements.offscreenLinks) issues.push({ path, issue: `${measurements.offscreenLinks} inaccessible links` });
      if (measurements.landscapeDialog) issues.push({ path, issue: 'landscape-only dialog covers SEO content' });
      if (measurements.scrollLocked) issues.push({ path, issue: 'document scrolling is locked' });
      if (measurements.mainHeight > viewport.height && measurements.documentHeight <= viewport.height) {
        issues.push({ path, issue: 'main content cannot scroll' });
      }
      const slug = path === '/moods' ? 'index' : path.split('/').pop();
      const screenshot = test.info().outputPath(`${viewport.name}-${slug}.png`);
      await page.screenshot({ path: screenshot, fullPage: true, animations: 'disabled' });
    }
    await test.info().attach('responsive-issues.json', {
      body: JSON.stringify({ viewport, pages: 32, issues }, null, 2), contentType: 'application/json',
    });
    expect(issues).toEqual([]);
  });
}
