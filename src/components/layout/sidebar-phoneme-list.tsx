"use client";

import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguageConfig } from "@/hooks/use-api-keys";
import { getLanguagePhonemes } from "@/lib/language-phonemes";
import { getLanguageProfile } from "@/lib/language-profiles";
import { getPhonemeDisplayGroups } from "@/lib/phoneme-display";
import { getBestScoreForPhoneme } from "@/lib/score-history";
import { cn } from "@/lib/utils";
import type { LanguageId } from "@/types/language";
import type { PhonemeData } from "@/types/phoneme";

interface SidebarPhonemeListProps {
  currentSlug: string | null;
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  const color =
    score >= 80
      ? "bg-primary/15 text-primary ring-primary/20"
      : score >= 60
        ? "bg-yellow-500/15 text-yellow-600 ring-yellow-500/20 dark:text-yellow-400"
        : "bg-muted text-muted-foreground ring-border";
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-7 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-mono tabular-nums ring-1 ring-inset",
        color,
      )}
    >
      {score}
    </span>
  );
}

function PhonemeGroup({
  label,
  phonemes,
  currentSlug,
  defaultOpen,
  languageId,
}: {
  label: string;
  phonemes: PhonemeData[];
  currentSlug: string | null;
  defaultOpen: boolean;
  languageId: LanguageId;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [scores, setScores] = useState<Record<string, number | null>>({});

  useEffect(() => {
    const s: Record<string, number | null> = {};
    for (const p of phonemes) {
      s[p.slug] = getBestScoreForPhoneme(languageId, p.slug);
    }
    setScores(s);
  }, [languageId, phonemes]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="group flex w-full items-center gap-2 rounded-md px-2 py-2 text-[11px] font-semibold text-muted-foreground/65 transition-colors hover:bg-accent/40 hover:text-muted-foreground"
      >
        <ChevronDown
          className={cn(
            "h-3 w-3 shrink-0 transition-transform duration-200",
            !open && "-rotate-90",
          )}
        />
        <span className="min-w-0 flex-1 truncate text-left">{label}</span>
        <span className="rounded-full bg-muted/70 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/70 ring-1 ring-border/50 ring-inset">
          {phonemes.length}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {phonemes.map((p) => {
              const isActive = p.slug === currentSlug;
              const isLongSymbol = p.ipa.length >= 13;
              const isVeryLongSymbol = p.ipa.length >= 22;
              return (
                <Link
                  key={p.slug}
                  href={`/phonemes/${p.slug}`}
                  className={cn(
                    "group grid grid-cols-[5rem_minmax(0,1fr)_auto] items-center gap-x-2 rounded-lg border border-transparent px-2 py-1.5 text-xs transition-all duration-150",
                    isActive
                      ? "border-primary/20 bg-primary/10 text-foreground shadow-sm"
                      : "text-sidebar-foreground/70 hover:border-border/70 hover:bg-accent/55",
                  )}
                >
                  <span
                    className={cn(
                      "flex min-h-7 min-w-0 items-center rounded-md border border-border/60 bg-background/70 px-1.5 text-left font-mono leading-tight text-primary shadow-sm transition-colors [overflow-wrap:anywhere]",
                      isLongSymbol ? "text-[11px]" : "text-[13px]",
                      isVeryLongSymbol && "leading-[1.1]",
                      isActive
                        ? "border-primary/30 bg-primary/10"
                        : "group-hover:border-primary/20 group-hover:bg-background",
                    )}
                  >
                    {p.ipa}
                  </span>
                  <span className="min-w-0 self-center truncate capitalize font-medium leading-4 text-muted-foreground transition-colors group-hover:text-sidebar-foreground/85">
                    {p.chartWord ?? p.example}
                  </span>
                  <span className="self-center">
                    <ScoreBadge score={scores[p.slug] ?? null} />
                  </span>
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SidebarPhonemeList({ currentSlug }: SidebarPhonemeListProps) {
  const { languageId } = useLanguageConfig();
  const profile = getLanguageProfile(languageId);
  const groups = getPhonemeDisplayGroups(getLanguagePhonemes(languageId));

  return (
    <div className="flex flex-col gap-0.5">
      {groups.map((group, index) => (
        <PhonemeGroup
          key={group.id}
          label={group.label}
          phonemes={group.phonemes}
          currentSlug={currentSlug}
          defaultOpen={
            group.phonemes.some((p) => p.slug === currentSlug) ||
            (!currentSlug && index === 0)
          }
          languageId={languageId}
        />
      ))}
      <div className="px-2 pt-2 text-[11px] text-muted-foreground/60">
        {profile.shortLabel} · {profile.soundUnitLabel}
      </div>
    </div>
  );
}
