"use client";

import { toast } from "sonner";

function isSafeExternalUrl(href: string): boolean {
  try {
    const url = new URL(href);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
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

export async function openBrowserExternalUrl(
  href: string,
  copyMessage?: string,
) {
  if (!isSafeExternalUrl(href)) {
    toast.error("这个外部链接格式不安全，已阻止打开");
    return;
  }

  const opened = window.open(href, "_blank", "noopener,noreferrer");
  if (opened) {
    return;
  }

  await copyHrefToClipboard(href, copyMessage);
}
