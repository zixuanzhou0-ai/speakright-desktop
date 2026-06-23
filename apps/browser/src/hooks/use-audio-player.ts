"use client";

import { Howl } from "howler";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  isVideoBackedAudioSrc,
  type AudioPlaybackOptions,
} from "@/lib/audio-playback-policy";

export interface UseAudioPlayerReturn {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  play: (src: string, options?: AudioPlaybackOptions) => void;
  playBlob: (blob: Blob) => void;
  stop: () => void;
  clearError: () => void;
}

function getAudioPlaybackErrorMessage(src?: string): string {
  if (!src) return "音频播放失败，请检查系统音频输出或稍后重试。";
  if (src.startsWith("blob:")) {
    return "录音回放加载失败，请重录或重启 SpeakRight 后再试。";
  }
  if (src.startsWith("/audio/")) {
    return "本地音频加载失败：浏览器版音频资源可能缺失或被网络/浏览器拦截，请刷新静态服务，或通过音频/provider issue 反馈 Browser Edition 音频缺口。";
  }
  return "音频播放失败，请检查系统音频输出、网络或代理后重试。";
}

export function useAudioPlayer(): UseAudioPlayerReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const howlRef = useRef<Howl | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const setSafeIsPlaying = useCallback((value: boolean) => {
    if (mountedRef.current) setIsPlaying(value);
  }, []);

  const setSafeIsLoading = useCallback((value: boolean) => {
    if (mountedRef.current) setIsLoading(value);
  }, []);

  const setSafeError = useCallback((value: string | null) => {
    if (mountedRef.current) setError(value);
  }, []);

  const clearPlaybackTimers = useCallback(() => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    clearPlaybackTimers();
    if (howlRef.current) {
      howlRef.current.unload();
      howlRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, [clearPlaybackTimers]);

  const play = useCallback(
    (src: string, options: AudioPlaybackOptions = {}) => {
      cleanup();
      setSafeError(null);
      if (isVideoBackedAudioSrc(src)) {
        setSafeIsLoading(false);
        setSafeIsPlaying(false);
        console.warn(`[AudioPlayer] Refusing to play video-backed audio: ${src}`);
        return;
      }

      setSafeIsLoading(true);

      const volume = options.volume ?? 1;
      const handlePlaybackError = () => {
        clearPlaybackTimers();
        setSafeIsLoading(false);
        setSafeIsPlaying(false);
        setSafeError(getAudioPlaybackErrorMessage(src));
      };

      const howl = new Howl({
        src: [src],
        format: ["mp3", "wav", "ogg", "mp4", "m4a"],
        html5: src.startsWith("http") || src.endsWith(".mp4"),
        volume,
        onplay: () => {
          setSafeIsLoading(false);
          setSafeIsPlaying(true);
        },
        onend: () => {
          clearPlaybackTimers();
          setSafeIsPlaying(false);
        },
        onstop: () => {
          clearPlaybackTimers();
          setSafeIsPlaying(false);
        },
        onloaderror: handlePlaybackError,
        onplayerror: handlePlaybackError,
      });

      howlRef.current = howl;
      const soundId = howl.play();
      const numericSoundId = typeof soundId === "number" ? soundId : undefined;
      if (options.startMs && numericSoundId !== undefined) {
        howl.seek(options.startMs / 1000, numericSoundId);
      }

      if (options.maxDurationMs) {
        const fadeOutMs = Math.max(0, options.fadeOutMs ?? 0);
        const fadeDelayMs = options.maxDurationMs - fadeOutMs;
        if (fadeOutMs > 0 && fadeDelayMs > 0) {
          fadeTimerRef.current = setTimeout(() => {
            if (howlRef.current === howl) {
              howl.fade(volume, 0, fadeOutMs, numericSoundId);
            }
          }, fadeDelayMs);
        }

        stopTimerRef.current = setTimeout(() => {
          if (howlRef.current === howl) {
            howl.stop(numericSoundId);
            cleanup();
            setSafeIsLoading(false);
            setSafeIsPlaying(false);
          }
        }, options.maxDurationMs);
      }
    },
    [
      cleanup,
      clearPlaybackTimers,
      setSafeError,
      setSafeIsLoading,
      setSafeIsPlaying,
    ],
  );

  const playBlob = useCallback(
    (blob: Blob) => {
      cleanup();
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      setSafeError(null);
      setSafeIsLoading(true);
      const handlePlaybackError = () => {
        setSafeIsLoading(false);
        setSafeIsPlaying(false);
        setSafeError(getAudioPlaybackErrorMessage(url));
      };
      const howl = new Howl({
        src: [url],
        format: ["wav", "webm", "ogg", "mp4", "m4a", "mp3"],
        html5: true,
        onplay: () => {
          setSafeIsLoading(false);
          setSafeIsPlaying(true);
        },
        onend: () => setSafeIsPlaying(false),
        onstop: () => setSafeIsPlaying(false),
        onloaderror: handlePlaybackError,
        onplayerror: handlePlaybackError,
      });
      howlRef.current = howl;
      howl.play();
    },
    [cleanup, setSafeError, setSafeIsLoading, setSafeIsPlaying],
  );

  const stop = useCallback(() => {
    cleanup();
    setSafeIsPlaying(false);
    setSafeIsLoading(false);
    setSafeError(null);
  }, [cleanup, setSafeError, setSafeIsLoading, setSafeIsPlaying]);

  const clearError = useCallback(() => setSafeError(null), [setSafeError]);

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  return { isPlaying, isLoading, error, play, playBlob, stop, clearError };
}
