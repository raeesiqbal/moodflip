'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    setMenuOpen(false);
    router.replace('/login');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#E4DAD7] bg-[#FDF8F5]/95 backdrop-blur-md" suppressHydrationWarning>
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 h-12 sm:h-14 flex items-center justify-between gap-4">
        
        {/* LOGO (with TM per Spec §23) */}
        <Link href="/" className="flex items-center gap-2.5 text-decoration-none shrink-0 group">
          <img
            src="/moodflip-logo.png"
            alt="MoodFlip"
            className="h-8 sm:h-9 md:h-10 w-auto object-contain mix-blend-multiply transition-transform duration-200 group-hover:scale-102"
          />
        </Link>


        {/* ACTION BUTTONS: Nav + Login — all on the right */}
        <div className="flex items-center gap-4 md:gap-6 lg:gap-8 shrink-0">

          {/* DESKTOP NAV: Home | About | Privacy Policy | Contact */}
          <nav className="hidden sm:flex items-center gap-4 md:gap-6 lg:gap-8 text-sm">
            {[
              { href: '/', label: 'Home' },
              { href: '/about', label: 'About' },
              { href: '/privacy', label: 'Privacy Policy' },
              { href: '/contact', label: 'Contact' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={
                  pathname === href
                    ? 'font-bold border-b-2 border-[#7464AC] text-[#1A143F]'
                    : 'font-semibold text-[#5C527A] hover:text-[#7464AC] transition-colors'
                }
              >
                {label}
              </Link>
            ))}
          </nav>

          {loading ? (
            <span className="inline-block h-9 w-24 rounded-full border border-[#E4DAD7] bg-[#F4EBF5]/60 animate-pulse" aria-label="Checking sign-in status" />
          ) : user ? (
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full border border-[#7464AC] bg-[#F4EBF5] text-[#4F438B] text-xs md:text-sm font-bold shadow-2xs hover:bg-[#EAE0F5] transition-all whitespace-nowrap"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full border border-[#D6CEE8] bg-[#FEFAF8] text-[#533B93] text-xs md:text-sm font-bold shadow-2xs hover:border-[#7464AC] hover:bg-[#F4EBF5] transition-all whitespace-nowrap"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Login
            </Link>
          )}

          {/* MOBILE TOGGLE */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden flex items-center justify-center w-10 h-10 rounded-xl border border-[#E4DAD7] bg-[#FEFAF8] text-[#7464AC] hover:bg-[#F4EBF5] hover:border-[#7666AB] transition shadow-xs cursor-pointer"
            aria-label="Toggle Navigation Menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* MOBILE DROPDOWN: Home | About | Privacy Policy | Contact | Login */}
      {menuOpen && (
        <nav className="md:hidden flex flex-col p-4 bg-[#FDF8F5]/98 backdrop-blur-xl border-t border-[#E4DAD7] shadow-xl animate-in slide-in-from-top-2 duration-200 gap-1.5" suppressHydrationWarning>
          <div className="flex flex-col gap-1">
            {[
              { href: '/', label: 'Home', icon: '🏠' },
              { href: '/about', label: 'About', icon: 'ℹ️' },
              { href: '/privacy', label: 'Privacy Policy', icon: '🔒' },
              { href: '/contact', label: 'Contact', icon: '✉️' },
            ].map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 p-3 rounded-xl text-sm hover:bg-[#F4EBF5] hover:text-[#7464AC] transition ${
                  pathname === href
                    ? 'font-bold text-[#1A143F]'
                    : 'font-semibold text-[#5C527A]'
                }`}
              >
                <span className="w-6 text-center text-lg">{icon}</span> {label}
              </Link>
            ))}
            {user ? (
              <>
                <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl text-[#4F438B] font-bold text-sm hover:bg-[#F4EBF5] transition">
                  <span className="w-6 text-center text-lg">👤</span> My Profile
                </Link>
                <button type="button" onClick={() => void handleLogout()} className="flex w-full items-center gap-3 p-3 rounded-xl text-[#4F438B] font-bold text-sm hover:bg-[#F4EBF5] transition">
                  <span className="w-6 text-center text-lg">↪</span> Logout
                </button>
              </>
            ) : (
              <Link href="/login" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl text-[#1A143F] font-bold text-sm hover:bg-[#F4EBF5] hover:text-[#7464AC] transition">
                <span className="w-6 text-center text-lg">🔑</span> Login
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
