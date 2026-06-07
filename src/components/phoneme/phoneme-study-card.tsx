"use client";

import { ChevronLeft, ChevronRight, Loader2, Volume2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { PhonemePlayButton } from "@/components/phoneme/phoneme-play-button";
import { VideoPlayer } from "@/components/phoneme/video-player";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LanguageProfile } from "@/types/language";
import type { KeywordEntry, PhonemeData } from "@/types/phoneme";

interface PhonemeStudyCardProps {
  phoneme: PhonemeData;
  languageProfile: LanguageProfile;
  currentWord: KeywordEntry | null;
  wordDirection: number;
  wordPoolSize: number;
  practicedCount: number;
  hasMwConfig: boolean;
  isWordActive: boolean;
  mwIsLoading: boolean;
  lastChartPlay: "normal" | "slow";
  onPrevious: () => void;
  onNext: () => void;
  onSetWordDirection: (dir: number) => void;
  onSetLastChartPlay: (play: "normal" | "slow") => void;
  onPlayWord: (word: string, voice?: "blue" | "pink") => void;
  onPlayChartAudio: (path: string) => void;
  onStopPlayback: () => void;
  onStopMw: () => void;
  onStopChartAudio: () => void;
  wordHistoryLength: number;
}

export function PhonemeStudyCard({
  phoneme,
  languageProfile,
  currentWord,
  wordDirection,
  wordPoolSize,
  practicedCount,
  hasMwConfig,
  isWordActive,
  mwIsLoading,
  lastChartPlay,
  onPrevious,
  onNext,
  onSetWordDirection,
  onSetLastChartPlay,
  onPlayWord,
  onPlayChartAudio,
  onStopPlayback,
  onStopMw,
  onStopChartAudio,
  wordHistoryLength,
}: PhonemeStudyCardProps) {
  const hasLocalPhonemeAssets = phoneme.languageId === "en-US";
  const isLongPhoneme = phoneme.ipa.length >= 10;
  const isVeryLongPhoneme = phoneme.ipa.length >= 18;
  const isLongWord = (currentWord?.word.length ?? 0) >= 14;

  return (
    <div className="shrink-0 rounded-xl border bg-card shadow-sm overflow-hidden">
      <VideoPlayer
        slug={phoneme.slug}
        available={phoneme.video?.status === "ready"}
        label={phoneme.video?.label}
      />
      <div className="px-4 py-3">
        {/* IPA + play + emoji */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex min-w-0 items-start gap-2">
              <h1
                className={cn(
                  "min-w-0 whitespace-normal break-words font-mono font-bold leading-tight [overflow-wrap:anywhere]",
                  isVeryLongPhoneme
                    ? "text-xl"
                    : isLongPhoneme
                      ? "text-2xl"
                      : "text-3xl",
                )}
              >
                {phoneme.ipa}
              </h1>
              <div className="shrink-0 pt-0.5">
                <PhonemePlayButton
                  chartWord={hasLocalPhonemeAssets ? phoneme.chartWord : undefined}
                />
              </div>
            </div>
            <p className="min-w-0 text-sm leading-snug text-muted-foreground line-clamp-2">
              {languageProfile.shortLabel} · {phoneme.name}
            </p>
          </div>
          {hasLocalPhonemeAssets && phoneme.chartImage && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              onClick={() => {
                if (!phoneme.chartWord) return;
                onStopPlayback();
                onStopMw();
                const next = lastChartPlay === "slow" ? "normal" : "slow";
                onSetLastChartPlay(next);
                onPlayChartAudio(`/audio/ipa/${next}/${phoneme.chartWord}.mp3`);
              }}
              className="flex shrink-0 flex-col items-center cursor-pointer"
            >
              <Image
                src={`/images/ipa/${phoneme.chartImage}.png`}
                alt={phoneme.chartWord || ""}
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
              <span className="text-[10px] text-muted-foreground capitalize">
                {phoneme.chartWord}
              </span>
            </motion.button>
          )}
        </div>

        {/* Word navigation */}
        {currentWord ? (
          <div className="mt-3 grid grid-cols-[2rem_minmax(0,1fr)_2rem] items-center gap-2 rounded-xl border bg-muted/25 px-1.5 py-2">
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  onSetWordDirection(-1);
                  onPrevious();
                }}
                disabled={wordHistoryLength === 0}
                className="h-7 w-7 shrink-0 rounded-full cursor-pointer disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </motion.div>

            <div className="relative min-w-0 overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentWord.word}
                  initial={{ x: wordDirection > 0 ? 120 : -120, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: wordDirection > 0 ? -120 : 120, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="min-w-0 text-center"
                >
                  <div className="flex min-w-0 items-center justify-center gap-2">
                    <motion.span
                      animate={{ scale: isWordActive ? 1.03 : 1 }}
                      className={cn(
                        "min-w-0 whitespace-normal break-words text-center font-bold leading-tight transition-colors [overflow-wrap:anywhere]",
                        isLongWord ? "text-xl" : "text-2xl",
                        isWordActive && "text-primary",
                      )}
                    >
                      {currentWord.word}
                    </motion.span>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        onStopPlayback();
                        onStopChartAudio();
                        onPlayWord(currentWord.word, "blue");
                      }}
                      disabled={mwIsLoading}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full cursor-pointer text-muted-foreground hover:bg-primary/10 hover:text-primary disabled:opacity-50"
                    >
                      {mwIsLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </motion.button>
                  </div>
                  <span
                    className={cn(
                      "mt-1 block min-w-0 whitespace-normal break-words font-mono text-xs leading-snug [overflow-wrap:anywhere]",
                      isWordActive ? "text-primary/70" : "text-muted-foreground",
                    )}
                  >
                    {currentWord.ipa}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>

            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  onSetWordDirection(1);
                  onNext();
                }}
                className="h-7 w-7 shrink-0 rounded-full cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        ) : (
          <div className="mt-3 h-8" />
        )}

        {/* Progress + MW attribution */}
        <div className="mt-1.5 flex items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground">
            已练 {practicedCount}/{wordPoolSize}
          </span>
          {hasMwConfig && (
            <>
              <span className="text-muted-foreground/20">|</span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground/50">
                <Image
                  src="/images/mw-logo.svg"
                  alt="MW"
                  width={12}
                  height={12}
                  className="opacity-50"
                />
                <span>Merriam-Webster</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
