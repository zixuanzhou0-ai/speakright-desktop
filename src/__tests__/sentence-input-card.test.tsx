import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SentenceInputCard } from "@/components/sentences/sentence-input-card";

function renderCard({
  isWordMode = false,
  sentence = "I want to practice this sentence clearly.",
}: {
  isWordMode?: boolean;
  sentence?: string;
} = {}) {
  return render(
    <SentenceInputCard
      sentence={sentence}
      onSentenceChange={vi.fn()}
      speed={0.85}
      onSpeedChange={vi.fn()}
      isWordMode={isWordMode}
      trimmedText={sentence}
      wordIpa={isWordMode ? "/ˈpræktɪs/" : null}
      hasPlayedWord={false}
      wordAudioIsPlaying={false}
      wordAudioIsLoading={false}
      onWordAudioPlay={vi.fn()}
      ttsIsPlaying={false}
      ttsIsLoading={false}
      ttsError={null}
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

    const textareaWrapper = screen
      .getByPlaceholderText("输入单词或句子")
      .parentElement;
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
});
