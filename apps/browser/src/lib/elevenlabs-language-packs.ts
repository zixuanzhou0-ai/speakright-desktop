import type { LanguageId } from "@/types/language";

export type ElevenLabsPackLanguageId = Extract<
  LanguageId,
  "es-ES" | "fr-FR" | "ru-RU"
>;

export interface ElevenLabsLanguagePackPreset {
  languageId: ElevenLabsPackLanguageId;
  languageCode: "es" | "fr" | "ru";
  modelId: string;
  speed: number;
}

export const ELEVENLABS_LANGUAGE_PACKS: Record<
  ElevenLabsPackLanguageId,
  ElevenLabsLanguagePackPreset
> = {
  "es-ES": {
    languageId: "es-ES",
    languageCode: "es",
    modelId: "eleven_multilingual_v2",
    speed: 0.86,
  },
  "fr-FR": {
    languageId: "fr-FR",
    languageCode: "fr",
    modelId: "eleven_multilingual_v2",
    speed: 0.84,
  },
  "ru-RU": {
    languageId: "ru-RU",
    languageCode: "ru",
    modelId: "eleven_multilingual_v2",
    speed: 0.82,
  },
};

export function getElevenLabsLanguagePack(
  languageId: ElevenLabsPackLanguageId,
): ElevenLabsLanguagePackPreset {
  return ELEVENLABS_LANGUAGE_PACKS[languageId];
}

export function isElevenLabsPackLanguageId(
  languageId: LanguageId,
): languageId is ElevenLabsPackLanguageId {
  return languageId === "es-ES" || languageId === "fr-FR" || languageId === "ru-RU";
}
