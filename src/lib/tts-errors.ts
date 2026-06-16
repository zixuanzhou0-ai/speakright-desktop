const CJK_TEXT_PATTERN = /[\u3400-\u9fff]/;

export const STANDARD_TTS_UNAVAILABLE_MESSAGE =
  "无法播放标准示范：请先在设置页配置 ElevenLabs，或改用已内置发音资源的练习内容。单词词典发音只负责单词复读。";

function truncateTtsDetail(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 180);
}

export function normalizeStandardTtsError(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : String(error);
  const message = truncateTtsDetail(raw);

  if (!message) return STANDARD_TTS_UNAVAILABLE_MESSAGE;

  if (CJK_TEXT_PATTERN.test(message)) {
    return `${STANDARD_TTS_UNAVAILABLE_MESSAGE}（${message}）`;
  }

  if (/401|403|auth|unauthorized|forbidden|api key|invalid key/i.test(message)) {
    return `${STANDARD_TTS_UNAVAILABLE_MESSAGE}（ElevenLabs 认证失败，请检查设置页里的 API Key 是否正确。）`;
  }

  if (/429|quota|rate limit|too many requests|insufficient/i.test(message)) {
    return `${STANDARD_TTS_UNAVAILABLE_MESSAGE}（ElevenLabs 请求过于频繁或额度不足，请稍后重试或检查 ElevenLabs 用量。）`;
  }

  if (/400|404|voice|model|not found|bad request/i.test(message)) {
    return `${STANDARD_TTS_UNAVAILABLE_MESSAGE}（ElevenLabs 请求配置无效，请检查 Voice、Model 和文本长度。）`;
  }

  if (
    /fetch|network|dns|timeout|timed out|connection|offline|refused/i.test(
      message,
    )
  ) {
    return `${STANDARD_TTS_UNAVAILABLE_MESSAGE}（无法连接 ElevenLabs，请检查网络、代理或 ElevenLabs 配置后重试。）`;
  }

  if (/indexeddb|database|storage|cache|transaction|quota/i.test(message)) {
    return `${STANDARD_TTS_UNAVAILABLE_MESSAGE}（本地标准示范缓存不可用，请重试；如果持续失败，可在设置页清理本地数据。）`;
  }

  return `${STANDARD_TTS_UNAVAILABLE_MESSAGE}（标准示范服务异常，请稍后重试；如果持续失败，请检查 ElevenLabs 配置。）`;
}
