import { describe, expect, it } from "vitest";
import { buildTtsCacheKey } from "@/lib/tts-cache";

const baseKey = {
  languageId: "en-US",
  provider: "elevenlabs",
  modelId: "eleven_flash_v2_5",
  voiceId: "voice1",
  purpose: "sentence" as const,
  speed: 1,
  text: "Hello",
  textNormalizerVersion: "aligned-v1",
};

describe("TTS cache key format", () => {
  it("normalizes text and speed while preserving provider dimensions", () => {
    expect(buildTtsCacheKey({ ...baseKey, text: "  Hello  " })).toBe(
      "v2:en-US:elevenlabs:eleven_flash_v2_5:voice1:sentence:1.0:default-dict:aligned-v1:hello",
    );
  });

  it("separates identical text across languages", () => {
    const english = buildTtsCacheKey(baseKey);
    const spanish = buildTtsCacheKey({ ...baseKey, languageId: "es-ES" });

    expect(english).not.toBe(spanish);
  });

  it("separates provider, model, voice, purpose and speed", () => {
    const original = buildTtsCacheKey(baseKey);

    expect(
      buildTtsCacheKey({ ...baseKey, provider: "azure-tts" }),
    ).not.toBe(original);
    expect(
      buildTtsCacheKey({ ...baseKey, modelId: "eleven_multilingual_v2" }),
    ).not.toBe(original);
    expect(
      buildTtsCacheKey({ ...baseKey, voiceId: "voice2" }),
    ).not.toBe(original);
    expect(
      buildTtsCacheKey({ ...baseKey, purpose: "diagnosis" }),
    ).not.toBe(original);
    expect(buildTtsCacheKey({ ...baseKey, speed: 0.85 })).not.toBe(original);
  });
});
