import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addScore, getScores, scoreHistoryKey } from "@/lib/score-history";

describe("score-history", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("returns true when a score trend is saved", () => {
    const key = scoreHistoryKey("en-US", "ee", "green");

    expect(addScore(key, 88.4)).toBe(true);

    expect(getScores(key)).toEqual([88]);
  });

  it("returns false when score history cannot be saved", () => {
    const key = scoreHistoryKey("en-US", "ee", "green");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota exceeded", "QuotaExceededError");
    });

    expect(addScore(key, 88)).toBe(false);
  });
});
