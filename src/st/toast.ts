export const toast = {
  success(message: string, title = 'Novel-ST') {
    if (typeof window !== 'undefined' && window.toastr?.success) {
      window.toastr.success(message, title);
    } else {
      console.log(`[${title}] Success:`, message);
    }
  },

  info(message: string, title = 'Novel-ST') {
    if (typeof window !== 'undefined' && window.toastr?.info) {
      window.toastr.info(message, title);
    } else {
      console.log(`[${title}] Info:`, message);
    }
  },

  warning(message: string, title = 'Novel-ST') {
    if (typeof window !== 'undefined' && window.toastr?.warning) {
      window.toastr.warning(message, title);
    } else {
      console.warn(`[${title}] Warning:`, message);
    }
  },

  error(message: string, title = 'Novel-ST') {
    if (typeof window !== 'undefined' && window.toastr?.error) {
      window.toastr.error(message, title);
    } else {
      console.error(`[${title}] Error:`, message);
    }
  },
};
