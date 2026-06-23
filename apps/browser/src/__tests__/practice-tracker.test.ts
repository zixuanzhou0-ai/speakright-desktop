import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getPracticedWordsForLanguage,
  markWordPracticedForLanguage,
} from "@/lib/practice-tracker";

describe("practice-tracker", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("returns true when language-scoped practice history is saved", () => {
    expect(markWordPracticedForLanguage("en-US", "ee", "Green")).toBe(true);

    expect(getPracticedWordsForLanguage("en-US", "ee")).toEqual(["green"]);
  });

  it("returns false when local practice history cannot be saved", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota exceeded", "QuotaExceededError");
    });

    expect(markWordPracticedForLanguage("en-US", "ee", "Green")).toBe(false);
  });
});
