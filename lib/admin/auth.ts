import { getSupabaseAdmin } from '@/lib/supabase';

export async function requireAdminRequest(request: Request) {
  const authorization = request.headers.get('authorization');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !authorization?.startsWith('Bearer ')) return null;
  const admin = getSupabaseAdmin();
  const { data: { user }, error: authError } = await admin.auth.getUser(authorization.slice(7));
  if (authError || !user) return null;
  const { data: profile, error } = await admin.from('profiles').select('is_admin').eq('id', user.id).single();
  if (error || !profile?.is_admin) return null;
  return { admin, user };
}

export const noStore = { 'Cache-Control': 'private, no-store' };
