import type { Page, Request } from '@playwright/test';

type RequestRecord = { url: string; method: string; status?: number; durationMs?: number; failed?: boolean };

// Strip query strings because they can contain tokens or personal data.
function safeUrl(raw: string) {
  try {
    const url = new URL(raw);
    const path = url.pathname.split('/').map((part) =>
      /@|^[0-9a-f]{8}-[0-9a-f-]{27,}$|^[A-Za-z0-9_-]{24,}$/.test(part) ? '[redacted]' : part).join('/');
    return `${url.origin}${path}`;
  } catch { return '[invalid URL]'; }
}

export function monitorPage(page: Page) {
  const requests: RequestRecord[] = [];
  const starts = new WeakMap<Request, number>();
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on('request', (request) => starts.set(request, performance.now()));
  page.on('response', (response) => {
    const request = response.request();
    requests.push({ url: safeUrl(request.url()), method: request.method(), status: response.status(),
      durationMs: Math.round(performance.now() - (starts.get(request) || performance.now())) });
  });
  page.on('requestfailed', (request) => requests.push({ url: safeUrl(request.url()), method: request.method(), failed: true }));
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push('Browser console error'); });
  page.on('pageerror', (error) => pageErrors.push(error.name));
  return {
    snapshot: async () => {
      const timing = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
        return navigation ? { navigationMs: Math.round(navigation.duration), ttfbMs: Math.round(navigation.responseStart) } : null;
      });
      const repeatedApiRequests = Object.entries(requests.filter((r) => r.url.includes('/api/'))
        .reduce<Record<string, number>>((counts, r) => { const key = `${r.method} ${r.url}`; counts[key] = (counts[key] || 0) + 1; return counts; }, {}))
        .filter(([, count]) => count > 1);
      return { requests, requestCount: requests.length, repeatedApiRequests,
        failedRequests: requests.filter((r) => r.failed), consoleErrors, pageErrors, timing };
    },
  };
}
