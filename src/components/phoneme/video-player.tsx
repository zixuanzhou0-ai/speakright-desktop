"use client";

import { ExternalLink, Film, Headphones, Languages } from "lucide-react";
import { DesktopExternalLink } from "@/components/common/desktop-external-link";
import type { PhonemeTeachingResource } from "@/types/phoneme";

interface VideoPlayerProps {
  slug: string;
  available?: boolean;
  label?: string;
  localSrc?: string;
  source?: string;
  sourceUrl?: string;
  license?: string;
  attribution?: string;
  notes?: string[];
  className?: string;
  resources?: PhonemeTeachingResource[];
}

const RESOURCE_ICON = {
  video: Film,
  ipa: Languages,
  dictionary: Languages,
  articulation: Headphones,
  audio: Headphones,
} as const;

function isProxyOrRuleNote(note: string): boolean {
  return /proxy|rule\/prosody|cluster unit|final devoicing|voicing assimilation|soft consonants|soft sign|iotated vowels/i.test(
    note,
  );
}

export function VideoPlayer({
  slug,
  available = true,
  label,
  localSrc,
  source,
  sourceUrl,
  license,
  attribution,
  notes = [],
  className,
  resources = [],
}: VideoPlayerProps) {
  const videoSrc = localSrc ?? `/videos/phonemes/${slug}.mp4`;
  const proxyNotes = notes.filter(isProxyOrRuleNote);
  const visibleNotes = (proxyNotes.length > 0 ? proxyNotes : notes).slice(0, 2);
  const hasProxyOrRuleNote = proxyNotes.length > 0;

  if (!available) {
    const visibleResources = resources.slice(0, 3);

    return (
      <div
        className={`flex aspect-video w-full flex-col justify-center rounded-lg border border-dashed bg-muted/25 p-4 ${className ?? ""}`}
      >
        <div className="mb-3 text-center">
          <p className="text-sm font-medium text-foreground">
            {visibleResources.length > 0
              ? "外部 IPA / 发音教学资源"
              : "教学视频素材准备中"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground/80">
            {label ?? "待补充授权教学视频"}
          </p>
        </div>

        {visibleResources.length > 0 ? (
          <div className="grid gap-2">
            {visibleResources.map((resource) => {
              const Icon = RESOURCE_ICON[resource.kind];

              return (
                <DesktopExternalLink
                  key={`${resource.kind}-${resource.url}`}
                  href={resource.url}
                  className="group flex items-center gap-3 rounded-lg border bg-background/70 px-3 py-2 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium text-foreground">
                      {resource.title}
                    </span>
                    {resource.description && (
                      <span className="mt-0.5 block line-clamp-1 text-[11px] text-muted-foreground">
                        {resource.description}
                      </span>
                    )}
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                </DesktopExternalLink>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-xs text-muted-foreground/70">
            {label ?? "待补充授权教学视频"}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <video
        key={slug}
        src={videoSrc}
        controls
        preload="metadata"
        className="w-full rounded-lg border"
      >
        <track kind="captions" />
      </video>
      {(visibleNotes.length > 0 || source || license || attribution) && (
        <div className="-mt-1 rounded-b-lg border border-t-0 bg-muted/25 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          <div className="flex flex-wrap items-center gap-1.5">
            {hasProxyOrRuleNote && (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-medium text-amber-700 dark:text-amber-300">
                规则/代理素材
              </span>
            )}
            {sourceUrl ? (
              <DesktopExternalLink
                href={sourceUrl}
                className="inline-flex items-center gap-1 font-medium text-foreground hover:text-primary"
              >
                {source ?? "本地授权素材"}
                <ExternalLink className="h-3 w-3" />
              </DesktopExternalLink>
            ) : (
              source && <span className="font-medium text-foreground">{source}</span>
            )}
            {license && <span>{license}</span>}
          </div>
          {visibleNotes.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {visibleNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
          {attribution && <p className="mt-1">{attribution}</p>}
        </div>
      )}
    </div>
  );
}
