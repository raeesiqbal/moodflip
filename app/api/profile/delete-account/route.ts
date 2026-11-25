import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ message: 'Authentication is required' }, { status: 401 });
    const admin = getSupabaseAdmin();
    const { data: { user }, error: userError } = await admin.auth.getUser(authHeader.slice(7));
    if (userError || !user) return NextResponse.json({ message: 'Invalid session' }, { status: 401 });
    // Financial purchase records must survive account deletion. Their nullable
    // user/report references are cleared by the database foreign-key actions.
    const { error: checkinsError } = await admin.from('checkins').delete().eq('email', user.email || '');
    if (checkinsError) return NextResponse.json({ message: checkinsError.message }, { status: 400 });
    const { error: profileError } = await admin.from('profiles').delete().eq('email', user.email || '');
    if (profileError) return NextResponse.json({ message: profileError.message }, { status: 400 });
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });

    return NextResponse.json({ success: true, message: 'Account deleted successfully' });
  } catch {
    return NextResponse.json({ message: 'Failed to process request' }, { status: 500 });
  }
}
