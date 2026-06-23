"use client";

import { AudioLines } from "lucide-react";

export function Titlebar() {
  return (
    <div className="flex h-9 shrink-0 select-none items-center border-b bg-background/95 backdrop-blur">
      <div className="flex items-center gap-2 pl-4 pr-3 pointer-events-none">
        <AudioLines className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold tracking-tight font-heading">
          SpeakRight
        </span>
      </div>
      <div className="flex-1" />
      <span className="pr-4 text-[11px] font-medium text-muted-foreground">
        Browser Edition
      </span>
    </div>
  );
}
