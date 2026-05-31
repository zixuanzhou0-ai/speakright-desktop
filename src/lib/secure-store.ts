import { invoke } from "@tauri-apps/api/core";
import { isTauriEnvironment } from "@/lib/tauri-runtime";

function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function parseSecureJson<T>(key: string, raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`Secure store value for ${key} is not valid JSON`);
  }
}

export async function secureStoreGet<T>(key: string): Promise<T | null> {
  if (!isTauriEnvironment()) {
    return parseJson<T>(localStorage.getItem(key));
  }
  const raw = await invoke<string | null>("secure_store_get", { key });
  return parseSecureJson<T>(key, raw);
}

export async function secureStoreSet<T>(key: string, value: T): Promise<void> {
  if (!isTauriEnvironment()) {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new StorageEvent("storage", { key }));
    return;
  }
  await invoke("secure_store_set", { key, value: JSON.stringify(value) });
}

export async function secureStoreDelete(key: string): Promise<void> {
  if (!isTauriEnvironment()) {
    localStorage.removeItem(key);
    window.dispatchEvent(new StorageEvent("storage", { key }));
    return;
  }
  await invoke("secure_store_delete", { key });
}
