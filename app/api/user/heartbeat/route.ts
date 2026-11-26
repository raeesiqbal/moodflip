import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const authorization = request.headers.get('authorization');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !authorization?.startsWith('Bearer ')) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }
  const admin = getSupabaseAdmin();
  const { data: { user }, error: authError } = await admin.auth.getUser(authorization.slice(7));
  if (authError || !user) return Response.json({ error: 'Authentication required' }, { status: 401 });
  const now = Date.now();
  const { error } = await admin.from('profiles').update({ last_active_at: new Date(now).toISOString() })
    .eq('id', user.id).lt('last_active_at', new Date(now - 24 * 60 * 60_000).toISOString());
  if (error) return Response.json({ error: 'Activity could not be recorded' }, { status: 503 });
  return Response.json({ success: true }, { headers: { 'Cache-Control': 'private, no-store' } });
}
