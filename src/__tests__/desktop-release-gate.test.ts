import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

describe("desktop public release gate", () => {
  it("is wired as an explicit signed-artifact gate separate from internal desktop validation", () => {
    const packageJson = JSON.parse(
      readFileSync(join(projectRoot, "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };

    expect(packageJson.scripts["desktop:release-gate"]).toContain(
      "desktop-release-gate.mjs",
    );
    expect(packageJson.scripts["validate:desktop"]).not.toContain(
      "desktop:release-gate",
    );
    expect(packageJson.scripts["validate:public-release"]).toContain(
      "validate:desktop",
    );
    expect(packageJson.scripts["validate:public-release"]).toContain(
      "desktop:release-gate",
    );
  });

  it("fails public release when any desktop artifact is unsigned", () => {
    const gateScript = readFileSync(
      join(projectRoot, "scripts/desktop-release-gate.mjs"),
      "utf8",
    );

    expect(gateScript).toContain("unsignedArtifacts");
    expect(gateScript).toContain("allValid");
    expect(gateScript).toContain("controlled internal testing only");
  });
});
