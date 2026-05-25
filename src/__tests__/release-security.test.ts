import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(join(projectRoot, path), "utf8")) as T;
}

describe("release security configuration", () => {
  it("does not allow arbitrary HTTPS requests from Tauri HTTP", () => {
    const capability = readJson<{
      permissions: Array<
        | string
        | {
            identifier?: string;
            allow?: Array<{ url?: string }>;
          }
      >;
    }>("src-tauri/capabilities/default.json");

    const urls = capability.permissions.flatMap((permission) =>
      typeof permission === "string"
        ? []
        : (permission.allow ?? []).map((item) => item.url),
    );

    expect(urls).not.toContain("https://**");
  });

  it("does not allow plaintext HTTP endpoints in desktop capabilities", () => {
    const capability = readJson<{
      permissions: Array<
        | string
        | {
            identifier?: string;
            allow?: Array<{ url?: string }>;
          }
      >;
    }>("src-tauri/capabilities/default.json");

    const urls = capability.permissions.flatMap((permission) =>
      typeof permission === "string"
        ? []
        : (permission.allow ?? []).map((item) => item.url ?? ""),
    );

    expect(urls.every((url) => !url.startsWith("http://"))).toBe(true);
  });

  it("does not ship Tauri devtools in the release dependency feature set", () => {
    const cargoToml = readFileSync(
      join(projectRoot, "src-tauri/Cargo.toml"),
      "utf8",
    );

    expect(cargoToml).not.toMatch(/features\s*=\s*\[[^\]]*"devtools"/);
  });

  it("keeps blob permission scoped to media and avoids unsafe eval", () => {
    const config = readJson<{
      app?: { security?: { csp?: string } };
    }>("src-tauri/tauri.conf.json");
    const csp = config.app?.security?.csp ?? "";

    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).toContain("media-src 'self' blob:");
    expect(csp).not.toMatch(/default-src[^;]*\sblob:/);
    expect(csp).not.toMatch(/connect-src[^;]*\sblob:/);
  });
});
