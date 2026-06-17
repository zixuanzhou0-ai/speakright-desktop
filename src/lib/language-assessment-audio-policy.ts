import { getAllAssessmentSegmentAudioRegistryEntries } from "@/lib/assessment-segment-audio";
import { isPlayableHeaderAudioSrc } from "@/lib/audio-playback-policy";
import { getLocalLanguagePhonemeAsset } from "@/lib/local-language-assets";
import {
  getLanguagePhonologyInventory,
  type NonEnglishLanguageId,
  type PhonologyInventoryAudioStatus,
  type PhonologyInventoryLayer,
  type PhonologyInventoryTilePolicy,
} from "@/lib/language-phonology-inventory";

export type AssessmentAudioPolicyStatus =
  | "clickable-exact-header"
  | "blocked-proxy-reference"
  | "blocked-rule-guidance"
  | "blocked-unverified";

export interface LanguageAssessmentAudioPolicyRow {
  languageId: NonEnglishLanguageId;
  slug: string;
  ipa: string;
  layer: PhonologyInventoryLayer;
  variantScope: string;
  audioStatus: PhonologyInventoryAudioStatus;
  tilePolicy: PhonologyInventoryTilePolicy;
  policyStatus: AssessmentAudioPolicyStatus;
  shouldBeClickable: boolean;
  hasRegistryEntry: boolean;
  registryEntryCount: number;
  registryAliases: string[];
  registryAudioUrl?: string;
  registryUsesPlayableHeaderClip: boolean;
  registryMatchesHeaderAudio: boolean;
  headerAudioSrc?: string;
  localAssetSource?: string;
  localAssetIsProxy: boolean;
  sourceRefs: string[];
  gaps: string[];
  reason: string;
}

export interface LanguageAssessmentAudioPolicyTableRow {
  slug: string;
  ipa: string;
  layer: PhonologyInventoryLayer;
  audioStatus: PhonologyInventoryAudioStatus;
  tilePolicy: PhonologyInventoryTilePolicy;
  policyStatus: AssessmentAudioPolicyStatus;
  clickable: "yes" | "no";
  headerAudioSrc: string;
  registryAudioUrl: string;
  aliases: string;
  reason: string;
}

const LANGUAGE_IDS = ["es-ES", "fr-FR", "ru-RU"] as const;

const LANGUAGE_DOCUMENT_LABELS: Record<NonEnglishLanguageId, string> = {
  "es-ES": "Spanish",
  "fr-FR": "French",
  "ru-RU": "Russian",
};

const registryEntries = getAllAssessmentSegmentAudioRegistryEntries();

function registryEntriesFor(languageId: NonEnglishLanguageId, slug: string) {
  return registryEntries.filter(
    (entry) => entry.languageId === languageId && entry.soundUnitSlug === slug,
  );
}

function policyStatusFor({
  tilePolicy,
  localAssetIsProxy,
}: {
  tilePolicy: PhonologyInventoryTilePolicy;
  localAssetIsProxy: boolean;
}): AssessmentAudioPolicyStatus {
  if (tilePolicy === "clickable-exact-header") return "clickable-exact-header";
  if (localAssetIsProxy) return "blocked-proxy-reference";
  if (tilePolicy === "rule-guidance-only") return "blocked-rule-guidance";
  return "blocked-unverified";
}

function reasonFor(status: AssessmentAudioPolicyStatus): string {
  switch (status) {
    case "clickable-exact-header":
      return "Uses an exact same-unit local short header clip from the assessment audio registry.";
    case "blocked-proxy-reference":
      return "Local material is a proxy/reference asset, so the scoring tile must remain unclickable.";
    case "blocked-rule-guidance":
      return "This unit is trained as a rule, phrase, or prosody target and must not pretend to be standalone segment audio.";
    case "blocked-unverified":
      return "No verified exact same-unit local short header clip is available for scoring tile playback.";
  }
}

