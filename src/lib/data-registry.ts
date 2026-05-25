"use client";

import { API_KEY_STORAGE_KEYS, clearItem } from "@/lib/api-keys";
import { clearBenchmarkRecordings } from "@/lib/benchmark-archive";
import { clearTtsCache } from "@/lib/tts-cache";

const ASSESSMENT_STORAGE_KEYS = [
  "speakright_assessment_result_v2",
  "speakright_assessment_result",
] as const;

const LEARNING_STORAGE_KEYS = [
  ...ASSESSMENT_STORAGE_KEYS,
  "speakright_mastery_profile_v2",
  "speakright_mastery_profile_v1",
  "speakright_training_sessions_v2",
  "speakright_practice_history",
  "speakright_score_history",
  "speakright_usage",
  "speakright_benchmark_recordings_v1",
  "speakright_coverage_benchmarks_v1",
] as const;

const CACHE_STORAGE_KEYS = [
  "speakright_ipa_cache",
  "speakright_stress_cache",
] as const;

const CACHE_STORAGE_PREFIXES = ["speakright_mw_words_"] as const;

export interface LocalDataExport {
  schemaVersion: 1;
  exportedAt: string;
  product: "SpeakRight Desktop";
  localStorage: Record<string, unknown>;
  excluded: string[];
}

export interface LocalDataSummary {
  learningKeys: number;
  cacheKeys: number;
  apiKeySlots: number;
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function collectKeys(keys: readonly string[]): Record<string, unknown> {
  if (typeof window === "undefined") return {};
  const entries: Record<string, unknown> = {};
  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      entries[key] = safeParse(raw);
    }
  }
  return entries;
}

function prefixedLocalStorageKeys(prefixes: readonly string[]): string[] {
  if (typeof window === "undefined") return [];
  const keys: string[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key && prefixes.some((prefix) => key.startsWith(prefix))) {
      keys.push(key);
    }
  }
  return keys;
}

function removeLocalStorageKeys(keys: readonly string[]): void {
  if (typeof window === "undefined") return;
  for (const key of keys) {
    localStorage.removeItem(key);
    window.dispatchEvent(new StorageEvent("storage", { key }));
  }
}

export function buildLocalDataExport(): LocalDataExport {
  const cacheKeys = prefixedLocalStorageKeys(CACHE_STORAGE_PREFIXES);
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    product: "SpeakRight Desktop",
    localStorage: {
      ...collectKeys(LEARNING_STORAGE_KEYS),
      ...collectKeys(CACHE_STORAGE_KEYS),
      ...collectKeys(cacheKeys),
    },
    excluded: [
      "API keys",
      "Benchmark audio blobs",
      "ElevenLabs TTS audio cache",
      "Theme preference",
    ],
  };
}

export function getLocalDataSummary(): LocalDataSummary {
  const cacheKeys = [
    ...CACHE_STORAGE_KEYS,
    ...prefixedLocalStorageKeys(CACHE_STORAGE_PREFIXES),
  ];
  return {
    learningKeys: Object.keys(collectKeys(LEARNING_STORAGE_KEYS)).length,
    cacheKeys: Object.keys(collectKeys(cacheKeys)).length,
    apiKeySlots: API_KEY_STORAGE_KEYS.length,
  };
}

export function downloadLocalDataExport(): void {
  if (typeof document === "undefined") return;
  const snapshot = buildLocalDataExport();
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `speakright-data-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function deleteLearningData(): Promise<void> {
  const cacheKeys = prefixedLocalStorageKeys(CACHE_STORAGE_PREFIXES);
  await clearBenchmarkRecordings();
  await clearTtsCache();
  removeLocalStorageKeys([
    ...LEARNING_STORAGE_KEYS,
    ...CACHE_STORAGE_KEYS,
    ...cacheKeys,
  ]);
}

export async function deleteBenchmarkAudioData(): Promise<void> {
  await clearBenchmarkRecordings();
  removeLocalStorageKeys(["speakright_benchmark_recordings_v1"]);
}

export function deleteApiKeys(): void {
  for (const key of API_KEY_STORAGE_KEYS) {
    clearItem(key);
  }
}
