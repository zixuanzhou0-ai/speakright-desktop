"use client";

import { motion } from "motion/react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getLanguagePhonemes } from "@/lib/language-phonemes";
import { DEFAULT_LANGUAGE_ID } from "@/lib/language-profiles";
import { getPhonemeDisplayGroups } from "@/lib/phoneme-display";
import { cn } from "@/lib/utils";
import type { LanguageId } from "@/types/language";

interface PhonemeHealthMapProps {
  scores: Record<string, number | { score: number; sampleCount: number }>;
  languageId?: LanguageId;
}

function normalizeScore(
  value: number | { score: number; sampleCount: number } | undefined,
): { score: number; sampleCount: number } {
  if (typeof value === "number") {
    return { score: value, sampleCount: value > 0 ? 1 : 0 };
  }
  return value ?? { score: 0, sampleCount: 0 };
}

function getColor(score: number): string {
  if (score >= 80) return "bg-primary text-primary-foreground";
  if (score >= 60) return "bg-yellow-500 text-white";
  if (score > 0) return "bg-red-500 text-white";
  return "bg-muted text-muted-foreground";
}

function getLabel(score: number): string {
  if (score >= 80) return "掌握";
  if (score >= 60) return "还行";
  if (score > 0) return "薄弱";
  return "未测";
}

export function PhonemeHealthMap({
  scores,
  languageId = DEFAULT_LANGUAGE_ID,
}: PhonemeHealthMapProps) {
  const groups = getPhonemeDisplayGroups(getLanguagePhonemes(languageId));
  let renderedCount = 0;

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const startIndex = renderedCount;
        renderedCount += group.phonemes.length;
        return (
          <div key={group.id}>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
              {group.label}（{group.phonemes.length}）
            </h3>
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 lg:grid-cols-8">
              {group.phonemes.map((p, i) => {
                const normalized = normalizeScore(scores[p.slug]);
                return (
                  <PhonemeCell
                    key={p.slug}
                    ipa={p.ipa}
                    slug={p.slug}
                    name={p.name}
                    score={normalized.score}
                    sampleCount={normalized.sampleCount}
                    delay={(startIndex + i) * 0.03}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PhonemeCell({
  ipa,
  slug,
  name,
  score,
  sampleCount,
  delay,
}: {
  ipa: string;
  slug: string;
  name: string;
  score: number;
  sampleCount: number;
  delay: number;
}) {
  const isLongPhoneme = ipa.length >= 8;
  const isVeryLongPhoneme = ipa.length >= 14;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            href={`/phonemes/${slug}`}
            aria-label={`${ipa} ${name} — ${getLabel(score)}`}
          />
        }
      >
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          transition={{ delay, type: "spring", stiffness: 300, damping: 20 }}
          className={`flex min-h-14 flex-col items-center justify-center rounded-lg p-1.5 text-center cursor-pointer transition-shadow hover:shadow-md ${getColor(score)}`}
        >
          <span
            className={cn(
              "max-w-full whitespace-normal break-words font-mono font-bold leading-tight [overflow-wrap:anywhere]",
              isVeryLongPhoneme
                ? "text-[10px]"
                : isLongPhoneme
                  ? "text-xs"
                  : "text-sm",
            )}
          >
            {ipa}
          </span>
          <span className="text-[10px] tabular-nums">
            {score > 0 ? score : "—"}
          </span>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">
          {ipa} — {name}
        </p>
        <p className="text-xs">
          {getLabel(score)} {score > 0 ? `(${score}分)` : ""}
          {sampleCount > 0 ? ` · ${sampleCount} 个样本` : ""} · 点击进入学习
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
