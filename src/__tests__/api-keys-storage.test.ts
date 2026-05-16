import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const store = new Map<string, unknown>();
  return {
    store,
    storeGet: vi.fn(async (key: string) => store.get(key) ?? null),
    storeSet: vi.fn(async (key: string, value: unknown) => {
      store.set(key, value);
    }),
    storeDelete: vi.fn(async (key: string) => {
      store.delete(key);
    }),
  };
});

vi.mock("@/lib/tauri-runtime", () => ({
  isTauriEnvironment: () => true,
}));

vi.mock("@/lib/tauri-store", () => ({
  storeGet: mocks.storeGet,
  storeSet: mocks.storeSet,
  storeDelete: mocks.storeDelete,
}));

describe("api key storage in Tauri", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    mocks.store.clear();
    vi.clearAllMocks();
  });

  it("keeps newly saved secrets out of localStorage", async () => {
    const { getAzureConfig, setAzureConfig } = await import("@/lib/api-keys");

    setAzureConfig({ subscriptionKey: "azure-secret", region: "eastus" });

    expect(localStorage.getItem("speakright_azure_config")).toBeNull();
    expect(getAzureConfig()).toEqual({
      subscriptionKey: "azure-secret",
      region: "eastus",
    });
  });

  it("migrates legacy localStorage secrets to store and clears the local copy", async () => {
    localStorage.setItem(
      "speakright_elevenlabs_config",
      JSON.stringify({
        apiKey: "eleven-secret",
        voiceId: "voice",
        modelId: "eleven_flash_v2_5",
      }),
    );
    const { getElevenLabsConfig, hydrateKeys } = await import("@/lib/api-keys");

    await hydrateKeys();

    expect(localStorage.getItem("speakright_elevenlabs_config")).toBeNull();
    expect(mocks.store.get("speakright_elevenlabs_config")).toMatchObject({
      apiKey: "eleven-secret",
      voiceId: "voice",
    });
    expect(getElevenLabsConfig()?.apiKey).toBe("eleven-secret");
  });
});
