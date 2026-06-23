import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ASSESSMENT_REPORT_STORAGE_WARNING,
  assessmentReportStorageKeyFor,
  loadAssessmentReportForLanguage,
} from "@/lib/assessment-report-storage";

const LEGACY_STORAGE_KEY = "speakright_assessment_result";

function legacyReport() {
  return {
    timestamp: 123_456,
    overallScore: 72,
    dimensions: {
      pronunciation: 70,
      fluency: 74,
      integrity: 80,
      rhythm: 68,
    },
    phonemeScores: {
      th: 54,
      ee: 88,
    },
    weakPhonemes: ["th"],
  };
}

describe("assessment report storage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("loads the language-specific quick diagnosis report", () => {
    localStorage.setItem(
      assessmentReportStorageKeyFor("fr-FR"),
      JSON.stringify({ languageId: "fr-FR", source: "quick-assessment" }),
    );

    const result = loadAssessmentReportForLanguage("fr-FR");

    expect(result.warning).toBeNull();
    expect(result.report).toMatchObject({ languageId: "fr-FR" });
  });

  it("migrates the legacy English report when the v2 language report is absent", () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(legacyReport()));

    const result = loadAssessmentReportForLanguage("en-US");

    expect(result.warning).toBeNull();
    expect(result.report).toMatchObject({
      version: 2,
      languageId: "en-US",
      overallScore: 72,
    });
    expect(result.report?.issues[0]?.id).toBe("legacy-th");
  });

  it("does not mask a corrupt current English report with a legacy fallback", () => {
    localStorage.setItem(assessmentReportStorageKeyFor("en-US"), "{broken v2");
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(legacyReport()));

    const result = loadAssessmentReportForLanguage("en-US");

    expect(result.report).toBeNull();
    expect(result.warning).toBe(ASSESSMENT_REPORT_STORAGE_WARNING);
  });

  it("returns a warning for corrupt legacy English reports", () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, "{broken legacy");

    const result = loadAssessmentReportForLanguage("en-US");

    expect(result.report).toBeNull();
    expect(result.warning).toBe(ASSESSMENT_REPORT_STORAGE_WARNING);
    expect(result.warning).toContain("重置本机学习数据");
  });

  it("returns a warning when storage cannot be read", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked storage");
    });

    const result = loadAssessmentReportForLanguage("en-US");

    expect(result.report).toBeNull();
    expect(result.warning).toBe(ASSESSMENT_REPORT_STORAGE_WARNING);
  });
});
