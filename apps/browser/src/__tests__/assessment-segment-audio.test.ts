import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getAllAssessmentSegmentAudioEntries,
  getAllAssessmentSegmentAudioRegistryEntries,
} from "@/lib/assessment-segment-audio";
import {
  getAssessmentPhonemeLabel,
  getPhonemeAudioInfo,
  getPhonemeAudioUrl,
} from "@/lib/azure-phoneme-map";
import { getLocalLanguagePhonemeAsset } from "@/lib/local-language-assets";
import type { LanguageId } from "@/types/language";

const VERIFIED_SEGMENTS: Record<Exclude<LanguageId, "en-US">, string[]> = {
  "es-ES": [
    "a",
    "e",
    "i",
    "o",
    "u",
    "p",
    "t",
    "k",
    "f",
    "m",
    "n",
    "b",
    "d",
    "g",
    "β",
    "ð",
    "ɣ",
    "θ",
    "x",
    "ɲ",
    "ɾ",
    "r",
    "s",
    "tʃ",
    "ʝ",
    "l",
    "j",
    "w",
  ],
  "fr-FR": [
    "i",
    "y",
    "u",
    "e",
    "ɛ",
    "eh",
    "ø",
    "œ",
    "ə",
    "ax",
    "o",
    "ɔ",
    "a",
    "ɑ̃",
    "ɛ̃",
    "ɔ̃",
    "œ̃",
    "p",
    "b",
    "t",
    "d",
    "k",
    "g",
    "ɡ",
    "f",
    "v",
    "s",
    "z",
    "m",
    "n",
    "l",
    "ʁ",
    "ʃ",
    "ʒ",
    "ɲ",
    "j",
    "ɥ",
    "w",
  ],
  "ru-RU": [
    "a",
    "o",
    "i",
    "ɨ",
    "u",
    "e",
    "ɛ",
    "p",
    "b",
    "t",
    "d",
    "k",
    "g",
    "f",
    "v",
    "s",
    "z",
    "m",
    "n",
    "l",
    "r",
    "x",
    "ʂ",
    "ʐ",
    "ts",
    "t͡s",
    "tɕ",
    "t͡ɕ",
    "ɕː",
    "j",
    "rʲ",
    "rj",
  ],
};

function expectExactHeaderClip(segment: string, languageId: LanguageId) {
  const audioInfo = getPhonemeAudioInfo(segment, languageId);
  expect(audioInfo, `${languageId}:${segment}`).not.toBeNull();
  expect(getPhonemeAudioUrl(segment, languageId)).toBe(audioInfo?.url);
  expect(audioInfo?.kind, `${languageId}:${segment}`).toBe("sound-unit");
  expect(audioInfo?.url, `${languageId}:${segment}`).toMatch(
    new RegExp(`^/audio/language-assets/${languageId}/header-clips/`),
  );
  expect(audioInfo?.url, `${languageId}:${segment}`).toMatch(/\.m4a$/);
  expect(audioInfo?.url, `${languageId}:${segment}`).not.toContain(
    "/audio/language-packs/",
  );
  expect(audioInfo?.url, `${languageId}:${segment}`).not.toMatch(
    /\.(mp4|m4v|webm)(?:$|\?)/i,
  );
  expect(audioInfo?.startMs, `${languageId}:${segment}`).toBe(15);
  expect(audioInfo?.maxDurationMs, `${languageId}:${segment}`).toBe(500);
  expect(audioInfo?.fadeOutMs, `${languageId}:${segment}`).toBe(60);
}

