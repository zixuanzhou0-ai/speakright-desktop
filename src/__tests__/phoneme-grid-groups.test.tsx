import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PhonemeGrid } from "@/components/phoneme/phoneme-grid";
import { getLanguagePhonemes } from "@/lib/language-phonemes";

vi.mock("@/hooks/use-audio-player", () => ({
  useAudioPlayer: () => ({
    isPlaying: false,
    isLoading: false,
    play: vi.fn(),
    playBlob: vi.fn(),
    stop: vi.fn(),
  }),
}));

vi.mock("next/image", () => ({
  default: () => null,
}));

afterEach(() => cleanup());

describe("PhonemeGrid language grouping", () => {
  it("keeps English as vowels and consonants", () => {
    render(<PhonemeGrid phonemes={getLanguagePhonemes("en-US")} />);

    expect(screen.getByRole("heading", { name: "元音" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "辅音" })).toBeInTheDocument();
  });

  it("renders Spanish-specific sound unit groups", () => {
    render(<PhonemeGrid phonemes={getLanguagePhonemes("es-ES")} />);

    for (const label of [
      "纯元音",
      "核心辅音",
      "对比/变体",
      "双元音/滑音",
      "重音与节奏",
    ]) {
      expect(screen.getByRole("heading", { name: label })).toBeInTheDocument();
    }
  });

  it("renders French-specific sound unit groups", () => {
    render(<PhonemeGrid phonemes={getLanguagePhonemes("fr-FR")} />);

    for (const label of [
      "口腔元音",
      "鼻化元音",
      "辅音与滑音",
      "连读/静音规则",
    ]) {
      expect(screen.getByRole("heading", { name: label })).toBeInTheDocument();
    }
  });

  it("renders Russian-specific sound unit groups", () => {
    render(<PhonemeGrid phonemes={getLanguagePhonemes("ru-RU")} />);

    for (const label of [
      "元音",
      "硬软辅音",
      "核心辅音",
      "重音与弱化",
      "拼写到发音规则",
    ]) {
      expect(screen.getByRole("heading", { name: label })).toBeInTheDocument();
    }
  });
});
