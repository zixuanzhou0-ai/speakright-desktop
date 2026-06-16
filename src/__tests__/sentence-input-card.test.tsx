import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SentenceInputCard } from "@/components/sentences/sentence-input-card";
import type { LanguageId } from "@/types/language";

function renderCard({
  isWordMode = false,
  sentence = "I want to practice this sentence clearly.",
  languageId = "en-US",
  ttsError = null,
}: {
  isWordMode?: boolean;
  sentence?: string;
  languageId?: LanguageId;
  ttsError?: string | null;
} = {}) {
  return render(
    <SentenceInputCard
      sentence={sentence}
      onSentenceChange={vi.fn()}
      speed={0.85}
      onSpeedChange={vi.fn()}
      languageId={languageId}
      isWordMode={isWordMode}
      trimmedText={sentence}
      wordIpa={isWordMode ? "/ˈpræktɪs/" : null}
      hasPlayedWord={false}
      wordAudioIsPlaying={false}
      wordAudioIsLoading={false}
      onWordAudioPlay={vi.fn()}
      ttsIsPlaying={false}
      ttsIsLoading={false}
      ttsError={ttsError}
      ttsWordTimings={[]}
      ttsCurrentTime={0}
      onTtsReplay={vi.fn()}
      onListen={vi.fn()}
    />,
  );
}

describe("SentenceInputCard narrow layout", () => {
  it("lets the free-practice input and sentence listen button wrap on narrow widths", () => {
    renderCard();

    const actionRow = document.querySelector(
      '[data-smoke="sentence-input-actions"]',
    );
    expect(actionRow).toHaveClass("flex-wrap");
    expect(actionRow).toHaveClass("justify-center");

    const textareaWrapper =
      screen.getByPlaceholderText("输入单词或句子").parentElement;
    expect(textareaWrapper).toHaveClass("min-w-[min(100%,16rem)]");
    expect(textareaWrapper).toHaveClass("flex-1");

    const listenControl = screen.getByRole("button", { name: "听标准发音" });
    expect(listenControl).toHaveAttribute(
      "data-smoke",
      "free-practice-listen-control",
    );
    expect(listenControl).toHaveClass("self-center");
  });

  it("keeps the word-mode listen control accessible when the row wraps", () => {
    renderCard({ isWordMode: true, sentence: "practice" });

    const listenControl = screen.getByRole("button", { name: "播放单词发音" });
    expect(listenControl).toHaveAttribute(
      "data-smoke",
      "free-practice-listen-control",
    );
    expect(
      document.querySelector('[data-smoke="sentence-input-actions"]'),
    ).toHaveClass("flex-wrap");
  });

  it("does not advertise online dictionary fallback for experimental languages", () => {
    renderCard({
      isWordMode: true,
      languageId: "fr-FR",
      sentence: "bonjour",
    });

    expect(
      screen.getByText(
        "单词模式 · 本地语言包音频优先，无本地条目时不会用在线音频冒充",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("单词模式 · 本地音频优先，有道兜底"),
    ).not.toBeInTheDocument();
  });

  it("marks sentence TTS failures for Release EXE smoke checks", () => {
    renderCard({
      sentence: "I want to practice this sentence clearly.",
      ttsError: "未配置 ElevenLabs API Key，句子示范暂时不可用。",
    });

    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("data-smoke", "free-practice-tts-error");
    expect(alert).toHaveTextContent(
      "未配置 ElevenLabs API Key，句子示范暂时不可用。",
    );
  });
});
