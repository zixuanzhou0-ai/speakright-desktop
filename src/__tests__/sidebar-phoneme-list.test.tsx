import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SidebarPhonemeList } from "@/components/layout/sidebar-phoneme-list";

const languageMock = vi.hoisted(() => ({
  languageId: "fr-FR" as "en-US" | "es-ES" | "fr-FR" | "ru-RU",
}));

vi.mock("@/hooks/use-api-keys", () => ({
  useLanguageConfig: () => ({
    languageId: languageMock.languageId,
  }),
}));

afterEach(() => cleanup());

function renderWithLanguage(
  languageId: "en-US" | "es-ES" | "fr-FR" | "ru-RU",
  currentSlug: string,
) {
  languageMock.languageId = languageId;
  render(<SidebarPhonemeList currentSlug={currentSlug} />);
}

describe("SidebarPhonemeList layout", () => {
  it("keeps English sound units compact on one row", () => {
    renderWithLanguage("en-US", "ee");

    const englishItem = screen.getByText("/iː/").closest("a");
    const englishExample = screen.getByText("green");

    expect(englishItem).toHaveClass("flex");
    expect(englishItem).not.toHaveClass("whitespace-nowrap");
    expect(englishExample).toHaveClass("text-center");
    expect(englishExample).toHaveClass("break-words");
  });

  it("uses a wrapping two-line layout for long French rule units", () => {
    renderWithLanguage("fr-FR", "fr-final-consonant-silence");

    const ruleLabel = screen.getByText("词尾静音");
    const frenchItem = ruleLabel.closest("a");
    const layerBadge = frenchItem?.querySelector(
      '[data-smoke="sidebar-phonology-layer"]',
    );

    expect(frenchItem).toHaveClass("grid");
    expect(frenchItem).not.toHaveClass("whitespace-nowrap");
    expect(ruleLabel).toHaveClass("break-words");
    expect(layerBadge).toHaveAttribute(
      "data-phonology-layer",
      "connected-speech-rule",
    );
    expect(layerBadge).toHaveTextContent("语流规则");
  });

  it("uses a wrapping two-line layout for Spanish rhythm units", () => {
    renderWithLanguage("es-ES", "es-syllable-rhythm");

    const rhythmLabel = screen.getByText("音节节奏");
    const spanishItem = rhythmLabel.closest("a");

    expect(spanishItem).toHaveClass("grid");
    expect(spanishItem).not.toHaveClass("whitespace-nowrap");
    expect(rhythmLabel).toHaveClass("break-words");
  });

  it("uses a wrapping two-line layout for Russian rule units", () => {
    renderWithLanguage("ru-RU", "ru-voicing-assimilation");

    const ruleLabel = screen.getByText("清浊同化");
    const russianItem = ruleLabel.closest("a");

    expect(russianItem).toHaveClass("grid");
    expect(russianItem).not.toHaveClass("whitespace-nowrap");
    expect(ruleLabel).toHaveClass("break-words");
  });

  it("labels Spanish realization units as allophones in the sidebar", () => {
    renderWithLanguage("es-ES", "es-bv");

    const item = screen.getByText("B/V 对比").closest("a");
    expect(item).toBeTruthy();
    if (!item) return;

    const layerBadge = within(item).getByText("实现音");
    expect(layerBadge).toHaveAttribute("data-smoke", "sidebar-phonology-layer");
    expect(layerBadge).toHaveAttribute("data-phonology-layer", "allophone");
  });

  it("labels Russian hard-soft units as contrasts instead of standalone phonemes", () => {
    renderWithLanguage("ru-RU", "ru-hard-soft");

    const item = screen.getByText("硬软辅音").closest("a");
    expect(item).toBeTruthy();
    if (!item) return;

    const layerBadge = within(item).getByText("对比/变体");
    expect(layerBadge).toHaveAttribute("data-smoke", "sidebar-phonology-layer");
    expect(layerBadge).toHaveAttribute("data-phonology-layer", "contrast");
  });
});
