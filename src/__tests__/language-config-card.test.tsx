import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LanguageConfigCard } from "@/components/settings/language-config-card";
import type { LanguageId } from "@/types/language";

const mocks = vi.hoisted(() => ({
  languageId: "fr-FR" as LanguageId,
  setLanguageConfig: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/hooks/use-api-keys", () => ({
  useLanguageConfig: () => ({ languageId: mocks.languageId }),
}));

vi.mock("@/lib/api-keys", () => ({
  setLanguageConfig: mocks.setLanguageConfig,
}));

vi.mock("sonner", () => ({
  toast: {
    success: mocks.toastSuccess,
  },
}));

describe("language config card", () => {
  it("surfaces non-English phonology gaps separately from service capability gaps", () => {
    render(<LanguageConfigCard />);

    const gapSummaries = document.querySelectorAll(
      '[data-smoke="language-option-phonology-gaps"]',
    );
    expect(gapSummaries).toHaveLength(3);
    for (const summary of gapSummaries) {
      expect(summary).toHaveAttribute("data-phonology-gap-count", "2");
    }

    expect(
      screen.getByText(/音系待补：\/p t k f m n b d g\//),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/音系待补：\/p b t d k g f v s z m n l\//),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/音系待补：complete hard\/soft consonant pairs/),
    ).toBeInTheDocument();

    const englishOption = document.querySelector(
      '[data-smoke="language-option"][data-language-id="en-US"]',
    );
    expect(englishOption).not.toBeNull();
    expect(englishOption?.textContent).not.toContain("音系待补");
  });
});
