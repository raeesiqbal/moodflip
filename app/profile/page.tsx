'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { notify } from '@/lib/toast';
import { useAuth } from '@/components/AuthProvider';
import AuthPasswordFields from '@/components/AuthPasswordFields';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SavedMoodFlip {
  id: string;
  date: string;
  timestamp?: number;
  savedAt?: string;
  mood: string;
  feeling: string;
  targetMood: string;
  action: string;
  actionDesc?: string;
}

interface ReportProgress {
  dailyCount: number;
  qualifyingDays: number;
  totalCount: number;
  eligible: boolean;
  timezone: string;
}

type Tab = 'My Mood Lifts' | 'My 7-Day Report' | 'Downloads' | 'Account Settings';

const TABS: Tab[] = ['My Mood Lifts', 'My 7-Day Report', 'Downloads', 'Account Settings'];

// ─── Profile Page Entry ───────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const { user: verifiedUser, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    let active = true;

    const checkUser = async () => {
      // 1. Try Supabase
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user && active) {
          const user = data.user;
          setIsLoggedIn(true);
          const name = String(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Member');
          setUserEmail(user.email || '');
          setUserName(name.charAt(0).toUpperCase() + name.slice(1));
          setMounted(true);
          return;
        }
      } catch (e) {
        // continue to cookie/localStorage fallback
      }

      // 2. Check Cookie / localStorage fallback
      if (typeof window !== 'undefined') {
        let userObj: any = null;
        const cookieMatch = document.cookie.match(/(^|;)\s*mf_auth_user=([^;]+)/);
        if (cookieMatch) {
          try { userObj = JSON.parse(decodeURIComponent(cookieMatch[2])); } catch (e) {}
        }
        if (!userObj) {
          const local = localStorage.getItem('mf_user');
          if (local) {
            try { userObj = JSON.parse(local); } catch (e) {}
          }
        }
        if (userObj && active) {
          setIsLoggedIn(true);
          setUserEmail(userObj.email || '');
          const rawName = userObj.user_metadata?.full_name || userObj.full_name || userObj.email?.split('@')[0] || 'Member';
          setUserName(String(rawName).charAt(0).toUpperCase() + String(rawName).slice(1));
          setMounted(true);
          return;
        }
      }

      if (active) {
        setIsLoggedIn(false);
        setMounted(true);
      }
    };

    checkUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && session?.user) {
        setIsLoggedIn(true);
        setUserEmail(session.user.email || '');
        const name = String(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Member');
        setUserName(name.charAt(0).toUpperCase() + name.slice(1));
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authLoading && !verifiedUser) {
      router.replace('/login?redirect=/profile');
    }
  }, [authLoading, router, verifiedUser]);

  // Never render protected profile content from cached browser data. Only a
  // user verified by Supabase may pass this gate.
  if (authLoading || !verifiedUser) {
    return (
      <div className="min-h-screen bg-[#FDF8F5] font-sans antialiased flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div role="status" className="text-center text-[#7464AC] font-medium animate-pulse">
            {authLoading ? 'Checking your session…' : 'Redirecting to sign in…'}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Hydration guard
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#FDF8F5] font-sans antialiased flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="text-center text-[#7464AC] font-medium animate-pulse">
            Loading profile...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Auth gate (Spec requirement: Profile MUST require authentication) ─────────
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#FDF8F5] font-sans antialiased flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="max-w-md w-full text-center rounded-3xl border border-[#E4DAD7] bg-[#FEFAF8] p-10 shadow-sm">
            <div className="text-5xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-[#4F438B] mb-3">Sign In Required</h1>
            <p className="text-gray-600 mb-8 text-sm leading-relaxed">
              You need to be logged in to view your profile. Please sign in to access your Saved
              Mood Lifts, reports, and account settings.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/login?redirect=/profile"
                className="inline-block rounded-full bg-gradient-to-r from-[#7464AC] to-[#4F438B] text-white font-semibold px-8 py-3 text-sm hover:opacity-90 transition text-center shadow-xs"
              >
                Log In
              </Link>
              <Link
                href="/register?redirect=/profile"
                className="inline-block rounded-full border border-[#D6CEE8] bg-white text-[#4F438B] font-semibold px-8 py-3 text-sm hover:bg-[#F4EBF5] transition text-center shadow-2xs"
              >
                Sign up free
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <ProfileContent
      initialEmail={verifiedUser.email || userEmail}
      initialName={String(verifiedUser.user_metadata?.full_name || verifiedUser.email?.split('@')[0] || userName || 'Member')}
      onLogout={() => {
        setIsLoggedIn(false);
      }}
    />
  );
}

// ─── Main Profile Content ─────────────────────────────────────────────────────

function ProfileContent({
  initialEmail,
  initialName,
  onLogout,
}: {
  initialEmail: string;
  initialName: string;
  onLogout: () => void;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('My Mood Lifts');
  const [userEmail, setUserEmail] = useState(initialEmail);
  const [flipsCount, setFlipsCount] = useState(0);

  useEffect(() => {
    const syncTabFromUrl = () => {
      const requestedTab = new URLSearchParams(window.location.search).get('tab');
      if (requestedTab && TABS.includes(requestedTab as Tab)) {
        setActiveTab(requestedTab as Tab);
      } else {
        setActiveTab('My Mood Lifts');
      }
    };

    syncTabFromUrl();
    window.addEventListener('popstate', syncTabFromUrl);
    return () => window.removeEventListener('popstate', syncTabFromUrl);
  }, []);

  // Sync count of saved flips
  const handleFlipsCountChange = React.useCallback((count: number) => {
    setFlipsCount(count);
  }, []);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    router.replace(`/profile?tab=${encodeURIComponent(tab)}`, { scroll: false });
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      document.cookie = 'mf_auth_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      localStorage.removeItem('mf_user');
    }
    void supabase.auth.signOut().finally(() => {
      onLogout();
      router.push('/login');
    });
  };

  return (
    <div className="min-h-screen bg-[#FDF8F5] font-sans antialiased flex flex-col selection:bg-[#EEE0FC] selection:text-[#4F438B]">
      <Header />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 sm:py-10">
        {/* ── Page Heading ── */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E4DAD7] pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#7464AC] to-[#4F438B] flex items-center justify-center text-white text-xl font-bold shadow-xs">
                {initialName ? initialName.charAt(0).toUpperCase() : 'M'}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#4F438B]">My Profile</h1>
                <p className="text-gray-500 text-xs sm:text-sm mt-0.5">{userEmail || 'Member'}</p>
              </div>
            </div>
          </div>

          {/* Flip My Mood CTA (Spec: link to /) */}
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#7464AC] to-[#4F438B] text-white font-semibold px-6 py-2.5 sm:py-3 text-sm hover:opacity-90 transition shadow-sm self-start sm:self-auto"
          >
            <span>🔄</span> Flip My Mood
          </Link>
        </div>

        {/* ── Tab Navigation ── */}
        <div className="flex flex-wrap gap-2 mb-8">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition border cursor-pointer ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-[#7464AC] to-[#4F438B] text-white border-transparent shadow-xs'
                  : 'bg-white text-[#4F438B] border-[#E4DAD7] hover:bg-[#F3EEF8]'
              }`}
            >
              {tab}
              {tab === 'My Mood Lifts' && flipsCount > 0 && (
                <span className="ml-1.5 px-2 py-0.5 rounded-full text-[11px] bg-white/20 text-white">
                  {flipsCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab Panels ── */}
        <div>
          {activeTab === 'My Mood Lifts' && (
            <MyMoodFlipsTab onCountChange={handleFlipsCountChange} />
          )}
          {activeTab === 'My 7-Day Report' && <My7DayReportTab />}
          {activeTab === 'Downloads' && <DownloadsTab />}
          {activeTab === 'Account Settings' && (
            <AccountSettingsTab
              currentEmail={userEmail}
              onEmailUpdated={(newEmail) => setUserEmail(newEmail)}
            />
          )}
        </div>

        {/* ── Logout Section ── */}
        <div className="mt-14 border-t border-[#E4DAD7] pt-8 flex items-center justify-between">
          <p className="text-xs text-gray-400">MoodFlip™ Personal Mindset Dashboard</p>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full border border-red-300 text-red-500 px-6 py-2 text-xs sm:text-sm font-semibold hover:bg-red-50 transition cursor-pointer"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ─── Tab: My Mood Lifts (Spec §10) ───────────────────────────────────────────

function MyMoodFlipsTab({ onCountChange }: { onCountChange: (count: number) => void }) {
  const [flips, setFlips] = useState<SavedMoodFlip[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadWarning, setLoadWarning] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadMoodLifts = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Your session has expired. Please sign in again.');

        const response = await fetch('/api/user/activity', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const result = await response.json();
        if (!response.ok || !result.success || !Array.isArray(result.checkins)) {
          throw new Error(result.error || 'Unable to load saved Mood Lifts.');
        }

        if (!active) return;
        const databaseFlips = result.checkins as SavedMoodFlip[];
        setFlips(databaseFlips);
        onCountChange(databaseFlips.length);
        localStorage.setItem('moodflip_checkin_history', JSON.stringify(databaseFlips));
      } catch (error) {
        if (!active) return;
        console.error('Error loading Mood Lifts from database:', error);
        try {
          const cached = JSON.parse(localStorage.getItem('moodflip_checkin_history') || '[]');
          const cachedFlips = Array.isArray(cached) ? cached : [];
          setFlips(cachedFlips);
          onCountChange(cachedFlips.length);
          setLoadWarning('Database connection unavailable. Showing the last saved device cache.');
        } catch {
          setFlips([]);
          onCountChange(0);
          setLoadWarning('Saved Mood Lifts could not be loaded. Please refresh and try again.');
        }
      } finally {
        if (active) setLoaded(true);
      }
    };

    void loadMoodLifts();
    return () => { active = false; };
  }, [onCountChange]);

  const handleDeleteFlip = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Your session has expired. Please sign in again.');

      const response = await fetch(`/api/user/activity?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to delete Mood Lift.');
      }

      const updated = flips.filter((flip) => flip.id !== id);
      setFlips(updated);
      onCountChange(updated.length);
      localStorage.setItem('moodflip_checkin_history', JSON.stringify(updated));
      notify.success('The Mood Lift was removed from your profile.');
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Unable to delete Mood Lift.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string, timestamp?: number) => {
    try {
      const d = timestamp ? new Date(timestamp) : new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr || 'Recent';
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr || 'Recent';
    }
  };

  if (!loaded) {
    return (
      <div className="py-12 text-center text-[#7464AC] font-medium animate-pulse">
        Loading saved Mood Lifts...
      </div>
    );
  }

  return (
    <section>
      {loadWarning && (
        <div role="status" className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          {loadWarning}
        </div>
      )}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-[#4F438B]">Saved Mood Lifts</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Your recorded mood transformation exercises and exercises saved to your profile
          </p>
        </div>
        <span className="text-xs sm:text-sm text-gray-500 bg-[#FEFAF8] border border-[#E4DAD7] px-3.5 py-1.5 rounded-full font-medium">
          Total Mood Lifts:{' '}
          <span className="font-bold text-[#4F438B] ml-1">{flips.length}</span>
        </span>
      </div>

      {flips.length === 0 ? (
        <div className="rounded-3xl border border-[#E4DAD7] bg-[#FEFAF8] p-10 sm:p-14 text-center shadow-xs">
          <div className="text-5xl mb-4">🌀</div>
          <h3 className="text-lg font-bold text-[#4F438B] mb-2">No Mood Lifts yet</h3>
          <p className="text-gray-500 mb-6 text-sm max-w-md mx-auto">
            Your saved Mood Lifts will appear here after you complete and save your first session on the home screen.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#7464AC] to-[#4F438B] text-white font-semibold px-8 py-3 text-sm hover:opacity-90 transition shadow-xs"
          >
            <span>🔄</span> Flip My Mood
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {flips.map((flip) => (
            <div
              key={flip.id}
              className="rounded-3xl border border-[#E4DAD7] bg-[#FEFAF8] p-5 sm:p-6 shadow-xs transition hover:border-[#7464AC]"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F3EEF8] text-[#7464AC] border border-[#E4DAD7]">
                      Mood Lift
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(flip.date, flip.timestamp)}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-[#4F438B] flex items-center gap-2 flex-wrap">
                    <span>{flip.mood || 'Starting Mood'}</span>
                    <span className="text-[#7464AC]">→</span>
                    <span className="text-[#3A7E56]">{flip.targetMood || 'Target Mood'}</span>
                  </h3>

                  {flip.feeling && (
                    <p className="text-xs text-gray-500 mt-1">
                      <span className="font-semibold text-gray-600">Feeling:</span> {flip.feeling}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteFlip(flip.id)}
                  disabled={deletingId === flip.id}
                  className="self-start text-xs text-gray-400 hover:text-red-500 transition px-2 py-1 rounded-lg hover:bg-red-50 cursor-pointer disabled:cursor-wait disabled:opacity-50"
                  title="Remove from saved"
                  aria-label="Remove Mood Flip"
                >
                  {deletingId === flip.id ? 'Removing…' : '✕ Remove'}
                </button>
              </div>

              {/* 60-Second Action Details */}
              {(flip.action || flip.actionDesc) && (
                <div className="mt-3 rounded-2xl bg-white border border-[#E4DAD7] p-4 text-sm">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#7464AC] mb-1">
                    <span>⏱️</span> 60-Second Action
                  </div>
                  {flip.action && (
                    <h4 className="font-bold text-[#1A143F] text-sm mb-1">{flip.action}</h4>
                  )}
                  {flip.actionDesc && (
                    <p className="text-xs text-gray-600 leading-relaxed">{flip.actionDesc}</p>
                  )}

                  {/* SAVE MY PROFILE button (Spec §10 requirement: right under 60-second action) */}
                  <div className="mt-3 pt-3 border-t border-[#F0EAE8] flex items-center justify-between">
                    <span className="text-[11px] text-green-700 font-semibold flex items-center gap-1.5">
                      <span>✓</span> Saved in Profile
                    </span>
                    <span className="text-[11px] text-gray-400">Synced with database</span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Recent Mood Lifts label (Spec §10 exact terminology) */}
          <div className="pt-2 text-right">
            <p className="text-xs text-gray-400">
              Showing {flips.length} Recent Mood Lift{flips.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Tab: My 7-Day Report (Spec §10) ──────────────────────────────────────────

function My7DayReportTab() {
  const [progress, setProgress] = useState<ReportProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    const loadProgress = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Your session has expired. Please sign in again.');

        const response = await fetch('/api/user/activity', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const result = await response.json();
        if (!response.ok || !result.success || !result.reportProgress) {
          throw new Error(result.error || 'Unable to load your report progress.');
        }

        if (active) setProgress(result.reportProgress as ReportProgress);
      } catch (error) {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load your report progress.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadProgress();
    return () => { active = false; };
  }, []);

  const qualifyingDays = Math.min(progress?.qualifyingDays || 0, 7);
  const remainingDays = Math.max(7 - qualifyingDays, 0);

  return (
    <section>
      <h2 className="text-xl font-bold text-[#4F438B] mb-2">My 7-Day Report</h2>
      <p className="text-xs text-gray-500 mb-6">
        Detailed review of your emotional patterns, triggers, and practical action history
      </p>

      {loading ? (
        <p role="status" className="mb-7 text-xs font-semibold text-[#7464AC] animate-pulse">
          Loading report progress…
        </p>
      ) : errorMessage ? (
        <p role="alert" className="mb-7 text-xs font-semibold text-red-600">{errorMessage}</p>
      ) : (
        /* Seven qualifying calendar days — visual progress only, not interactive */
        <div className="mb-7" aria-label={`Seven-day report progress: ${qualifyingDays} of 7 qualifying days`}>
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="font-serif text-xl font-bold text-[#4F438B]">Saved calendar days</p>
            <p className="shrink-0 font-serif text-xl font-bold text-[#4F438B]">
              {qualifyingDays} of 7
            </p>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2" aria-hidden="true">
            {Array.from({ length: 7 }, (_, index) => {
              const dayNumber = index + 1;
              const completed = dayNumber <= qualifyingDays;

              return (
                <div
                  key={dayNumber}
                  className={`flex min-h-16 flex-col items-center justify-center rounded-xl border px-1 py-2 transition-colors sm:min-h-20 ${
                    completed
                      ? 'border-[#7464AC] bg-[#F1EBFA] text-[#4F438B]'
                      : 'border-[#DED5D1] bg-transparent text-[#91879F]'
                  }`}
                >
                  <span
                    className={`mb-1 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold sm:h-6 sm:w-6 ${
                      completed
                        ? 'bg-[#7464AC] text-white'
                        : 'bg-[#B9B4BC] text-transparent'
                    }`}
                  >
                    {completed ? '✓' : '•'}
                  </span>
                  <span className="text-[10px] font-bold sm:text-xs">D{dayNumber}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-3">
            <p className={`text-sm font-bold ${progress?.eligible ? 'text-green-700' : 'text-[#4F438B]'}`}>
              {progress?.eligible ? 'Report eligible' : 'Report not yet eligible'}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {progress?.eligible
                ? 'You have completed seven qualifying calendar days.'
                : `${remainingDays} more qualifying ${remainingDays === 1 ? 'day' : 'days'} needed. Days do not need to be consecutive.`}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-[#E4DAD7] bg-[#FEFAF8] p-6 sm:p-10 text-center shadow-xs">
        <div className="text-5xl mb-4">📊</div>
        <h3 className="text-lg font-bold text-[#4F438B] mb-2">
          Your Personalised PDF Progress Report
        </h3>
        <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto leading-relaxed">
          Get a comprehensive PDF report of your 7-day mood journey, including your Mood Lifts,
          patterns, and personalised actionable suggestions.
        </p>

        {/* Pricing Card */}
        <div className="inline-block rounded-2xl border border-[#E4DAD7] bg-white p-6 text-left w-full max-w-sm mx-auto mb-6 shadow-2xs">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">
            One-time purchase
          </p>
          <p className="text-3xl font-bold text-[#4F438B] mb-1">
            US$7 <span className="text-base font-normal text-gray-400">/ report</span>
          </p>
          <ul className="text-xs sm:text-sm text-gray-600 space-y-2 mt-4">
            <li className="flex items-center gap-2">
              <span className="text-green-600 font-bold">✓</span> Full 7-day mood analysis
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600 font-bold">✓</span> Personalised Mood Flip insights
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600 font-bold">✓</span> Downloadable PDF format
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600 font-bold">✓</span> Actionable suggestions
            </li>
          </ul>
        </div>

        {progress?.eligible ? (
          <div>
            <p className="text-sm font-bold text-[#4F438B] mb-4 max-w-lg mx-auto leading-relaxed">
              Your 7-Day MoodFlip Report is ready. Download your personalised report with your saved moods,
              positive moods, 60-second actions, and mood pattern summary.
            </p>
            <Link
              href="/checkout"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#7464AC] to-[#4F438B] text-white font-semibold px-8 py-3 text-sm hover:opacity-90 transition shadow-xs"
            >
              <span>📄</span> Get My 7-Day MoodFlip Report — US$7
            </Link>
          </div>
        ) : (
          <p className="text-sm font-semibold text-[#7464AC]">
            Save at least one Mood Lift on seven different calendar days to unlock the purchase option.
          </p>
        )}
        <p className="mt-4 text-xs text-gray-400">
          Progress is based on saved UTC calendar days. Up to three Mood Lifts may be saved per day.
        </p>
      </div>
    </section>
  );
}

// ─── Tab: Downloads (Spec §10) ────────────────────────────────────────────────

function DownloadsTab() {
  return (
    <section>
      <h2 className="text-xl font-bold text-[#4F438B] mb-2">Downloads</h2>
      <p className="text-xs text-gray-500 mb-6">
        Access your purchased PDF progress reports, worksheets, and resources
      </p>

      <div className="rounded-3xl border border-[#E4DAD7] bg-[#FEFAF8] p-8 sm:p-10 text-center shadow-xs">
        <div className="text-5xl mb-4">📥</div>
        <h3 className="text-lg font-bold text-[#4F438B] mb-2">Your Purchased Reports & Downloads</h3>
        <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto leading-relaxed">
          Your personalised PDF reports and resources are permanently stored here. You can download
          or re-generate them at any time.
        </p>
        <p className="text-sm font-semibold text-[#7464AC]">
          Purchased reports will appear here when they are available for download.
        </p>
      </div>
    </section>
  );
}

// ─── Tab: Account Settings (Spec §10) ──────────────────────────────────────────

function AccountSettingsTab({
  currentEmail,
  onEmailUpdated,
}: {
  currentEmail: string;
  onEmailUpdated: (email: string) => void;
}) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#4F438B]">Account Settings</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Manage your e-mail address, security password, and profile preferences
        </p>
      </div>

      <ChangeEmailForm currentEmail={currentEmail} onEmailUpdated={onEmailUpdated} />
      <ChangePasswordForm />
      <DeleteProfileSection />
    </section>
  );
}

// ── Change E-mail Form ──────────────────────────────────────────────────────────

function ChangeEmailForm({
  currentEmail,
  onEmailUpdated,
}: {
  currentEmail: string;
  onEmailUpdated: (email: string) => void;
}) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const newEmail = email.trim().toLowerCase();
    if (!newEmail || !newEmail.includes('@')) {
      notify.error('Please enter a valid e-mail address.');
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Your session has expired. Please sign in again.');
      const res = await fetch('/api/profile/update-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ email: newEmail }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'Failed to update e-mail.');
      }

      onEmailUpdated(newEmail);
      notify.success('Your e-mail address was updated successfully.', { title: 'E-mail updated' });
      setEmail('');
    } catch (err: unknown) {
      notify.error(err instanceof Error ? err.message : 'Something went wrong.', { title: 'E-mail not updated' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-[#E4DAD7] bg-[#FEFAF8] p-6 shadow-xs">
      <h3 className="text-base font-bold text-[#4F438B] mb-1">Change E-mail</h3>
      <p className="text-xs text-gray-500 mb-4">
        Current e-mail: <span className="font-semibold text-gray-700">{currentEmail || 'Not set'}</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
        <div>
          <label htmlFor="new-email" className="block text-xs font-semibold text-gray-700 mb-1">
            New E-mail Address
          </label>
          <input
            id="new-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-[#E4DAD7] bg-white px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#7464AC] transition"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-gradient-to-r from-[#7464AC] to-[#4F438B] text-white font-semibold px-6 py-2.5 text-xs sm:text-sm hover:opacity-90 transition disabled:opacity-60 cursor-pointer shadow-xs"
        >
          {loading ? 'Saving…' : 'Update E-mail'}
        </button>
      </form>
    </div>
  );
}

// ── Change Password Form ───────────────────────────────────────────────────────

function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      notify.error('Please enter your current password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      notify.error('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      notify.error('New password must be at least 8 characters.');
      return;
    }
    if (currentPassword === newPassword) {
      notify.error('Your new password must be different from your current password.');
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Your session has expired. Please sign in again.');
      const res = await fetch('/api/profile/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || 'Failed to update password.');
      }

      notify.success('Your password was updated successfully.', { title: 'Password updated' });
      if (!data.notificationSent) {
        notify.warning('Your password was updated, but the security notification e-mail could not be delivered.', {
          title: 'Security e-mail not sent',
          duration: 7000,
        });
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      notify.error(err instanceof Error ? err.message : 'Something went wrong.', { title: 'Password not updated' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-[#E4DAD7] bg-[#FEFAF8] p-6 shadow-xs">
      <h3 className="text-base font-bold text-[#4F438B] mb-1">Change Password</h3>
      <p className="text-xs text-gray-500 mb-4">
        Choose a strong password with at least 8 characters.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4 w-full max-w-lg">
        <AuthPasswordFields
          currentPassword={currentPassword}
          password={newPassword}
          confirmPassword={confirmPassword}
          onCurrentPasswordChange={setCurrentPassword}
          onPasswordChange={setNewPassword}
          onConfirmPasswordChange={setConfirmPassword}
          disabled={loading}
          passwordLabel="New password"
          confirmPasswordLabel="Confirm new password"
          passwordPlaceholder="Create a new password"
          confirmPasswordPlaceholder="Confirm your new password"
          idPrefix="profile"
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-gradient-to-r from-[#7464AC] to-[#4F438B] text-white font-semibold px-6 py-2.5 text-xs sm:text-sm hover:opacity-90 transition disabled:opacity-60 cursor-pointer shadow-xs"
        >
          {loading ? 'Saving…' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}

// ── Delete Profile Section (Spec §10 requirement) ─────────────────────────────

function DeleteProfileSection() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Your session has expired. Please sign in again.');
      const res = await fetch('/api/profile/delete-account', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'Failed to delete account. Please try again.');
      }

      await supabase.auth.signOut();
      router.push('/');
    } catch (err: unknown) {
      notify.error(err instanceof Error ? err.message : 'Something went wrong.', { title: 'Account not deleted' });
      setLoading(false);
    }
  };

  return (
    <>
      <div className="rounded-3xl border border-red-200 bg-red-50/60 p-6 shadow-xs">
        <h3 className="text-base font-bold text-red-600 mb-1">Delete Profile</h3>
        <p className="text-xs text-red-500 mb-5 leading-relaxed">
          Permanently delete your account and all associated Mood Lifts. This action cannot be undone.
        </p>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="rounded-full border border-red-400 text-red-600 font-semibold px-6 py-2.5 text-xs sm:text-sm hover:bg-red-100 transition cursor-pointer"
        >
          Delete My Profile
        </button>
      </div>

      {/* Confirmation Modal with exact Spec warning text */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-[#E4DAD7] bg-white p-7 sm:p-8 shadow-xl">
            <div className="text-4xl mb-3 text-center">⚠️</div>
            <h2 className="text-xl font-bold text-red-600 text-center mb-2">Delete Profile?</h2>
            <p className="text-xs sm:text-sm text-gray-700 text-center mb-6 leading-relaxed">
              Are you sure you want to permanently delete your profile? This will delete all your
              saved Mood Lifts and cannot be undone.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                }}
                disabled={loading}
                className="flex-1 rounded-full border border-[#E4DAD7] text-gray-700 font-semibold px-6 py-2.5 text-xs sm:text-sm hover:bg-gray-50 transition disabled:opacity-60 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 rounded-full bg-red-500 text-white font-semibold px-6 py-2.5 text-xs sm:text-sm hover:bg-red-600 transition disabled:opacity-60 cursor-pointer shadow-xs"
              >
                {loading ? 'Deleting…' : 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
