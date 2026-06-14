import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  elevenLabsTts,
  elevenLabsTtsAligned,
  fetchElevenLabsUsage,
  fetchPronunciation,
  testElevenLabs,
} from "@/lib/api-client";

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
}));

vi.mock("@/lib/tauri-http", () => ({
  apiFetch: mocks.apiFetch,
}));

describe("desktop audio API client errors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns Chinese ElevenLabs connection-test errors", async () => {
    mocks.apiFetch.mockResolvedValueOnce(
      new Response("invalid key", { status: 401 }),
    );

    await expect(testElevenLabs("bad-key")).resolves.toEqual({
      success: false,
      error: "ElevenLabs 认证失败，请检查设置页里的 API Key 是否正确。",
    });

    mocks.apiFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(testElevenLabs("secret")).resolves.toEqual({
      success: false,
      error: "无法连接 ElevenLabs，请检查网络、代理或 ElevenLabs 配置后重试。",
    });
  });

  it("throws Chinese ElevenLabs usage and TTS errors", async () => {
    mocks.apiFetch.mockResolvedValueOnce(
      new Response("quota exhausted", { status: 429 }),
    );

    await expect(fetchElevenLabsUsage("secret")).rejects.toThrow(
      "ElevenLabs 请求过于频繁或额度不足，请稍后重试或检查 ElevenLabs 用量。",
    );

    await expect(
      elevenLabsTts("secret", "bad voice id", "hello", "eleven_flash_v2_5"),
    ).rejects.toThrow(
      "ElevenLabs Voice ID 格式无效，请在设置页重新选择或填写声音。",
    );

    await expect(
      elevenLabsTts(
        "secret",
        "VoiceId12345",
        "x".repeat(501),
        "eleven_flash_v2_5",
      ),
    ).rejects.toThrow("标准示范文本过长，请控制在 500 个字符以内。");

    mocks.apiFetch.mockRejectedValueOnce(new TypeError("network offline"));

    await expect(
      elevenLabsTts("secret", "VoiceId12345", "hello", "eleven_flash_v2_5"),
    ).rejects.toThrow(
      "无法连接 ElevenLabs，请检查网络、代理或 ElevenLabs 配置后重试。",
    );
  });

  it("throws Chinese aligned TTS provider errors", async () => {
    mocks.apiFetch.mockResolvedValueOnce(
      new Response("model missing", { status: 404 }),
    );

    await expect(
      elevenLabsTtsAligned("secret", "VoiceId12345", "hello", "missing-model"),
    ).rejects.toThrow(
      "ElevenLabs 声音或模型不可用，请检查 Voice ID 和 Model。",
    );
  });

  it("throws Chinese online dictionary pronunciation errors", async () => {
    await expect(fetchPronunciation("   ")).rejects.toThrow(
      "请输入要播放发音的单词。",
    );

    await expect(fetchPronunciation("x".repeat(81))).rejects.toThrow(
      "单词发音文本过长，请控制在 80 个字符以内。",
    );

    mocks.apiFetch.mockResolvedValueOnce(new Response("", { status: 404 }));

    await expect(fetchPronunciation("notaword")).rejects.toThrow(
      "在线词典没有找到这个词的发音，请换一个词或使用内置练习词。",
    );

    mocks.apiFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(fetchPronunciation("hello")).rejects.toThrow(
      "无法连接在线词典发音，请检查网络后重试；已内置的本地音频不受影响。",
    );
  });
});
