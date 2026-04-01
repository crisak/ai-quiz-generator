
const SESSION_KEY_NAME = 'quiz-ia-session-key';
const STORAGE_KEY_NAME = 'quiz-ia-encrypted-key';
const SALT_KEY_NAME = 'quiz-ia-key-salt';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function deriveKey(salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode('quiz-ia-encryption-context'),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptApiKey(apiKey: string): Promise<{ encrypted: string; salt: string }> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(salt);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(apiKey)
  );

  const combined = new Uint8Array(iv.byteLength + encrypted.byteLength);
  combined.set(new Uint8Array(iv), 0);
  combined.set(new Uint8Array(encrypted), iv.byteLength);

  return {
    encrypted: arrayBufferToBase64(combined.buffer),
    salt: arrayBufferToBase64(salt.buffer),
  };
}

export async function decryptApiKey(encrypted: string, salt: string): Promise<string> {
  const combined = new Uint8Array(base64ToArrayBuffer(encrypted));
  const saltArray = new Uint8Array(base64ToArrayBuffer(salt));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

  const key = await deriveKey(saltArray);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

export function isSetupComplete(): boolean {
  try {
    const encrypted = localStorage.getItem(STORAGE_KEY_NAME);
    const salt = localStorage.getItem(SALT_KEY_NAME);
    return !!(encrypted && salt);
  } catch {
    return false;
  }
}

export function getStoredEncryptedKey(): { encrypted: string; salt: string } | null {
  try {
    const encrypted = localStorage.getItem(STORAGE_KEY_NAME);
    const salt = localStorage.getItem(SALT_KEY_NAME);
    if (encrypted && salt) {
      return { encrypted, salt };
    }
    return null;
  } catch {
    return null;
  }
}

export function clearStoredKey(): void {
  localStorage.removeItem(STORAGE_KEY_NAME);
  localStorage.removeItem(SALT_KEY_NAME);
  sessionStorage.removeItem(SESSION_KEY_NAME);
}
