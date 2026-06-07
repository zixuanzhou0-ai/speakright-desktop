"use client";

import { Play } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { UseAudioPlayerReturn } from "@/hooks/use-audio-player";
import { cn } from "@/lib/utils";
import {
  getPhonemeCategoryLabel,
  getSoundUnitTypeLabel,
} from "@/lib/phoneme-display";
import type { Difficulty, PhonemeData } from "@/types/phoneme";

interface PhonemeCardProps {
  phoneme: PhonemeData;
  player: UseAudioPlayerReturn;
}

const springTransition = {
  type: "spring",
  stiffness: 400,
  damping: 10,
} as const;

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "简单",
  medium: "中等",
  high: "困难",
};

const DIFFICULTY_VARIANT: Record<
  Difficulty,
  "secondary" | "outline" | "default"
> = {
  easy: "secondary",
  medium: "outline",
  high: "default",
};

export function PhonemeCard({ phoneme, player }: PhonemeCardProps) {
  const [lastWordPlay, setLastWordPlay] = useState<"normal" | "slow">("slow");

  const localChartWord = phoneme.chartWord;
  const word = phoneme.chartWord ?? phoneme.example;
  const image = phoneme.chartImage;
  const keywordIpa = phoneme.chartIpa ?? phoneme.keywords[0]?.ipa;
  const isLongPhoneme = phoneme.ipa.length >= 8;
  const isVeryLongPhoneme = phoneme.ipa.length >= 14;

  const handlePlayPhoneme = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!localChartWord) return;
    player.play(`/audio/ipa/phoneme/${localChartWord}.mp3`);
  };

  const handlePlayWord = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!localChartWord) return;
    const next = lastWordPlay === "slow" ? "normal" : "slow";
    setLastWordPlay(next);
    player.play(`/audio/ipa/${next}/${localChartWord}.mp3`);
  };

  return (
    <Link href={`/phonemes/${phoneme.slug}`} className="block">
      <Card className="relative h-full cursor-pointer p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        {/* Top row: IPA + difficulty badge */}
        <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <motion.span
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            transition={springTransition}
            onClick={handlePlayPhoneme}
            className={cn(
              "min-w-0 cursor-pointer select-none whitespace-normal break-words font-mono font-bold leading-tight [overflow-wrap:anywhere]",
              isVeryLongPhoneme
                ? "text-xl"
                : isLongPhoneme
                  ? "text-2xl"
                  : "text-4xl",
            )}
          >
            {phoneme.ipa}
          </motion.span>
          <Badge
            variant={DIFFICULTY_VARIANT[phoneme.difficulty]}
            className="text-xs"
          >
            {DIFFICULTY_LABEL[phoneme.difficulty]}
          </Badge>
        </div>

        {/* Category + description */}
        <div className="mb-5">
          <p className="text-sm font-semibold">
            {getPhonemeCategoryLabel(phoneme)} · {getSoundUnitTypeLabel(phoneme)}
          </p>
          {phoneme.description && (
            <p className="mt-1 text-sm leading-snug text-muted-foreground line-clamp-2">
              {phoneme.description}
            </p>
          )}
        </div>

        {/* Bottom: image + word + play */}
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            {image && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={springTransition}
                onClick={handlePlayWord}
                className="relative h-12 w-12 shrink-0 cursor-pointer"
              >
                <Image
                  src={`/images/ipa/${image}.png`}
                  alt={word || ""}
                  width={48}
                  height={48}
                  className="h-full w-full object-contain"
                />
              </motion.div>
            )}
            <div className="min-w-0">
              {word && (
                <p className="min-w-0 truncate font-semibold capitalize">
                  {word}
                </p>
              )}
              {keywordIpa && (
                <p className="min-w-0 truncate text-sm text-muted-foreground font-mono">
                  {keywordIpa}
                </p>
              )}
            </div>
          </div>
          {localChartWord && (
            <motion.div
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              transition={springTransition}
              onClick={handlePlayPhoneme}
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-muted transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <Play className="h-5 w-5" />
            </motion.div>
          )}
        </div>
      </Card>
    </Link>
  );
}
