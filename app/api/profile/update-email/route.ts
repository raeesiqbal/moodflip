import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;
    if (!email || !email.includes('@')) {
      return NextResponse.json({ message: 'Valid email address is required' }, { status: 400 });
    }
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Authentication is required' }, { status: 401 });
    }
    const admin = getSupabaseAdmin();
    const token = authHeader.slice(7);
    const { data: { user }, error: userError } = await admin.auth.getUser(token);
    if (userError || !user) return NextResponse.json({ message: 'Invalid session' }, { status: 401 });
    const { error } = await admin.auth.admin.updateUserById(user.id, { email });
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ success: true, message: 'Confirmation sent to your new e-mail address.', email });
  } catch {
    return NextResponse.json({ message: 'Failed to process request' }, { status: 500 });
  }
}
