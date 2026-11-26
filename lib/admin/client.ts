import { supabase } from '@/lib/supabase';

export async function isCurrentUserAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase.from('profiles')
    .select('is_admin').eq('id', userId).single();
  return !error && data?.is_admin === true;
}
