import type {
  MasteryProfile,
  RemediationResult,
  ReviewQueueItem,
  TrainingEvidenceItem,
  TrainingSessionSummary,
} from "@/types/training";
import { buildReviewQueue } from "./review-queue";
import { TRAINING_ERROR_PATTERNS } from "./training-error-patterns";
import { getTrainingPack } from "./training-packs";

export type EvidenceSeverity = "critical" | "major" | "watch";

export interface EvidenceCard {
  id: string;
  packId: string;
  packTitle: string;
  levelId: string;
  levelTitle: string;
  text: string;
  targetPhonemes: string[];
  patternIds: string[];
  patternTitles: string[];
  attempts: number;
  worstTargetScore: number;
  bestTargetScore: number;
  latestTargetScore: number;
  latestOverallScore: number;
  scoreGap: number;
  firstSeenAt: number;
  lastSeenAt: number;
  nextCue: string;
  severity: EvidenceSeverity;
  dueTask?: ReviewQueueItem;
}

export interface PatternEvidence {
  patternId: string;
  title: string;
  packId: string;
  packTitle: string;
  levelId: string;
  seenCount: number;
  stuckCount: number;
  failedItemCount: number;
  lastSeenAt?: number;
  cue: string;
  explanation: string;
  severity: EvidenceSeverity;
}

export interface RemediationEvidence {
  id: string;
  packId: string;
  packTitle: string;
  pathId: string;
  text: string;
  attempts: number;
  passedCount: number;
  failedCount: number;
  bestImprovement: number;
  latestTargetScore: number;
  latestPassed: boolean;
  lastSeenAt: number;
}

export interface TrainingEvidenceBook {
  generatedAt: number;
  totalSessions: number;
  totalEvidence: number;
  criticalCount: number;
  activePatternCount: number;
  remediationFailedCount: number;
  dueReviewCount: number;
  cards: EvidenceCard[];
  patterns: PatternEvidence[];
  remediations: RemediationEvidence[];
  reviewQueue: ReviewQueueItem[];
}

interface EvidenceDraft extends EvidenceCard {
  severityScore: number;
}

interface RemediationDraft extends RemediationEvidence {
  latestAt: number;
}

function packTitle(packId: string): string {
  return getTrainingPack(packId)?.title ?? packId;
}

function levelTitle(packId: string, levelId: string): string {
  return (
    getTrainingPack(packId)?.course?.levels.find((level) => level.id === levelId)
      ?.title ?? levelId
  );
}

function patternTitle(patternId: string): string {
  return (
    TRAINING_ERROR_PATTERNS.find((pattern) => pattern.id === patternId)?.title ??
    "未分类错因"
  );
}

function patternCue(patternId: string): string {
  return (
    TRAINING_ERROR_PATTERNS.find((pattern) => pattern.id === patternId)
      ?.immediateCue ?? "下一次只改一个动作，先慢速复现。"
  );
}

function patternLevel(patternId: string): string {
  if (patternId.includes("rhythm")) return "shadowing-transfer";
  if (patternId.includes("final")) return "word-ladder";
  return "articulation";
}

function severityFromScore(score: number): EvidenceSeverity {
  if (score >= 6) return "critical";
  if (score >= 3) return "major";
  return "watch";
}

function scoreForItem(item: TrainingEvidenceItem): number {
  const lowScore = item.targetScore < 60 ? 4 : item.targetScore < 75 ? 2 : 1;
  const gap = item.overallScore - item.targetScore >= 12 ? 2 : 0;
  return lowScore + gap + Math.min(2, item.patternIds.length);
}

function evidenceKey(session: TrainingSessionSummary, item: TrainingEvidenceItem): string {
  return [
    session.packId,
    item.levelId,
    item.text.toLowerCase(),
    item.patternIds[0] ?? "unclassified",
  ].join(":");
}

function reviewKey(task: ReviewQueueItem): string {
  return [
    task.packId,
    task.levelId,
    task.itemText?.toLowerCase() ?? "",
    task.errorPatternId ?? "",
  ].join(":");
}

