'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { REPORT_CURRENCIES } from '@/lib/payments/pricing';
import AdminLoading from '@/components/AdminLoading';

type View = 'overview' | 'users' | 'purchases';
type Overview = { totalUsers: number; purchasedUsers: number; nonPurchasedUsers: number; revenue: Record<string, number> };
type User = { id: string; name: string | null; email: string; created_at: string; moodLiftCount: number; purchaseStatus: 'Active' | 'Inactive' };
type MoodLift = { id: string; mood: string; feeling: string; target_mood: string | null; action_title: string | null; action_desc: string | null; saved_at: string; created_at: string };
type Purchase = { id: string; user_id: string | null; email: string; customerName: string | null; product_name: string;
  paid_at: string | null; amount_minor: number | null; currency: string | null; currency_decimals: number | null;
  payment_status: string; payment_provider: string | null; order_number: string; airwallex_payment_intent_id: string | null; report_id: string | null;
  report: { delivery_status: string; email_status: string; download_completed_at: string | null; delivery_error: string | null; email_last_error: string | null } | null;
  canRecoverDownload: boolean; canResendReport: boolean };
type List<T> = { page: number; total: number } & T;
type MoodList = { user: { id: string; name: string | null; email: string }; entries: MoodLift[]; total: number; page: number };

function money(amountMinor: number | null, currency: string | null, decimals: number | null) {
  if (amountMinor == null || !currency || decimals == null) return 'Unavailable';
  return `${currency} ${(amountMinor / 10 ** decimals).toFixed(decimals)}`;
}
function date(value: string | null) { return value ? new Date(value).toLocaleString() : 'Unavailable'; }

