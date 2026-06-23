"use client";

import { getScoreBg } from "@/lib/score-utils";
import { cn } from "@/lib/utils";
import type { AzureAssessmentResult } from "@/types/azure";
import { AnimatedNumber, SubScoreRow } from "./score-breakdown";
import { ScoreTrend } from "./score-trend";

interface ScoreSummaryProps {
  result: AzureAssessmentResult;
  showProsody?: boolean;
  historyKey?: string;
  compact?: boolean;
}

export function ScoreSummary({
  result,
  showProsody = false,
  historyKey,
  compact = false,
}: ScoreSummaryProps) {
  return (
    <div
      role="status"
      className={cn(
        "grid",
        compact ? "grid-cols-[76px_1fr] gap-3" : "grid-cols-[100px_1fr] gap-4",
      )}
      data-smoke="score-summary"
      aria-live="polite"
      aria-label="发音评分结果"
    >
      {/* Total score + trend */}
      <div
        className={cn(
          "flex flex-col items-center",
          compact ? "justify-center gap-1.5" : "gap-2",
        )}
      >
        <div
          className={cn(
            "flex w-full flex-col items-center justify-center rounded-xl text-white",
            compact ? "p-2.5" : "p-4",
            getScoreBg(result.pronunciationScore),
          )}
        >
          <AnimatedNumber
            value={result.pronunciationScore}
            className={cn(
              "font-bold tabular-nums",
              compact ? "text-3xl" : "text-4xl",
            )}
          />
          <span className={cn("mt-0.5 opacity-80", compact ? "text-xs" : "text-sm")}>
            总分
          </span>
        </div>
        {historyKey && !compact && <ScoreTrend historyKey={historyKey} />}
      </div>

      {/* Sub-scores */}
      <div className={cn("flex flex-col justify-center", compact ? "gap-1.5" : "gap-2")}>
        <SubScoreRow score={result.accuracyScore} label="准确度" />
        <SubScoreRow score={result.fluencyScore} label="流利度" />
        <SubScoreRow score={result.completenessScore} label="完整度" />
        {showProsody && result.prosodyScore != null && (
          <SubScoreRow score={result.prosodyScore} label="韵律" />
        )}
      </div>
    </div>
  );
}
