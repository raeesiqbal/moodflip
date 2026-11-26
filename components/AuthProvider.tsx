'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadVerifiedUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!active) return;
      setUser(error ? null : data.user);
      setLoading(false);
    };

    void loadVerifiedUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    let lastAttempt = 0;
    let active = true;
    const touch = async () => {
      if (!active || document.hidden || Date.now() - lastAttempt < 60 * 60_000) return;
      lastAttempt = Date.now();
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!active || !session) return;
        const response = await fetch('/api/user/heartbeat', {
          method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store',
        });
        if (!response.ok) lastAttempt = 0;
      } catch { lastAttempt = 0; }
    };
    void touch();
    const onVisible = () => { if (!document.hidden) void touch(); };
    document.addEventListener('visibilitychange', onVisible);
    const interval = setInterval(() => { if (!document.hidden) void touch(); }, 60 * 60_000);
    return () => { active = false; clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); };
  }, [user?.id]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    signOut: async () => {
      await supabase.auth.signOut();
      localStorage.removeItem('mf_user');
      document.cookie = 'mf_auth_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      setUser(null);
    },
  }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}
