type ToastType = 'info' | 'success' | 'warning' | 'error';

interface Toastr {
  info: (msg: string, title?: string) => void;
  success: (msg: string, title?: string) => void;
  warning: (msg: string, title?: string) => void;
  error: (msg: string, title?: string) => void;
}

function showToast(message: string, type: ToastType = 'info', title = 'Novel-ST'): void {
  try {
    const t = (window as unknown as { toastr?: Toastr }).toastr;
    if (t && typeof t[type] === 'function') {
      t[type](message, title);
      return;
    }
  } catch {
    /* toastr not available */
  }
  console.log(`[${title}] ${type.toUpperCase()}:`, message);
}

export function toast(message: string, type: ToastType = 'info', title = 'Novel-ST'): void {
  showToast(message, type, title);
}

toast.info = (message: string, title = 'Novel-ST') => showToast(message, 'info', title);
toast.success = (message: string, title = 'Novel-ST') => showToast(message, 'success', title);
toast.warning = (message: string, title = 'Novel-ST') => showToast(message, 'warning', title);
toast.error = (message: string, title = 'Novel-ST') => showToast(message, 'error', title);
