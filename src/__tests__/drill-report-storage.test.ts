import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DRILL_REPORT_STORAGE_WARNING,
  loadDrillReportForLanguage,
} from "@/lib/drill-report-storage";

const REPORT_STORAGE_KEY = "speakright_assessment_result_v2";

describe("drill report storage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("loads the language-specific diagnosis report first", () => {
    localStorage.setItem(
      `${REPORT_STORAGE_KEY}:en-US`,
      JSON.stringify({ languageId: "en-US", source: "quick-assessment" }),
    );
    localStorage.setItem(
      REPORT_STORAGE_KEY,
      JSON.stringify({ languageId: "legacy", source: "quick-assessment" }),
    );

    const result = loadDrillReportForLanguage("en-US");

    expect(result.warning).toBeNull();
    expect(result.report).toMatchObject({ languageId: "en-US" });
  });

  it("falls back to the English base diagnosis report when the language key is empty", () => {
    localStorage.setItem(
      REPORT_STORAGE_KEY,
      JSON.stringify({ languageId: "en-US", source: "quick-assessment" }),
    );

    const result = loadDrillReportForLanguage("en-US");

    expect(result.warning).toBeNull();
    expect(result.report).toMatchObject({ languageId: "en-US" });
  });

  it("does not mask a corrupt language-specific diagnosis report with the English fallback", () => {
    localStorage.setItem(`${REPORT_STORAGE_KEY}:en-US`, "{broken report");
    localStorage.setItem(
      REPORT_STORAGE_KEY,
      JSON.stringify({ languageId: "en-US", source: "quick-assessment" }),
    );

    const result = loadDrillReportForLanguage("en-US");

    expect(result.report).toBeNull();
    expect(result.warning).toBe(DRILL_REPORT_STORAGE_WARNING);
  });

  it("returns a recovery warning when storage cannot be read", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked storage");
    });

    const result = loadDrillReportForLanguage("es-ES");

    expect(result.report).toBeNull();
    expect(result.warning).toBe(DRILL_REPORT_STORAGE_WARNING);
    expect(result.warning).toContain("重置本机学习数据");
  });
});
