import { create } from 'zustand';
import { encryptApiKey, decryptApiKey } from '../utils/crypto';
import { DEFAULT_MODEL, type GeminiModelId } from '../constants/geminiModels';

interface StoredConfig {
  encryptedApiKey: string;
  salt: string;
  selectedModel?: string;
}

interface ConfigStore {
  encryptedApiKey: string | null;
  salt: string | null;
  apiKey: string | null;
  selectedModel: GeminiModelId;
  setApiKey: (apiKey: string, model: GeminiModelId) => Promise<void>;
  getApiKey: () => Promise<string | null>;
  setModel: (model: GeminiModelId) => void;
  clearConfig: () => void;
}

const STORAGE_KEY = 'quiz-ia-config';

function loadFromStorage(): { encryptedApiKey: string | null; salt: string | null; selectedModel: GeminiModelId } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: StoredConfig = JSON.parse(stored);
      return {
        encryptedApiKey: parsed?.encryptedApiKey || null,
        salt: parsed?.salt || null,
        selectedModel: (parsed?.selectedModel as GeminiModelId) || DEFAULT_MODEL,
      };
    }
  } catch {}
  return { encryptedApiKey: null, salt: null, selectedModel: DEFAULT_MODEL };
}

function saveToStorage(encryptedApiKey: string, salt: string, selectedModel: string): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ encryptedApiKey, salt, selectedModel }));
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
    selectedModel: stored.selectedModel,

    setApiKey: async (apiKey: string, model: GeminiModelId) => {
      const { encrypted, salt } = await encryptApiKey(apiKey);
      saveToStorage(encrypted, salt, model);
      set({ encryptedApiKey: encrypted, salt, apiKey, selectedModel: model });
    },

    getApiKey: async () => {
      const state = get();
      if (state.apiKey) return state.apiKey;
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

    setModel: (model: GeminiModelId) => {
      const state = get();
      if (state.encryptedApiKey && state.salt) {
        saveToStorage(state.encryptedApiKey, state.salt, model);
      }
      set({ selectedModel: model });
    },

    clearConfig: () => {
      clearFromStorage();
      set({ encryptedApiKey: null, salt: null, apiKey: null, selectedModel: DEFAULT_MODEL });
    },
  };
});
