import '@testing-library/jest-dom';

const ensureCrypto = () => {
  if (!globalThis.crypto) {
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        getRandomValues: (array: Uint8Array) => {
          const arr = array;
          for (let i = 0; i < arr.length; i += 1) {
            arr[i] = Math.floor(Math.random() * 256);
          }
          return arr;
        },
      },
      configurable: true,
    });
  } else if (!globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues = <T extends ArrayBufferView>(array: T): T => {
      const view = array;
      const bytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
      for (let i = 0; i < bytes.length; i += 1) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
      return array;
    };
  }
};

const createMemoryStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
  };
};

const ensureStorage = () => {
  const memoryStorage = createMemoryStorage();
  if (!('localStorage' in window)) {
    Object.defineProperty(window, 'localStorage', {
      value: memoryStorage,
      configurable: true,
    });
  }
  if (!('sessionStorage' in window)) {
    Object.defineProperty(window, 'sessionStorage', {
      value: createMemoryStorage(),
      configurable: true,
    });
  }
};

ensureCrypto();
ensureStorage();
