import { describe, expect, it } from "vitest";
import { REQUIRED_SPANISH_UNITS } from "@/lib/language-critical-units";
import { LANGUAGE_LEARNING_DECKS } from "@/lib/language-learning-decks";
import { getLanguagePhonemes } from "@/lib/language-phonemes";
import {
  expectDeckTargetsResolvable,
  expectRequiredUnits,
  expectSourceBackedUnits,
} from "./language-content-helpers";

describe("Spanish pronunciation content", () => {
  it("covers the Spanish IPA-first beta inventory", () => {
    expectRequiredUnits("es-ES", REQUIRED_SPANISH_UNITS);
    expect(getLanguagePhonemes("es-ES").length).toBeGreaterThanOrEqual(31);
  });

  it("keeps Spanish units source-backed and learner-facing", () => {
    expectSourceBackedUnits("es-ES");
  });

  it("expands Spanish diagnostic, contrast, and sentence decks", () => {
    const deck = LANGUAGE_LEARNING_DECKS["es-ES"];

    expect(deck.diagnosticWords.length).toBeGreaterThanOrEqual(31);
    expect(deck.contrastDeck.length).toBeGreaterThanOrEqual(19);
    expect(deck.sentenceDeck.length).toBeGreaterThanOrEqual(25);
    expectDeckTargetsResolvable("es-ES");
  });

  it("marks dialect-sensitive Spanish units honestly", () => {
    const deckText = [
      ...LANGUAGE_LEARNING_DECKS["es-ES"].contrastDeck.map((item) => item.focus),
      ...LANGUAGE_LEARNING_DECKS["es-ES"].sentenceDeck.map((item) => item.focus),
    ].join(" ");

    expect(deckText).toMatch(/es-ES|Castilian|拉美|方言|seseo/i);
  });

  it("keeps Spanish rule sentence IPA hints tied to real sentence realization", () => {
    const deck = LANGUAGE_LEARNING_DECKS["es-ES"];
    const byText = (text: string) =>
      deck.sentenceDeck.find((item) => item.text === text);

    expect(byText("Un gato duerme en un banco.")?.ipaHint).toBe(
      "/uŋ ˈgato ˈdweɾme en um ˈbaŋko/",
    );
    expect(byText("Un gato duerme en un banco.")?.focus).toContain(
      "鼻音位置同化",
    );
    expect(byText("Papá habló con el médico.")?.ipaHint).toBe(
      "/paˈpa aˈβlo kon el ˈmeðiko/",
    );
    expect(byText("Papá habló con el médico.")?.ipaHint).toContain("β");
    expect(byText("Papá habló con el médico.")?.ipaHint).toContain("ð");
    expect(byText("Buenos días, muchas gracias.")?.ipaHint).toBe(
      "/ˈbwenos ˈdias ˈmutʃas ˈɣɾaθjas/",
    );
    expect(byText("Buenos días, muchas gracias.")?.targetUnitSlugs).toContain(
      "es-syllable-rhythm",
    );
  });
});
