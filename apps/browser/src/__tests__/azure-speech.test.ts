import { describe, expect, it } from "vitest";
import { parseAzureResult } from "@/lib/azure-speech";

describe("parseAzureResult", () => {
  it("uses REST AccuracyScore as total score when PronScore is absent", () => {
    const result = parseAzureResult({
      NBest: [
        {
          AccuracyScore: 89,
          Words: [
            {
              Word: "casa",
              AccuracyScore: 81,
              Phonemes: [{ Phoneme: "k", AccuracyScore: 92 }],
            },
          ],
        },
      ],
    });

    expect(result.pronunciationScore).toBe(89);
    expect(result.accuracyScore).toBe(89);
    expect(result.words[0]?.accuracyScore).toBe(81);
    expect(result.words[0]?.phonemes[0]?.accuracyScore).toBe(92);
  });

  it("falls back to average word accuracy when only word scores exist", () => {
    const result = parseAzureResult({
      NBest: [
        {
          Words: [
            { Word: "si", AccuracyScore: 40 },
            { Word: "oui", AccuracyScore: 80 },
          ],
        },
      ],
    });

    expect(result.pronunciationScore).toBe(60);
    expect(result.accuracyScore).toBe(60);
  });
});