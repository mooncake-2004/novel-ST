declare const __NOVEL_ST_VERSION__: string;

declare interface Window {
  SillyTavern?: {
    getContext: () => any;
  };
  toastr?: {
    info: (msg: string, title?: string, opts?: any) => void;
    success: (msg: string, title?: string, opts?: any) => void;
    warning: (msg: string, title?: string, opts?: any) => void;
    error: (msg: string, title?: string, opts?: any) => void;
  };
  $?: any;
  jQuery?: any;
}
