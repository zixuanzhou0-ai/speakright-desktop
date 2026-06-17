import { describe, expect, it } from "vitest";
import { auditLanguageCoverage } from "@/lib/language-content-audit";
import { REQUIRED_RUSSIAN_UNITS } from "@/lib/language-critical-units";
import { LANGUAGE_LEARNING_DECKS } from "@/lib/language-learning-decks";
import { getLanguagePhonemeBySlug } from "@/lib/language-phonemes";
import {
  expectDeckTargetsResolvable,
  expectRequiredUnits,
  expectSourceBackedUnits,
} from "./language-content-helpers";

describe("Russian pronunciation content", () => {
  it("covers the Russian stress-aware IPA beta inventory", () => {
    expectRequiredUnits("ru-RU", REQUIRED_RUSSIAN_UNITS);
  });

  it("keeps Russian units source-backed and learner-facing", () => {
    expectSourceBackedUnits("ru-RU");
  });

  it("requires visible stressText for all Russian multi-syllable keywords", () => {
    const audit = auditLanguageCoverage("ru-RU");

    expect(audit.russianKeywordsWithoutStress).toEqual([]);
  });

  it("adds standalone Russian hard-soft pair anchors without claiming mastery coverage", () => {
    for (const [slug, expectedIpa] of [
      ["ru-t-tj", "/t tʲ/"],
      ["ru-d-dj", "/d dʲ/"],
      ["ru-p-pj", "/p pʲ/"],
      ["ru-b-bj", "/b bʲ/"],
      ["ru-m-mj", "/m mʲ/"],
      ["ru-f-fj", "/f fʲ/"],
      ["ru-v-vj", "/v vʲ/"],
      ["ru-k-kj", "/k kʲ/"],
      ["ru-g-gj", "/g gʲ/"],
      ["ru-x-xj", "/x xʲ/"],
    ] as const) {
      const unit = getLanguagePhonemeBySlug("ru-RU", slug);

      expect(unit?.soundUnitType, slug).toBe("contrast");
      expect(unit?.ipa, slug).toBe(expectedIpa);
      expect(unit?.description, slug).toContain("硬");
      expect(unit?.description, slug).toContain("软");
      expect(unit?.keywords.length, slug).toBeGreaterThanOrEqual(20);
    }
  });

  it("explains final devoicing without hiding connected-speech voicing", () => {
    const finalDevoicing = getLanguagePhonemeBySlug(
      "ru-RU",
      "ru-final-devoicing",
    );

    expect(finalDevoicing?.description).toContain("停顿或清辅音前");
    expect(finalDevoicing?.description).toContain("连到浊辅音、响音或元音前");
    expect(finalDevoicing?.description).not.toContain("在词尾不保持浊音");
  });

  it("keeps Russian rule sentence hints faithful to cross-word realization", () => {
    const deck = LANGUAGE_LEARNING_DECKS["ru-RU"];
    const finalDevoicingItems = deck.sentenceDeck.filter((item) =>
      item.targetUnitSlugs.includes("ru-final-devoicing"),
    );
    const assimilationItem = deck.sentenceDeck.find(
      (item) => item.text === "Сделать быстро трудно.",
    );
    const reductionItem = deck.sentenceDeck.find((item) =>
      item.targetUnitSlugs.includes("ru-unstressed-o-a"),
    );
    const hardSoftItem = deck.sentenceDeck.find((item) =>
      item.targetUnitSlugs.includes("ru-hard-soft"),
    );
    const clusterItem = deck.sentenceDeck.find((item) =>
      item.targetUnitSlugs.includes("ru-clusters"),
    );
    const greetingClusterItem = deck.sentenceDeck.find(
      (item) => item.text === "Здравствуйте, студент.",
    );
    const longClusterItem = deck.sentenceDeck.find(
      (item) => item.text === "Текст простой, но группа большая.",
    );

    expect(finalDevoicingItems.map((item) => item.text)).not.toContain(
      "Друг ждёт у гаража.",
    );
    expect(finalDevoicingItems[0]).toMatchObject({
      text: "Нож тупой.",
      stressText: "Нож тупо́й.",
      ipaHint: "/noʂ tʊˈpoj/",
    });
    expect(finalDevoicingItems[0]?.focus).toContain("清辅音");
    expect(assimilationItem?.ipaHint).toBe("/ˈzdʲelətʲ ˈbɨstrə/");
    expect(assimilationItem?.focus).toContain("清浊同化");
    expect(reductionItem?.stressText).toContain("Москва́");
    expect(reductionItem?.ipaHint).toContain("ɐ");
    expect(hardSoftItem?.focus).toContain("硬软辅音");
    expect(clusterItem?.focus).toContain("辅音丛");
    expect(greetingClusterItem?.ipaHint).toBe(
      "/ˈzdrastvʊjtʲe stʊˈdʲent/",
    );
    expect(longClusterItem?.ipaHint).toBe(
      "/tʲekst prɐˈstoj no ˈgrupə bɐlʲˈʂajə/",
    );
  });

  it("expands Russian diagnostic, contrast, and sentence decks", () => {
    const deck = LANGUAGE_LEARNING_DECKS["ru-RU"];

    expect(deck.diagnosticWords.length).toBeGreaterThanOrEqual(24);
    expect(deck.contrastDeck.length).toBeGreaterThanOrEqual(18);
    expect(deck.sentenceDeck.length).toBeGreaterThanOrEqual(18);
    expectDeckTargetsResolvable("ru-RU");
  });
});
