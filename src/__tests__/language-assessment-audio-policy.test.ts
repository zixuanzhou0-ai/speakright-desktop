import { describe, expect, it } from "vitest";
import { LOCAL_LANGUAGE_PHONEME_ASSETS } from "@/lib/local-language-assets";
import {
  formatLanguageAssessmentAudioPolicyMarkdownDocument,
  formatLanguageAssessmentAudioPolicyMarkdownTable,
  getAllLanguageAssessmentAudioPolicyRows,
  getLanguageAssessmentAudioPolicyRows,
  getLanguageAssessmentAudioPolicyTableRows,
} from "@/lib/language-assessment-audio-policy";
import { getLanguagePhonologyInventory } from "@/lib/language-phonology-inventory";
import type { LanguageId } from "@/types/language";

const LANGUAGE_IDS = ["es-ES", "fr-FR", "ru-RU"] as const;

describe("language assessment audio policy", () => {
  it("exports one auditable policy row per non-English inventory entry", () => {
    const allRows = getAllLanguageAssessmentAudioPolicyRows();
    const totalInventoryRows = LANGUAGE_IDS.reduce(
      (total, languageId) =>
        total + getLanguagePhonologyInventory(languageId).length,
      0,
    );

    expect(allRows).toHaveLength(totalInventoryRows);

    for (const languageId of LANGUAGE_IDS) {
      const rows = getLanguageAssessmentAudioPolicyRows(languageId);
      const inventory = getLanguagePhonologyInventory(languageId);

      expect(rows).toHaveLength(inventory.length);
      expect(rows.map((row) => row.slug).sort()).toEqual(
        inventory.map((entry) => entry.slug).sort(),
      );

      for (const row of rows) {
        expect(row.languageId).toBe(languageId);
        expect(row.ipa).toBeTruthy();
        expect(row.variantScope).toBeTruthy();
        expect(row.sourceRefs.length, row.slug).toBeGreaterThanOrEqual(2);
        expect(row.reason, row.slug).toBeTruthy();
      }
    }
  });

  it("marks clickable rows only when registry audio is the same exact local header clip", () => {
    for (const languageId of LANGUAGE_IDS) {
      for (const row of getLanguageAssessmentAudioPolicyRows(languageId)) {
        if (row.tilePolicy !== "clickable-exact-header") {
          expect(row.shouldBeClickable, row.slug).toBe(false);
          expect(row.hasRegistryEntry, row.slug).toBe(false);
          expect(row.registryEntryCount, row.slug).toBe(0);
          expect(row.registryAliases, row.slug).toEqual([]);
          expect(row.registryAudioUrl, row.slug).toBeUndefined();
          continue;
        }

        expect(row.policyStatus, row.slug).toBe("clickable-exact-header");
        expect(row.audioStatus, row.slug).toBe("exact-local-header");
        expect(row.shouldBeClickable, row.slug).toBe(true);
        expect(row.hasRegistryEntry, row.slug).toBe(true);
        expect(row.registryEntryCount, row.slug).toBe(1);
        expect(row.registryAliases.length, row.slug).toBeGreaterThan(0);
        expect(row.registryAudioUrl, row.slug).toBe(row.headerAudioSrc);
        expect(row.registryAudioUrl, row.slug).toMatch(
          new RegExp(`^/audio/language-assets/${languageId}/header-clips/`),
        );
        expect(row.registryAudioUrl, row.slug).toMatch(/\.m4a$/);
        expect(row.registryUsesPlayableHeaderClip, row.slug).toBe(true);
        expect(row.registryMatchesHeaderAudio, row.slug).toBe(true);
        expect(row.localAssetIsProxy, row.slug).toBe(false);
      }
    }
  });

  it("turns proxy local assets into explicit unclickable policy rows", () => {
    const proxyAssets = LOCAL_LANGUAGE_PHONEME_ASSETS.filter(
      (asset) => asset.isProxyForAssessment,
    );

    expect(proxyAssets.length).toBeGreaterThan(0);

    for (const asset of proxyAssets) {
      const row = getLanguageAssessmentAudioPolicyRows(asset.languageId).find(
        (candidate) => candidate.slug === asset.slug,
      );

      expect(row, `${asset.languageId}:${asset.slug}`).toBeDefined();
      expect(row?.localAssetIsProxy, asset.slug).toBe(true);
      expect(row?.policyStatus, asset.slug).toBe("blocked-proxy-reference");
      expect(row?.shouldBeClickable, asset.slug).toBe(false);
      expect(row?.hasRegistryEntry, asset.slug).toBe(false);
      expect(row?.registryAliases, asset.slug).toEqual([]);
      expect(row?.headerAudioSrc, asset.slug).toBe(asset.audioSrc);
    }
  });

  it("keeps rule-only units separate from proxy and unverified rows", () => {
    const expectedRuleRows = [
      ["es-ES", "es-lexical-stress"],
      ["es-ES", "es-syllable-rhythm"],
      ["fr-FR", "fr-liaison"],
      ["fr-FR", "fr-enchainement"],
      ["fr-FR", "fr-elision"],
      ["fr-FR", "fr-final-consonant-silence"],
      ["fr-FR", "fr-phrase-final-prominence"],
    ] as const;

    for (const [languageId, slug] of expectedRuleRows) {
      const row = getLanguageAssessmentAudioPolicyRows(languageId).find(
        (candidate) => candidate.slug === slug,
      );

      expect(row?.policyStatus, `${languageId}:${slug}`).toBe(
        "blocked-rule-guidance",
      );
      expect(row?.audioStatus, `${languageId}:${slug}`).toBe("rule-only");
      expect(row?.tilePolicy, `${languageId}:${slug}`).toBe(
        "rule-guidance-only",
      );
      expect(row?.shouldBeClickable, `${languageId}:${slug}`).toBe(false);
      expect(row?.headerAudioSrc, `${languageId}:${slug}`).toBeUndefined();
      expect(row?.reason, `${languageId}:${slug}`).toContain(
        "rule, phrase, or prosody",
      );
    }
  });

  it("keeps score-only gaps visibly unverified instead of treating nearby assets as audio", () => {
    const expectedUnverifiedRows = [
      ["es-ES", "es-p"],
      ["es-ES", "es-b-stop"],
      ["fr-FR", "fr-p"],
      ["fr-FR", "fr-v"],
      ["ru-RU", "ru-t-tj"],
      ["ru-RU", "ru-r-rj"],
    ] as const;

    for (const [languageId, slug] of expectedUnverifiedRows) {
      const row = getLanguageAssessmentAudioPolicyRows(languageId).find(
        (candidate) => candidate.slug === slug,
      );

      expect(row?.policyStatus, `${languageId}:${slug}`).toBe(
        "blocked-unverified",
      );
      expect(row?.audioStatus, `${languageId}:${slug}`).toBe(
        "gap-no-local-clip",
      );
      expect(row?.tilePolicy, `${languageId}:${slug}`).toBe(
        "score-only-unverified",
      );
      expect(row?.shouldBeClickable, `${languageId}:${slug}`).toBe(false);
      expect(row?.registryMatchesHeaderAudio, `${languageId}:${slug}`).toBe(
        false,
      );
      expect(row?.reason, `${languageId}:${slug}`).toContain("No verified");
    }
  });

  it("formats policy tables with release-auditable columns", () => {
    for (const languageId of LANGUAGE_IDS) {
      const tableRows = getLanguageAssessmentAudioPolicyTableRows(languageId);
      const markdown = formatLanguageAssessmentAudioPolicyMarkdownTable(languageId);

      expect(tableRows).toHaveLength(
        getLanguagePhonologyInventory(languageId).length,
      );
      expect(markdown).toContain(
        "| slug | IPA | layer | audio status | tile policy | policy status | clickable | header audio | registry audio | aliases | reason |",
      );
      expect(markdown.split("\n")).toHaveLength(tableRows.length + 2);
      expect(markdown).toContain("clickable-exact-header");
      expect(markdown).toContain("blocked-unverified");

      if (languageId !== "fr-FR") {
        expect(markdown).toContain("blocked-proxy-reference");
      }
    }
  });

  it("formats generated policy documents with experimental status and playback boundaries", () => {
    for (const languageId of LANGUAGE_IDS) {
      const document =
        formatLanguageAssessmentAudioPolicyMarkdownDocument(languageId);
      const clickableCount = getLanguageAssessmentAudioPolicyRows(
        languageId,
      ).filter((row) => row.shouldBeClickable).length;

      expect(document).toContain("Product status: experimental");
      expect(document).toContain(
        "Generated from `src/lib/language-assessment-audio-policy.ts`",
      );
      expect(document).toContain(
        `- Clickable exact scoring tiles: ${clickableCount}`,
      );
      expect(document).toContain(
        "Proxy, rule guidance, whole-word, sentence, dictionary, generated TTS, and video-track material must stay unclickable.",
      );
      expect(document).toContain("## Audio Policy");
      expect(document).toContain("blocked-unverified");
    }
  });

  it("does not expose an English policy table", () => {
    expect(
      () =>
        getLanguageAssessmentAudioPolicyRows(
          "en-US" as Exclude<LanguageId, "en-US">,
        ),
    ).toThrow();
  });
});
