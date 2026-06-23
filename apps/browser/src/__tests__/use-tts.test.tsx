import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTts } from "@/hooks/use-tts";

const mocks = vi.hoisted(() => ({
  elevenLabsTts: vi.fn(),
  getElevenLabsConfig: vi.fn(),
  playBlob: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
  elevenLabsTts: mocks.elevenLabsTts,
}));

vi.mock("@/lib/api-keys", () => ({
  getElevenLabsConfig: mocks.getElevenLabsConfig,
}));

vi.mock("@/hooks/use-audio-player", () => ({
  useAudioPlayer: () => ({
    isPlaying: false,
    playBlob: mocks.playBlob,
  }),
}));

describe("useTts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getElevenLabsConfig.mockReturnValue({
      apiKey: "test-key",
      voiceId: "VoiceId12345",
      modelId: "eleven_flash_v2_5",
    });
    mocks.elevenLabsTts.mockResolvedValue(
      new Blob([new Uint8Array([1, 2, 3])], { type: "audio/mpeg" }),
    );
  });

  it("normalizes raw English TTS failures before showing them", async () => {
    mocks.elevenLabsTts.mockRejectedValueOnce(
      new TypeError("Failed to fetch"),
    );
    const { result } = renderHook(() => useTts());

    await act(async () => {
      await result.current.speak("This is a sentence.");
    });

    expect(result.current.error).toContain("无法播放标准示范");
    expect(result.current.error).toContain("无法连接 ElevenLabs");
    expect(result.current.error).not.toContain("Failed to fetch");
    expect(mocks.playBlob).not.toHaveBeenCalled();
  });

  it("plays audio when the provider returns a blob", async () => {
    const { result } = renderHook(() => useTts());

    await act(async () => {
      await result.current.speak("This is a sentence.");
    });

    expect(result.current.error).toBeNull();
    expect(mocks.playBlob).toHaveBeenCalledWith(expect.any(Blob));
  });
});
