import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DrillSummaryCard } from "@/components/drill/drill-summary";
import type { DrillSummary } from "@/types/drill";

function summaryWithWeakItem(): DrillSummary {
  return {
    config: {
      kind: "sentence",
      phonemeSlug: "ru-clusters",
      itemCount: 5,
      passThreshold: 70,
    },
    startedAt: 1_000,
    completedAt: 66_000,
    totalItems: 5,
    passedItems: 4,
    skippedItems: 1,
    firstPassRate: 0.4,
    averageScore: 72,
    weakItems: [
      {
        item: {
          text: "Здравствуйте, встретиться с сестрой трудно.",
          ipa: "/ˈzdrastvʊjtʲe ˈfstrʲetʲɪt͡sə s sʲɪˈstroj ˈtrudnə/",
          phoneme: "ru-clusters",
          description:
            "先保留每个辅音，不要在辅音丛中间加汉语式过渡元音。",
        },
        attempts: [
          {
            attemptNumber: 3,
            passed: false,
            score: {
              pronunciationScore: 58,
              accuracyScore: 60,
              targetScore: 52,
              overallScore: 66,
            },
          },
        ],
        passed: false,
        skipped: true,
        bestScore: 58,
      },
    ],
    items: [],
  };
}

describe("DrillSummaryCard", () => {
  it("keeps long weak-item text and IPA wrap-ready in the completion summary", () => {
    render(
      <DrillSummaryCard
        summary={summaryWithWeakItem()}
        onRestart={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    const row = document.querySelector('[data-smoke="drill-summary-weak-item"]');
    expect(row).toHaveClass("grid");
    expect(row).toHaveClass("grid-cols-1");
    expect(row).toHaveClass("sm:grid-cols-[minmax(0,1fr)_auto]");

    const text = screen.getByText(
      "Здравствуйте, встретиться с сестрой трудно.",
    );
    expect(text).toHaveAttribute("data-smoke", "drill-summary-weak-item-text");
    expect(text).toHaveClass("break-words");
    expect(text).toHaveClass("text-center");
    expect(text).toHaveClass("[overflow-wrap:anywhere]");
    expect(text).not.toHaveClass("truncate");
    expect(text).not.toHaveClass("line-clamp");
    expect(text).not.toHaveClass("whitespace-nowrap");

    const ipa = screen.getByText(
      "/ˈzdrastvʊjtʲe ˈfstrʲetʲɪt͡sə s sʲɪˈstroj ˈtrudnə/",
    );
    expect(ipa).toHaveAttribute("data-smoke", "drill-summary-weak-item-ipa");
    expect(ipa).toHaveClass("break-words");
    expect(ipa).toHaveClass("[overflow-wrap:anywhere]");
    expect(ipa).not.toHaveClass("truncate");
    expect(ipa).not.toHaveClass("line-clamp");
    expect(ipa).not.toHaveClass("whitespace-nowrap");

    const score = screen.getByText("58");
    expect(score).toHaveAttribute("data-smoke", "drill-summary-weak-item-score");
    expect(score).toHaveClass("tabular-nums");
  });
});
