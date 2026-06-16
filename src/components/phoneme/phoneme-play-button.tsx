"use client";

import { AudioPlayerButton } from "@/components/audio/audio-player";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import {
  getSoundUnitHeaderPlaybackOptions,
  isPlayableHeaderAudioSrc,
} from "@/lib/audio-playback-policy";
import type { PhonemeAudioSource } from "@/types/phoneme";

interface PhonemePlayButtonProps {
  chartWord?: string;
  phonemeAudio?: PhonemeAudioSource;
  onBeforePlay?: () => void;
}

export function PhonemePlayButton({
  chartWord,
  phonemeAudio,
  onBeforePlay,
}: PhonemePlayButtonProps) {
  const { play, isPlaying, isLoading } = useAudioPlayer();
  const canPlayLocalHeaderAudio = isPlayableHeaderAudioSrc(
    phonemeAudio?.localSrc,
  );

  if (!chartWord && !canPlayLocalHeaderAudio) return null;

  const playbackOptions = getSoundUnitHeaderPlaybackOptions({
    chartWord,
    phonemeAudio,
  });
  if (!playbackOptions) return null;

  const audioSrc = chartWord
    ? `/audio/ipa/phoneme/${chartWord}.mp3`
    : (phonemeAudio?.localSrc ?? "");
  const audioKind = chartWord ? "chart" : "sound-unit";
  const dataAttributes = {
    "data-audio-playable": "true",
    "data-audio-kind": audioKind,
    "data-audio-src": audioSrc,
    "data-audio-max-duration-ms":
      playbackOptions.maxDurationMs?.toString() ?? "",
    "data-audio-fade-out-ms": playbackOptions.fadeOutMs?.toString() ?? "",
  };

  const handleClick = () => {
    onBeforePlay?.();
    play(audioSrc, playbackOptions);
  };

  return (
    <AudioPlayerButton
      onClick={handleClick}
      isPlaying={isPlaying}
      isLoading={isLoading}
      size="lg"
      dataAttributes={dataAttributes}
    />
  );
}
