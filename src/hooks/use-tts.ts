"use client";

import { useCallback, useState } from "react";
import { elevenLabsTts } from "@/lib/api-client";
import { getElevenLabsConfig } from "@/lib/api-keys";
import { useAudioPlayer } from "./use-audio-player";

interface UseTtsReturn {
  speak: (text: string) => Promise<void>;
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
}

const STANDARD_TTS_UNAVAILABLE_MESSAGE =
  "无法播放标准示范：请先在设置页配置 ElevenLabs，或改用已内置发音资源的练习内容。单词词典发音只负责单词复读。";

export function useTts(): UseTtsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const player = useAudioPlayer();

  const speak = useCallback(
    async (text: string) => {
      const config = getElevenLabsConfig();
      if (!config) {
        setError(STANDARD_TTS_UNAVAILABLE_MESSAGE);
        return;
      }

      setError(null);
      setIsLoading(true);

      try {
        const blob = await elevenLabsTts(
          config.apiKey,
          config.voiceId,
          text,
          config.modelId || "eleven_flash_v2_5",
        );
        player.playBlob(blob);
      } catch (e) {
        console.error("[ElevenLabs TTS]", e);
        const details = e instanceof Error ? `（${e.message}）` : "";
        setError(`${STANDARD_TTS_UNAVAILABLE_MESSAGE}${details}`);
      } finally {
        setIsLoading(false);
      }
    },
    [player],
  );

  return { speak, isLoading, isPlaying: player.isPlaying, error };
}
