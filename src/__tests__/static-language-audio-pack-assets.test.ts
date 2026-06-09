import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PROJECT_ROOT = process.cwd();
const PACK_LANGUAGES = ["es-ES", "fr-FR", "ru-RU"] as const;

interface StaticPackManifest {
  languageId: (typeof PACK_LANGUAGES)[number];
  itemCount: number;
  items: Array<{
    key: string;
    text: string;
    audioSrc: string;
  }>;
}

function loadManifest(languageId: (typeof PACK_LANGUAGES)[number]) {
  const manifestPath = join(
    PROJECT_ROOT,
    "public",
    "audio",
    "language-packs",
    languageId,
    "manifest.json",
  );
  return JSON.parse(readFileSync(manifestPath, "utf8")) as StaticPackManifest;
}

describe("static multilingual language audio packs", () => {
  it("bundles a manifest and local audio files for each experimental language", () => {
    for (const languageId of PACK_LANGUAGES) {
      const manifest = loadManifest(languageId);

      expect(manifest.languageId).toBe(languageId);
      expect(manifest.itemCount).toBe(manifest.items.length);
      expect(manifest.itemCount).toBeGreaterThan(300);

      const keys = new Set<string>();
      for (const item of manifest.items) {
        expect(item.key).toBeTruthy();
        expect(item.text).toBeTruthy();
        expect(item.audioSrc).toMatch(
          new RegExp(`^/audio/language-packs/${languageId}/.+\\.mp3$`),
        );
        expect(keys.has(item.key)).toBe(false);
        keys.add(item.key);

        const filePath = join(PROJECT_ROOT, "public", item.audioSrc.replace(/^\//, ""));
        expect(existsSync(filePath)).toBe(true);
      }
    }
  });
});
