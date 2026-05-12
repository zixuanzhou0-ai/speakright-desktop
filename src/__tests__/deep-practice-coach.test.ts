import { describe, expect, it } from "vitest";
import { buildDeepPracticeCoach } from "@/lib/deep-practice-coach";
import { getTrainingPack } from "@/lib/training-packs";
import type { AttemptAnalysis, TrainingCourseItem } from "@/types/training";

function pack(id: string) {
  const trainingPack = getTrainingPack(id);
  if (!trainingPack) throw new Error(`missing pack ${id}`);
  return trainingPack;
}

function item(overrides: Partial<TrainingCourseItem> = {}): TrainingCourseItem {
  return {
    id: "word-think",
    text: "think",
    referenceText: "think",
    targetPhonemes: ["th"],
    focusPoint: "舌尖露出一点，只吹气。",
    commonMistake: "读成 sink。",
    successCue: "舌尖轻夹在齿间，气流稳定。",
    difficulty: 2,
    position: "initial",
    ...overrides,
  };
}

function analysis(overrides: Partial<AttemptAnalysis> = {}): AttemptAnalysis {
  return {
    itemId: "word-think",
    passed: false,
    targetScore: 52,
    overallScore: 86,
    scoreGap: 34,
    detectedPatternIds: ["tongue-between-teeth", "target-low-overall-high"],
    primaryPatternId: "tongue-between-teeth",
    nextCue: "露出一点舌尖",
    remediationPathId: "th-rebuild",
    ...overrides,
  };
}

describe("deep practice coach", () => {
  it("turns a target-low attempt into a concrete repair card", () => {
    const coach = buildDeepPracticeCoach({
      pack: pack("s-th"),
      item: item(),
      analysis: analysis(),
      failedAttempts: 1,
    });

    expect(coach.status).toBe("repair");
    expect(coach.diagnosis).toContain("整词/整句分比目标音高");
    expect(coach.bodyCheck).toContain("舌尖");
    expect(coach.microDrill.map((step) => step.text)).toContain("sink think");
  });

  it("uses stuck-prep guidance after repeated failures", () => {
    const coach = buildDeepPracticeCoach({
      pack: pack("s-th"),
      item: item(),
      analysis: analysis(),
      failedAttempts: 2,
    });

    expect(coach.status).toBe("stuck-prep");
    expect(coach.moveOnRule).toContain("慢速拆解");
    expect(coach.reflectionPrompt).toContain("只能改一个动作");
  });

  it("locks in the success cue when the attempt passed", () => {
    const coach = buildDeepPracticeCoach({
      pack: pack("s-th"),
      item: item(),
      analysis: analysis({
        passed: true,
        targetScore: 82,
        overallScore: 88,
        scoreGap: 6,
        detectedPatternIds: [],
        primaryPatternId: undefined,
      }),
      failedAttempts: 0,
    });

    expect(coach.status).toBe("lock-in");
    expect(coach.bodyCheck).toBe("舌尖轻夹在齿间，气流稳定。");
    expect(coach.moveOnRule).toContain("再复现");
  });

  it("uses pack-specific recipes for common Chinese learner confusions", () => {
    const coach = buildDeepPracticeCoach({
      pack: pack("v-w"),
      item: item({
        id: "word-very",
        text: "very",
        referenceText: "very",
        targetPhonemes: ["v"],
        focusPoint: "/v/ 上齿碰下唇。",
      }),
      analysis: analysis({
        primaryPatternId: "lip-teeth-round-lips",
        detectedPatternIds: ["lip-teeth-round-lips"],
        remediationPathId: "vw-rebuild",
      }),
      failedAttempts: 1,
    });

    expect(coach.bodyCheck).toContain("上齿");
    expect(coach.microDrill.map((step) => step.text)).toEqual([
      "very",
      "well",
      "vest west",
    ]);
  });
});
