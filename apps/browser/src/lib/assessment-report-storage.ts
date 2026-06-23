import { getPhonemeBySlug } from "@/lib/phoneme-data";
import { buildTrainingPrescription } from "@/lib/training-prescription";
import type { AssessmentResult as LegacyAssessmentResult } from "@/types/assessment";
import type { DiagnosisReport } from "@/types/diagnosis";

const STORAGE_KEY_V2 = "speakright_assessment_result_v2";
const LEGACY_STORAGE_KEY = "speakright_assessment_result";

export const ASSESSMENT_REPORT_STORAGE_WARNING =
  "上次快速诊断报告无法读取，已暂时按未诊断状态展示。可以重新完成快速诊断，或到设置的数据与隐私中心导出诊断后重置本机学习数据。";

export interface AssessmentReportLoadResult {
  report: DiagnosisReport | null;
  warning: string | null;
}

export function assessmentReportStorageKeyFor(languageId: string): string {
  return `${STORAGE_KEY_V2}:${languageId}`;
}

function emptyResult(): AssessmentReportLoadResult {
  return { report: null, warning: null };
}

function warningResult(): AssessmentReportLoadResult {
  return { report: null, warning: ASSESSMENT_REPORT_STORAGE_WARNING };
}

function migrateLegacyResult(legacy: LegacyAssessmentResult): DiagnosisReport {
  const phonemeScores: DiagnosisReport["phonemeScores"] = {};
  for (const [slug, score] of Object.entries(legacy.phonemeScores)) {
    phonemeScores[slug] = { score, sampleCount: score > 0 ? 1 : 0 };
  }
  const issues = legacy.weakPhonemes.slice(0, 3).map((slug) => {
    const phoneme = getPhonemeBySlug(slug);
    return {
      id: `legacy-${slug}`,
      severity: "major" as const,
      type: "phoneme" as const,
      title: `${phoneme?.ipa ?? slug} 需要复测`,
      targetPhonemes: [slug],
      evidence: [
        {
          text: phoneme?.name ?? slug,
          score: legacy.phonemeScores[slug] ?? 0,
          detail: "来自旧版诊断结果，建议重新测试以生成证据和训练处方。",
        },
      ],
      impact: "旧版报告只有平均分，没有足够证据判断错因。",
      fixCue: phoneme?.description ?? "重新诊断后会生成更具体的发音动作。",
      recommendedPackIds: [],
    };
  });

  return {
    version: 2,
    languageId: "en-US",
    timestamp: legacy.timestamp,
    overallScore: legacy.overallScore,
    dimensions: {
      ...legacy.dimensions,
      connectedSpeech: Math.round(
        (legacy.dimensions.rhythm + legacy.dimensions.fluency) / 2,
      ),
    },
    phonemeScores,
    issues,
    prescription: buildTrainingPrescription(issues, "diagnosis"),
    rawEvidence: [],
  };
}

function readStoredReport(key: string): AssessmentReportLoadResult {
  if (typeof window === "undefined") return emptyResult();

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return emptyResult();
    return { report: JSON.parse(raw) as DiagnosisReport, warning: null };
  } catch {
    return warningResult();
  }
}

function readLegacyEnglishReport(): AssessmentReportLoadResult {
  if (typeof window === "undefined") return emptyResult();

  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return emptyResult();
    return {
      report: migrateLegacyResult(JSON.parse(raw) as LegacyAssessmentResult),
      warning: null,
    };
  } catch {
    return warningResult();
  }
}

export function loadAssessmentReportForLanguage(
  languageId: string,
): AssessmentReportLoadResult {
  const currentReport = readStoredReport(
    assessmentReportStorageKeyFor(languageId),
  );

  if (currentReport.report || currentReport.warning || languageId !== "en-US") {
    return currentReport;
  }

  return readLegacyEnglishReport();
}
