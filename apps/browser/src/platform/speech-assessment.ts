import {
  assertAzureRegion,
  getAzureRegionValidationError,
} from "@/lib/azure-config";
import { parseAzureResult } from "@/lib/azure-speech";
import { isSentence } from "@/lib/utils";
import type { AzureAssessmentResult } from "@/types/azure";

type SpeechSdk = typeof import("microsoft-cognitiveservices-speech-sdk");
type SpeechRecognitionResult =
  import("microsoft-cognitiveservices-speech-sdk").SpeechRecognitionResult;

function truncateServiceDetail(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 220);
}

function buildSdkCancellationErrorMessage(
  details: { errorDetails?: string },
  fallback = "",
): string {
  const detail = truncateServiceDetail(details.errorDetails || fallback);

  if (/401|403|unauthori[sz]ed|forbidden|subscription|key|auth/i.test(detail)) {
    return "Azure Speech 认证失败，请检查设置页里的 Subscription Key 和区域是否匹配。";
  }

  if (/region|endpoint|host|404|not found/i.test(detail)) {
    return "Azure Speech 区域或服务终结点不可用，请检查设置页里的 Azure 区域。";
  }

  if (/429|quota|rate|too many/i.test(detail)) {
    return "Azure Speech 请求过于频繁或额度已用尽，请稍后重试或检查 Azure 配额。";
  }

  if (/timeout|timed out|408|504/i.test(detail)) {
    return "Azure Speech 请求超时，请检查网络后重试。";
  }

  if (/websocket|network|connection|connect|fetch|offline|dns/i.test(detail)) {
    return "无法连接 Azure Speech，请检查网络、代理或 Azure 区域后重试。";
  }

  return detail
    ? `Azure Speech 评分失败：${detail}`
    : "Azure Speech 评分失败，请检查 Azure Speech API 密钥、区域、网络或代理后重试。";
}

function buildSpeechConfig(
  SpeechSDK: SpeechSdk,
  key: string,
  region: string,
  language: string,
) {
  const normalizedRegion = assertAzureRegion(region);
  const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
    key,
    normalizedRegion,
  );
  speechConfig.speechRecognitionLanguage = language;
  speechConfig.outputFormat = SpeechSDK.OutputFormat.Detailed;
  return speechConfig;
}

function buildAudioConfig(SpeechSDK: SpeechSdk, audioBlob: Blob) {
  const wavFile = new File([audioBlob], "speakright-recording.wav", {
    type: audioBlob.type || "audio/wav",
  });
  return SpeechSDK.AudioConfig.fromWavFileInput(wavFile);
}

function createSilentWavBlob(durationMs = 300): Blob {
  const sampleRate = 16_000;
  const channelCount = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * channelCount * bitsPerSample) / 8;
  const blockAlign = (channelCount * bitsPerSample) / 8;
  const sampleCount = Math.max(1, Math.floor((sampleRate * durationMs) / 1000));
  const dataSize = sampleCount * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  let offset = 0;

  const writeAscii = (value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
    offset += value.length;
  };

  writeAscii("RIFF");
  view.setUint32(offset, 36 + dataSize, true);
  offset += 4;
  writeAscii("WAVE");
  writeAscii("fmt ");
  view.setUint32(offset, 16, true);
  offset += 4;
  view.setUint16(offset, 1, true);
  offset += 2;
  view.setUint16(offset, channelCount, true);
  offset += 2;
  view.setUint32(offset, sampleRate, true);
  offset += 4;
  view.setUint32(offset, byteRate, true);
  offset += 4;
  view.setUint16(offset, blockAlign, true);
  offset += 2;
  view.setUint16(offset, bitsPerSample, true);
  offset += 2;
  writeAscii("data");
  view.setUint32(offset, dataSize, true);

  return new Blob([buffer], { type: "audio/wav" });
}

function buildPronunciationConfig(SpeechSDK: SpeechSdk, referenceText: string) {
  const pronunciationConfig = new SpeechSDK.PronunciationAssessmentConfig(
    referenceText,
    SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark,
    SpeechSDK.PronunciationAssessmentGranularity.Phoneme,
    true,
  );
  pronunciationConfig.enableProsodyAssessment = isSentence(referenceText);
  return pronunciationConfig;
}

function getJsonResult(
  SpeechSDK: SpeechSdk,
  result: SpeechRecognitionResult,
): Record<string, unknown> {
  const json =
    result.properties.getProperty(
      SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult,
    ) || result.json;
  if (!json) {
    throw new Error("Azure Speech 没有返回详细评分 JSON，请重新录音后再试。");
  }
  return JSON.parse(json) as Record<string, unknown>;
}

