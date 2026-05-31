"use client";

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { toast } from "sonner";
import { isTauriEnvironment } from "@/lib/tauri-runtime";

interface DesktopExternalLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "rel" | "target"> {
  href: string;
  children: ReactNode;
  copyMessage?: string;
}

async function copyHrefToClipboard(href: string, copyMessage?: string) {
  try {
    if (!navigator.clipboard?.writeText) {
      throw new Error("Clipboard API is unavailable");
    }
    await navigator.clipboard.writeText(href);
    toast.success(copyMessage ?? "已复制链接，请在浏览器中打开");
  } catch {
    toast.error(`请手动打开：${href}`);
  }
}

export function DesktopExternalLink({
  href,
  children,
  className,
  copyMessage,
  onClick,
  ...props
}: DesktopExternalLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || !isTauriEnvironment()) return;

    event.preventDefault();
    void copyHrefToClipboard(href, copyMessage);
  };

  return (
    <a
      {...props}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
