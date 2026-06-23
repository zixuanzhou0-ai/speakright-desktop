import { describe, expect, it } from "vitest";
import {
  buildRecordingQualityReportFromMetrics,
  reliabilityFromRecordingQuality,
} from "@/lib/recording-quality";

describe("recording quality", () => {
  const stableReport = () =>
    buildRecordingQualityReportFromMetrics({
      durationMs: 2_000,
      peak: 0.35,
      rms: 0.08,
      silentRatio: 0.08,
      clippedRatio: 0,
      expectedMode: "sentence",
    });

  it("blocks recordings that are too short", () => {
    const report = buildRecordingQualityReportFromMetrics({
      durationMs: 320,
      peak: 0.4,
      rms: 0.08,
      silentRatio: 0.1,
      clippedRatio: 0,
      minDurationMs: 500,
      expectedMode: "word",
    });

    expect(report.canSubmit).toBe(false);
    expect(report.issues.map((issue) => issue.code)).toContain("too-short");
  });

  it("blocks nearly silent recordings", () => {
    const report = buildRecordingQualityReportFromMetrics({
      durationMs: 1_500,
      peak: 0.008,
      rms: 0.001,
      silentRatio: 0.98,
      clippedRatio: 0,
      expectedMode: "sentence",
    });

    expect(report.canSubmit).toBe(false);
    expect(report.issues.some((issue) => issue.severity === "blocker")).toBe(
      true,
    );
  });

  it("warns but still allows low-volume usable recordings", () => {
    const report = buildRecordingQualityReportFromMetrics({
      durationMs: 2_000,
      peak: 0.065,
      rms: 0.012,
      silentRatio: 0.2,
      clippedRatio: 0,
      expectedMode: "sentence",
    });

    expect(report.canSubmit).toBe(true);
    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "low-level", severity: "warning" }),
      ]),
    );
  });

  it("warns on clipping and long silence without blocking", () => {
    const report = buildRecordingQualityReportFromMetrics({
      durationMs: 4_000,
      peak: 0.99,
      rms: 0.05,
      silentRatio: 0.72,
      clippedRatio: 0.02,
      expectedMode: "paragraph",
    });

    expect(report.canSubmit).toBe(true);
    expect(report.issues.map((issue) => issue.code)).toEqual([
      "clipping",
      "long-silence",
    ]);
  });

  it("keeps stable English recordings eligible for formal mastery evidence", () => {
    const reliability = reliabilityFromRecordingQuality(stableReport(), {
      languageId: "en-US",
    });

    expect(reliability.canPromoteMastery).toBe(true);
    expect(reliability.note).toContain("可计入掌握度");
  });

  it("blocks formal mastery promotion for experimental languages", () => {
    for (const languageId of ["es-ES", "fr-FR", "ru-RU"] as const) {
      const reliability = reliabilityFromRecordingQuality(stableReport(), {
        languageId,
        note: "录音质量稳定，可计入掌握度。",
      });

      expect(reliability.canPromoteMastery, languageId).toBe(false);
      expect(reliability.note, languageId).toContain("experimental");
      expect(reliability.note, languageId).toContain("不生成正式 mastery");
      expect(reliability.note, languageId).not.toContain("可计入掌握度");
    }
  });
});
