export async function storeGet<T>(key: string): Promise<T | null> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function storeSet<T>(key: string, value: T): Promise<void> {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new StorageEvent("storage", { key }));
}

export async function storeDelete(key: string): Promise<void> {
  localStorage.removeItem(key);
  window.dispatchEvent(new StorageEvent("storage", { key }));
}

export async function migrateFromLocalStorage(keys: string[]): Promise<void> {
  void keys;
}