describe("assessment segment audio inventory", () => {
  it("makes only exact Spanish/French/Russian header clips clickable", () => {
    for (const [languageId, segments] of Object.entries(VERIFIED_SEGMENTS) as [
      Exclude<LanguageId, "en-US">,
      string[],
    ][]) {
      for (const segment of segments) {
        expectExactHeaderClip(segment, languageId);
      }
    }
  });

  it("uses the same localSrc as the matching left/detail sound unit", () => {
    const expected = [
      ["es-ES", "β", "es-bv"],
      ["es-ES", "ð", "es-d"],
      ["es-ES", "ɣ", "es-g"],
      ["es-ES", "p", "es-p"],
      ["es-ES", "t", "es-t"],
      ["es-ES", "k", "es-k"],
      ["es-ES", "f", "es-f"],
      ["es-ES", "m", "es-m"],
      ["es-ES", "n", "es-n"],
      ["es-ES", "b", "es-b-stop"],
      ["es-ES", "d", "es-d-stop"],
      ["es-ES", "g", "es-g-stop"],
      ["es-ES", "θ", "es-theta"],
      ["es-ES", "j", "es-diphthongs-j"],
      ["fr-FR", "p", "fr-p"],
      ["fr-FR", "b", "fr-b"],
      ["fr-FR", "t", "fr-t"],
      ["fr-FR", "d", "fr-d"],
      ["fr-FR", "k", "fr-k"],
      ["fr-FR", "g", "fr-g"],
      ["fr-FR", "ɡ", "fr-g"],
      ["fr-FR", "f", "fr-f"],
      ["fr-FR", "v", "fr-v"],
      ["fr-FR", "s", "fr-s"],
      ["fr-FR", "z", "fr-z"],
      ["fr-FR", "m", "fr-m"],
      ["fr-FR", "n", "fr-n"],
      ["fr-FR", "l", "fr-l"],
      ["fr-FR", "ɛ", "fr-e-open"],
      ["fr-FR", "ə", "fr-schwa"],
      ["fr-FR", "ʁ", "fr-r"],
      ["ru-RU", "ɨ", "ru-y"],
      ["ru-RU", "p", "ru-p"],
      ["ru-RU", "g", "ru-g"],
      ["ru-RU", "f", "ru-f"],
      ["ru-RU", "v", "ru-v"],
      ["ru-RU", "s", "ru-s"],
      ["ru-RU", "z", "ru-z"],
      ["ru-RU", "m", "ru-m"],
      ["ru-RU", "n", "ru-n"],
      ["ru-RU", "l", "ru-l"],
      ["ru-RU", "ʂ", "ru-sh"],
      ["ru-RU", "ʐ", "ru-zh"],
      ["ru-RU", "tɕ", "ru-ch"],
      ["ru-RU", "ɕː", "ru-shch"],
      ["ru-RU", "rʲ", "ru-r-rj"],
      ["ru-RU", "rj", "ru-r-rj"],
    ] as const;

    for (const [languageId, segment, slug] of expected) {
      const asset = getLocalLanguagePhonemeAsset(languageId, slug);
      expect(asset?.audioSrc, `${languageId}:${slug}`).toBeTruthy();
      expect(getPhonemeAudioUrl(segment, languageId)).toBe(asset?.audioSrc);
    }
  });

  it("keeps the canción breakdown honest: exact vowels, plain consonants, fricatives, and glides play", () => {
    const exactSources = [
      ["a", "/audio/language-assets/es-ES/header-clips/es-a.m4a"],
      ["k", "/audio/language-assets/es-ES/header-clips/es-k.m4a"],
      ["n", "/audio/language-assets/es-ES/header-clips/es-n.m4a"],
      ["θ", "/audio/language-assets/es-ES/header-clips/es-theta.m4a"],
      ["j", "/audio/language-assets/es-ES/header-clips/es-diphthongs-j.m4a"],
      ["o", "/audio/language-assets/es-ES/header-clips/es-o.m4a"],
    ] as const;

    for (const [segment, source] of exactSources) {
      const audioInfo = getPhonemeAudioInfo(segment, "es-ES");
      expect(audioInfo?.kind, segment).toBe("sound-unit");
      expect(audioInfo?.url, segment).toBe(source);
    }
  });

  it("keeps Spanish plain stops and approximant allophones on separate clips", () => {
    for (const [segment, source] of [
      ["b", "/audio/language-assets/es-ES/header-clips/es-b-stop.m4a"],
      ["d", "/audio/language-assets/es-ES/header-clips/es-d-stop.m4a"],
      ["g", "/audio/language-assets/es-ES/header-clips/es-g-stop.m4a"],
      ["p", "/audio/language-assets/es-ES/header-clips/es-p.m4a"],
      ["t", "/audio/language-assets/es-ES/header-clips/es-t.m4a"],
      ["k", "/audio/language-assets/es-ES/header-clips/es-k.m4a"],
      ["f", "/audio/language-assets/es-ES/header-clips/es-f.m4a"],
    ] as const) {
      expect(getPhonemeAudioUrl(segment, "es-ES")).toBe(source);
    }

    for (const segment of ["v"] as const) {
      expect(getPhonemeAudioInfo(segment, "es-ES")).toBeNull();
      expect(getPhonemeAudioUrl(segment, "es-ES")).toBeNull();
    }

    expect(getPhonemeAudioUrl("β", "es-ES")).toBe(
      "/audio/language-assets/es-ES/header-clips/es-bv.m4a",
    );
    expect(getPhonemeAudioUrl("ð", "es-ES")).toBe(
      "/audio/language-assets/es-ES/header-clips/es-d.m4a",
    );
    expect(getPhonemeAudioUrl("ɣ", "es-ES")).toBe(
      "/audio/language-assets/es-ES/header-clips/es-g.m4a",
    );
  });

  it("keeps rule/proxy-only or unverified segments unclickable instead of falling back to word audio", () => {
    for (const [languageId, segment] of [
      ["es-ES", "ŋ"],
      ["es-ES", "h"],
      ["es-ES", "ʎ"],
      ["es-ES", "y"],
      ["es-ES", "ll"],
      ["fr-FR", "‿"],
      ["fr-FR", "liaison"],
      ["ru-RU", "h"],
      ["ru-RU", "tʃ"],
      ["ru-RU", "ch"],
      ["ru-RU", "ʃ"],
      ["ru-RU", "sh"],
      ["ru-RU", "ʒ"],
      ["ru-RU", "zh"],
      ["ru-RU", "ʃː"],
      ["ru-RU", "ɐ"],
      ["ru-RU", "ə"],
      ["ru-RU", "tʲ"],
      ["ru-RU", "dʲ"],
      ["ru-RU", "final devoicing"],
      ["ru-RU", "cluster"],
      ["ru-RU", "not-a-real-code"],
    ] as const) {
      expect(getPhonemeAudioInfo(segment, languageId)).toBeNull();
      expect(getPhonemeAudioUrl(segment, languageId)).toBeNull();
    }
  });

  it("keeps unverified non-English labels specific instead of using broad course-unit labels", () => {
    expect(getAssessmentPhonemeLabel("ɱ", "es-ES")).toBe("/ɱ/");
    expect(getAssessmentPhonemeLabel("m", "es-ES")).toBe("/m/");
    expect(getAssessmentPhonemeLabel("n", "es-ES")).toBe("/n/");
    expect(getAssessmentPhonemeLabel("final devoicing", "ru-RU")).toBe(
      "/final devoicing/",
    );
    expect(getAssessmentPhonemeLabel("‿", "fr-FR")).toBe("/‿/");
  });

  it("points every inventory entry at a real bundled m4a header clip", () => {
    const missingOrEmpty = getAllAssessmentSegmentAudioEntries()
      .map((entry) => entry.audioUrl.replace(/^\//, ""))
      .filter((publicPath) => {
        const diskPath = join(process.cwd(), "public", publicPath);
        return (
          !publicPath.endsWith(".m4a") ||
          publicPath.includes("/language-packs/") ||
          !publicPath.includes("/header-clips/") ||
          !existsSync(diskPath) ||
          statSync(diskPath).size < 1024
        );
      });

    expect(missingOrEmpty).toEqual([]);
  });

  it("keeps every exact registry alias tied to a single local sound-unit header clip", () => {
    const duplicateAliases = new Map<string, string[]>();
    for (const entry of getAllAssessmentSegmentAudioRegistryEntries()) {
      expect(entry.kind).toBe("sound-unit");
      expect(entry.audioUrl).toBe(
        getLocalLanguagePhonemeAsset(entry.languageId, entry.soundUnitSlug)
          ?.audioSrc,
      );
      for (const alias of entry.aliases) {
        const key = `${entry.languageId}:${alias}`;
        duplicateAliases.set(key, [
          ...(duplicateAliases.get(key) ?? []),
          entry.soundUnitSlug,
        ]);
      }
    }

    const collisions = [...duplicateAliases.entries()]
      .filter(([, slugs]) => new Set(slugs).size > 1)
      .map(([alias, slugs]) => `${alias}:${slugs.join(",")}`);

    expect(collisions).toEqual([]);
  });
});
