import { useCallback, useEffect, useState } from 'react';
import { encryptApiKey, decryptApiKey } from '../utils/crypto';

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

let cachedApiKey: string | null = null;

export function useConfig() {
  const [isConfigured, setIsConfigured] = useState(() => {
    const stored = loadFromStorage();
    return !!(stored.encryptedApiKey && stored.salt);
  });
  const [apiKey, setApiKeyState] = useState<string | null>(cachedApiKey);

  const saveApiKey = useCallback(async (key: string) => {
    const { encrypted, salt } = await encryptApiKey(key);
    saveToStorage(encrypted, salt);
    cachedApiKey = key;
    setApiKeyState(key);
    setIsConfigured(true);
  }, []);

  const getApiKey = useCallback(async (): Promise<string | null> => {
    if (cachedApiKey) return cachedApiKey;
    
    const stored = loadFromStorage();
    if (stored.encryptedApiKey && stored.salt) {
      try {
        const decrypted = await decryptApiKey(stored.encryptedApiKey, stored.salt);
        cachedApiKey = decrypted;
        setApiKeyState(decrypted);
        return decrypted;
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  const removeConfig = useCallback(() => {
    clearFromStorage();
    cachedApiKey = null;
    setApiKeyState(null);
    setIsConfigured(false);
  }, []);

  return {
    isConfigured,
    apiKey,
    loadApiKey: getApiKey,
    saveApiKey,
    removeConfig,
  };
}
