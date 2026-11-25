import nextWorker from 'vinext/server/fetch-handler';

// Cloudflare invokes scheduled() for the Cron Trigger. Forward the recovery
// request through the same Next.js fetch handler used for normal HTTP traffic.
export default {
  fetch: nextWorker.fetch,
  async scheduled(
    _controller: { cron: string },
    env: Parameters<typeof nextWorker.fetch>[1] & { CRON_SECRET?: string; APP_URL?: string },
    context: Parameters<typeof nextWorker.fetch>[2],
  ) {
    if (!env.CRON_SECRET || !env.APP_URL) {
      throw new Error('Payment recovery requires CRON_SECRET and APP_URL runtime bindings.');
    }
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
