import type { DiagnosisReport } from "@/types/diagnosis";

const REPORT_STORAGE_KEY = "speakright_assessment_result_v2";

export const DRILL_REPORT_STORAGE_WARNING =
  "上次诊断报告无法读取，已暂时按未诊断状态展示。可以重新完成 3 分钟诊断，或到设置的数据与隐私中心导出诊断后重置本机学习数据。";

export interface DrillReportLoadResult {
  report: DiagnosisReport | null;
  warning: string | null;
}

function emptyResult(): DrillReportLoadResult {
  return { report: null, warning: null };
}

function readReport(key: string): DrillReportLoadResult {
  if (typeof window === "undefined") return emptyResult();

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return emptyResult();
    return { report: JSON.parse(raw) as DiagnosisReport, warning: null };
  } catch {
    return { report: null, warning: DRILL_REPORT_STORAGE_WARNING };
  }
}

export function loadDrillReportForLanguage(
  languageId: string,
): DrillReportLoadResult {
  const languageReport = readReport(`${REPORT_STORAGE_KEY}:${languageId}`);

  if (
    languageReport.report ||
    languageReport.warning ||
    languageId !== "en-US"
  ) {
    return languageReport;
  }

  return readReport(REPORT_STORAGE_KEY);
}