export default function AdminDashboard() {
  const router = useRouter();
  const [view, setView] = useState<View>('overview');
  const [page, setPage] = useState(1);
  const [access, setAccess] = useState<'checking' | 'ready' | 'failed' | 'denied' | 'signed-out'>('checking');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<List<{ users: User[] }> | null>(null);
  const [purchases, setPurchases] = useState<List<{ purchases: Purchase[] }> | null>(null);
  const [moods, setMoods] = useState<MoodList | null>(null);
  const [moodUser, setMoodUser] = useState<string | null>(null);
  const [moodPage, setMoodPage] = useState(1);
  const [busyPurchase, setBusyPurchase] = useState<string | null>(null);
  const [recoveryLink, setRecoveryLink] = useState('');

  const request = useCallback(async (url: string, init?: RequestInit) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Your session has ended. Please sign in again.');
    const response = await fetch(url, { ...init, cache: 'no-store', headers: {
      Authorization: `Bearer ${session.access_token}`, ...(init?.headers || {}),
    } });
    if (response.status === 403) { setAccess('denied'); throw new Error('Administrator access required.'); }
    return response;
  }, []);

  const load = useCallback(async (target: View, targetPage: number) => {
    setLoading(true); setError('');
    try {
      const response = await request(`/api/admin/data?view=${target}&page=${targetPage}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Unable to load admin data.');
      setAccess('ready');
      if (target === 'overview') setOverview(body);
      if (target === 'users') setUsers(body);
      if (target === 'purchases') setPurchases(body);
    } catch (reason) {
      setAccess((current) => current === 'checking' ? 'failed' : current);
      setError(reason instanceof Error ? reason.message : 'Unable to load admin data.');
    }
    finally { setLoading(false); }
  }, [request]);

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab === 'users' || tab === 'purchases') setView(tab);
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) setAccess('signed-out');
      else void load(tab === 'users' || tab === 'purchases' ? tab : 'overview', 1);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setOverview(null); setUsers(null); setPurchases(null); setMoods(null);
        setAccess('signed-out');
      }
    });
    return () => subscription.unsubscribe();
  }, [load]);

  const changeView = (next: View) => {
    setView(next); setPage(1); setMoods(null); setMoodUser(null); setNotice('');
    const url = new URL(window.location.href);
    url.searchParams.set('tab', next);
    window.history.replaceState({}, '', url);
    void load(next, 1);
  };
  const changePage = (next: number) => { setPage(next); void load(view, next); };

  const loadMoods = async (userId: string, nextPage: number) => {
    setMoodUser(userId); setMoodPage(nextPage); setMoods(null); setError('');
    try {
      const response = await request(`/api/admin/data?view=checkins&user=${encodeURIComponent(userId)}&page=${nextPage}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Unable to load Mood Lifts.');
      setMoods(body);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to load Mood Lifts.'); }
  };

  const exportCsv = async (scope: 'all' | 'consented') => {
    setError(''); setNotice('');
    try {
      const response = await request(`/api/admin/data?view=csv&scope=${scope}`);
      if (!response.ok) throw new Error('Unable to export registered users.');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url; link.download = `moodflip-${scope === 'all' ? 'registered' : 'consented'}-users.csv`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setNotice(scope === 'all' ? 'Exported registered users with their promotional e-mail consent status.' : 'Exported users with recorded promotional e-mail consent.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to export contacts.'); }
  };

  const purchaseAction = async (purchase: Purchase, action: 'regenerate' | 'resend-report' | 'resend-receipt') => {
    setBusyPurchase(purchase.id); setError(''); setNotice(''); setRecoveryLink('');
    try {
      const response = await request('/api/admin/purchases', { method: 'POST',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ purchaseId: purchase.id, action }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Recovery failed.');
      setNotice(`${purchase.order_number}: ${result.message}`);
      if (result.downloadUrl) setRecoveryLink(new URL(result.downloadUrl, window.location.origin).toString());
      await load('purchases', page);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Recovery failed.'); }
    finally { setBusyPurchase(null); }
  };

  const logout = async () => {
    await fetch('/api/admin/session', { method: 'DELETE' }).catch(() => {});
    await supabase.auth.signOut();
    router.replace('/login');
  };
  if (access === 'checking') return <AdminLoading />;
  if (access === 'failed') return <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#FDF8F5] px-4 text-center text-[#4F438B]">
    <h1 className="font-serif text-2xl">Administration is unavailable</h1>
    <p role="alert">{error || 'Unable to load administrator data.'}</p>
    <button onClick={() => { setAccess('checking'); void load(view, page); }} className="rounded-full bg-[#4F438B] px-6 py-3 text-white">Try again</button>
  </main>;
  if (access === 'signed-out') return <main className="min-h-screen bg-[#FDF8F5] p-8 text-center text-[#4F438B]">
    <h1 className="font-serif text-3xl">MoodFlip administration</h1>
    <p className="my-6">Sign in with your authorised administrator account.</p>
    <a className="rounded-full bg-[#4F438B] px-6 py-3 text-white" href="/login?redirect=/admin">Admin login</a>
  </main>;
  if (access === 'denied') return <main className="min-h-screen bg-[#FDF8F5] p-8 text-center text-[#4F438B]">
    <h1 className="font-serif text-3xl">Administrator access required</h1>
    <p className="my-6">This account is not authorised to view admin data.</p>
    <button onClick={() => void logout()} className="rounded-full bg-[#4F438B] px-6 py-3 text-white">Log out</button>
  </main>;

  const total = view === 'users' ? users?.total || 0 : purchases?.total || 0;
  return <main className="min-h-screen bg-[#FDF8F5] px-4 py-8 text-[#1A143F] sm:px-8">
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E4DAD7] pb-6">
        <div><p className="text-sm text-[#7464AC]">MoodFlip</p><h1 className="font-serif text-3xl text-[#4F438B]">Administration</h1></div>
        <button onClick={() => void logout()} className="rounded-full border border-[#7464AC] px-5 py-2 text-[#4F438B]">Log out</button>
      </header>
      <nav aria-label="Admin sections" className="my-6 flex flex-wrap gap-2">
        {(['overview', 'users', 'purchases'] as const).map((item) => <button key={item} type="button"
          onClick={() => changeView(item)} aria-current={view === item ? 'page' : undefined}
          className={`rounded-full px-5 py-2 capitalize ${view === item ? 'bg-[#4F438B] text-white' : 'border border-[#E4DAD7] bg-white text-[#4F438B]'}`}>{item}</button>)}
      </nav>
      {loading && <p role="status" className="mb-4 text-[#7464AC]">Loading {view}…</p>}
      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-xl bg-green-50 p-4 text-green-800">{notice}</p>}
      {recoveryLink && <div className="mb-4 rounded-xl bg-white p-4 text-sm">
        <p>The customer must sign in to use this profile link. The original download remains limited to one completion.</p>
        <button className="mt-2 text-[#4F438B] underline" onClick={() => void navigator.clipboard.writeText(recoveryLink)}>Copy customer profile link</button>
      </div>}
      {view === 'overview' && overview && <section aria-label="Overview" className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {([['Registered users', overview.totalUsers], ['Purchased a report', overview.purchasedUsers], ['No report purchase', overview.nonPurchasedUsers]] as const)
            .map(([label, count]) => <div key={label} className="rounded-2xl border border-[#E4DAD7] bg-white p-6"><p className="text-sm text-[#5C527A]">{label}</p><p className="mt-2 text-3xl font-bold text-[#4F438B]">{count}</p></div>)}
        </div>
        <div className="rounded-2xl border border-[#E4DAD7] bg-white p-6">
          <h2 className="font-serif text-xl text-[#4F438B]">Revenue by currency</h2>
          <p className="mt-1 text-sm text-[#5C527A]">Confirmed purchases only. Currency totals are kept separate.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{REPORT_CURRENCIES.map((currency) =>
            <div key={currency} className="rounded-xl bg-[#F7F1F7] p-4"><p className="text-xs text-[#5C527A]">{currency}</p>
              <p className="font-semibold">{money(overview.revenue[currency] || 0, currency, currency === 'JPY' ? 0 : 2)}</p></div>)}</div>
        </div>
      </section>}
      {view === 'users' && <section aria-label="Registered users">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="font-serif text-xl text-[#4F438B]">Registered users</h2>
          <div className="flex flex-wrap gap-2"><button onClick={() => void exportCsv('all')} className="rounded-full border border-[#4F438B] px-5 py-2 text-[#4F438B]">Export users CSV</button>
            <button onClick={() => void exportCsv('consented')} className="rounded-full bg-[#4F438B] px-5 py-2 text-white">Export consented users CSV</button></div></div>
        <p className="mb-4 text-sm text-[#5C527A]">The full export includes consent status. Use only recorded, current consent for promotional e-mail; this panel sends no campaigns.</p>
        <div className="overflow-x-auto rounded-2xl border border-[#E4DAD7] bg-white"><table className="w-full text-left text-sm">
          <thead className="bg-[#F7F1F7]"><tr>{['Name', 'E-mail', 'Saved Mood Lifts', 'Purchase status', ''].map((h) => <th key={h} className="p-4">{h}</th>)}</tr></thead>
          <tbody>{users?.users.map((person) => <tr key={person.id} className="border-t border-[#E4DAD7]">
            <td className="p-4">{person.name || '—'}</td><td className="p-4">{person.email}</td><td className="p-4">{person.moodLiftCount}</td>
            <td className="p-4">{person.purchaseStatus}</td><td className="p-4"><button className="text-[#4F438B] underline" onClick={() => void loadMoods(person.id, 1)}>View Mood Lifts</button></td>
          </tr>)}</tbody></table>{users?.users.length === 0 && <p className="p-5 text-sm">No registered users found.</p>}</div>
        {moodUser && <div className="mt-6 rounded-2xl border border-[#E4DAD7] bg-white p-6">
          <div className="flex justify-between gap-3"><h3 className="font-serif text-xl text-[#4F438B]">Mood Lifts for {moods?.user.name || moods?.user.email || 'user'}</h3>
            <button className="text-[#4F438B] underline" onClick={() => { setMoodUser(null); setMoods(null); }}>Close</button></div>
          {!moods && <p className="mt-4">Loading Mood Lifts…</p>}
          {moods?.entries.length === 0 && <p className="mt-4">No saved Mood Lifts.</p>}
          {moods?.entries.map((entry) => <article key={entry.id} className="mt-4 border-t border-[#E4DAD7] pt-4 text-sm">
            <p className="font-semibold text-[#4F438B]">{entry.saved_at} (UTC) · {entry.mood} / {entry.feeling}</p>
            <p>Positive mood: {entry.target_mood || '—'}</p><p>60-second action: {[entry.action_title, entry.action_desc].filter(Boolean).join(' — ') || '—'}</p>
          </article>)}
          {moods && <div className="mt-4 flex items-center gap-3"><button disabled={moodPage <= 1} onClick={() => void loadMoods(moodUser, moodPage - 1)}>Previous</button>
            <span>Page {moodPage} of {Math.max(1, Math.ceil(moods.total / 50))}</span>
            <button disabled={moodPage * 50 >= moods.total} onClick={() => void loadMoods(moodUser, moodPage + 1)}>Next</button></div>}
        </div>}
      </section>}
      {view === 'purchases' && <section aria-label="Purchases">
        <h2 className="mb-4 font-serif text-xl text-[#4F438B]">Confirmed purchases</h2>
        <div className="space-y-4">{purchases?.purchases.map((purchase) => <article key={purchase.id} className="rounded-2xl border border-[#E4DAD7] bg-white p-5 text-sm">
          <div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-semibold text-[#4F438B]">{purchase.customerName || purchase.email}</h3><p>{purchase.email}</p></div>
            <strong className="text-[#4F438B]">{money(purchase.amount_minor, purchase.currency, purchase.currency_decimals)}</strong></div>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div><dt className="text-[#7464AC]">Product</dt><dd>{purchase.product_name}</dd></div>
            <div><dt className="text-[#7464AC]">Purchased</dt><dd>{date(purchase.paid_at)}</dd></div>
            <div><dt className="text-[#7464AC]">Payment</dt><dd>{purchase.payment_status}</dd></div>
            <div><dt className="text-[#7464AC]">Order reference</dt><dd className="break-all">{purchase.order_number}</dd></div>
            <div><dt className="text-[#7464AC]">Airwallex payment ID</dt><dd className="break-all">{purchase.airwallex_payment_intent_id || '—'}</dd></div>
            <div><dt className="text-[#7464AC]">PDF / download state</dt><dd>{purchase.report?.delivery_status || 'Record unavailable'}</dd></div>
            <div><dt className="text-[#7464AC]">E-mail delivery</dt><dd>{purchase.report?.email_status || 'Record unavailable'}</dd></div>
            <div><dt className="text-[#7464AC]">Original download</dt><dd>{purchase.report?.download_completed_at ? 'Completed' : 'Not completed'}</dd></div>
          </dl>
          {(purchase.report?.delivery_error || purchase.report?.email_last_error) && <p className="mt-3 text-red-700">{purchase.report.delivery_error || purchase.report.email_last_error}</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            {purchase.canRecoverDownload && <button disabled={busyPurchase === purchase.id} onClick={() => void purchaseAction(purchase, 'regenerate')} className="rounded-full bg-[#4F438B] px-4 py-2 text-white disabled:opacity-50">{busyPurchase === purchase.id ? 'Checking PDF…' : 'Regenerate PDF for customer'}</button>}
            {purchase.report && !purchase.report.download_completed_at && ['pending', 'generated'].includes(purchase.report.delivery_status) && <button
              onClick={() => { setRecoveryLink(new URL('/profile?tab=My%207-Day%20Report', window.location.origin).toString()); setNotice(`${purchase.order_number}: The customer can download the original report after signing in.`); }}
              className="rounded-full border border-[#4F438B] px-4 py-2 text-[#4F438B]">Get secure profile link</button>}
            {purchase.canResendReport && <button disabled={busyPurchase === purchase.id} onClick={() => void purchaseAction(purchase, 'resend-report')} className="rounded-full border border-[#4F438B] px-4 py-2 text-[#4F438B] disabled:opacity-50">Resend failed report e-mail</button>}
            {purchase.payment_provider === 'airwallex' && purchase.paid_at && <button disabled={busyPurchase === purchase.id} onClick={() => void purchaseAction(purchase, 'resend-receipt')} className="rounded-full border border-[#4F438B] px-4 py-2 text-[#4F438B] disabled:opacity-50">Resend purchase details</button>}
          </div>
        </article>)}</div>{purchases?.purchases.length === 0 && <p>No confirmed purchases found.</p>}
      </section>}
      {view !== 'overview' && total > 0 && <div className="mt-6 flex items-center gap-4 text-sm">
        <button disabled={page <= 1 || loading} onClick={() => changePage(page - 1)} className="disabled:opacity-40">Previous</button>
        <span>Page {page} of {Math.ceil(total / 50)}</span>
        <button disabled={page * 50 >= total || loading} onClick={() => changePage(page + 1)} className="disabled:opacity-40">Next</button>
      </div>}
    </div>
  </main>;
}
