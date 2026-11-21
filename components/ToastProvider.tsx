'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toastEventName, type ToastKind, type ToastMessage } from '@/lib/toast';

const styles: Record<ToastKind, { title: string; card: string; icon: string; titleColor: string; progress: string }> = {
  success: {
    title: 'Success',
    card: 'border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-white shadow-[0_16px_40px_rgba(5,150,105,0.18)]',
    icon: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
    titleColor: 'text-emerald-950',
    progress: 'bg-emerald-500',
  },
  error: {
    title: 'Something went wrong',
    card: 'border-rose-200 bg-gradient-to-r from-rose-50 via-white to-white shadow-[0_16px_40px_rgba(225,29,72,0.18)]',
    icon: 'bg-rose-100 text-rose-700 ring-rose-200',
    titleColor: 'text-rose-950',
    progress: 'bg-rose-500',
  },
  warning: {
    title: 'Please note',
    card: 'border-amber-200 bg-gradient-to-r from-amber-50 via-white to-white shadow-[0_16px_40px_rgba(217,119,6,0.18)]',
    icon: 'bg-amber-100 text-amber-700 ring-amber-200',
    titleColor: 'text-amber-950',
    progress: 'bg-amber-500',
  },
  info: {
    title: 'Information',
    card: 'border-indigo-200 bg-gradient-to-r from-indigo-50 via-white to-white shadow-[0_16px_40px_rgba(79,70,229,0.18)]',
    icon: 'bg-indigo-100 text-indigo-700 ring-indigo-200',
    titleColor: 'text-indigo-950',
    progress: 'bg-indigo-500',
  },
};

function ToastIcon({ kind }: { kind: ToastKind }) {
  if (kind === 'success') return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" /></svg>;
  if (kind === 'error') return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" /></svg>;
  if (kind === 'warning') return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.25"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 4.7 2.8 18a1.5 1.5 0 0 0 1.3 2.2h15.8a1.5 1.5 0 0 0 1.3-2.2L13.7 4.7a2 2 0 0 0-3.4 0Z" /></svg>;
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.25"><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M12 11v5m0-8h.01" /></svg>;
}

export default function ToastProvider() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const timers = useRef<Map<number, number>>(new Map());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
    setMessages((items) => items.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    const activeTimers = timers.current;
    const onToast = (event: Event) => {
      const message = (event as CustomEvent<ToastMessage>).detail;
      setMessages((items) => [...items, message].slice(-4));
      activeTimers.set(message.id, window.setTimeout(() => dismiss(message.id), message.duration ?? 5000));
    };
    window.addEventListener(toastEventName, onToast);
    return () => {
      window.removeEventListener(toastEventName, onToast);
      activeTimers.forEach((timer) => window.clearTimeout(timer));
      activeTimers.clear();
    };
  }, [dismiss]);

  return (
    <div aria-label="Notifications" aria-live="polite" className="pointer-events-none fixed inset-x-4 top-4 z-[9999] flex flex-col items-end gap-3 sm:left-auto sm:right-5 sm:w-[25rem]">
      {messages.map((item) => {
        const appearance = styles[item.kind];
        return (
          <div key={item.id} role={item.kind === 'error' ? 'alert' : 'status'} className={`toast-enter pointer-events-auto relative w-full overflow-hidden rounded-2xl border p-4 pr-11 backdrop-blur-xl ${appearance.card}`}>
            <div className="flex items-start gap-3.5">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${appearance.icon}`}><ToastIcon kind={item.kind} /></span>
              <div className="min-w-0 pt-0.5">
                <p className={`text-sm font-extrabold leading-5 ${appearance.titleColor}`}>{item.title ?? appearance.title}</p>
                <p className="mt-0.5 text-[13px] font-semibold leading-5 text-slate-600">{item.message}</p>
              </div>
            </div>
            <button type="button" aria-label="Dismiss notification" className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-black/5 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400" onClick={() => dismiss(item.id)}>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.25"><path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
            <span aria-hidden="true" className={`toast-progress absolute inset-x-0 bottom-0 h-1 origin-left ${appearance.progress}`} style={{ animationDuration: `${item.duration ?? 5000}ms` }} />
          </div>
        );
      })}
    </div>
  );
}
