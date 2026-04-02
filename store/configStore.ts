import { create } from 'zustand';
import { encryptApiKey, decryptApiKey } from '../utils/crypto';
import { DEFAULT_MODEL_CONFIG, type ModelConfig } from '../constants/geminiModels';

interface StoredConfig {
  encryptedApiKey: string;
  salt: string;
  modelConfig?: Partial<ModelConfig>;
  selectedModel?: string; // legacy, ignored
}

interface ConfigStore {
  encryptedApiKey: string | null;
  salt: string | null;
  apiKey: string | null;
  modelConfig: ModelConfig;
  setApiKey: (apiKey: string, config: ModelConfig) => Promise<void>;
  getApiKey: () => Promise<string | null>;
  setModelConfig: (config: ModelConfig) => void;
  clearConfig: () => void;
}

const STORAGE_KEY = 'quiz-ia-config';

function loadFromStorage(): { encryptedApiKey: string | null; salt: string | null; modelConfig: ModelConfig } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: StoredConfig = JSON.parse(stored);
      return {
        encryptedApiKey: parsed?.encryptedApiKey || null,
        salt: parsed?.salt || null,
        modelConfig: { ...DEFAULT_MODEL_CONFIG, ...parsed?.modelConfig },
      };
    }
  } catch {}
  return { encryptedApiKey: null, salt: null, modelConfig: DEFAULT_MODEL_CONFIG };
}

function saveToStorage(encryptedApiKey: string, salt: string, modelConfig: ModelConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ encryptedApiKey, salt, modelConfig }));
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
    modelConfig: stored.modelConfig,

    setApiKey: async (apiKey: string, config: ModelConfig) => {
      const { encrypted, salt } = await encryptApiKey(apiKey);
      saveToStorage(encrypted, salt, config);
      set({ encryptedApiKey: encrypted, salt, apiKey, modelConfig: config });
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

    setModelConfig: (config: ModelConfig) => {
      const state = get();
      if (state.encryptedApiKey && state.salt) {
        saveToStorage(state.encryptedApiKey, state.salt, config);
      }
      set({ modelConfig: config });
    },

    clearConfig: () => {
      clearFromStorage();
      set({ encryptedApiKey: null, salt: null, apiKey: null, modelConfig: DEFAULT_MODEL_CONFIG });
    },
  };
});
