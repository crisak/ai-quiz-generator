import { useCallback, useState } from 'react';
import { encryptApiKey, decryptApiKey } from '../utils/crypto';
import { DEFAULT_MODEL, type GeminiModelId } from '../constants/geminiModels';

const STORAGE_KEY = 'quiz-ia-config';

interface StoredConfig {
  encryptedApiKey: string;
  salt: string;
  selectedModel?: string;
}

function loadFromStorage(): { encryptedApiKey: string | null; salt: string | null; selectedModel: string | null } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: StoredConfig = JSON.parse(stored);
      return {
        encryptedApiKey: parsed?.encryptedApiKey || null,
        salt: parsed?.salt || null,
        selectedModel: parsed?.selectedModel || null,
      };
    }
  } catch {}
  return { encryptedApiKey: null, salt: null, selectedModel: null };
}

function saveToStorage(encryptedApiKey: string, salt: string, selectedModel: string): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ encryptedApiKey, salt, selectedModel }));
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
  const [selectedModel, setSelectedModelState] = useState<GeminiModelId>(
    (stored.selectedModel as GeminiModelId) || DEFAULT_MODEL
  );

  const saveApiKey = useCallback(async (key: string, model: GeminiModelId) => {
    const { encrypted, salt } = await encryptApiKey(key);
    saveToStorage(encrypted, salt, model);
    cachedApiKey = key;
    setApiKeyState(key);
    setSelectedModelState(model);
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

  const getSelectedModel = useCallback((): GeminiModelId => {
    const s = loadFromStorage();
    return (s.selectedModel as GeminiModelId) || DEFAULT_MODEL;
  }, []);

  const saveModel = useCallback((model: GeminiModelId) => {
    const s = loadFromStorage();
    if (s.encryptedApiKey && s.salt) {
      saveToStorage(s.encryptedApiKey, s.salt, model);
    }
    setSelectedModelState(model);
  }, []);

  const removeConfig = useCallback(() => {
    clearFromStorage();
    cachedApiKey = null;
    setApiKeyState(null);
    setIsConfigured(false);
    setSelectedModelState(DEFAULT_MODEL);
  }, []);

  return {
    isConfigured,
    apiKey,
    selectedModel,
    loadApiKey: getApiKey,
    getSelectedModel,
    saveApiKey,
    saveModel,
    removeConfig,
  };
}
