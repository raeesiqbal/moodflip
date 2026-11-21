'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { notify } from '@/lib/toast';
import AuthPasswordFields from '@/components/AuthPasswordFields';

type PageStatus = 'checking' | 'ready' | 'invalid' | 'submitting' | 'success';

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<PageStatus>('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    document.title = 'Choose a new password | MoodFlip';
    let active = true;

    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    if (urlParams.has('error') || hashParams.has('error')) {
      setErrorMessage(urlParams.get('error_description') || hashParams.get('error_description') || 'This reset link is invalid or has expired.');
      setStatus('invalid');
      return;
    }

    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error || !data.session) {
        setStatus('invalid');
        return;
      }
      setStatus('ready');
    };

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY' && session) setStatus('ready');
    });

    void checkSession();
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      notify.error('Your new password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      notify.error('The passwords do not match.');
      return;
    }

    setStatus('submitting');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      notify.error(error.message || 'We could not update your password. Please request a new reset link.', { title: 'Password not updated' });
      setStatus('ready');
      return;
    }

    window.sessionStorage.removeItem('mf_password_reset_email');
    await supabase.auth.signOut();
    notify.success('Your password has been changed successfully.', { title: 'Password updated' });
    setStatus('success');
  };

  const invalid = status === 'invalid';
  const success = status === 'success';

  return (
    <div className="min-h-screen bg-[#FDF8F5] flex flex-col justify-between text-[#1A143F]">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-[440px] rounded-[28px] border border-[#E4DAD7] bg-[#FEF9F5] p-7 sm:p-9 shadow-[0_12px_40px_rgba(79,67,139,0.08)]">
          <Image src="/moodflip-logo.png" alt="MoodFlip" width={160} height={38} priority className="h-8 w-auto mx-auto mb-5 object-contain mix-blend-multiply" />

          {status === 'checking' && <p role="status" className="text-center font-semibold text-[#5C527A]">Opening your secure reset link…</p>}

          {invalid && (
            <div className="text-center">
              <h1 className="font-serif text-2xl font-extrabold mb-3">Reset link unavailable</h1>
              <p className="text-sm text-[#5C527A]">{errorMessage || 'This password reset link is invalid or has expired.'}</p>
              <Link href="/forgot-password" className="mt-6 h-11 rounded-full bg-[#5B4B91] text-white text-sm font-extrabold flex items-center justify-center">Request a New Link</Link>
            </div>
          )}

          {success && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl" aria-hidden="true">✓</div>
              <h1 className="font-serif text-2xl font-extrabold mb-3">Password updated</h1>
              <p className="text-sm text-[#5C527A]">Your password has been changed successfully. You can now sign in with your new password.</p>
              <Link href="/login" className="mt-6 h-11 rounded-full bg-[#5B4B91] text-white text-sm font-extrabold flex items-center justify-center">Sign In</Link>
            </div>
          )}

          {(status === 'ready' || status === 'submitting') && (
            <>
              <div className="text-center mb-6">
                <h1 className="font-serif text-2xl font-extrabold">Choose a new password</h1>
                <p className="mt-2 text-xs font-medium text-[#5C527A]">Use at least 8 characters for your new password.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <AuthPasswordFields
                  password={password}
                  confirmPassword={confirmPassword}
                  onPasswordChange={setPassword}
                  onConfirmPasswordChange={setConfirmPassword}
                  disabled={status === 'submitting'}
                  passwordLabel="New password"
                  confirmPasswordLabel="Confirm new password"
                  passwordPlaceholder="Create a new password"
                  confirmPasswordPlaceholder="Confirm your new password"
                  idPrefix="reset"
                />
                <button type="submit" disabled={status === 'submitting'} className="w-full h-11 rounded-full bg-[#5B4B91] text-white text-sm font-extrabold hover:opacity-95 disabled:opacity-70">
                  {status === 'submitting' ? 'Updating Password…' : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
