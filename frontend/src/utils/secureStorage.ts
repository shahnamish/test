import { getStorage, type StorageAdapter } from './storage';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const toBase64 = (buffer: Uint8Array): string => {
  let binary = '';
  buffer.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const fromBase64 = (value: string): Uint8Array => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const fallbackEncode = (value: string): string => {
  if (typeof btoa !== 'undefined') {
    return btoa(value);
  }
  return value;
};

const fallbackDecode = (value: string): string => {
  if (typeof atob !== 'undefined') {
    return atob(value);
  }
  return value;
};

const deriveKey = async (secret: string, namespace: string): Promise<CryptoKey | null> => {
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj?.subtle) {
    return null;
  }

  const salt = textEncoder.encode(namespace);
  const keyMaterial = await cryptoObj.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return cryptoObj.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 250_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt'],
  );
};

export class SecureStorage {
  private readonly storage: StorageAdapter;
  private readonly namespace: string;
  private cryptoKey: Promise<CryptoKey | null> | null = null;

  constructor(namespace: string, storage: StorageAdapter = getStorage('session')) {
    this.namespace = namespace;
    this.storage = storage;
  }

  private getNamespacedKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  private async getKey(): Promise<CryptoKey | null> {
    if (!this.cryptoKey) {
      const secret = `${this.namespace}-secret`;
      this.cryptoKey = deriveKey(secret, this.namespace).catch(() => null);
    }
    return this.cryptoKey;
  }

  async setItem<T>(key: string, value: T | null): Promise<void> {
    if (value === null) {
      this.storage.removeItem(this.getNamespacedKey(key));
      return;
    }

    const payload = JSON.stringify(value);
    const cryptoKey = await this.getKey();
    let record: string;

    if (cryptoKey) {
      const iv = globalThis.crypto?.getRandomValues?.(new Uint8Array(12));
      if (!iv) {
        record = fallbackEncode(payload);
      } else {
        const encrypted = await globalThis.crypto!.subtle.encrypt(
          {
            name: 'AES-GCM',
            iv,
          },
          cryptoKey,
          textEncoder.encode(payload),
        );
        const data = new Uint8Array(iv.byteLength + encrypted.byteLength);
        data.set(iv, 0);
        data.set(new Uint8Array(encrypted), iv.byteLength);
        record = toBase64(data);
      }
    } else {
      record = fallbackEncode(payload);
    }

    this.storage.setItem(this.getNamespacedKey(key), record);
  }

  async getItem<T>(key: string): Promise<T | null> {
    const raw = this.storage.getItem(this.getNamespacedKey(key));
    if (!raw) {
      return null;
    }

    try {
      const cryptoKey = await this.getKey();
      let decoded: string;

      if (cryptoKey) {
        const buffer = fromBase64(raw);
        const iv = buffer.slice(0, 12);
        const ciphertext = buffer.slice(12);
        const decrypted = await globalThis.crypto!.subtle.decrypt(
          {
            name: 'AES-GCM',
            iv,
          },
          cryptoKey,
          ciphertext,
        );
        decoded = textDecoder.decode(decrypted);
      } else {
        decoded = fallbackDecode(raw);
      }

      return JSON.parse(decoded) as T;
    } catch (error) {
      console.warn('SecureStorage: failed to decrypt payload, clearing entry', error);
      this.storage.removeItem(this.getNamespacedKey(key));
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    this.storage.removeItem(this.getNamespacedKey(key));
  }
}