export function getLanguageAssessmentAudioPolicyRows(
  languageId: NonEnglishLanguageId,
): LanguageAssessmentAudioPolicyRow[] {
  return getLanguagePhonologyInventory(languageId).map((entry) => {
    const asset = getLocalLanguagePhonemeAsset(languageId, entry.slug);
    const matchingRegistryEntries = registryEntriesFor(languageId, entry.slug);
    const registryAudioUrls = new Set(
      matchingRegistryEntries.map((registryEntry) => registryEntry.audioUrl),
    );
    const registryAudioUrl =
      registryAudioUrls.size === 1 ? [...registryAudioUrls][0] : undefined;
    const registryAliases = matchingRegistryEntries.flatMap(
      (registryEntry) => registryEntry.aliases,
    );
    const localAssetIsProxy = asset?.isProxyForAssessment === true;
    const policyStatus = policyStatusFor({
      tilePolicy: entry.tilePolicy,
      localAssetIsProxy,
    });

    return {
      languageId,
      slug: entry.slug,
      ipa: entry.ipa,
      layer: entry.layer,
      variantScope: entry.variantScope,
      audioStatus: entry.audioStatus,
      tilePolicy: entry.tilePolicy,
      policyStatus,
      shouldBeClickable: policyStatus === "clickable-exact-header",
      hasRegistryEntry: matchingRegistryEntries.length > 0,
      registryEntryCount: matchingRegistryEntries.length,
      registryAliases,
      registryAudioUrl,
      registryUsesPlayableHeaderClip:
        matchingRegistryEntries.length > 0 &&
        matchingRegistryEntries.every((registryEntry) =>
          isPlayableHeaderAudioSrc(registryEntry.audioUrl),
        ),
      registryMatchesHeaderAudio:
        matchingRegistryEntries.length === 1 &&
        Boolean(asset?.audioSrc) &&
        matchingRegistryEntries[0].audioUrl === asset?.audioSrc,
      headerAudioSrc: asset?.audioSrc,
      localAssetSource: asset?.source,
      localAssetIsProxy,
      sourceRefs: [...entry.sourceRefs],
      gaps: [...entry.gaps],
      reason: reasonFor(policyStatus),
    };
  });
}

export function getAllLanguageAssessmentAudioPolicyRows(): LanguageAssessmentAudioPolicyRow[] {
  return LANGUAGE_IDS.flatMap((languageId) =>
    getLanguageAssessmentAudioPolicyRows(languageId),
  );
}

export function getLanguageAssessmentAudioPolicyTableRows(
  languageId: NonEnglishLanguageId,
): LanguageAssessmentAudioPolicyTableRow[] {
  return getLanguageAssessmentAudioPolicyRows(languageId).map((row) => ({
    slug: row.slug,
    ipa: row.ipa,
    layer: row.layer,
    audioStatus: row.audioStatus,
    tilePolicy: row.tilePolicy,
    policyStatus: row.policyStatus,
    clickable: row.shouldBeClickable ? "yes" : "no",
    headerAudioSrc: row.headerAudioSrc ?? "none",
    registryAudioUrl: row.registryAudioUrl ?? "none",
    aliases:
      row.registryAliases.length > 0 ? row.registryAliases.join(", ") : "none",
    reason: row.reason,
  }));
}

function escapeMarkdownTableCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

export function formatLanguageAssessmentAudioPolicyMarkdownTable(
  languageId: NonEnglishLanguageId,
): string {
  const header =
    "| slug | IPA | layer | audio status | tile policy | policy status | clickable | header audio | registry audio | aliases | reason |";
  const separator =
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |";
  const rows = getLanguageAssessmentAudioPolicyTableRows(languageId).map((row) =>
    [
      row.slug,
      row.ipa,
      row.layer,
      row.audioStatus,
      row.tilePolicy,
      row.policyStatus,
      row.clickable,
      row.headerAudioSrc,
      row.registryAudioUrl,
      row.aliases,
      row.reason,
    ]
      .map((value) => escapeMarkdownTableCell(value))
      .join(" | "),
  );

  return [header, separator, ...rows.map((row) => `| ${row} |`)].join("\n");
}

export function formatLanguageAssessmentAudioPolicyMarkdownDocument(
  languageId: NonEnglishLanguageId,
): string {
  const languageLabel = LANGUAGE_DOCUMENT_LABELS[languageId];
  const rows = getLanguageAssessmentAudioPolicyRows(languageId);
  const clickableCount = rows.filter((row) => row.shouldBeClickable).length;
  const blockedCount = rows.length - clickableCount;
  const table = formatLanguageAssessmentAudioPolicyMarkdownTable(languageId);

  return [
    `# ${languageLabel} Assessment Audio Policy Table`,
    "",
    "Generated from `src/lib/language-assessment-audio-policy.ts`. Do not edit the table by hand; run `npm.cmd run phonology:audio-policy:export` after changing language sound units, local assets, assessment registry entries, or playback policy.",
    "",
    `Language profile: \`${languageId}\``,
    "Product status: experimental",
    "",
    "## Policy Summary",
    "",
    `- Clickable exact scoring tiles: ${clickableCount}`,
    `- Blocked or score-only tiles: ${blockedCount}`,
    "- Clickable means the scoring tile uses the same local short header clip as the sound-unit header/detail card.",
    "- Proxy, rule guidance, whole-word, sentence, dictionary, generated TTS, and video-track material must stay unclickable.",
    "",
    "## Audio Policy",
    "",
    table,
    "",
  ].join("\n");
}
