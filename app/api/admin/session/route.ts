import { requireAdminRequest, noStore } from '@/lib/admin/auth';

export const dynamic = 'force-dynamic';
const cookieName = 'mf_admin_page_session';

export async function POST(request: Request) {
  const access = await requireAdminRequest(request);
  if (!access) return Response.json({ error: 'Administrator access required' }, { status: 403, headers: noStore });
  const token = request.headers.get('authorization')!.slice(7);
  const response = Response.json({ success: true }, { headers: noStore });
  response.headers.append('Set-Cookie', `${cookieName}=${encodeURIComponent(token)}; Path=/admin; Max-Age=3600; HttpOnly; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
  return response;
}

export async function DELETE() {
  const response = Response.json({ success: true }, { headers: noStore });
  response.headers.append('Set-Cookie', `${cookieName}=; Path=/admin; Max-Age=0; HttpOnly; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
  return response;
}
