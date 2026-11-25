const MAX_CLOCK_SKEW_MS = 10 * 60 * 1000;

export async function verifyWebhookSignature(timestamp: string, signature: string, rawBody: string, secret: string): Promise<boolean> {
  if (!secret || !/^\d{13}$/.test(timestamp) || !/^[a-fA-F0-9]{64}$/.test(signature)) return false;
  if (Math.abs(Date.now() - Number(timestamp)) > MAX_CLOCK_SKEW_MS) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const bytes = new Uint8Array(signature.match(/.{2}/g)!.map((part) => parseInt(part, 16)));
  return crypto.subtle.verify('HMAC', key, bytes, encoder.encode(timestamp + rawBody));
}
