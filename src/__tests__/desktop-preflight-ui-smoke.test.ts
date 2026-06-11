import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

function readProjectFile(path: string): string {
  return readFileSync(join(projectRoot, path), "utf8");
}

describe("desktop preflight and UI smoke", () => {
  it("wires a preflight command before desktop release builds", () => {
    const packageJson = JSON.parse(readProjectFile("package.json")) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts["desktop:preflight"]).toContain(
      "desktop-preflight.mjs",
    );
    expect(packageJson.scripts["desktop:preflight:build"]).toContain(
      "--allow-missing-release-exe",
    );
    expect(packageJson.scripts["validate:desktop"]).toContain(
      "desktop:preflight:build",
    );
    expect(packageJson.scripts["validate:desktop"].indexOf("desktop:preflight"))
      .toBeLessThan(packageJson.scripts["validate:desktop"].indexOf("desktop:build"));
  });

  it("fails preflight with a clear prompt when speakright.exe is running", () => {
    const script = readProjectFile("scripts/desktop-preflight.mjs");

    expect(script).toContain("tasklist.exe");
    expect(script).toContain("IMAGENAME eq speakright.exe");
    expect(script).toContain("speakright.exe is already running");
    expect(script).toContain("Close the desktop app before building");
    expect(script).not.toContain("taskkill");
    expect(script).not.toContain("Stop-Process");
  });

  it("checks the release executable and static desktop configuration", () => {
    const script = readProjectFile("scripts/desktop-preflight.mjs");

    expect(script).toContain("E:\\\\SpeakRightDesktopRepo");
    expect(script).toContain("com.speakright.desktop");
    expect(script).toContain("../out");
    expect(script).toContain("release executable is missing");
    expect(script).toContain("does not start localhost");
  });

  it("wires a release UI smoke command into local desktop validation", () => {
    const packageJson = JSON.parse(readProjectFile("package.json")) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts["desktop:ui-smoke"]).toContain(
      "desktop-ui-smoke.mjs",
    );
    expect(packageJson.scripts["validate:desktop"]).toContain(
      "desktop:ui-smoke",
    );
    expect(packageJson.scripts["validate:desktop"].indexOf("desktop:artifact-smoke"))
      .toBeLessThan(packageJson.scripts["validate:desktop"].indexOf("desktop:ui-smoke"));
  });

  it("opens key release routes without recording or ElevenLabs generation", () => {
    const script = readProjectFile("scripts/desktop-ui-smoke.mjs");

    expect(script).toContain("/settings");
    expect(script).toContain("/phonemes/ee");
    expect(script).toContain("/phonemes/es-a");
    expect(script).toContain("/phonemes/fr-i");
    expect(script).toContain("/phonemes/ru-a");
    expect(script).toContain("/drill");
    expect(script).toContain("/sentences");
    expect(script).toContain("/assessment");
    expect(script).toContain("releaseServedFromDevServer=false");
    expect(script).toContain("data-smoke=\"language-option\"");
    expect(script).not.toContain("MediaRecorder");
    expect(script).not.toContain("elevenlabs");
    expect(script).not.toContain("generate-word-audio");
  });
});
