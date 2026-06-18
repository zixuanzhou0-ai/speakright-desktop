import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

function readProjectFile(relativePath: string): string {
  return readFileSync(join(projectRoot, relativePath), "utf8");
}

describe("release size audit", () => {
  it("keeps a reusable read-only size audit script available", () => {
    const packageJson = JSON.parse(readProjectFile("package.json")) as {
      scripts: Record<string, string>;
    };
    const script = readProjectFile("scripts/release-size-audit.mjs");

    expect(packageJson.scripts["release:size:audit"]).toBe(
      "node scripts/release-size-audit.mjs",
    );
    expect(script).toContain("public-audio");
    expect(script).toContain("public-videos");
    expect(script).toContain("release-bundle");
    expect(script).toContain("Read-only size audit");
    expect(script).not.toMatch(/\b(unlink|rm|rmdir|Remove-Item)\b/);
    expect(script).not.toContain("audio:parity:generate");
    expect(script).not.toContain("ElevenLabs");
  });
});
