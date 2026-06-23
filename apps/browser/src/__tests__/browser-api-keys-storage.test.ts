import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  API_KEY_STORAGE_ERROR_EVENT,
  clearItem,
  getAzureConfig,
  getApiKeyPersistence,
  getElevenLabsConfig,
  getLlmConfig,
  getPronunciationConfig,
  hydrateKeys,
  setApiKeyPersistence,
  setAzureConfig,
  setElevenLabsConfig,
  setLlmConfig,
  setPronunciationConfig,
  subscribeToStorage,
} from "@/lib/api-keys";

describe("browser API key storage", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("stores BYOK provider config in sessionStorage by default", async () => {
    setAzureConfig({
      subscriptionKey: "azure-key",
      region: "eastus",
    });

    expect(sessionStorage.getItem("speakright_azure_config")).toContain(
      "azure-key",
    );
    expect(localStorage.getItem("speakright_azure_config")).toBeNull();
    expect(getAzureConfig()).toMatchObject({
      subscriptionKey: "azure-key",
      region: "eastus",
    });

    await clearItem("speakright_azure_config");
    expect(getAzureConfig()).toBeNull();
  });

  it("moves existing API keys only after the user enables local persistence", () => {
    setAzureConfig({
      subscriptionKey: "azure-key",
      region: "eastus",
    });

    expect(getApiKeyPersistence()).toBe("session");

    setApiKeyPersistence("local");

    expect(localStorage.getItem("speakright_azure_config")).toContain(
      "azure-key",
    );
    expect(sessionStorage.getItem("speakright_azure_config")).toBeNull();
    expect(getApiKeyPersistence()).toBe("local");

    setApiKeyPersistence("session");

    expect(sessionStorage.getItem("speakright_azure_config")).toContain(
      "azure-key",
    );
    expect(localStorage.getItem("speakright_azure_config")).toBeNull();
  });

  it("returns stable snapshots for saved configs", () => {
    setAzureConfig({
      subscriptionKey: "azure-key",
      region: "eastus",
    });
    setElevenLabsConfig({
      apiKey: "eleven-key",
      voiceId: "voice-id",
      voiceName: "Voice",
      modelId: "eleven_flash_v2_5",
    });
    setLlmConfig({
      provider: "openai",
      apiKey: "llm-key",
      baseUrl: "https://example.test/v1",
      model: "gpt-test",
    });
    setPronunciationConfig({ source: "youdao" });

    expect(getAzureConfig()).toBe(getAzureConfig());
    expect(getElevenLabsConfig()).toBe(getElevenLabsConfig());
    expect(getLlmConfig()).toBe(getLlmConfig());
    expect(getPronunciationConfig()).toBe(getPronunciationConfig());
  });

  it("returns a new stable snapshot after a config changes", () => {
    setAzureConfig({
      subscriptionKey: "azure-key",
      region: "eastus",
    });
    const previous = getAzureConfig();

    setAzureConfig({
      subscriptionKey: "azure-key-2",
      region: "westus",
    });
    const next = getAzureConfig();

    expect(next).not.toBe(previous);
    expect(next).toMatchObject({
      subscriptionKey: "azure-key-2",
      region: "westus",
    });
    expect(next).toBe(getAzureConfig());
  });

  it("keeps snapshots stable after moving key persistence", () => {
    setAzureConfig({
      subscriptionKey: "azure-key",
      region: "eastus",
    });

    setApiKeyPersistence("local");
    const localSnapshot = getAzureConfig();

    expect(localSnapshot).toBe(getAzureConfig());
    expect(localStorage.getItem("speakright_azure_config")).toContain(
      "azure-key",
    );
    expect(sessionStorage.getItem("speakright_azure_config")).toBeNull();

    setApiKeyPersistence("session");
    const sessionSnapshot = getAzureConfig();

    expect(sessionSnapshot).toBe(getAzureConfig());
    expect(sessionStorage.getItem("speakright_azure_config")).toContain(
      "azure-key",
    );
    expect(localStorage.getItem("speakright_azure_config")).toBeNull();
  });

  it("does not return stale cached snapshots after clearing a config", async () => {
    setAzureConfig({
      subscriptionKey: "azure-key",
      region: "eastus",
    });
    expect(getAzureConfig()).not.toBeNull();

    await clearItem("speakright_azure_config");

    expect(getAzureConfig()).toBeNull();
  });

  it("keeps non-secret browser preferences in localStorage", () => {
    expect(getPronunciationConfig()).toEqual({ source: "youdao" });

    setPronunciationConfig({ source: "youdao" });

    expect(localStorage.getItem("speakright_pronunciation_config")).toContain(
      "youdao",
    );
    expect(getPronunciationConfig()).toEqual({ source: "youdao" });
  });

  it("emits storage events for browser settings readers", () => {
    const callback = vi.fn();
    const unsubscribe = subscribeToStorage(callback);

    setAzureConfig({
      subscriptionKey: "azure-key",
      region: "eastus",
    });

    expect(callback).toHaveBeenCalled();
    unsubscribe();
  });

  it("reports corrupt browser storage during hydration without blocking startup", async () => {
    const listener = vi.fn();
    window.addEventListener(API_KEY_STORAGE_ERROR_EVENT, listener);
    sessionStorage.setItem("speakright_azure_config", "{not json");

    await hydrateKeys();

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          key: "speakright_azure_config",
          operation: "hydrate",
        }),
      }),
    );
    window.removeEventListener(API_KEY_STORAGE_ERROR_EVENT, listener);
  });
});