function addEvidenceCard(
  map: Map<string, EvidenceDraft>,
  taskMap: Map<string, ReviewQueueItem>,
  session: TrainingSessionSummary,
  item: TrainingEvidenceItem,
) {
  const key = evidenceKey(session, item);
  const current = map.get(key);
  const severityScore = scoreForItem(item);
  const dueTask =
    taskMap.get(
      [
        session.packId,
        item.levelId,
        item.text.toLowerCase(),
        item.patternIds[0] ?? "",
      ].join(":"),
    ) ??
    taskMap.get([session.packId, item.levelId, "", item.patternIds[0] ?? ""].join(":"));

  if (!current) {
    map.set(key, {
      id: key,
      packId: session.packId,
      packTitle: packTitle(session.packId),
      levelId: item.levelId,
      levelTitle: levelTitle(session.packId, item.levelId),
      text: item.text,
      targetPhonemes: item.targetPhonemes,
      patternIds: item.patternIds,
      patternTitles: item.patternIds.map(patternTitle),
      attempts: 1,
      worstTargetScore: item.targetScore,
      bestTargetScore: item.targetScore,
      latestTargetScore: item.targetScore,
      latestOverallScore: item.overallScore,
      scoreGap: item.overallScore - item.targetScore,
      firstSeenAt: session.completedAt,
      lastSeenAt: session.completedAt,
      nextCue: item.nextCue,
      severity: severityFromScore(severityScore),
      severityScore,
      dueTask,
    });
    return;
  }

  const nextScore = current.severityScore + severityScore;
  map.set(key, {
    ...current,
    attempts: current.attempts + 1,
    worstTargetScore: Math.min(current.worstTargetScore, item.targetScore),
    bestTargetScore: Math.max(current.bestTargetScore, item.targetScore),
    latestTargetScore:
      session.completedAt >= current.lastSeenAt
        ? item.targetScore
        : current.latestTargetScore,
    latestOverallScore:
      session.completedAt >= current.lastSeenAt
        ? item.overallScore
        : current.latestOverallScore,
    scoreGap:
      session.completedAt >= current.lastSeenAt
        ? item.overallScore - item.targetScore
        : current.scoreGap,
    firstSeenAt: Math.min(current.firstSeenAt, session.completedAt),
    lastSeenAt: Math.max(current.lastSeenAt, session.completedAt),
    nextCue: session.completedAt >= current.lastSeenAt ? item.nextCue : current.nextCue,
    severity: severityFromScore(nextScore),
    severityScore: nextScore,
    dueTask: current.dueTask ?? dueTask,
  });
}

function buildTaskMap(reviewQueue: ReviewQueueItem[]): Map<string, ReviewQueueItem> {
  const map = new Map<string, ReviewQueueItem>();
  for (const task of reviewQueue) {
    map.set(reviewKey(task), task);
  }
  return map;
}

function buildCards(
  sessions: TrainingSessionSummary[],
  reviewQueue: ReviewQueueItem[],
): EvidenceCard[] {
  const map = new Map<string, EvidenceDraft>();
  const taskMap = buildTaskMap(reviewQueue);
  for (const session of sessions) {
    for (const item of session.failedItems ?? []) {
      addEvidenceCard(map, taskMap, session, item);
    }
  }

  return Array.from(map.values())
    .sort((a, b) => {
      if (b.severityScore !== a.severityScore) return b.severityScore - a.severityScore;
      return b.lastSeenAt - a.lastSeenAt;
    })
    .map(({ severityScore: _severityScore, ...card }) => card);
}

