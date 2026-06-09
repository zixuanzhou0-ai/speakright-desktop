import { cleanup, render, screen } from "@testing-library/react";
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

    expect(englishItem).toHaveClass("flex");
    expect(englishItem).toHaveClass("whitespace-nowrap");
  });

  it("uses a wrapping two-line layout for long French rule units", () => {
    renderWithLanguage("fr-FR", "fr-final-consonant-silence");

    const ruleLabel = screen.getByText("silent final C");
    const frenchItem = ruleLabel.closest("a");

    expect(frenchItem).toHaveClass("grid");
    expect(frenchItem).not.toHaveClass("whitespace-nowrap");
    expect(ruleLabel).toHaveClass("break-words");
  });

  it("uses a wrapping two-line layout for Spanish rhythm units", () => {
    renderWithLanguage("es-ES", "es-syllable-rhythm");

    const rhythmLabel = screen.getByText("syllable timing");
    const spanishItem = rhythmLabel.closest("a");

    expect(spanishItem).toHaveClass("grid");
    expect(spanishItem).not.toHaveClass("whitespace-nowrap");
    expect(rhythmLabel).toHaveClass("break-words");
  });

  it("uses a wrapping two-line layout for Russian rule units", () => {
    renderWithLanguage("ru-RU", "ru-voicing-assimilation");

    const ruleLabel = screen.getByText("voicing assimilation");
    const russianItem = ruleLabel.closest("a");

    expect(russianItem).toHaveClass("grid");
    expect(russianItem).not.toHaveClass("whitespace-nowrap");
    expect(ruleLabel).toHaveClass("break-words");
  });
});