function assertRecognizedResult(
  SpeechSDK: SpeechSdk,
  result: SpeechRecognitionResult,
): void {
  if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
    return;
  }

  if (result.reason === SpeechSDK.ResultReason.NoMatch) {
    throw new Error(
      "没有检测到清晰语音，请靠近麦克风、读完目标内容后重新录音。",
    );
  }

  if (result.reason === SpeechSDK.ResultReason.Canceled) {
    const details = SpeechSDK.CancellationDetails.fromResult(result);
    throw new Error(buildSdkCancellationErrorMessage(details));
  }

  throw new Error("Azure Speech 没有返回可用识别结果，请重新录音后再试。");
}

async function recognizeOnce(
  recognizer: InstanceType<SpeechSdk["SpeechRecognizer"]>,
): Promise<SpeechRecognitionResult> {
  return new Promise((resolve, reject) => {
    recognizer.recognizeOnceAsync(resolve, reject);
  });
}

export async function testAzureCredentialsInBrowser(
  key: string,
  region: string,
): Promise<void> {
  const regionError = getAzureRegionValidationError(region);
  if (regionError) throw new Error(regionError);

  const SpeechSDK = await import("microsoft-cognitiveservices-speech-sdk");
  const speechConfig = buildSpeechConfig(SpeechSDK, key, region, "en-US");
  const audioConfig = buildAudioConfig(SpeechSDK, createSilentWavBlob());
  const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

  try {
    const result = await recognizeOnce(recognizer);
    if (
      result.reason === SpeechSDK.ResultReason.RecognizedSpeech ||
      result.reason === SpeechSDK.ResultReason.NoMatch
    ) {
      return;
    }
    if (result.reason === SpeechSDK.ResultReason.Canceled) {
      const details = SpeechSDK.CancellationDetails.fromResult(result);
      throw new Error(buildSdkCancellationErrorMessage(details));
    }
    throw new Error("Azure Speech 连接测试没有返回可用状态，请稍后重试。");
  } catch (error) {
    if (error instanceof Error && /[\u3400-\u9fff]/.test(error.message)) {
      throw error;
    }
    throw new Error(
      buildSdkCancellationErrorMessage(
        {},
        error instanceof Error ? error.message : String(error),
      ),
    );
  } finally {
    recognizer.close();
    audioConfig.close();
  }
}

export async function assessPronunciationInBrowser(
  audioBlob: Blob,
  referenceText: string,
  key: string,
  region: string,
  language = "en-US",
): Promise<AzureAssessmentResult> {
  const regionError = getAzureRegionValidationError(region);
  if (regionError) throw new Error(regionError);

  const SpeechSDK = await import("microsoft-cognitiveservices-speech-sdk");
  const speechConfig = buildSpeechConfig(SpeechSDK, key, region, language);
  const audioConfig = buildAudioConfig(SpeechSDK, audioBlob);
  const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
  const pronunciationConfig = buildPronunciationConfig(
    SpeechSDK,
    referenceText,
  );
  pronunciationConfig.applyTo(recognizer);

  try {
    const result = await recognizeOnce(recognizer);
    assertRecognizedResult(SpeechSDK, result);
    return parseAzureResult(getJsonResult(SpeechSDK, result));
  } catch (error) {
    if (error instanceof Error && /[\u3400-\u9fff]/.test(error.message)) {
      throw error;
    }
    throw new Error(
      buildSdkCancellationErrorMessage(
        {},
        error instanceof Error ? error.message : String(error),
      ),
    );
  } finally {
    recognizer.close();
    audioConfig.close();
  }
}

export async function transcribeSpeechInBrowser(
  audioBlob: Blob,
  key: string,
  region: string,
  language = "en-US",
): Promise<string> {
  const regionError = getAzureRegionValidationError(region);
  if (regionError) throw new Error(regionError);

  const SpeechSDK = await import("microsoft-cognitiveservices-speech-sdk");
  const speechConfig = buildSpeechConfig(SpeechSDK, key, region, language);
  const audioConfig = buildAudioConfig(SpeechSDK, audioBlob);
  const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

  try {
    const result = await recognizeOnce(recognizer);
    assertRecognizedResult(SpeechSDK, result);
    const raw = getJsonResult(SpeechSDK, result);
    const nbest = raw.NBest as Array<Record<string, unknown>> | undefined;
    const best = nbest?.[0];
    const transcript =
      (best?.Display as string | undefined) ??
      (best?.Lexical as string | undefined) ??
      (raw.DisplayText as string | undefined) ??
      result.text ??
      "";
    if (!transcript.trim()) {
      throw new Error("Azure Speech 没有返回可用转写文本，请重新录音后再试。");
    }
    return transcript.trim();
  } catch (error) {
    if (error instanceof Error && /[\u3400-\u9fff]/.test(error.message)) {
      throw error;
    }
    throw new Error(
      buildSdkCancellationErrorMessage(
        {},
        error instanceof Error ? error.message : String(error),
      ),
    );
  } finally {
    recognizer.close();
    audioConfig.close();
  }
}