function buildPatternEvidence(
  profile: MasteryProfile,
  cards: EvidenceCard[],
): PatternEvidence[] {
  const failedCounts = new Map<string, number>();
  for (const card of cards) {
    for (const patternId of card.patternIds) {
      failedCounts.set(patternId, (failedCounts.get(patternId) ?? 0) + card.attempts);
    }
  }

  return Object.entries(profile.errorPatterns)
    .map(([patternId, mastery]) => {
      const pattern = TRAINING_ERROR_PATTERNS.find((item) => item.id === patternId);
      const packId = pattern?.appliesToPackIds.find((id) => getTrainingPack(id)) ?? "";
      const severityScore =
        (mastery.status === "active" ? 4 : 1) +
        mastery.stuckCount +
        (failedCounts.get(patternId) ?? 0);
      return {
        patternId,
        title: patternTitle(patternId),
        packId,
        packTitle: packTitle(packId),
        levelId: patternLevel(patternId),
        seenCount: mastery.seenCount,
        stuckCount: mastery.stuckCount,
        failedItemCount: failedCounts.get(patternId) ?? 0,
        lastSeenAt: mastery.lastSeenAt,
        cue: patternCue(patternId),
        explanation:
          pattern?.coachExplanation ?? "这个错因近期出现过，需要保留复练入口。",
        severity: severityFromScore(severityScore),
      };
    })
    .filter((pattern) => !!pattern.packId)
    .sort((a, b) => {
      const severity = severityRank(a.severity) - severityRank(b.severity);
      if (severity !== 0) return severity;
      return (b.lastSeenAt ?? 0) - (a.lastSeenAt ?? 0);
    });
}

function severityRank(severity: EvidenceSeverity): number {
  if (severity === "critical") return 0;
  if (severity === "major") return 1;
  return 2;
}

function remediationKey(session: TrainingSessionSummary, item: RemediationResult): string {
  return [session.packId, item.pathId, item.text.toLowerCase()].join(":");
}

function buildRemediations(sessions: TrainingSessionSummary[]): RemediationEvidence[] {
  const map = new Map<string, RemediationDraft>();
  for (const session of sessions) {
    for (const item of session.remediationResults ?? []) {
      const key = remediationKey(session, item);
      const current = map.get(key);
      const improvement = item.targetScore - item.beforeTargetScore;
      if (!current) {
        map.set(key, {
          id: key,
          packId: session.packId,
          packTitle: packTitle(session.packId),
          pathId: item.pathId,
          text: item.text,
          attempts: 1,
          passedCount: item.passed ? 1 : 0,
          failedCount: item.passed ? 0 : 1,
          bestImprovement: improvement,
          latestTargetScore: item.targetScore,
          latestPassed: item.passed,
          lastSeenAt: session.completedAt,
          latestAt: session.completedAt,
        });
        continue;
      }
      map.set(key, {
        ...current,
        attempts: current.attempts + 1,
        passedCount: current.passedCount + (item.passed ? 1 : 0),
        failedCount: current.failedCount + (item.passed ? 0 : 1),
        bestImprovement: Math.max(current.bestImprovement, improvement),
        latestTargetScore:
          session.completedAt >= current.latestAt
            ? item.targetScore
            : current.latestTargetScore,
        latestPassed:
          session.completedAt >= current.latestAt ? item.passed : current.latestPassed,
        lastSeenAt: Math.max(current.lastSeenAt, session.completedAt),
        latestAt: Math.max(current.latestAt, session.completedAt),
      });
    }
  }

  return Array.from(map.values())
    .sort((a, b) => {
      if (b.failedCount !== a.failedCount) return b.failedCount - a.failedCount;
      return b.lastSeenAt - a.lastSeenAt;
    })
    .map(({ latestAt: _latestAt, ...item }) => item);
}

export function buildTrainingEvidenceBook(
  profile: MasteryProfile | null | undefined,
  now = Date.now(),
): TrainingEvidenceBook {
  const reviewQueue = buildReviewQueue(profile, now);
  if (!profile) {
    return {
      generatedAt: now,
      totalSessions: 0,
      totalEvidence: 0,
      criticalCount: 0,
      activePatternCount: 0,
      remediationFailedCount: 0,
      dueReviewCount: 0,
      cards: [],
      patterns: [],
      remediations: [],
      reviewQueue,
    };
  }

  const cards = buildCards(profile.sessions, reviewQueue);
  const patterns = buildPatternEvidence(profile, cards);
  const remediations = buildRemediations(profile.sessions);

  return {
    generatedAt: now,
    totalSessions: profile.sessions.length,
    totalEvidence: cards.length,
    criticalCount: cards.filter((card) => card.severity === "critical").length,
    activePatternCount: patterns.filter((pattern) => pattern.severity === "critical").length,
    remediationFailedCount: remediations.filter((item) => item.failedCount > 0).length,
    dueReviewCount: reviewQueue.filter((task) => task.dueAt <= now).length,
    cards,
    patterns,
    remediations,
    reviewQueue,
  };
}
