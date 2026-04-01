import { create } from 'zustand';
import { encryptApiKey, decryptApiKey } from '../utils/crypto';

interface ConfigStore {
  encryptedApiKey: string | null;
  salt: string | null;
  apiKey: string | null;
  setApiKey: (apiKey: string) => Promise<void>;
  getApiKey: () => Promise<string | null>;
  clearConfig: () => void;
}

const STORAGE_KEY = 'quiz-ia-config';

function loadFromStorage(): { encryptedApiKey: string | null; salt: string | null } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        encryptedApiKey: parsed?.encryptedApiKey || null,
        salt: parsed?.salt || null,
      };
    }
  } catch {}
  return { encryptedApiKey: null, salt: null };
}

function saveToStorage(encryptedApiKey: string, salt: string): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ encryptedApiKey, salt }));
}

function clearFromStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export const useConfigStore = create<ConfigStore>((set, get) => {
  const stored = loadFromStorage();
  return {
    encryptedApiKey: stored.encryptedApiKey,
    salt: stored.salt,
    apiKey: null,

    setApiKey: async (apiKey: string) => {
      const { encrypted, salt } = await encryptApiKey(apiKey);
      saveToStorage(encrypted, salt);
      set({
        encryptedApiKey: encrypted,
        salt: salt,
        apiKey: apiKey,
      });
    },

    getApiKey: async () => {
      const state = get();
      if (state.apiKey) {
        return state.apiKey;
      }
      if (state.encryptedApiKey && state.salt) {
        try {
          const decrypted = await decryptApiKey(state.encryptedApiKey, state.salt);
          set({ apiKey: decrypted });
          return decrypted;
        } catch {
          return null;
        }
      }
      return null;
    },

    clearConfig: () => {
      clearFromStorage();
      set({
        encryptedApiKey: null,
        salt: null,
        apiKey: null,
      });
    },
  };
});
