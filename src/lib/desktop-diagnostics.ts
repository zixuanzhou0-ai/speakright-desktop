"use client";

import { invoke } from "@tauri-apps/api/core";
import { getLocalDataSummary, type LocalDataSummary } from "@/lib/data-registry";
import { DESKTOP_RELEASE_INFO } from "@/lib/release-info";
import { isTauriEnvironment } from "@/lib/tauri-runtime";

export interface DesktopRuntimeDiagnostics {
  app_identifier: string;
  log: {
    path: string | null;
    bytes: number | null;
    tail: string[];
    error: string | null;
  };
}

export interface DesktopSupportBundle {
  schemaVersion: 1;
  exportedAt: string;
  product: "SpeakRight Desktop";
  release: typeof DESKTOP_RELEASE_INFO;
  dataSummary: LocalDataSummary;
  runtime: DesktopRuntimeDiagnostics;
  excluded: string[];
}

function redactDesktopLogPath(path: string | null): string | null {
  if (!path) return null;
  const normalized = path.replaceAll("\\", "/");
  const marker = "/com.speakright.desktop/";
  const markerIndex = normalized.lastIndexOf(marker);
  if (markerIndex >= 0) {
    return `<local-app-data>${normalized.slice(markerIndex)}`;
  }
  const fileName = normalized.split("/").filter(Boolean).at(-1);
  return fileName ? `<redacted>/${fileName}` : "<redacted>";
}

function sanitizeDesktopRuntimeDiagnostics(
  diagnostics: DesktopRuntimeDiagnostics,
): DesktopRuntimeDiagnostics {
  return {
    ...diagnostics,
    log: {
      ...diagnostics.log,
      path: redactDesktopLogPath(diagnostics.log.path),
    },
  };
}

export async function getDesktopRuntimeDiagnostics(): Promise<DesktopRuntimeDiagnostics> {
  if (!isTauriEnvironment()) {
    return {
      app_identifier: "browser-dev",
      log: {
        path: null,
        bytes: null,
        tail: [],
        error: "Runtime diagnostics are available only in the desktop app.",
      },
    };
  }
  return invoke<DesktopRuntimeDiagnostics>("desktop_diagnostics");
}

export async function buildDesktopSupportBundle(): Promise<DesktopSupportBundle> {
  const runtime = await getDesktopRuntimeDiagnostics();
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    product: "SpeakRight Desktop",
    release: DESKTOP_RELEASE_INFO,
    dataSummary: getLocalDataSummary(),
    runtime: sanitizeDesktopRuntimeDiagnostics(runtime),
    excluded: [
      "API keys",
      "Local user profile path",
      "Full learning history",
      "Benchmark audio blobs",
      "ElevenLabs TTS audio cache",
    ],
  };
}

export async function downloadDesktopSupportBundle(): Promise<void> {
  if (typeof document === "undefined") return;
  const bundle = await buildDesktopSupportBundle();
  const blob = new Blob([JSON.stringify(bundle, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `speakright-diagnostics-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
