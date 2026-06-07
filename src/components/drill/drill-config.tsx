"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCoachMode, useLanguageConfig } from "@/hooks/use-api-keys";
import { getAvailableWordCount, getPassThreshold } from "@/lib/drill-utils";
import { getLanguagePhonemes } from "@/lib/language-phonemes";
import { getPhonemeDisplayGroups } from "@/lib/phoneme-display";
import { cn } from "@/lib/utils";
import type { DrillKind } from "@/types/drill";
import type { PhonemeData } from "@/types/phoneme";

interface DrillConfigProps {
  kind: DrillKind;
  onStart: (
    phonemeSlug: string,
    itemCount: number,
    passThreshold: number,
  ) => void;
}

const WORD_COUNT_OPTIONS = [5, 10, 15, 20];
const SENTENCE_COUNT_OPTIONS = [3, 5, 8, 10];

export function DrillConfig({ kind, onStart }: DrillConfigProps) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [itemCount, setItemCount] = useState(kind === "word" ? 10 : 5);

  const { languageId } = useLanguageConfig();
  const phonemes = getLanguagePhonemes(languageId);
  const groups = getPhonemeDisplayGroups(phonemes);
  const countOptions =
    kind === "word" ? WORD_COUNT_OPTIONS : SENTENCE_COUNT_OPTIONS;
  const coachMode = useCoachMode();
  const threshold = getPassThreshold(coachMode);

  // biome-ignore lint/correctness/useExhaustiveDependencies: changing language invalidates the selected phoneme slug
  useEffect(() => {
    setSelectedSlug(null);
  }, [languageId]);

  const selectedPhoneme = selectedSlug
    ? phonemes.find((p) => p.slug === selectedSlug)
    : null;
  const availableWords = selectedPhoneme
    ? getAvailableWordCount(selectedPhoneme)
    : 0;

  const handleStart = () => {
    if (!selectedSlug) return;
    onStart(selectedSlug, itemCount, threshold);
  };

  return (
    <div className="space-y-6">
      {/* Phoneme selection */}
      {groups.map((group) => (
        <div key={group.id}>
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
            {group.label}（{group.phonemes.length}）
          </h3>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
            {group.phonemes.map((p) => (
              <PhonemeChip
                key={p.slug}
                phoneme={p}
                selected={selectedSlug === p.slug}
                onClick={() => setSelectedSlug(p.slug)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Count selection + start */}
      {selectedSlug && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border bg-card p-4 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-3">
            <span className="font-mono text-2xl font-bold">
              {selectedPhoneme?.ipa}
            </span>
            <span className="text-sm text-muted-foreground">
              {selectedPhoneme?.name}
            </span>
          </div>

          {selectedPhoneme?.description && (
            <p className="text-sm text-muted-foreground">
              💡 {selectedPhoneme.description}
            </p>
          )}

          <div>
            <p className="mb-2 block text-sm font-medium">
              {kind === "word" ? "训练单词数" : "训练句子数"}
            </p>
            <div className="flex gap-2">
              {countOptions.map((n) => {
                const disabled = kind === "word" && n > availableWords;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => !disabled && setItemCount(n)}
                    disabled={disabled}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                      itemCount === n
                        ? "bg-primary text-primary-foreground"
                        : disabled
                          ? "bg-muted text-muted-foreground/40 cursor-not-allowed"
                          : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            {kind === "word" && (
              <p className="mt-1 text-xs text-muted-foreground">
                可用 {availableWords} 个词
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              达标分数：{threshold} 分（
              {coachMode === "easy"
                ? "简单"
                : coachMode === "normal"
                  ? "正常"
                  : coachMode === "hard"
                    ? "略难"
                    : "严师"}
              模式）
            </p>
            <Button onClick={handleStart} className="cursor-pointer">
              开始训练
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function PhonemeChip({
  phoneme,
  selected,
  onClick,
}: {
  phoneme: PhonemeData;
  selected: boolean;
  onClick: () => void;
}) {
  const isLongPhoneme = phoneme.ipa.length >= 8;
  const isVeryLongPhoneme = phoneme.ipa.length >= 14;

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "flex min-h-20 flex-col items-center justify-center gap-1 rounded-lg border p-2 text-center transition-colors cursor-pointer",
        selected
          ? "border-primary bg-primary/10 text-primary"
          : "border-border hover:border-primary/50",
      )}
    >
      <span
        className={cn(
          "w-full min-w-0 whitespace-normal break-words font-mono font-bold leading-tight [overflow-wrap:anywhere]",
          isVeryLongPhoneme
            ? "text-[11px]"
            : isLongPhoneme
              ? "text-sm"
              : "text-lg",
        )}
      >
        {phoneme.ipa}
      </span>
      <span className="w-full min-w-0 truncate text-[10px] text-muted-foreground">
        {phoneme.example}
      </span>
    </motion.button>
  );
}
