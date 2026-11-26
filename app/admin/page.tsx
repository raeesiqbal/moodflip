import AdminDashboard from '@/components/AdminDashboard';
import AdminGate from '@/components/AdminGate';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return <AdminGate />;
  const token = (await cookies()).get('mf_admin_page_session')?.value;
  if (!token) return <AdminGate />;
  const admin = getSupabaseAdmin();
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return <AdminGate />;
  const { data: profile, error: profileError } = await admin.from('profiles')
    .select('is_admin').eq('id', user.id).single();
  if (profileError || !profile?.is_admin) return <AdminGate />;
  return <AdminDashboard />;
}
