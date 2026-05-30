import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  clearBenchmarkRecordings: vi.fn(async () => {}),
  clearTtsCache: vi.fn(async () => {}),
  secureStoreDelete: vi.fn(async (key: string) => {
    localStorage.removeItem(key);
  }),
  storeDelete: vi.fn(async () => {}),
  storeGet: vi.fn(async () => null),
  storeSet: vi.fn(async () => {}),
}));

vi.mock("@/lib/benchmark-archive", () => ({
  clearBenchmarkRecordings: mocks.clearBenchmarkRecordings,
}));

vi.mock("@/lib/tts-cache", () => ({
  clearTtsCache: mocks.clearTtsCache,
}));

vi.mock("@/lib/tauri-runtime", () => ({
  isTauriEnvironment: () => false,
}));

vi.mock("@/lib/secure-store", () => ({
  secureStoreDelete: mocks.secureStoreDelete,
  secureStoreGet: vi.fn(async () => null),
  secureStoreSet: vi.fn(async () => {}),
}));

vi.mock("@/lib/tauri-store", () => ({
  storeDelete: mocks.storeDelete,
  storeGet: mocks.storeGet,
  storeSet: mocks.storeSet,
}));

describe("data registry", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("exports learning data without API keys", async () => {
    const { buildLocalDataExport } = await import("@/lib/data-registry");
    localStorage.setItem(
      "speakright_mastery_profile_v2",
      JSON.stringify({ version: 2 }),
    );
    localStorage.setItem(
      "speakright_azure_config",
      JSON.stringify({ subscriptionKey: "secret" }),
    );

    const snapshot = buildLocalDataExport();

    expect(snapshot.schemaVersion).toBe(2);
    expect(snapshot.dataSchema.currentVersion).toBeGreaterThanOrEqual(2);
    expect(snapshot.localStorage.speakright_mastery_profile_v2).toEqual({
      version: 2,
    });
    expect(snapshot.localStorage.speakright_azure_config).toBeUndefined();
    expect(snapshot.excluded).toContain("API keys");
  });

  it("deletes learning data and caches while preserving app settings and keys", async () => {
    const { deleteLearningData } = await import("@/lib/data-registry");
    localStorage.setItem("speakright_mastery_profile_v2", "{}");
    localStorage.setItem("speakright_ipa_cache", "{}");
    localStorage.setItem("speakright_mw_words_th", "{}");
    localStorage.setItem("speakright_corrupt_data_v1", "[]");
    localStorage.setItem("speakright_azure_config", "{}");
    localStorage.setItem("theme", "dark");

    await deleteLearningData();

    expect(localStorage.getItem("speakright_mastery_profile_v2")).toBeNull();
    expect(localStorage.getItem("speakright_ipa_cache")).toBeNull();
    expect(localStorage.getItem("speakright_mw_words_th")).toBeNull();
    expect(localStorage.getItem("speakright_corrupt_data_v1")).toBeNull();
    expect(localStorage.getItem("speakright_azure_config")).toBe("{}");
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(mocks.clearBenchmarkRecordings).toHaveBeenCalledOnce();
    expect(mocks.clearTtsCache).toHaveBeenCalledOnce();
  });

  it("deletes API key slots separately", async () => {
    const { deleteApiKeys } = await import("@/lib/data-registry");
    localStorage.setItem("speakright_azure_config", "{}");
    localStorage.setItem("speakright_llm_config", "{}");

    deleteApiKeys();

    expect(localStorage.getItem("speakright_azure_config")).toBeNull();
    expect(localStorage.getItem("speakright_llm_config")).toBeNull();
    expect(mocks.secureStoreDelete).toHaveBeenCalledWith(
      "speakright_azure_config",
    );
    expect(mocks.secureStoreDelete).toHaveBeenCalledWith(
      "speakright_llm_config",
    );
    expect(mocks.storeDelete).not.toHaveBeenCalled();
  });
});
