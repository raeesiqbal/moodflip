import nextWorker from 'vinext/server/fetch-handler';

// Cloudflare invokes scheduled() for the Cron Triggers. Route each schedule
// through the same Next.js fetch handler used for normal HTTP traffic.
export default {
  fetch: nextWorker.fetch,
  async scheduled(
    controller: { cron: string },
    env: Parameters<typeof nextWorker.fetch>[1] & { CRON_SECRET?: string; APP_URL?: string },
    context: Parameters<typeof nextWorker.fetch>[2],
  ) {
    if (!env.CRON_SECRET || !env.APP_URL) {
      throw new Error('Scheduled jobs require CRON_SECRET and APP_URL runtime bindings.');
    }
    if (controller.cron === '0 3 * * *') {
      const cleanupRequest = new Request(new URL('/api/cron/cleanup', env.APP_URL), {
        headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
      });
      const cleanupResponse = await nextWorker.fetch(cleanupRequest, env, context);
      if (!cleanupResponse.ok) throw new Error(`Inactive account cleanup returned HTTP ${cleanupResponse.status}.`);
      return;
    }
    if (controller.cron !== '*/5 * * * *') throw new Error(`Unrecognised scheduled job: ${controller.cron}`);
    const request = new Request(new URL('/api/payments/recover', env.APP_URL), {
      headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
    });
    const response = await nextWorker.fetch(request, env, context);
    if (!response.ok) {
      throw new Error(`Payment recovery returned HTTP ${response.status}.`);
    }
    const deliveryRequest = new Request(new URL('/api/reports/deliver-pending', env.APP_URL), {
      method: 'POST', headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
    });
    const deliveryResponse = await nextWorker.fetch(deliveryRequest, env, context);
    if (!deliveryResponse.ok) throw new Error(`Report delivery returned HTTP ${deliveryResponse.status}.`);
  },
};
