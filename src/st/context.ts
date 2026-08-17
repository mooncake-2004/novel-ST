export interface STContext {
  characterId?: string;
  characters?: any[];
  chatId?: string;
  chat?: any[];
  extension_settings?: Record<string, any>;
  saveSettingsDebounced?: () => void;
  eventSource?: any;
  event_types?: Record<string, string>;
  generateQuietPrompt?: (prompt: string, quiet?: boolean, skipWFormat?: boolean) => Promise<string>;
  sendSystemMessage?: (type: string, text: string) => void;
  online_status?: string;
  main_api?: string;
  [key: string]: any;
}

export function getContext(): STContext | null {
  if (typeof window !== 'undefined' && window.SillyTavern?.getContext) {
    return window.SillyTavern.getContext();
  }
  return null;
}
