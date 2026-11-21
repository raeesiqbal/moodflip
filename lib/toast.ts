export type ToastKind = 'success' | 'error' | 'warning' | 'info';
export type ToastOptions = { title?: string; duration?: number };
export type ToastMessage = ToastOptions & { id: number; kind: ToastKind; message: string };

const eventName = 'moodflip:toast';
let nextId = 0;

function show(kind: ToastKind, message: string, options: ToastOptions = {}) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<ToastMessage>(eventName, {
      detail: { id: ++nextId, kind, message, title: options.title, duration: options.duration ?? 5000 },
    }));
  }
}

export const notify = {
  success: (message: string, options?: ToastOptions) => show('success', message, options),
  error: (message: string, options?: ToastOptions) => show('error', message, options),
  warning: (message: string, options?: ToastOptions) => show('warning', message, options),
  info: (message: string, options?: ToastOptions) => show('info', message, options),
};

export const toastEventName = eventName;
