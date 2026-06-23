"use client";

export const BROWSER_MIC_CHECK_KEY = "speakright_browser_mic_check_v1";
export const BROWSER_MIC_CHECK_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
export const BROWSER_MIC_SAMPLE_MS = 1_200;
export const BROWSER_MIC_MIN_SAMPLE_MS = 600;
export const BROWSER_MIC_MIN_RMS_LEVEL = 0.012;
export const BROWSER_MIC_MIN_PEAK_LEVEL = 0.04;

export interface BrowserMicCheck {
  version: 1;
  passedAt: number;
  deviceLabel?: string;
  rmsLevel: number;
  peakLevel: number;
  sampledMs: number;
}

export interface BrowserMicSignal {
  rmsLevel: number;
  peakLevel: number;
  sampledMs: number;
}

export interface BrowserMicSignalEvaluation {
  passed: boolean;
  reason?: "low-signal" | "too-short";
}

export type BrowserMicFailureReason = NonNullable<
  BrowserMicSignalEvaluation["reason"]
>;

export type BrowserReadinessStepId =
  | "azure"
  | "microphone"
  | "diagnosis"
  | "training";

export interface BrowserReadinessStep {
  id: BrowserReadinessStepId;
  label: string;
  ready: boolean;
  actionHref?: string;
}

export interface BrowserReadinessSummary {
  steps: BrowserReadinessStep[];
  readyCount: number;
  totalCount: number;
  complete: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function finiteNonNegative(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

export function parseBrowserMicCheck(
  raw: string | null,
): BrowserMicCheck | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      !isRecord(parsed) ||
      parsed.version !== 1 ||
      typeof parsed.passedAt !== "number" ||
      !Number.isFinite(parsed.passedAt)
    ) {
      return null;
    }

    const rmsLevel = finiteNonNegative(parsed.rmsLevel);
    const peakLevel = finiteNonNegative(parsed.peakLevel);
    const sampledMs = finiteNonNegative(parsed.sampledMs);
    if (
      rmsLevel === undefined ||
      peakLevel === undefined ||
      sampledMs === undefined
    ) {
      return null;
    }
    return {
      version: 1,
      passedAt: parsed.passedAt,
      deviceLabel:
        typeof parsed.deviceLabel === "string" && parsed.deviceLabel.trim()
          ? parsed.deviceLabel
          : undefined,
      rmsLevel,
      peakLevel,
      sampledMs,
    };
  } catch {
    return null;
  }
}

export function evaluateBrowserMicSignal({
  rmsLevel,
  peakLevel,
  sampledMs,
}: BrowserMicSignal): BrowserMicSignalEvaluation {
  if (sampledMs < BROWSER_MIC_MIN_SAMPLE_MS) {
    return { passed: false, reason: "too-short" };
  }
  const passed =
    rmsLevel >= BROWSER_MIC_MIN_RMS_LEVEL ||
    peakLevel >= BROWSER_MIC_MIN_PEAK_LEVEL;
  return passed ? { passed } : { passed: false, reason: "low-signal" };
}

export function getBrowserMicFailureMessage(
  reason: BrowserMicFailureReason,
): string {
  if (reason === "too-short") {
    return "麦克风检测时间太短，请保持窗口打开并完整读一句话后再重试。";
  }
  return "麦克风输入太低，请靠近麦克风、确认没有静音，并完整读一句话后重试。";
}

export function isBrowserMicCheckFresh(
  check: BrowserMicCheck | null,
  now = Date.now(),
): boolean {
  if (!check) return false;
  const ageMs = now - check.passedAt;
  return ageMs >= 0 && ageMs <= BROWSER_MIC_CHECK_MAX_AGE_MS;
}

export function readBrowserMicCheck(now = Date.now()): BrowserMicCheck | null {
  if (typeof window === "undefined") return null;
  const check = parseBrowserMicCheck(
    localStorage.getItem(BROWSER_MIC_CHECK_KEY),
  );
  return isBrowserMicCheckFresh(check, now) ? check : null;
}

export function saveBrowserMicCheck(
  check: Omit<BrowserMicCheck, "version" | "passedAt"> & {
    passedAt?: number;
  },
): BrowserMicCheck {
  const evaluation = evaluateBrowserMicSignal(check);
  if (!evaluation.passed) {
    throw new Error(
      getBrowserMicFailureMessage(evaluation.reason ?? "low-signal"),
    );
  }
  const item: BrowserMicCheck = {
    version: 1,
    passedAt: check.passedAt ?? Date.now(),
    deviceLabel: check.deviceLabel,
    rmsLevel: check.rmsLevel,
    peakLevel: check.peakLevel,
    sampledMs: check.sampledMs,
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(BROWSER_MIC_CHECK_KEY, JSON.stringify(item));
    window.dispatchEvent(
      new StorageEvent("storage", { key: BROWSER_MIC_CHECK_KEY }),
    );
  }
  return item;
}

export function buildBrowserReadinessSummary({
  azureReady,
  microphoneReady,
  hasDiagnosis,
}: {
  azureReady: boolean;
  microphoneReady: boolean;
  hasDiagnosis: boolean;
}): BrowserReadinessSummary {
  const steps: BrowserReadinessStep[] = [
    {
      id: "azure",
      label: "Azure Speech 评分密钥",
      ready: azureReady,
      actionHref: azureReady ? undefined : "/settings",
    },
    {
      id: "microphone",
      label: "麦克风检测",
      ready: microphoneReady,
    },
    {
      id: "diagnosis",
      label: "3 分钟诊断",
      ready: hasDiagnosis,
      actionHref: hasDiagnosis ? undefined : "/assessment",
    },
    {
      id: "training",
      label: "开始今日训练",
      ready: azureReady && microphoneReady && hasDiagnosis,
      actionHref: azureReady ? "/drill" : "/settings",
    },
  ];
  const readyCount = steps.filter((step) => step.ready).length;
  return {
    steps,
    readyCount,
    totalCount: steps.length,
    complete: readyCount === steps.length,
  };
}
