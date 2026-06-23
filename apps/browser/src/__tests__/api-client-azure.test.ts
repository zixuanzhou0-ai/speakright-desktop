import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  assessPronunciation,
  testAzure,
  transcribeSpeech,
} from "@/lib/api-client";

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  assessPronunciationInBrowser: vi.fn(),
  testAzureCredentialsInBrowser: vi.fn(),
  transcribeSpeechInBrowser: vi.fn(),
}));

vi.mock("@/platform/browser-fetch", () => ({
  apiFetch: mocks.apiFetch,
}));

vi.mock("@/platform/speech-assessment", () => ({
  assessPronunciationInBrowser: mocks.assessPronunciationInBrowser,
  testAzureCredentialsInBrowser: mocks.testAzureCredentialsInBrowser,
  transcribeSpeechInBrowser: mocks.transcribeSpeechInBrowser,
}));

describe("Azure browser API client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("tests Azure credentials through the browser Speech SDK adapter", async () => {
    mocks.testAzureCredentialsInBrowser.mockResolvedValueOnce(undefined);

    await expect(testAzure("secret", " EastUS2 ")).resolves.toEqual({
      success: true,
    });

    expect(mocks.testAzureCredentialsInBrowser).toHaveBeenCalledWith(
      "secret",
      " EastUS2 ",
    );
    expect(mocks.apiFetch).not.toHaveBeenCalled();
  });

  it("rejects invalid regions before testing Azure credentials", async () => {
    await expect(
      testAzure("secret", "eastus.example.com"),
    ).resolves.toMatchObject({
      success: false,
      error: expect.stringContaining("只能包含字母、数字和连字符"),
    });
    expect(mocks.apiFetch).not.toHaveBeenCalled();
    expect(mocks.testAzureCredentialsInBrowser).not.toHaveBeenCalled();
  });

  it("rejects invalid regions before pronunciation assessment network calls", async () => {
    mocks.assessPronunciationInBrowser.mockRejectedValueOnce(
      new Error(
        "Azure 区域只能包含字母、数字和连字符，例如 eastus 或 southeastasia。",
      ),
    );

    await expect(
      assessPronunciation(
        new Blob(["audio"], { type: "audio/wav" }),
        "hello",
        "secret",
        "https://eastus",
      ),
    ).rejects.toThrow("只能包含字母、数字和连字符");

    expect(mocks.assessPronunciationInBrowser).toHaveBeenCalledWith(
      expect.any(Blob),
      "hello",
      "secret",
      "https://eastus",
      "en-US",
    );
  });

  it("rejects invalid regions before transcription network calls", async () => {
    mocks.transcribeSpeechInBrowser.mockRejectedValueOnce(
      new Error(
        "Azure 区域只能包含字母、数字和连字符，例如 eastus 或 southeastasia。",
      ),
    );

    await expect(
      transcribeSpeech(
        new Blob(["audio"], { type: "audio/wav" }),
        "secret",
        "eastus/path",
      ),
    ).rejects.toThrow("只能包含字母、数字和连字符");

    expect(mocks.transcribeSpeechInBrowser).toHaveBeenCalledWith(
      expect.any(Blob),
      "secret",
      "eastus/path",
      "en-US",
    );
  });

  it("returns a Chinese Azure auth error for invalid credentials", async () => {
    mocks.testAzureCredentialsInBrowser.mockRejectedValueOnce(
      new Error(
        "Azure Speech 认证失败，请检查设置页里的 Subscription Key 和区域是否匹配。",
      ),
    );

    await expect(testAzure("bad-key", "eastus")).resolves.toEqual({
      success: false,
      error:
        "Azure Speech 认证失败，请检查设置页里的 Subscription Key 和区域是否匹配。",
    });
  });

  it("returns a Chinese Azure network error when connection testing cannot reach Azure", async () => {
    mocks.testAzureCredentialsInBrowser.mockRejectedValueOnce(
      new TypeError("Failed to fetch"),
    );

    await expect(testAzure("secret", "eastus")).resolves.toEqual({
      success: false,
      error: "无法连接 Azure Speech，请检查网络、代理或 Azure 区域后重试。",
    });
  });

  it("does not leak unknown English browser transport errors during connection testing", async () => {
    mocks.testAzureCredentialsInBrowser.mockRejectedValueOnce(
      new Error("plugin-http panicked"),
    );

    await expect(testAzure("secret", "eastus")).resolves.toEqual({
      success: false,
      error:
        "Azure Speech 请求失败，请检查 Azure Speech API 密钥、区域、网络或代理后重试。",
    });
  });

  it("throws a Chinese no-speech message for Azure assessment silence", async () => {
    mocks.assessPronunciationInBrowser.mockRejectedValueOnce(
      new Error("没有检测到清晰语音，请靠近麦克风、读完目标内容后重新录音。"),
    );

    await expect(
      assessPronunciation(
        new Blob(["audio"], { type: "audio/wav" }),
        "hello",
        "secret",
        "eastus",
      ),
    ).rejects.toThrow(
      "没有检测到清晰语音，请靠近麦克风、读完目标内容后重新录音。",
    );
  });

  it("throws a Chinese Azure assessment network error", async () => {
    mocks.assessPronunciationInBrowser.mockRejectedValueOnce(
      new Error("无法连接 Azure Speech，请检查网络、代理或 Azure 区域后重试。"),
    );

    await expect(
      assessPronunciation(
        new Blob(["audio"], { type: "audio/wav" }),
        "hello",
        "secret",
        "eastus",
      ),
    ).rejects.toThrow(
      "无法连接 Azure Speech，请检查网络、代理或 Azure 区域后重试。",
    );
  });

  it("does not leak unknown English transport errors during assessment", async () => {
    mocks.assessPronunciationInBrowser.mockRejectedValueOnce(
      new Error(
        "Azure Speech 评分失败，请检查 Azure Speech API 密钥、区域、网络或代理后重试。",
      ),
    );

    await expect(
      assessPronunciation(
        new Blob(["audio"], { type: "audio/wav" }),
        "hello",
        "secret",
        "eastus",
      ),
    ).rejects.toThrow(
      "Azure Speech 评分失败，请检查 Azure Speech API 密钥、区域、网络或代理后重试。",
    );
  });

  it("throws a Chinese no-speech message for Azure NoMatch responses", async () => {
    mocks.assessPronunciationInBrowser.mockRejectedValueOnce(
      new Error("没有检测到清晰语音，请靠近麦克风、读完目标内容后重新录音。"),
    );

    await expect(
      assessPronunciation(
        new Blob(["audio"], { type: "audio/wav" }),
        "hello",
        "secret",
        "eastus",
      ),
    ).rejects.toThrow(
      "没有检测到清晰语音，请靠近麦克风、读完目标内容后重新录音。",
    );
  });

  it("throws a Chinese message when Azure transcription returns no text", async () => {
    mocks.transcribeSpeechInBrowser.mockRejectedValueOnce(
      new Error("Azure Speech 没有返回可用转写文本，请重新录音后再试。"),
    );

    await expect(
      transcribeSpeech(
        new Blob(["audio"], { type: "audio/wav" }),
        "secret",
        "eastus",
      ),
    ).rejects.toThrow("Azure Speech 没有返回可用转写文本，请重新录音后再试。");
  });
});
