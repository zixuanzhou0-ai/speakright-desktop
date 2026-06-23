import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SentenceRecordingCard } from "@/components/sentences/sentence-recording-card";

function renderCard({
  assessError = null,
  localSaveError = null,
  recorderError = null,
}: {
  assessError?: string | null;
  localSaveError?: string | null;
  recorderError?: string | null;
} = {}) {
  render(
    <SentenceRecordingCard
      sentence="I want to practice clearly."
      isRecording={false}
      elapsedSeconds={0}
      maxDurationSeconds={60}
      audioBlob={new Blob(["audio"], { type: "audio/wav" })}
      stream={null}
      qualityReport={null}
      recorderError={recorderError}
      onRecordStart={vi.fn()}
      onRecordStop={vi.fn()}
      isPlaying={false}
      onReplay={vi.fn()}
      isAssessing={false}
      assessError={assessError}
      localSaveError={localSaveError}
      result={null}
      onClear={vi.fn()}
      onAssess={vi.fn()}
    />,
  );
}

describe("SentenceRecordingCard local persistence warning", () => {
  it("shows a Chinese alert when free-practice local history cannot be saved", () => {
    renderCard({
      localSaveError:
        "本次评分已完成，但本机趋势图、练习记录或迁移证据未保存。",
    });

    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute(
      "data-smoke",
      "free-practice-local-save-error",
    );
    expect(alert).toHaveTextContent("本次评分已完成");
    expect(alert).toHaveTextContent("未保存");
  });

  it("does not render a local-save alert when there is no persistence warning", () => {
    renderCard();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("marks microphone permission failures for Browser smoke checks", () => {
    renderCard({
      recorderError:
        "无法访问麦克风，请在系统设置中允许 SpeakRight 使用麦克风。",
    });

    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("data-smoke", "free-practice-recorder-error");
    expect(alert).toHaveTextContent("无法访问麦克风");
  });

  it("marks Azure assessment failures for Browser smoke checks", () => {
    renderCard({
      assessError:
        "请先到设置页配置 Azure Speech API 密钥和区域；配置后回到本页重新评分。",
    });

    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("data-smoke", "free-practice-assess-error");
    expect(alert).toHaveTextContent("Azure Speech API");
  });
});
