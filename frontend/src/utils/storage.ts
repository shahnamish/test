export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

const createMemoryStorage = (): StorageAdapter => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
};

const memoryStores: Record<'local' | 'session', StorageAdapter> = {
  local: createMemoryStorage(),
  session: createMemoryStorage(),
};

export const getStorage = (type: 'local' | 'session' = 'local'): StorageAdapter => {
  if (typeof window !== 'undefined') {
    if (type === 'local') {
      return window.localStorage;
    }
    return window.sessionStorage;
  }
  return memoryStores[type];
};
