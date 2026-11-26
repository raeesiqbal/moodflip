type ActivityResult = { success?: boolean; checkins?: unknown[]; reportProgress?: unknown; error?: string };

let cached: { token: string; expiresAt: number; value: ActivityResult } | null = null;
let pending: { token: string; promise: Promise<ActivityResult> } | null = null;

export function invalidateUserActivity() { cached = null; pending = null; }

export async function getUserActivity(token: string): Promise<ActivityResult> {
  if (cached?.token === token && cached.expiresAt > Date.now()) return cached.value;
  if (pending?.token === token) return pending.promise;
  const promise = fetch('/api/user/activity', {
    headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
  }).then(async (response) => {
    const result = await response.json() as ActivityResult;
    if (!response.ok || !result.success) throw new Error(result.error || 'Unable to load Mood Lifts.');
    cached = { token, value: result, expiresAt: Date.now() + 15_000 };
    return result;
  }).finally(() => { if (pending?.promise === promise) pending = null; });
  pending = { token, promise };
  return promise;
}
