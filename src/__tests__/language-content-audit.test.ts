import { describe, expect, it } from "vitest";
import { auditAllLanguages, auditLanguageCoverage } from "@/lib/language-content-audit";
import {
  countLanguageTrainingWords,
  getLanguageContentPack,
} from "@/lib/language-content-packs";
import { getLanguagePhonemeBySlug } from "@/lib/language-phonemes";
import {
  getDefaultPhonemeSlug,
  getEnabledLanguageProfiles,
  getLanguageProfile,
} from "@/lib/language-profiles";

describe("language content audit", () => {
  it("keeps English as the complete baseline", () => {
    const audit = auditLanguageCoverage("en-US");

    expect(audit.soundUnits).toBeGreaterThanOrEqual(40);
    expect(audit.unitsWithTooFewKeywords).toHaveLength(0);
    expect(audit.missingCapabilities).toHaveLength(0);
    expect(audit.coverageScore).toBe(100);
  });

  it("exposes that non-English languages are not complete learning systems yet", () => {
    const audits = auditAllLanguages().filter(
      (audit) => audit.languageId !== "en-US",
    );

    for (const audit of audits) {
      expect(audit.soundUnits).toBeGreaterThanOrEqual(10);
      expect(audit.averageKeywordsPerUnit).toBeGreaterThanOrEqual(6);
      expect(audit.missingCapabilities).toContain("证据驱动 mastery");
      expect(audit.missingCapabilities).toContain("本地授权教学视频");
      expect(audit.coverageScore).toBeLessThan(100);
    }
  });

  it("ensures every language default slug exists in its inventory", () => {
    for (const profile of getEnabledLanguageProfiles()) {
      const defaultSlug = getDefaultPhonemeSlug(profile.id);

      expect(profile.phonemeInventory.some((unit) => unit.slug === defaultSlug)).toBe(
        true,
      );
    }
  });

  it("ships expanded sound-unit maps for Spanish, French, and Russian", () => {
    const requiredByLanguage = {
      "es-ES": [
        "es-p",
        "es-t",
        "es-k",
        "es-tch",
        "es-y",
        "es-bdg-lenition",
        "es-r-contrast",
        "es-s-theta",
        "es-n-ny",
        "es-stress",
      ],
      "fr-FR": [
        "fr-a",
        "fr-o-close",
        "fr-o-open",
        "fr-p",
        "fr-b",
        "fr-sh",
        "fr-zh",
        "fr-j",
        "fr-hui",
        "fr-w",
        "fr-silent-finals",
        "fr-enchainement",
      ],
      "ru-RU": [
        "ru-e",
        "ru-td-pair",
        "ru-l-hard-soft",
        "ru-r-hard-soft",
        "ru-j",
        "ru-sh",
        "ru-zh",
        "ru-ts",
        "ru-ch",
        "ru-shch",
        "ru-stress",
        "ru-vowel-reduction",
        "ru-final-devoicing",
      ],
    } as const;

    expect(auditLanguageCoverage("es-ES").soundUnits).toBeGreaterThanOrEqual(35);
    expect(auditLanguageCoverage("fr-FR").soundUnits).toBeGreaterThanOrEqual(40);
    expect(auditLanguageCoverage("ru-RU").soundUnits).toBeGreaterThanOrEqual(30);

    for (const [languageId, slugs] of Object.entries(requiredByLanguage)) {
      for (const slug of slugs) {
        expect(getLanguagePhonemeBySlug(languageId as keyof typeof requiredByLanguage, slug)).toBeDefined();
      }
    }
  });

  it("keeps reviewed IPA details and avoids legacy combined Russian starter pages", () => {
    const spanishTrill = getLanguagePhonemeBySlug("es-ES", "es-trill-r");
    const spanishHiatus = getLanguagePhonemeBySlug("es-ES", "es-diphthong-hiatus");
    const frenchLiaison = getLanguagePhonemeBySlug("fr-FR", "fr-liaison");
    const russianI = getLanguagePhonemeBySlug("ru-RU", "ru-i");
    const russianTs = getLanguagePhonemeBySlug("ru-RU", "ru-ts");
    const russianCh = getLanguagePhonemeBySlug("ru-RU", "ru-ch");
    const russianFinalDevoicing = getLanguagePhonemeBySlug(
      "ru-RU",
      "ru-final-devoicing",
    );

    expect(
      spanishTrill?.keywords.find((entry) => entry.word === "rápido")?.ipa,
    ).toBe("/ˈrapido/");
    expect(
      spanishTrill?.keywords.find((entry) => entry.word === "río")?.ipa,
    ).toBe("/ˈri.o/");
    expect(
      spanishHiatus?.keywords.find((entry) => entry.word === "río")?.ipa,
    ).toBe("/ˈri.o/");

    expect(frenchLiaison?.name).toBe("liaison");
    expect(frenchLiaison?.keywords[0]?.ipa).toBe("/le.z‿a.mi/");
    expect(getLanguagePhonemeBySlug("fr-FR", "fr-enchainement")).toBeDefined();
    expect(getLanguagePhonemeBySlug("fr-FR", "fr-silent-finals")).toBeDefined();

    expect(russianI?.keywords.find((entry) => entry.word === "мир")?.ipa).toBe(
      "/mʲir/",
    );
    expect(russianTs?.ipa).toBe("/t͡s/");
    expect(russianCh?.ipa).toBe("/t͡ɕ/");
    expect(russianFinalDevoicing?.keywords[0]?.ipa).toBe("/drug/ → [druk]");
    expect(getLanguagePhonemeBySlug("ru-RU", "ru-sh-zh")).toBeUndefined();
    expect(getLanguagePhonemeBySlug("ru-RU", "ru-ts-ch-shch")).toBeUndefined();
    expect(getLanguagePhonemeBySlug("ru-RU", "ru-stress-reduction")).toBeUndefined();
  });

  it("keeps second-pass phonology review fixes in place", () => {
    const spanishD = getLanguagePhonemeBySlug("es-ES", "es-d");
    const spanishG = getLanguagePhonemeBySlug("es-ES", "es-g");
    const spanishB = getLanguagePhonemeBySlug("es-ES", "es-b");
    const spanishHiatus = getLanguagePhonemeBySlug("es-ES", "es-diphthong-hiatus");
    const spanishOU = getLanguagePhonemeBySlug("es-ES", "es-o-u");
    const frenchNasal = getLanguagePhonemeBySlug("fr-FR", "fr-nasal-contrast");
    const frenchEnchainement = getLanguagePhonemeBySlug("fr-FR", "fr-enchainement");
    const frenchRhythm = getLanguagePhonemeBySlug("fr-FR", "fr-rhythm-group");
    const russianStress = getLanguagePhonemeBySlug("ru-RU", "ru-stress");
    const russianFinalDevoicing = getLanguagePhonemeBySlug(
      "ru-RU",
      "ru-final-devoicing",
    );
    const russianKgx = getLanguagePhonemeBySlug("ru-RU", "ru-kgx-pair");
    const russianSz = getLanguagePhonemeBySlug("ru-RU", "ru-sz-pair");
    const russianSoftSign = getLanguagePhonemeBySlug("ru-RU", "ru-soft-sign");

    expect(spanishD?.keywords.map((entry) => entry.word)).not.toContain("nada");
    expect(spanishD?.keywords.map((entry) => entry.word)).not.toContain("lado");
    expect(spanishG?.ipa).toBe("/ɡ/");
    expect(spanishG?.keywords.map((entry) => entry.word)).not.toContain("agua");
    expect(spanishB?.keywords.map((entry) => entry.word)).not.toContain("bebé");
    expect(
      spanishHiatus?.keywords.find((entry) => entry.word === "día")?.ipa,
    ).toBe("/ˈdi.a/");
    expect(spanishOU?.name).toContain("near contrast");

    expect(frenchNasal?.keywords.map((entry) => entry.word)).not.toContain(
      "France / français",
    );
    expect(frenchEnchainement?.keywords[0]?.ipa).toBe("/a.vɛ.k‿ɛl/");
    expect(frenchRhythm?.keywords[0]?.ipa).toBe("/ʒə vu.dʁɛ œ̃ ka.fe/");

    expect(russianStress?.keywords.map((entry) => entry.word)).not.toContain(
      "во́да / вода́",
    );
    expect(russianStress?.keywords.map((entry) => entry.word)).toContain(
      "пла́чу / плачу́",
    );
    expect(
      russianFinalDevoicing?.keywords.find((entry) => entry.word === "город")?.ipa,
    ).toBe("/ˈgorod/ → [ˈgorət]");
    expect(russianKgx?.keywords.map((entry) => entry.word)).not.toContain("год");
    expect(russianSz?.keywords.map((entry) => entry.word)).not.toContain("зуб");
    expect(russianSoftSign?.keywords.map((entry) => entry.word)).not.toContain(
      "любовь",
    );
  });

  it("ships Spanish beta as real content, not only a language toggle", () => {
    const profile = getLanguageProfile("es-ES");
    const pack = getLanguageContentPack("es-ES");

    expect(profile.readiness.wordPractice).toBe(true);
    expect(profile.readiness.sentencePractice).toBe(true);
    expect(profile.readiness.diagnosis).toBe(true);
    expect(profile.readiness.evidenceMastery).toBe(false);
    expect(pack.assessment.screeningWords).toHaveLength(10);
    expect(pack.assessment.paragraph.length).toBeGreaterThan(120);
    expect(pack.sentenceBank.length).toBeGreaterThanOrEqual(12);
    expect(pack.minimalPairs.length).toBeGreaterThanOrEqual(5);
    expect(countLanguageTrainingWords("es-ES")).toBeGreaterThan(100);
  });

  it("keeps Spanish beta pronunciation references linguistically sane", () => {
    const pack = getLanguageContentPack("es-ES");
    const tapR = pack.wordBank["es-tap-r"]?.map((item) => item.word) ?? [];
    const trillR = pack.wordBank["es-trill-r"]?.map((item) => item.word) ?? [];
    const allMinimalPairWords = pack.minimalPairs.flatMap((set) =>
      set.pairs.flatMap((pair) => [pair.wordA, pair.wordB]),
    );
    const oU = pack.minimalPairs.find((set) => set.id === "es-o-u");
    const theta = getLanguagePhonemeBySlug("es-ES", "es-theta");

    expect(tapR).not.toContain("arroz");
    expect(trillR).toContain("arroz");
    expect(allMinimalPairWords).not.toContain("ano");
    expect(allMinimalPairWords).not.toContain("litchi");
    expect(allMinimalPairWords).toContain("peña");
    expect(oU?.kind).toBe("near-contrast");
    expect(theta?.description).not.toContain("送气");
  });

  it("keeps Spanish diagnosis and contrast references inside the Spanish inventory", () => {
    const pack = getLanguageContentPack("es-ES");
    const slugs = new Set(pack.phonemeUnits.map((unit) => unit.slug));
    const referenced = new Set<string>();

    for (const word of [
      ...pack.assessment.screeningWords,
      ...pack.assessment.adaptiveWords,
    ]) {
      for (const slug of word.targetPhonemes) referenced.add(slug);
    }
    for (const set of pack.minimalPairs) {
      referenced.add(set.phonemeA);
      referenced.add(set.phonemeB);
    }
    for (const slug of pack.assessment.trackedPhonemes) referenced.add(slug);

    expect([...referenced].filter((slug) => !slugs.has(slug))).toHaveLength(0);
  });

  it("keeps French and Russian gated until content and Azure evidence are ready", () => {
    for (const languageId of ["fr-FR", "ru-RU"] as const) {
      const profile = getLanguageProfile(languageId);
      const pack = getLanguageContentPack(languageId);

      expect(profile.readiness.wordPractice).toBe(false);
      expect(profile.readiness.sentencePractice).toBe(false);
      expect(profile.readiness.diagnosis).toBe(false);
      expect(profile.readiness.evidenceMastery).toBe(false);
      expect(pack.assessment.screeningWords).toHaveLength(0);
      expect(pack.sentenceBank).toHaveLength(0);
      expect(pack.minimalPairs).toHaveLength(0);
    }
  });
});
