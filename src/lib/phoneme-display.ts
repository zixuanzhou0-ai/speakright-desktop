import type { PhonemeCategory, PhonemeData, SoundUnitType } from "@/types/phoneme";

export const PHONEME_CATEGORY_LABELS: Record<PhonemeCategory, string> = {
  vowel: "元音",
  consonant: "辅音",
  semivowel: "半元音",
  prosody: "重音/规则",
  cluster: "辅音丛",
};

export const SOUND_UNIT_TYPE_LABELS: Record<SoundUnitType, string> = {
  phoneme: "音素",
  allophone: "变体",
  contrast: "对比",
  prosody: "规则",
  cluster: "辅音丛",
};

export function getPhonemeCategoryLabel(phoneme: PhonemeData): string {
  return PHONEME_CATEGORY_LABELS[phoneme.category];
}

export function getSoundUnitTypeLabel(phoneme: PhonemeData): string {
  return SOUND_UNIT_TYPE_LABELS[phoneme.soundUnitType ?? "phoneme"];
}

export interface PhonemeDisplayGroup {
  id:
    | "vowels"
    | "consonants"
    | "semivowels"
    | "allophones"
    | "contrasts"
    | "prosody"
    | "clusters";
  label: string;
  phonemes: PhonemeData[];
}

export function getPhonemeDisplayGroups(
  phonemes: PhonemeData[],
): PhonemeDisplayGroup[] {
  const groups: PhonemeDisplayGroup[] = [
    {
      id: "vowels",
      label: "元音",
      phonemes: phonemes.filter(
        (p) =>
          p.category === "vowel" &&
          (p.soundUnitType ?? "phoneme") === "phoneme",
      ),
    },
    {
      id: "consonants",
      label: "辅音",
      phonemes: phonemes.filter(
        (p) =>
          p.category === "consonant" &&
          (p.soundUnitType ?? "phoneme") === "phoneme",
      ),
    },
    {
      id: "semivowels",
      label: "半元音",
      phonemes: phonemes.filter((p) => p.category === "semivowel"),
    },
    {
      id: "allophones",
      label: "变体",
      phonemes: phonemes.filter(
        (p) => p.soundUnitType === "allophone" && p.category !== "semivowel",
      ),
    },
    {
      id: "contrasts",
      label: "对比训练",
      phonemes: phonemes.filter((p) => p.soundUnitType === "contrast"),
    },
    {
      id: "prosody",
      label: "重音/规则",
      phonemes: phonemes.filter(
        (p) => p.category === "prosody" || p.soundUnitType === "prosody",
      ),
    },
    {
      id: "clusters",
      label: "辅音丛",
      phonemes: phonemes.filter(
        (p) => p.category === "cluster" || p.soundUnitType === "cluster",
      ),
    },
  ];

  return groups.filter((group) => group.phonemes.length > 0);
}
