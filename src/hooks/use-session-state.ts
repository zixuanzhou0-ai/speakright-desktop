"use client";

import { useEffect, useRef, useState } from "react";

export const SESSION_STORAGE_WARNING =
  "本页临时状态无法保存或恢复。当前练习仍可继续，但切换页面后文本、评分或 AI 反馈可能不会自动恢复；如果频繁出现，请到设置的数据与隐私中心导出诊断后重置本机学习数据。";

interface SessionStorageOptions {
  onPersistenceError?: (message: string) => void;
}

function notifySessionStorageError(options?: SessionStorageOptions): void {
  options?.onPersistenceError?.(SESSION_STORAGE_WARNING);
}

/**
 * Drop-in replacement for useState that persists to sessionStorage.
 *
 * - On mount: reads from sessionStorage (if exists), otherwise uses initialValue
 * - On every state change: writes to sessionStorage
 * - sessionStorage auto-clears when browser tab closes
 *
 * @param key sessionStorage key (use page-scoped prefix like "sentences:speed")
 * @param initialValue default value when nothing is saved
 */
export function useSessionState<T>(
  key: string,
  initialValue: T,
  options: SessionStorageOptions = {},
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(initialValue);
  const { onPersistenceError } = options;

  const initialValueRef = useRef(initialValue);
  const loadedKeyRef = useRef<string | null>(null);
  const skipInitialPersistRef = useRef(false);

  useEffect(() => {
    initialValueRef.current = initialValue;
  }, [initialValue]);

  useEffect(() => {
    const fallback = initialValueRef.current;
    let hasSavedValue = false;
    try {
      const saved = sessionStorage.getItem(key);
      if (saved) {
        hasSavedValue = true;
        setState(JSON.parse(saved) as T);
      } else {
        setState(fallback);
      }
    } catch {
      notifySessionStorageError({ onPersistenceError });
      setState(fallback);
    }

    loadedKeyRef.current = key;
    skipInitialPersistRef.current = hasSavedValue;
  }, [key, onPersistenceError]);

  useEffect(() => {
    if (loadedKeyRef.current !== key) return;
    if (skipInitialPersistRef.current) {
      skipInitialPersistRef.current = false;
      return;
    }

    try {
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch {
      notifySessionStorageError({ onPersistenceError });
    }
  }, [key, state, onPersistenceError]);

  return [state, setState];
}

/**
 * Save a value to sessionStorage (for hook state that can't use useSessionState directly)
 */
export function saveSession<T>(
  key: string,
  value: T,
  options?: SessionStorageOptions,
): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    notifySessionStorageError(options);
  }
}

/**
 * Read a value from sessionStorage
 */
export function loadSession<T>(
  key: string,
  options?: SessionStorageOptions,
): T | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = sessionStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : null;
  } catch {
    notifySessionStorageError(options);
    return null;
  }
}

/**
 * Clear all session state for a given prefix
 */
export function clearSessionPrefix(
  prefix: string,
  options?: SessionStorageOptions,
): void {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k?.startsWith(prefix)) keysToRemove.push(k);
    }
    for (const k of keysToRemove) {
      sessionStorage.removeItem(k);
    }
  } catch {
    notifySessionStorageError(options);
  }
}
