import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SentenceInputCard } from "@/components/sentences/sentence-input-card";
import type { FreePracticeTargetPreview } from "@/lib/free-practice-transfer";
import type { LanguageId } from "@/types/language";

function renderCard({
  isWordMode = false,
  sentence = "I want to practice this sentence clearly.",
  languageId = "en-US",
  ttsError = null,
  targetPreview = null,
}: {
  isWordMode?: boolean;
  sentence?: string;
  languageId?: LanguageId;
  ttsError?: string | null;
  targetPreview?: FreePracticeTargetPreview | null;
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
      targetPreview={targetPreview}
      onListen={vi.fn()}
    />,
  );
}

function expectBadgeWraps(element: HTMLElement | null) {
  expect(element).toHaveClass("h-auto");
  expect(element).toHaveClass("min-h-5");
  expect(element).toHaveClass("max-w-full");
  expect(element).toHaveClass("whitespace-normal");
  expect(element).toHaveClass("break-words");
  expect(element).toHaveClass("text-center");
  expect(element).toHaveClass("[overflow-wrap:anywhere]");
  expect(element).not.toHaveClass("whitespace-nowrap");
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

  it("marks sentence TTS failures for Browser smoke checks", () => {
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

  it("keeps long free-practice target preview pack titles wrap-ready", () => {
    renderCard({
      sentence: "The thoughtful author thanked three theater teachers.",
      targetPreview: {
        generatedAt: 1,
        text: "The thoughtful author thanked three theater teachers.",
        targets: [
          {
            packId: "s-th",
            packTitle:
              "极长训练包标题：/s/ 与 /θ/ 在句子迁移里的复习任务需要完整显示",
            levelId: "sentence-ladder",
            targetPhonemes: ["s", "th"],
            matchedWords: ["thoughtful", "thanked", "three"],
            source: "review",
            reason: "review queue",
            priority: "critical",
          },
        ],
        suggestions: [],
      },
    });

    expectBadgeWraps(
      document.querySelector('[data-smoke="free-practice-target-pack-badge"]'),
    );
  });

  it("keeps long free-practice suggestion pack titles and every suggested word visible", () => {
    const suggestedWords = [
      "very",
      "voice",
      "window",
      "away",
      "weather",
      "vivid",
    ];

    renderCard({
      sentence: "I want to practice this sentence clearly.",
      targetPreview: {
        generatedAt: 1,
        text: "I want to practice this sentence clearly.",
        targets: [],
        suggestions: [
          {
            packId: "v-w",
            packTitle:
              "建议训练包：V/W 对比到自由句子迁移的长标题也必须完整换行显示",
            levelId: "word-ladder",
            words: suggestedWords,
            prompt: "Try a sentence with very and window.",
            reason: "active pack",
          },
        ],
      },
    });

    expectBadgeWraps(
      document.querySelector(
        '[data-smoke="free-practice-suggestion-pack-badge"]',
      ),
    );
    const wordBadges = document.querySelectorAll(
      '[data-smoke="free-practice-suggestion-word"]',
    );
    expect(wordBadges).toHaveLength(suggestedWords.length);
    for (const word of suggestedWords) {
      expect(screen.getByText(word)).toBeInTheDocument();
    }
    for (const wordBadge of wordBadges) {
      expectBadgeWraps(wordBadge as HTMLElement);
    }
  });
});
