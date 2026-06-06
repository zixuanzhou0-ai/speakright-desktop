import { describe, expect, it } from "vitest";
import {
  benchmarkGroupKey,
  encodeBenchmarkAudioBlob,
  summarizeBenchmarkGroups,
  summarizeBenchmarkTrend,
} from "@/lib/benchmark-archive";
import type { BenchmarkRecordingMeta } from "@/lib/benchmark-archive";

function benchmark(
  item: Omit<BenchmarkRecordingMeta, "languageId"> &
    Partial<Pick<BenchmarkRecordingMeta, "languageId">>,
): BenchmarkRecordingMeta {
  return { languageId: "en-US", ...item };
}

describe("benchmark archive", () => {
  it("summarizes before/after score trend", () => {
    const trend = summarizeBenchmarkTrend([
      benchmark({
        id: "a",
        createdAt: 1000,
        source: "prosody",
        title: "first",
        text: "hello",
        score: 68,
        targetLabel: "stress",
      }),
      benchmark({
        id: "b",
        createdAt: 2000,
        source: "prosody",
        title: "second",
        text: "hello",
        score: 82,
        targetLabel: "stress",
      }),
    ]);

    expect(trend.latestScore).toBe(82);
    expect(trend.bestScore).toBe(82);
    expect(trend.deltaFromFirst).toBe(14);
    expect(trend.count).toBe(2);
  });

  it("handles empty trend safely", () => {
    expect(summarizeBenchmarkTrend([])).toEqual({
      latestScore: 0,
      bestScore: 0,
      deltaFromFirst: 0,
      count: 0,
    });
  });

  it("groups trends by source, target and normalized text", () => {
    const groups = summarizeBenchmarkGroups([
      benchmark({
        id: "a",
        createdAt: 1000,
        source: "prosody",
        title: "first",
        text: "Hello, world!",
        score: 70,
        targetLabel: "stress",
      }),
      benchmark({
        id: "b",
        createdAt: 2000,
        source: "prosody",
        title: "second",
        text: "hello world",
        score: 80,
        targetLabel: "stress",
      }),
      benchmark({
        id: "c",
        createdAt: 3000,
        source: "scenario",
        title: "scenario",
        text: "hello world",
        score: 95,
        targetLabel: "stress",
      }),
    ]);

    expect(groups).toHaveLength(2);
    expect(
      groups.find((group) => group.source === "prosody")?.trend,
    ).toMatchObject({
      latestScore: 80,
      deltaFromFirst: 10,
      count: 2,
    });
    expect(benchmarkGroupKey(groups[0].recordings[0])).toContain("stress");
  });

  it("normalizes target label order for scenario trend grouping", () => {
    const first = benchmarkGroupKey(benchmark({
      id: "a",
      createdAt: 1000,
      source: "scenario",
      title: "scenario",
      text: "I worked late.",
      score: 80,
      targetLabel: "v-w, final-consonants",
    }));
    const second = benchmarkGroupKey(benchmark({
      id: "b",
      createdAt: 2000,
      source: "scenario",
      title: "scenario",
      text: "I worked late.",
      score: 85,
      targetLabel: "final-consonants, v-w",
    }));

    expect(first).toBe(second);
  });

  it("separates identical benchmark text by language", () => {
    const english = benchmarkGroupKey(
      benchmark({
        id: "en",
        createdAt: 1000,
        source: "scenario",
        title: "scenario",
        text: "No.",
        score: 80,
        targetLabel: "stress",
      }),
    );
    const spanish = benchmarkGroupKey(
      benchmark({
        id: "es",
        languageId: "es-ES",
        createdAt: 1000,
        source: "scenario",
        title: "scenario",
        text: "No.",
        score: 80,
        targetLabel: "stress",
      }),
    );

    expect(english).not.toBe(spanish);
  });

  it("encodes benchmark audio blobs for data export", async () => {
    const encoded = await encodeBenchmarkAudioBlob(
      "bench-1",
      new Blob(["abc"], { type: "audio/webm" }),
    );

    expect(encoded).toEqual({
      id: "bench-1",
      mimeType: "audio/webm",
      bytes: 3,
      dataBase64: "YWJj",
    });
  });
});
