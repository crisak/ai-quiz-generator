import { useCallback, useState } from 'react';
import { encryptApiKey, decryptApiKey } from '../utils/crypto';
import { DEFAULT_MODEL_CONFIG, type ModelConfig, type GeminiModelId } from '../constants/geminiModels';

const STORAGE_KEY = 'quiz-ia-config';

interface StoredConfig {
  encryptedApiKey: string;
  salt: string;
  modelConfig?: Partial<ModelConfig>;
  // legacy field — ignored on load, overridden by modelConfig
  selectedModel?: string;
}

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

let cachedApiKey: string | null = null;

export function useConfig() {
  const stored = loadFromStorage();

  const [isConfigured, setIsConfigured] = useState(() => {
    return !!(stored.encryptedApiKey && stored.salt);
  });
  const [apiKey, setApiKeyState] = useState<string | null>(cachedApiKey);
  const [modelConfig, setModelConfigState] = useState<ModelConfig>(stored.modelConfig);

  const saveApiKey = useCallback(async (key: string, config: ModelConfig) => {
    const { encrypted, salt } = await encryptApiKey(key);
    saveToStorage(encrypted, salt, config);
    cachedApiKey = key;
    setApiKeyState(key);
    setModelConfigState(config);
    setIsConfigured(true);
  }, []);

  const getApiKey = useCallback(async (): Promise<string | null> => {
    if (cachedApiKey) return cachedApiKey;

    const s = loadFromStorage();
    if (s.encryptedApiKey && s.salt) {
      try {
        const decrypted = await decryptApiKey(s.encryptedApiKey, s.salt);
        cachedApiKey = decrypted;
        setApiKeyState(decrypted);
        return decrypted;
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  const getModelConfig = useCallback((): ModelConfig => {
    return loadFromStorage().modelConfig;
  }, []);

  const saveModelConfig = useCallback((config: ModelConfig) => {
    const s = loadFromStorage();
    if (s.encryptedApiKey && s.salt) {
      saveToStorage(s.encryptedApiKey, s.salt, config);
    }
    setModelConfigState(config);
  }, []);

  const removeConfig = useCallback(() => {
    clearFromStorage();
    cachedApiKey = null;
    setApiKeyState(null);
    setIsConfigured(false);
    setModelConfigState(DEFAULT_MODEL_CONFIG);
  }, []);

  return {
    isConfigured,
    apiKey,
    modelConfig,
    loadApiKey: getApiKey,
    getModelConfig,
    saveApiKey,
    saveModelConfig,
    removeConfig,
  };
}

// Re-export for convenience
export type { GeminiModelId };
