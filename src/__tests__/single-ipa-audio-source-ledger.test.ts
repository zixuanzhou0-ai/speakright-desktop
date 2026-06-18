import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ledgerPath = join(
  process.cwd(),
  "docs",
  "operations",
  "SINGLE_IPA_AUDIO_SOURCE_LEDGER.md",
);

describe("single IPA audio source ledger", () => {
  const ledger = readFileSync(ledgerPath, "utf8");

  it("keeps the Russian soft-member gaps explicit", () => {
    for (const slug of [
      "ru-t-tj",
      "ru-d-dj",
      "ru-s-sj",
      "ru-z-zj",
      "ru-n-nj",
      "ru-l-lj",
      "ru-p-pj",
      "ru-b-bj",
      "ru-m-mj",
      "ru-f-fj",
      "ru-v-vj",
      "ru-k-kj",
      "ru-g-gj",
      "ru-x-xj",
    ]) {
      expect(ledger).toContain(`\`${slug}\``);
    }

    expect(ledger).toContain(
      "`ru-r-rj` already has standalone hard and soft exact clips",
    );
  });

  it("blocks word, phrase, TTS, rule, and teaching-video media from single-sound registration", () => {
    expect(ledger).toContain(
      "Whole words, phrases, sentence audio, rule explanations, teaching-video tracks",
    );
    expect(ledger).toMatch(
      /EasyPronunciation examples may support future teaching media,[\s\S]*accepted as single IPA clips/,
    );
    expect(ledger).toMatch(
      /If a unit is not verified,[\s\S]*show a score[\s\S]*tile[\s\S]*unclickable/,
    );
  });
});
